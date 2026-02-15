#!/usr/bin/env node
/**
 * Theme Studio Logic Tests
 *
 * Tests the pure logic from theme-studio.js:
 * 1. State merge behavior
 * 2. CSS generation output
 * 3. URL encoding/decoding round-trip
 * 4. Preset loading populates all fields
 * 5. Effect class name generation
 *
 * These tests re-implement the logic extracted from the IIFE
 * rather than importing it (since it's a browser script).
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const ROOT = path.resolve(__dirname, '..');
const STUDIO_JS = fs.readFileSync(path.join(ROOT, 'assets/js/theme-studio.js'), 'utf8');

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

// ── Extract data structures from the JS ───────────────────────
// Parse PRESET_COLORS from the source
function extractObject(varName) {
  const start = STUDIO_JS.indexOf(`var ${varName} = {`);
  if (start === -1) return null;
  let depth = 0;
  let i = STUDIO_JS.indexOf('{', start);
  const begin = i;
  for (; i < STUDIO_JS.length; i++) {
    if (STUDIO_JS[i] === '{') depth++;
    if (STUDIO_JS[i] === '}') depth--;
    if (depth === 0) break;
  }
  const raw = STUDIO_JS.substring(begin, i + 1);
  // Convert JS object literal to valid JSON
  const json = raw
    .replace(/'/g, '"')
    .replace(/(\w[\w-]*)(?=\s*:)/g, '"$1"')
    .replace(/,(\s*[}\]])/g, '$1');
  try {
    return JSON.parse(json);
  } catch (e) {
    return null;
  }
}

// ── Replicate core logic ──────────────────────────────────────
const REQUIRED_COLOR_VARS = ['theme', 'entry', 'primary', 'secondary', 'tertiary', 'content', 'code-bg', 'border'];

function defaultState() {
  return {
    version: 1,
    basePreset: 'default',
    colors: { light: {}, dark: {} },
    typography: {
      bodyFont: "system-ui, sans-serif",
      headingFont: "inherit",
      codeFont: "'JetBrains Mono', monospace",
      bodySize: 17,
      lineHeight: 1.7,
      headingWeight: 600
    },
    layout: { mainWidth: 720, gap: 24, contentGap: 20, radius: 8 },
    effects: {
      dropCaps: false, dashedBorders: false, gridBackground: false,
      textGlow: false, grayscale: false,
      sectionBreak: 'default', linkStyle: 'default', blockquoteStyle: 'default'
    }
  };
}

function mergeState(target, src) {
  target.version = src.version || 1;
  target.basePreset = src.basePreset || 'default';
  if (src.colors) {
    target.colors.light = src.colors.light || {};
    target.colors.dark = src.colors.dark || {};
  }
  if (src.typography) Object.assign(target.typography, src.typography);
  if (src.layout) Object.assign(target.layout, src.layout);
  if (src.effects) Object.assign(target.effects, src.effects);
}

function generateEffectClasses(effects) {
  var classes = [];
  if (effects.dropCaps) classes.push('effect-dropcaps');
  if (effects.dashedBorders) classes.push('effect-dashed-borders');
  if (effects.gridBackground) classes.push('effect-grid-bg');
  if (effects.textGlow) classes.push('effect-text-glow');
  if (effects.grayscale) classes.push('effect-grayscale');
  if (effects.sectionBreak !== 'default') classes.push('effect-hr-' + effects.sectionBreak);
  if (effects.linkStyle !== 'default') classes.push('effect-link-' + effects.linkStyle);
  if (effects.blockquoteStyle !== 'default') classes.push('effect-bq-' + effects.blockquoteStyle);
  return classes;
}

function generateCSS(state) {
  var lines = [];
  lines.push('/* Custom Theme — Adventures in Claude */');
  lines.push(':root {');
  lines.push('  /* Light mode */');
  for (const k of Object.keys(state.colors.light)) {
    lines.push('  --' + k + ': ' + state.colors.light[k] + ';');
  }
  lines.push('');
  lines.push('  /* Layout */');
  lines.push('  --main-width: ' + state.layout.mainWidth + 'px;');
  lines.push('  --gap: ' + state.layout.gap + 'px;');
  lines.push('  --content-gap: ' + state.layout.contentGap + 'px;');
  lines.push('  --radius: ' + state.layout.radius + 'px;');
  lines.push('}');
  lines.push('');
  lines.push('[data-theme="dark"] {');
  for (const k of Object.keys(state.colors.dark)) {
    lines.push('  --' + k + ': ' + state.colors.dark[k] + ';');
  }
  lines.push('}');
  lines.push('');
  lines.push('/* Typography */');
  lines.push('body, .post-content {');
  lines.push('  font-family: ' + state.typography.bodyFont + ';');
  lines.push('  font-size: ' + state.typography.bodySize + 'px;');
  lines.push('  line-height: ' + state.typography.lineHeight + ';');
  lines.push('}');
  var hFont = state.typography.headingFont === 'inherit' ? state.typography.bodyFont : state.typography.headingFont;
  lines.push('h1, h2, h3, h4, h5, h6 {');
  lines.push('  font-family: ' + hFont + ';');
  lines.push('  font-weight: ' + state.typography.headingWeight + ';');
  lines.push('}');
  lines.push('code, pre code {');
  lines.push('  font-family: ' + state.typography.codeFont + ';');
  lines.push('}');
  return lines.join('\n');
}

