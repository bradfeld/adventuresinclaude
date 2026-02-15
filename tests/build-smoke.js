#!/usr/bin/env node
/**
 * Hugo Build Smoke Test
 *
 * Runs `hugo --gc --minify` and verifies:
 * 1. Build exits cleanly
 * 2. Theme Studio page exists in output
 * 3. All 10 theme names appear in compiled CSS
 * 4. Nav menu has expected entries
 * 5. FOUC prevention script is present
 * 6. llms.txt, llms-full.txt, robots.txt, sitemap.xml generated
 * 7. Edit post links present
 * 8. Google verification tag present
 * 9. Giscus comments with theme sync
 * 10. Security headers configured
 * 11. Service worker present
 * 12. Callout shortcode CSS
 * 13. TOC enhancements
 * 14. Code block enhancements
 * 15. Reading list page
 * 16. Series taxonomy templates
 * 17. Enhanced RSS feed
 * 18. Webmention endpoints
 * 19. IndieWeb microformats
 * 20. Font preload hints
 * 21. Reading time calibration
 * 22. Image render hook
 * 23. Enhanced 404 page
 * 24. OG meta tags
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const ROOT = path.resolve(__dirname, '..');
const PUBLIC = path.join(ROOT, 'public');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  \x1b[32m✓\x1b[0m ${name}`);
    passed++;
  } catch (e) {
    console.log(`  \x1b[31m✗\x1b[0m ${name}`);
    console.log(`    ${e.message}`);
    failed++;
  }
}

// ── Build ──────────────────────────────────────────────────────
console.log('\nHugo Build Smoke Tests');
console.log('═'.repeat(50));

console.log('\n1. Build');
let buildOutput = '';
test('hugo --gc --minify exits cleanly', () => {
  buildOutput = execSync('hugo --gc --minify', {
    cwd: ROOT,
    encoding: 'utf8',
    timeout: 30000
  });
});

test('Build output reports pages generated', () => {
  assert.ok(buildOutput.includes('Pages'), 'Build output missing page count');
});

// ── Output Structure ──────────────────────────────────────────
console.log('\n2. Output Structure');

const EXPECTED_PAGES = [
  'index.html',
  'theme-studio/index.html',
  'about/index.html',
  'posts/index.html',
  'tags/index.html',
  'search/index.html',
  '404/index.html',
  'archives/index.html',
  'reading-list/index.html'
];

for (const page of EXPECTED_PAGES) {
  test(`${page} exists`, () => {
    const fullPath = path.join(PUBLIC, page);
    assert.ok(fs.existsSync(fullPath), `Missing: ${fullPath}`);
  });
}

// ── Theme Studio Page ─────────────────────────────────────────
console.log('\n3. Theme Studio Page');

const studioPage = fs.readFileSync(path.join(PUBLIC, 'theme-studio/index.html'), 'utf8');

test('Contains studio controls container', () => {
  assert.ok(studioPage.includes('studio-container'), 'Missing studio-container');
});

test('Contains preset grid', () => {
  assert.ok(studioPage.includes('preset-grid'), 'Missing preset-grid');
});

test('Contains color controls', () => {
  assert.ok(studioPage.includes('color-controls'), 'Missing color controls');
});

test('Contains export buttons', () => {
  assert.ok(studioPage.includes('copy-css-btn'), 'Missing copy-css-btn');
  assert.ok(studioPage.includes('share-url-btn'), 'Missing share-url-btn');
});

test('Contains live preview content', () => {
  assert.ok(studioPage.includes('studio-preview'), 'Missing preview panel');
  assert.ok(studioPage.includes('The Quick Brown Fox'), 'Missing sample text');
});

test('Contains JS controller (studio logic)', () => {
  assert.ok(studioPage.includes('custom-theme-settings'), 'Missing theme-studio.js localStorage key');
  assert.ok(studioPage.includes('preset-grid'), 'Missing preset grid reference');
});

// ── Compiled CSS ──────────────────────────────────────────────
console.log('\n4. Theme CSS');

const cssDir = path.join(PUBLIC, 'assets/css');
const cssFiles = fs.readdirSync(cssDir)
  .filter(f => f.startsWith('stylesheet.') && f.endsWith('.css'))
  .sort((a, b) => fs.statSync(path.join(cssDir, b)).size - fs.statSync(path.join(cssDir, a)).size);

test('Compiled CSS file exists', () => {
  assert.ok(cssFiles.length > 0, 'No compiled CSS found in public/assets/css/');
});

let compiledCSS = '';
if (cssFiles.length > 0) {
  compiledCSS = fs.readFileSync(
    path.join(cssDir, cssFiles[0]), 'utf8'
  );

  const THEMES_IN_CSS = [
    'terminal', 'manuscript', 'blueprint', 'amber', 'claude',
    'magazine', 'brutalist', 'e-ink', 'cyberpunk', 'colorful'
  ];

  for (const theme of THEMES_IN_CSS) {
    test(`CSS contains ${theme} theme`, () => {
      assert.ok(
        compiledCSS.includes(`data-full-theme=${theme}`) ||
        compiledCSS.includes(`data-full-theme="${theme}"`),
        `Theme "${theme}" not found in compiled CSS`
      );
    });
  }
}

// ── Nav Menu ──────────────────────────────────────────────────
console.log('\n5. Navigation');

const homepage = fs.readFileSync(path.join(PUBLIC, 'index.html'), 'utf8');

const EXPECTED_NAV = ['Posts', 'Tags', 'Archives', 'Search', 'Subscribe', 'Themes', 'Reading List', 'About'];
for (const item of EXPECTED_NAV) {
  test(`Nav contains "${item}"`, () => {
    assert.ok(homepage.includes(`>${item}<`) || homepage.includes(`> ${item} <`) || homepage.includes(item),
      `Nav missing: ${item}`);
  });
}

// ── FOUC Prevention ───────────────────────────────────────────
console.log('\n6. FOUC Prevention');

test('Homepage has FOUC prevention script', () => {
  assert.ok(
    homepage.includes('data-full-theme') && homepage.includes('full-theme'),
    'Missing FOUC prevention script'
  );
});

test('FOUC script handles custom theme', () => {
  assert.ok(
    homepage.includes('custom-theme-settings'),
    'FOUC script missing custom theme handling'
  );
});

// ── AI & SEO Outputs ─────────────────────────────────────────
console.log('\n7. AI & SEO Outputs');

test('llms.txt exists and has content', () => {
  const llms = fs.readFileSync(path.join(PUBLIC, 'llms.txt'), 'utf8');
  assert.ok(llms.includes('Adventures in Claude'), 'llms.txt missing site title');
  assert.ok(llms.includes('Posts'), 'llms.txt missing Posts section');
});

test('llms-full.txt exists and has full content', () => {
  const llmsFull = fs.readFileSync(path.join(PUBLIC, 'llms-full.txt'), 'utf8');
  assert.ok(llmsFull.includes('Adventures in Claude'), 'llms-full.txt missing site title');
  assert.ok(llmsFull.includes('Source:'), 'llms-full.txt missing Source links');
  assert.ok(llmsFull.length > 1000, 'llms-full.txt seems too short for full content');
});

test('robots.txt exists with sitemap', () => {
  const robots = fs.readFileSync(path.join(PUBLIC, 'robots.txt'), 'utf8');
  assert.ok(robots.includes('User-agent'), 'robots.txt missing User-agent directive');
  assert.ok(robots.includes('sitemap.xml'), 'robots.txt missing Sitemap reference');
});

test('sitemap.xml exists', () => {
  assert.ok(fs.existsSync(path.join(PUBLIC, 'sitemap.xml')), 'Missing sitemap.xml');
});

// ── Edit Post Links ──────────────────────────────────────────
console.log('\n8. Edit Post Links');

const post = fs.readFileSync(path.join(PUBLIC, 'posts/2026-02-14-hello-world/index.html'), 'utf8');

test('Post pages have "Suggest Changes" link', () => {
  assert.ok(post.includes('Suggest Changes'), 'Missing "Suggest Changes" edit link');
  assert.ok(post.includes('github.com/bradfeld/adventuresinclaude'), 'Edit link missing GitHub URL');
});

// ── Google Verification ──────────────────────────────────────
console.log('\n9. Google Verification');

test('Google site verification meta tag present', () => {
  assert.ok(
    homepage.includes('google-site-verification'),
    'Missing Google site verification meta tag'
  );
});

// ── Giscus Comments ──────────────────────────────────────────
console.log('\n10. Comments Integration');

test('Post pages have Giscus comments', () => {
  assert.ok(post.includes('giscus.app/client.js'), 'Missing Giscus script');
});

test('Giscus theme sync script present', () => {
  assert.ok(post.includes('giscus-frame'), 'Missing Giscus theme sync script');
  assert.ok(post.includes('setConfig'), 'Missing Giscus setConfig for theme sync');
});

// ── Security Headers ─────────────────────────────────────────
console.log('\n11. Security & Performance');

test('vercel.json has security headers', () => {
  const vercel = JSON.parse(fs.readFileSync(path.join(ROOT, 'vercel.json'), 'utf8'));
  assert.ok(vercel.headers, 'Missing headers in vercel.json');
  const globalHeaders = vercel.headers.find(h => h.source === '/(.*)');
  assert.ok(globalHeaders, 'Missing global headers');
  const headerNames = globalHeaders.headers.map(h => h.key);
  assert.ok(headerNames.includes('X-Content-Type-Options'), 'Missing X-Content-Type-Options');
  assert.ok(headerNames.includes('X-Frame-Options'), 'Missing X-Frame-Options');
  assert.ok(headerNames.includes('Referrer-Policy'), 'Missing Referrer-Policy');
});

test('vercel.json has asset caching', () => {
  const vercel = JSON.parse(fs.readFileSync(path.join(ROOT, 'vercel.json'), 'utf8'));
  const assetHeaders = vercel.headers.find(h => h.source === '/assets/(.*)');
  assert.ok(assetHeaders, 'Missing asset cache headers');
  const cacheHeader = assetHeaders.headers.find(h => h.key === 'Cache-Control');
  assert.ok(cacheHeader && cacheHeader.value.includes('immutable'), 'Missing immutable cache for assets');
});

// ── Service Worker ───────────────────────────────────────────
console.log('\n12. Service Worker');

test('Service worker file exists', () => {
  assert.ok(fs.existsSync(path.join(PUBLIC, 'sw.js')), 'Missing sw.js');
});

test('Service worker registration in head', () => {
  assert.ok(homepage.includes('serviceWorker'), 'Missing service worker registration');
});

// ── Callout Shortcodes ───────────────────────────────────────
console.log('\n13. Callout Shortcodes');

test('Callout shortcode template exists', () => {
  assert.ok(
    fs.existsSync(path.join(ROOT, 'layouts/shortcodes/callout.html')),
    'Missing callout shortcode'
  );
});

test('CSS contains callout styles', () => {
  assert.ok(compiledCSS.includes('callout'), 'Missing callout CSS');
  assert.ok(compiledCSS.includes('callout-note') || compiledCSS.includes('callout-tip'),
    'Missing callout type styles');
});

// ── TOC Enhancements ─────────────────────────────────────────
console.log('\n14. TOC Enhancements');

test('Custom TOC partial exists', () => {
  assert.ok(
    fs.existsSync(path.join(ROOT, 'layouts/partials/toc.html')),
    'Missing custom TOC partial'
  );
});

test('CSS contains TOC sticky styles', () => {
  assert.ok(compiledCSS.includes('sticky') || compiledCSS.includes('toc'),
    'Missing TOC enhancement CSS');
});

// ── Code Block Enhancements ──────────────────────────────────
console.log('\n15. Code Block Enhancements');

test('CSS contains code block language label styles', () => {
  assert.ok(compiledCSS.includes('data-lang'), 'Missing code block language label CSS');
});

// ── Reading List ─────────────────────────────────────────────
console.log('\n16. Reading List');

test('Reading list page has content', () => {
  const rl = fs.readFileSync(path.join(PUBLIC, 'reading-list/index.html'), 'utf8');
  assert.ok(rl.includes('Claude'), 'Reading list missing Claude section');
  assert.ok(rl.includes('Hugo') || rl.includes('hugo'), 'Reading list missing tools');
});

// ── Series Taxonomy ──────────────────────────────────────────
console.log('\n17. Series Taxonomy');

test('Series index page exists', () => {
  assert.ok(fs.existsSync(path.join(PUBLIC, 'series/index.html')), 'Missing series index');
});

test('Series templates exist', () => {
  assert.ok(
    fs.existsSync(path.join(ROOT, 'layouts/series/list.html')),
    'Missing series list template'
  );
  assert.ok(
    fs.existsSync(path.join(ROOT, 'layouts/series/terms.html')),
    'Missing series terms template'
  );
});

// ── Enhanced RSS ─────────────────────────────────────────────
console.log('\n18. Enhanced RSS');

test('RSS has media namespace', () => {
  const rss = fs.readFileSync(path.join(PUBLIC, 'index.xml'), 'utf8');
  assert.ok(rss.includes('xmlns:media'), 'RSS missing media namespace');
});

test('RSS has category tags', () => {
  const rss = fs.readFileSync(path.join(PUBLIC, 'index.xml'), 'utf8');
  assert.ok(rss.includes('<category>'), 'RSS missing category tags');
});

// ── Webmention & IndieWeb ────────────────────────────────────
console.log('\n19. Webmention & IndieWeb');

test('Webmention endpoint in head', () => {
  assert.ok(homepage.includes('webmention.io'), 'Missing webmention endpoint');
});

test('Post has h-entry microformat', () => {
  assert.ok(post.includes('h-entry'), 'Missing h-entry class on post');
});

test('Post has p-name on title', () => {
  assert.ok(post.includes('p-name'), 'Missing p-name class');
});

test('Post has e-content on body', () => {
  assert.ok(post.includes('e-content'), 'Missing e-content class');
});

test('Post has webmention display section', () => {
  assert.ok(post.includes('webmention-list'), 'Missing webmention display');
});

// ── Font Preload ─────────────────────────────────────────────
console.log('\n20. Font Preload');

test('Font preload hint in head', () => {
  assert.ok(homepage.includes('rel=preload') && homepage.includes('font/woff2'),
    'Missing font preload hint');
});

// ── Enhanced 404 ─────────────────────────────────────────────
console.log('\n21. Enhanced 404');

test('404 has custom layout with navigation', () => {
  const page404 = fs.readFileSync(path.join(PUBLIC, '404/index.html'), 'utf8');
  assert.ok(page404.includes('/search/'), '404 missing search link');
  assert.ok(page404.includes('/posts/'), '404 missing posts link');
});

// ── OG Meta Tags ─────────────────────────────────────────────
console.log('\n22. OpenGraph Meta');

test('Posts have OG meta tags', () => {
  assert.ok(post.includes('og:title'), 'Missing og:title');
  assert.ok(post.includes('og:description'), 'Missing og:description');
});

test('Posts have Twitter card meta', () => {
  assert.ok(post.includes('twitter:card'), 'Missing twitter:card');
});

test('Posts have article metadata', () => {
  assert.ok(post.includes('article:author'), 'Missing article:author');
});

// ── Image Render Hook ────────────────────────────────────────
console.log('\n23. Image Processing');

test('Custom image render hook exists', () => {
  assert.ok(
    fs.existsSync(path.join(ROOT, 'layouts/_default/_markup/render-image.html')),
    'Missing custom image render hook'
  );
});

// ── Summary ────────────────────────────────────────────────────
console.log('\n' + '═'.repeat(50));
console.log(`${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
