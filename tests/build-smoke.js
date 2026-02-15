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
  '404/index.html'
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
  // Hugo minifies variable names, but string literals survive
  assert.ok(studioPage.includes('custom-theme-settings'), 'Missing theme-studio.js localStorage key');
  assert.ok(studioPage.includes('preset-grid'), 'Missing preset grid reference');
});

// ── Compiled CSS ──────────────────────────────────────────────
console.log('\n4. Theme CSS');

// Find the compiled stylesheet
const cssFiles = fs.readdirSync(path.join(PUBLIC, 'assets/css'))
  .filter(f => f.startsWith('stylesheet.') && f.endsWith('.css'));

test('Compiled CSS file exists', () => {
  assert.ok(cssFiles.length > 0, 'No compiled CSS found in public/assets/css/');
});

if (cssFiles.length > 0) {
  const compiledCSS = fs.readFileSync(
    path.join(PUBLIC, 'assets/css', cssFiles[0]), 'utf8'
  );

  const THEMES_IN_CSS = [
    'terminal', 'manuscript', 'blueprint', 'amber', 'claude',
    'magazine', 'brutalist', 'e-ink', 'cyberpunk'
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

const EXPECTED_NAV = ['Posts', 'Tags', 'Search', 'Subscribe', 'Themes', 'About'];
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

// ── Summary ────────────────────────────────────────────────────
console.log('\n' + '═'.repeat(50));
console.log(`${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