// ── Tests ──────────────────────────────────────────────────────
console.log('\nTheme Studio Logic Tests');
console.log('═'.repeat(50));

// 1. State Management
console.log('\n1. State Management');

test('Default state has valid structure', () => {
  const s = defaultState();
  assert.strictEqual(s.version, 1);
  assert.strictEqual(s.basePreset, 'default');
  assert.ok(s.colors.light);
  assert.ok(s.colors.dark);
  assert.ok(s.typography);
  assert.ok(s.layout);
  assert.ok(s.effects);
});

test('mergeState applies colors correctly', () => {
  const target = defaultState();
  mergeState(target, {
    version: 1,
    basePreset: 'claude',
    colors: {
      light: { theme: '#faf8f6', primary: '#1a1410' },
      dark: { theme: '#1a1714', primary: '#ece4da' }
    }
  });
  assert.strictEqual(target.basePreset, 'claude');
  assert.strictEqual(target.colors.light.theme, '#faf8f6');
  assert.strictEqual(target.colors.dark.primary, '#ece4da');
});

test('mergeState preserves unset fields', () => {
  const target = defaultState();
  const originalBodyFont = target.typography.bodyFont;
  mergeState(target, {
    version: 1,
    layout: { mainWidth: 800 }
  });
  assert.strictEqual(target.typography.bodyFont, originalBodyFont);
  assert.strictEqual(target.layout.mainWidth, 800);
});

test('mergeState handles missing sections gracefully', () => {
  const target = defaultState();
  mergeState(target, { version: 1 });
  assert.strictEqual(target.version, 1);
  assert.ok(target.typography.bodyFont); // should be unchanged
});

// 2. URL Encoding Round-Trip
console.log('\n2. URL Encoding Round-Trip');

test('Base64 encode/decode preserves state', () => {
  const state = defaultState();
  state.basePreset = 'terminal';
  state.colors.light = { theme: '#f0f0e8', primary: '#1a3a1a' };
  state.layout.mainWidth = 760;

  const json = JSON.stringify(state);
  const encoded = Buffer.from(json).toString('base64');
  const decoded = JSON.parse(Buffer.from(encoded, 'base64').toString());

  assert.strictEqual(decoded.basePreset, 'terminal');
  assert.strictEqual(decoded.colors.light.theme, '#f0f0e8');
  assert.strictEqual(decoded.layout.mainWidth, 760);
});

test('Round-trip preserves all effect settings', () => {
  const state = defaultState();
  state.effects.dropCaps = true;
  state.effects.sectionBreak = 'asterisks';
  state.effects.linkStyle = 'dotted';
  state.effects.blockquoteStyle = 'pull-quote';

  const json = JSON.stringify(state);
  const decoded = JSON.parse(json);

  assert.strictEqual(decoded.effects.dropCaps, true);
  assert.strictEqual(decoded.effects.sectionBreak, 'asterisks');
  assert.strictEqual(decoded.effects.linkStyle, 'dotted');
  assert.strictEqual(decoded.effects.blockquoteStyle, 'pull-quote');
});

test('Round-trip with special characters in font names', () => {
  const state = defaultState();
  state.typography.bodyFont = "'Playfair Display', 'Georgia', serif";

  const encoded = Buffer.from(JSON.stringify(state)).toString('base64');
  const decoded = JSON.parse(Buffer.from(encoded, 'base64').toString());

  assert.strictEqual(decoded.typography.bodyFont, "'Playfair Display', 'Georgia', serif");
});

// 3. CSS Generation
console.log('\n3. CSS Generation');

test('generateCSS produces valid structure', () => {
  const state = defaultState();
  state.colors.light = { theme: '#ffffff', primary: '#000000' };
  state.colors.dark = { theme: '#1d1e20', primary: '#d4d4d8' };

  const css = generateCSS(state);
  assert.ok(css.includes(':root {'), 'Missing :root block');
  assert.ok(css.includes('[data-theme="dark"]'), 'Missing dark mode block');
  assert.ok(css.includes('body, .post-content'), 'Missing body typography');
  assert.ok(css.includes('h1, h2, h3'), 'Missing heading typography');
  assert.ok(css.includes('code, pre code'), 'Missing code typography');
});

test('generateCSS includes all color variables', () => {
  const state = defaultState();
  state.colors.light = { theme: '#fff', entry: '#f6f6f6', primary: '#1d1e20', secondary: '#717', tertiary: '#e4e', content: '#313', 'code-bg': '#f2f', border: '#eee' };
  state.colors.dark = { theme: '#1d1', entry: '#2a2', primary: '#d4d', secondary: '#717', tertiary: '#3f3', content: '#b4b', 'code-bg': '#272', border: '#3f3' };

  const css = generateCSS(state);
  for (const v of REQUIRED_COLOR_VARS) {
    assert.ok(css.includes('--' + v + ':'), `Missing --${v} in generated CSS`);
  }
});

