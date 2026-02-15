#!/usr/bin/env node
/**
 * Theme Completeness Validator
 *
 * Parses themes.css and verifies:
 * 1. Every theme has both light and dark color blocks
 * 2. Each color block defines all 8 required CSS variables
 * 3. The theme picker THEMES array matches the CSS definitions
 * 4. PRESET_COLORS in theme-studio.js covers every theme
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const ROOT = path.resolve(__dirname, '..');
const THEMES_CSS = path.join(ROOT, 'assets/css/extended/themes.css');
const STUDIO_JS = path.join(ROOT, 'assets/js/theme-studio.js');
const FOOTER_HTML = path.join(ROOT, 'layouts/partials/extend_footer.html');

// "default" theme uses PaperMod's built-in vars, so it has no [data-full-theme] block
const THEMES_WITH_CSS = [
  'terminal', 'manuscript', 'blueprint', 'amber', 'claude',
  'magazine', 'brutalist', 'e-ink', 'cyberpunk', 'colorful'
];

const ALL_THEMES = ['default', ...THEMES_WITH_CSS];

const REQUIRED_VARS = [
  '--theme', '--entry', '--primary', '--secondary',
  '--tertiary', '--content', '--code-bg', '--border'
];

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

// ── Parse CSS ──────────────────────────────────────────────────
const css = fs.readFileSync(THEMES_CSS, 'utf8');

function findColorBlock(theme, mode) {
  // Match [data-full-theme="X"][data-theme="light/dark"] { ... }
  const pattern = new RegExp(
    `\\[data-full-theme="${theme}"\\]\\[data-theme="${mode}"\\]\\s*\\{([^}]+)\\}`,
    'g'
  );
  const match = pattern.exec(css);
  return match ? match[1] : null;
}

function extractVars(block) {
  const vars = [];
  const pattern = /--([\w-]+)\s*:/g;
  let m;
  while ((m = pattern.exec(block)) !== null) {
    vars.push('--' + m[1]);
  }
  return vars;
}

// ── Tests ──────────────────────────────────────────────────────
console.log('\nTheme Completeness Tests');
console.log('═'.repeat(50));

console.log('\n1. Color Blocks (light + dark for each theme)');
for (const theme of THEMES_WITH_CSS) {
  test(`${theme} has light color block`, () => {
    const block = findColorBlock(theme, 'light');
    assert.ok(block, `Missing [data-full-theme="${theme}"][data-theme="light"] block`);
  });

  test(`${theme} has dark color block`, () => {
    const block = findColorBlock(theme, 'dark');
    assert.ok(block, `Missing [data-full-theme="${theme}"][data-theme="dark"] block`);
  });
}

console.log('\n2. Required CSS Variables');
for (const theme of THEMES_WITH_CSS) {
  for (const mode of ['light', 'dark']) {
    test(`${theme}/${mode} has all 8 required vars`, () => {
      const block = findColorBlock(theme, mode);
      if (!block) {
        assert.fail(`No ${mode} block found for ${theme}`);
        return;
      }
      const vars = extractVars(block);
      const missing = REQUIRED_VARS.filter(v => !vars.includes(v));
      assert.strictEqual(
        missing.length, 0,
        `Missing vars in ${theme}/${mode}: ${missing.join(', ')}`
      );
    });
  }
}

console.log('\n3. Layout Variables');
for (const theme of THEMES_WITH_CSS) {
  test(`${theme} has layout vars (radius, gap, main-width)`, () => {
    // Layout vars are on the base selector [data-full-theme="X"] { ... }
    const pattern = new RegExp(
      `\\[data-full-theme="${theme}"\\]\\s*\\{([^}]+)\\}`
    );
    const match = pattern.exec(css);
    assert.ok(match, `No base layout block for ${theme}`);
    const block = match[1];
    assert.ok(block.includes('--radius'), `${theme} missing --radius`);
    assert.ok(block.includes('--gap'), `${theme} missing --gap`);
    assert.ok(block.includes('--main-width'), `${theme} missing --main-width`);
  });
}

console.log('\n4. Theme Picker Consistency');
const footer = fs.readFileSync(FOOTER_HTML, 'utf8');
test('Footer THEMES array includes all 10 presets + custom', () => {
  for (const theme of ALL_THEMES) {
    assert.ok(
      footer.includes(`name: '${theme}'`),
      `Theme picker missing: ${theme}`
    );
  }
  assert.ok(footer.includes("name: 'custom'"), 'Theme picker missing: custom');
});

console.log('\n5. Studio JS Preset Coverage');
const studioJS = fs.readFileSync(STUDIO_JS, 'utf8');
test('PRESET_COLORS covers all themes', () => {
  for (const theme of ALL_THEMES) {
    assert.ok(
      studioJS.includes(`'${theme}':`),
      `PRESET_COLORS missing: ${theme}`
    );
  }
});

test('PRESET_TYPOGRAPHY covers all themes', () => {
  for (const theme of ALL_THEMES) {
    // Check PRESET_TYPOGRAPHY section specifically
    const typoSection = studioJS.substring(
      studioJS.indexOf('var PRESET_TYPOGRAPHY'),
      studioJS.indexOf('// ── State')
    );
    assert.ok(
      typoSection.includes(`'${theme}':`),
      `PRESET_TYPOGRAPHY missing: ${theme}`
    );
  }
});

test('PRESETS array in studio JS matches all themes', () => {
  const presetsSection = studioJS.substring(
    studioJS.indexOf('var PRESETS'),
    studioJS.indexOf('// Default color palettes')
  );
  for (const theme of ALL_THEMES) {
    assert.ok(
      presetsSection.includes(`name: '${theme}'`),
      `PRESETS array missing: ${theme}`
    );
  }
});

// ── Summary ────────────────────────────────────────────────────
console.log('\n' + '═'.repeat(50));
console.log(`${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
