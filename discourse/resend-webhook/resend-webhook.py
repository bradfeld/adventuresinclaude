#!/usr/bin/env python3
"""Resend Inbound Email Webhook -> Discourse Mail Handler Bridge

Receives Resend inbound email webhooks (metadata only), fetches
the raw email via Resend API, and forwards to Discourse's
handle_mail endpoint.

Security: Verifies Svix webhook signatures using HMAC-SHA256.
"""
import base64
import hashlib
import hmac
import json
import http.server
import os
import time
import urllib.request
import urllib.parse
import ssl
import logging

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(message)s")

DISCOURSE_URL = os.environ["DISCOURSE_URL"]
DISCOURSE_API_KEY = os.environ["DISCOURSE_API_KEY"]
RESEND_API_KEY = os.environ["RESEND_API_KEY"]
WEBHOOK_SIGNING_SECRET = os.environ.get("WEBHOOK_SIGNING_SECRET", "")
PORT = int(os.environ.get("WEBHOOK_PORT", "8025"))

# Svix signature tolerance: reject timestamps older than 5 minutes
TIMESTAMP_TOLERANCE = 300


def verify_svix_signature(body: bytes, headers: dict) -> bool:
    """Verify Resend/Svix webhook signature.

    Resend uses Svix for webhook delivery. The signature is:
    HMAC-SHA256(base64_decode(secret_without_prefix), "{svix_id}.{svix_timestamp}.{body}")
    """
    if not WEBHOOK_SIGNING_SECRET:
        logging.warning("WEBHOOK_SIGNING_SECRET not set — skipping verification")
        return True

    svix_id = headers.get("svix-id", "")
    svix_timestamp = headers.get("svix-timestamp", "")
    svix_signature = headers.get("svix-signature", "")

    if not all([svix_id, svix_timestamp, svix_signature]):
        logging.warning("Missing Svix headers — rejecting")
        return False

    # Check timestamp freshness (prevent replay attacks)
    try:
        ts = int(svix_timestamp)
        if abs(time.time() - ts) > TIMESTAMP_TOLERANCE:
            logging.warning("Svix timestamp too old: %s", svix_timestamp)
            return False
    except ValueError:
        logging.warning("Invalid Svix timestamp: %s", svix_timestamp)
        return False

    # Decode the signing secret (strip whsec_ prefix, base64 decode)
    secret = WEBHOOK_SIGNING_SECRET
    if secret.startswith("whsec_"):
        secret = secret[6:]
    try:
        secret_bytes = base64.b64decode(secret)
    except Exception:
        logging.error("Failed to base64-decode webhook signing secret")
        return False

    # Build the signed content: "{svix_id}.{svix_timestamp}.{body}"
    signed_content = f"{svix_id}.{svix_timestamp}.".encode() + body
    expected = base64.b64encode(
        hmac.new(secret_bytes, signed_content, hashlib.sha256).digest()
    ).decode()

    # Svix-Signature header can contain multiple signatures (v1,xxx v1,yyy)
    for sig in svix_signature.split(" "):
        sig_parts = sig.split(",", 1)
        if len(sig_parts) == 2 and sig_parts[0] == "v1":
            if hmac.compare_digest(expected, sig_parts[1]):
                return True

    logging.warning("Svix signature mismatch")
    return False


def fetch_raw_email(email_id):
    """Fetch raw email content from Resend API."""
    url = f"https://api.resend.com/emails/receiving/{email_id}"
    req = urllib.request.Request(url, headers={
        "Authorization": f"Bearer {RESEND_API_KEY}",
    })
    resp = urllib.request.urlopen(req)
    data = json.loads(resp.read())

    raw_info = data.get("raw", {})
    download_url = raw_info.get("download_url", "")

    if not download_url:
        logging.warning("No raw download URL for email %s", email_id)
        return None

    # Download the raw email from the signed URL
    raw_req = urllib.request.Request(download_url)
    raw_resp = urllib.request.urlopen(raw_req)
    return raw_resp.read().decode("utf-8", errors="replace")


def forward_to_discourse(raw_email):
    """Forward raw email to Discourse handle_mail endpoint."""
    data = urllib.parse.urlencode({"email": raw_email}).encode()
    req = urllib.request.Request(
        f"{DISCOURSE_URL}/admin/email/handle_mail",
        data=data,
        headers={
            "Api-Key": DISCOURSE_API_KEY,
            "Api-Username": "bfeld",
            "Content-Type": "application/x-www-form-urlencoded",
        },
    )
    resp = urllib.request.urlopen(req)
    return resp.status


class WebhookHandler(http.server.BaseHTTPRequestHandler):
    def do_POST(self):
        content_length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_length)

        # Verify webhook signature
        header_dict = {k.lower(): v for k, v in self.headers.items()}
        if not verify_svix_signature(body, header_dict):
            logging.warning("Rejected webhook: invalid signature from %s", self.client_address[0])
            self.send_response(401)
            self.end_headers()
            return

        try:
            payload = json.loads(body)
            event_type = payload.get("type", "")
            logging.info("Received webhook: type=%s", event_type)

            if event_type == "email.received":
                data = payload.get("data", {})
                email_id = data.get("email_id", "")
                from_addr = data.get("from", "unknown")
                subject = data.get("subject", "no subject")
                logging.info("Email from=%s subject=%s id=%s", from_addr, subject, email_id)

                if email_id:
                    raw_email = fetch_raw_email(email_id)
                    if raw_email:
                        status = forward_to_discourse(raw_email)
                        logging.info("Forwarded to Discourse: status=%s", status)
                    else:
                        logging.warning("Could not fetch raw email for %s", email_id)
                else:
                    logging.warning("No email_id in webhook payload")

            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"status": "ok"}).encode())

        except Exception as e:
            logging.error("Error processing webhook: %s", e, exc_info=True)
            self.send_response(200)  # Return 200 to prevent retries
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"status": "error", "message": str(e)}).encode())

    def do_GET(self):
        self.send_response(200)
        self.end_headers()
        self.wfile.write(b"Resend webhook bridge is running")

    def log_message(self, format, *args):
        pass  # Suppress default access logs


if __name__ == "__main__":
    sig_status = "ENABLED" if WEBHOOK_SIGNING_SECRET else "DISABLED (no secret)"
    logging.info("Config: DISCOURSE_URL=%s PORT=%s API_KEY=...%s RESEND_KEY=...%s SIG_VERIFY=%s",
                 DISCOURSE_URL, PORT, DISCOURSE_API_KEY[-6:], RESEND_API_KEY[-6:], sig_status)
    server = http.server.HTTPServer(("0.0.0.0", PORT), WebhookHandler)
    logging.info("Webhook bridge listening on 0.0.0.0:%s", PORT)
    server.serve_forever()