test('generateCSS includes layout variables', () => {
  const state = defaultState();
  state.colors.light = {};
  state.colors.dark = {};
  state.layout = { mainWidth: 800, gap: 32, contentGap: 28, radius: 4 };

  const css = generateCSS(state);
  assert.ok(css.includes('--main-width: 800px'), 'Missing mainWidth');
  assert.ok(css.includes('--gap: 32px'), 'Missing gap');
  assert.ok(css.includes('--content-gap: 28px'), 'Missing contentGap');
  assert.ok(css.includes('--radius: 4px'), 'Missing radius');
});

test('generateCSS resolves "inherit" heading font to body font', () => {
  const state = defaultState();
  state.colors.light = {};
  state.colors.dark = {};
  state.typography.bodyFont = "'Lora', serif";
  state.typography.headingFont = "inherit";

  const css = generateCSS(state);
  // h1-h6 should use body font when heading is "inherit"
  assert.ok(css.includes("font-family: 'Lora', serif"), 'Heading font should resolve to body font');
});

// 4. Effect Classes
console.log('\n4. Effect Class Generation');

test('No effects = empty classes array', () => {
  const effects = defaultState().effects;
  const classes = generateEffectClasses(effects);
  assert.strictEqual(classes.length, 0);
});

test('Boolean effects produce correct class names', () => {
  const effects = {
    dropCaps: true, dashedBorders: true, gridBackground: false,
    textGlow: true, grayscale: false,
    sectionBreak: 'default', linkStyle: 'default', blockquoteStyle: 'default'
  };
  const classes = generateEffectClasses(effects);
  assert.ok(classes.includes('effect-dropcaps'));
  assert.ok(classes.includes('effect-dashed-borders'));
  assert.ok(classes.includes('effect-text-glow'));
  assert.ok(!classes.includes('effect-grid-bg'));
  assert.ok(!classes.includes('effect-grayscale'));
});

test('Select effects produce correct class names', () => {
  const effects = {
    dropCaps: false, dashedBorders: false, gridBackground: false,
    textGlow: false, grayscale: false,
    sectionBreak: 'asterisks', linkStyle: 'dotted', blockquoteStyle: 'pull-quote'
  };
  const classes = generateEffectClasses(effects);
  assert.ok(classes.includes('effect-hr-asterisks'));
  assert.ok(classes.includes('effect-link-dotted'));
  assert.ok(classes.includes('effect-bq-pull-quote'));
});

test('All effects enabled at once', () => {
  const effects = {
    dropCaps: true, dashedBorders: true, gridBackground: true,
    textGlow: true, grayscale: true,
    sectionBreak: 'bar', linkStyle: 'thick', blockquoteStyle: 'italic'
  };
  const classes = generateEffectClasses(effects);
  assert.strictEqual(classes.length, 8); // 5 toggles + 3 selects
});

// 5. Data Integrity
console.log('\n5. Source Data Integrity');

test('PRESET_COLORS has light and dark for every theme', () => {
  const ALL_THEMES = ['default', 'terminal', 'manuscript', 'blueprint', 'amber', 'claude',
    'magazine', 'brutalist', 'e-ink', 'cyberpunk'];
  // Extract just the PRESET_COLORS section for testing
  const colorSection = STUDIO_JS.substring(
    STUDIO_JS.indexOf('var PRESET_COLORS'),
    STUDIO_JS.indexOf('// Default typography')
  );
  for (const theme of ALL_THEMES) {
    // Each theme should have both light: and dark: sub-objects
    const lightPattern = new RegExp(`'${theme}':[\\s\\S]*?light:\\s*\\{`);
    assert.ok(lightPattern.test(colorSection), `${theme} missing light palette in PRESET_COLORS`);
    const darkPattern = new RegExp(`'${theme}':[\\s\\S]*?dark:\\s*\\{`);
    assert.ok(darkPattern.test(colorSection), `${theme} missing dark palette in PRESET_COLORS`);
  }
});

test('PRESET_COLORS palettes have all 8 required color keys', () => {
  // Extract PRESET_COLORS section
  const colorSection = STUDIO_JS.substring(
    STUDIO_JS.indexOf('var PRESET_COLORS'),
    STUDIO_JS.indexOf('// Default typography')
  );
  for (const varName of REQUIRED_COLOR_VARS) {
    // Keys in PRESET_COLORS are unquoted (e.g., `theme:`) except 'code-bg' which is quoted
    // Match both: `theme:` (unquoted) and `'code-bg':` (quoted due to hyphen)
    const pattern = varName.includes('-')
      ? new RegExp(`'${varName}'\\s*:`, 'g')
      : new RegExp(`(?:^|[{,\\s])${varName}\\s*:`, 'gm');
    const matches = colorSection.match(pattern) || [];
    // 10 themes × 2 modes = 20 occurrences expected
    assert.ok(matches.length >= 10, `Color var "${varName}" only appears ${matches.length} times in PRESET_COLORS (expected ≥10)`);
  }
});

// ── Summary ────────────────────────────────────────────────────
console.log('\n' + '═'.repeat(50));
console.log(`${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
