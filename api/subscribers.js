export default async function handler(_req, res) {
  res.setHeader("Access-Control-Allow-Origin", "https://adventuresinclaude.ai");
  res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=600");

  try {
    const response = await fetch(
      "https://api.kit.com/v4/subscribers?status=active&include_total_count=true&per_page=1",
      {
        headers: {
          "X-Kit-Api-Key": process.env.KIT_API_KEY,
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Kit API responded with ${response.status}`);
    }

    const data = await response.json();
    res.status(200).json({ count: data.pagination?.total_count ?? 0 });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch subscriber count" });
  }
}
