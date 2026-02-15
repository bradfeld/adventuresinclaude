(function() {
  'use strict';

  // ── Preset definitions ──────────────────────────────────────────
  var PRESETS = [
    { name: 'default', label: 'Default', light: '#ffffff', dark: '#1d1e20' },
    { name: 'terminal', label: 'Terminal', light: '#f0f0e8', dark: '#0a0e0a' },
    { name: 'manuscript', label: 'Manuscript', light: '#faf7f0', dark: '#1c1a16' },
    { name: 'blueprint', label: 'Blueprint', light: '#f4f6fa', dark: '#0c1220' },
    { name: 'amber', label: 'Amber', light: '#faf5ee', dark: '#12100a' },
    { name: 'claude', label: 'Claude', light: '#faf8f6', dark: '#1a1714' },
    { name: 'magazine', label: 'Magazine', light: '#ffffff', dark: '#111111' },
    { name: 'brutalist', label: 'Brutalist', light: '#ffffff', dark: '#0a0a0a' },
    { name: 'e-ink', label: 'E-ink', light: '#f9f9f6', dark: '#1a1a18' },
    { name: 'cyberpunk', label: 'Cyberpunk', light: '#e8eaf0', dark: '#0a0a14' },
    { name: 'colorful', label: 'Colorful', light: '#fffbf5', dark: '#110e20' },
    { name: 'unicorn', label: 'Unicorn', light: '#FFF8F9', dark: '#1A141E' }
  ];

  // Default color palettes per preset (for color picker initialization)
  var PRESET_COLORS = {
    'default': {
      light: { theme:'#ffffff', entry:'#f6f6f6', primary:'#1d1e20', secondary:'#71717a', tertiary:'#e4e4e7', content:'#31343a', 'code-bg':'#f2f2f2', border:'#eeeeee' },
      dark:  { theme:'#1d1e20', entry:'#2a2b2e', primary:'#d4d4d8', secondary:'#71717a', tertiary:'#3f3f46', content:'#b4b4bc', 'code-bg':'#27272a', border:'#3f3f46' }
    },
    'terminal': {
      light: { theme:'#f0f0e8', entry:'#e8e8df', primary:'#1a3a1a', secondary:'#4a6a4a', tertiary:'#c0c8b8', content:'#1e3e1e', 'code-bg':'#d8ddd0', border:'#b8c0b0' },
      dark:  { theme:'#0a0e0a', entry:'#0f150f', primary:'#33ff33', secondary:'#22aa22', tertiary:'#1a3a1a', content:'#2bda2b', 'code-bg':'#112211', border:'#1a3a1a' }
    },
    'manuscript': {
      light: { theme:'#faf7f0', entry:'#f5f1e8', primary:'#2c2416', secondary:'#6b5f4f', tertiary:'#d4cbbe', content:'#3a3228', 'code-bg':'#eee8dc', border:'#ddd5c8' },
      dark:  { theme:'#1c1a16', entry:'#2a2722', primary:'#e8e0d0', secondary:'#a09080', tertiary:'#3e3a34', content:'#d8d0c0', 'code-bg':'#332e28', border:'#3e3a34' }
    },
    'blueprint': {
      light: { theme:'#f4f6fa', entry:'#edf0f7', primary:'#1a2744', secondary:'#4a5a7a', tertiary:'#c4cce0', content:'#212d4a', 'code-bg':'#dce2f0', border:'#bcc6dd' },
      dark:  { theme:'#0c1220', entry:'#111a2e', primary:'#c8d8f0', secondary:'#7088b0', tertiary:'#1e2a44', content:'#b0c4e0', 'code-bg':'#162040', border:'#1e2a44' }
    },
    'amber': {
      light: { theme:'#faf5ee', entry:'#f4ede2', primary:'#3a2a12', secondary:'#8a6a3a', tertiary:'#dcc8a0', content:'#42301a', 'code-bg':'#eee4d0', border:'#daccb0' },
      dark:  { theme:'#12100a', entry:'#1a1610', primary:'#ffb830', secondary:'#c08820', tertiary:'#2e2418', content:'#e8a828', 'code-bg':'#1e1a10', border:'#2e2418' }
    },
    'claude': {
      light: { theme:'#faf8f6', entry:'#f5f0ec', primary:'#1a1410', secondary:'#6b5c50', tertiary:'#ddd0c4', content:'#2a221c', 'code-bg':'#f0e8e0', border:'#e0d4c8' },
      dark:  { theme:'#1a1714', entry:'#262220', primary:'#ece4da', secondary:'#a09080', tertiary:'#3a3430', content:'#ddd4c8', 'code-bg':'#2e2a26', border:'#3a3430' }
    },
    'magazine': {
      light: { theme:'#ffffff', entry:'#f8f8f8', primary:'#111111', secondary:'#555555', tertiary:'#e0e0e0', content:'#222222', 'code-bg':'#f0f0f0', border:'#d0d0d0' },
      dark:  { theme:'#111111', entry:'#1a1a1a', primary:'#f0f0f0', secondary:'#999999', tertiary:'#2a2a2a', content:'#e0e0e0', 'code-bg':'#1e1e1e', border:'#333333' }
    },
    'brutalist': {
      light: { theme:'#ffffff', entry:'#ffffff', primary:'#000000', secondary:'#333333', tertiary:'#e0e0e0', content:'#111111', 'code-bg':'#f0f0f0', border:'#000000' },
      dark:  { theme:'#0a0a0a', entry:'#0a0a0a', primary:'#ffffff', secondary:'#cccccc', tertiary:'#222222', content:'#eeeeee', 'code-bg':'#1a1a1a', border:'#ffffff' }
    },
    'e-ink': {
      light: { theme:'#f9f9f6', entry:'#f4f4f0', primary:'#222222', secondary:'#666666', tertiary:'#e0e0dc', content:'#333333', 'code-bg':'#eeeeea', border:'#cccccc' },
      dark:  { theme:'#1a1a18', entry:'#222220', primary:'#d4d4d0', secondary:'#888884', tertiary:'#2e2e2c', content:'#c0c0bc', 'code-bg':'#282826', border:'#3a3a38' }
    },
    'cyberpunk': {
      light: { theme:'#e8eaf0', entry:'#dde0e8', primary:'#1a1030', secondary:'#4a3a6a', tertiary:'#c0bcd0', content:'#221840', 'code-bg':'#d0cce0', border:'#8080aa' },
      dark:  { theme:'#0a0a14', entry:'#0e0e1e', primary:'#e0e0ff', secondary:'#8888cc', tertiary:'#1a1a2e', content:'#d0d0ee', 'code-bg':'#12121e', border:'#00ffff' }
    },
    'colorful': {
      light: { theme:'#fffbf5', entry:'#fff5eb', primary:'#1e1040', secondary:'#6b4c9a', tertiary:'#ede4f7', content:'#2a1a50', 'code-bg':'#f3ecff', border:'#e0d0f0' },
      dark:  { theme:'#110e20', entry:'#1a1630', primary:'#f0e8ff', secondary:'#a890d0', tertiary:'#2a2244', content:'#e0d4f0', 'code-bg':'#1e1a30', border:'#332a50' }
    },
    'unicorn': {
      light: { theme:'#FFF8F9', entry:'#FFF2F5', primary:'#3A2D3D', secondary:'#7A6B80', tertiary:'#F3EDF7', content:'#4A3D50', 'code-bg':'#FFF0F3', border:'#E8D8EE' },
      dark:  { theme:'#1A141E', entry:'#221A28', primary:'#F5DDE2', secondary:'#A898B0', tertiary:'#2E2434', content:'#E8D0D8', 'code-bg':'#1E162A', border:'#3A2E44' }
    }
  };

  // Default typography/layout per preset
  var PRESET_TYPOGRAPHY = {
    'default':    { bodyFont: "system-ui, sans-serif", headingFont: "inherit", codeFont: "'JetBrains Mono', monospace", bodySize: 17, lineHeight: 1.7, headingWeight: 600, mainWidth: 720, gap: 24, contentGap: 20, radius: 8 },
    'terminal':   { bodyFont: "'JetBrains Mono', 'Fira Code', 'SF Mono', 'Cascadia Code', monospace", headingFont: "'JetBrains Mono', monospace", codeFont: "'JetBrains Mono', monospace", bodySize: 16, lineHeight: 1.7, headingWeight: 700, mainWidth: 760, gap: 20, contentGap: 16, radius: 0 },
    'manuscript': { bodyFont: "'Lora', 'Georgia', 'Times New Roman', serif", headingFont: "'Playfair Display', 'Georgia', serif", codeFont: "'JetBrains Mono', monospace", bodySize: 19, lineHeight: 1.8, headingWeight: 700, mainWidth: 660, gap: 28, contentGap: 24, radius: 4 },
    'blueprint':  { bodyFont: "'Inter', 'Helvetica Neue', 'Arial', sans-serif", headingFont: "'Space Grotesk', 'Inter', sans-serif", codeFont: "'JetBrains Mono', monospace", bodySize: 17, lineHeight: 1.65, headingWeight: 600, mainWidth: 740, gap: 24, contentGap: 20, radius: 2 },
    'amber':      { bodyFont: "'IBM Plex Sans', 'Helvetica Neue', sans-serif", headingFont: "'IBM Plex Sans', sans-serif", codeFont: "'IBM Plex Mono', monospace", bodySize: 17, lineHeight: 1.7, headingWeight: 600, mainWidth: 720, gap: 24, contentGap: 20, radius: 6 },
    'claude':     { bodyFont: "'DM Sans', 'Helvetica Neue', sans-serif", headingFont: "'DM Sans', sans-serif", codeFont: "'DM Mono', 'JetBrains Mono', monospace", bodySize: 18, lineHeight: 1.7, headingWeight: 600, mainWidth: 720, gap: 28, contentGap: 22, radius: 12 },
    'magazine':   { bodyFont: "'Inter', 'Helvetica Neue', sans-serif", headingFont: "'Playfair Display', 'Georgia', serif", codeFont: "'JetBrains Mono', monospace", bodySize: 17, lineHeight: 1.7, headingWeight: 700, mainWidth: 820, gap: 32, contentGap: 28, radius: 2 },
    'brutalist':  { bodyFont: "'Space Grotesk', 'Arial', sans-serif", headingFont: "'Space Grotesk', 'Arial', sans-serif", codeFont: "'JetBrains Mono', monospace", bodySize: 17, lineHeight: 1.6, headingWeight: 700, mainWidth: 780, gap: 20, contentGap: 16, radius: 0 },
    'e-ink':      { bodyFont: "'Lora', 'Georgia', serif", headingFont: "'Lora', 'Georgia', serif", codeFont: "'JetBrains Mono', monospace", bodySize: 20, lineHeight: 1.9, headingWeight: 600, mainWidth: 600, gap: 24, contentGap: 20, radius: 0 },
    'cyberpunk':  { bodyFont: "'JetBrains Mono', 'Fira Code', monospace", headingFont: "'Space Grotesk', sans-serif", codeFont: "'JetBrains Mono', monospace", bodySize: 15, lineHeight: 1.7, headingWeight: 700, mainWidth: 760, gap: 20, contentGap: 18, radius: 0 },
    'colorful':   { bodyFont: "'DM Sans', 'Helvetica Neue', sans-serif", headingFont: "'Space Grotesk', sans-serif", codeFont: "'JetBrains Mono', monospace", bodySize: 17, lineHeight: 1.7, headingWeight: 700, mainWidth: 720, gap: 24, contentGap: 20, radius: 12 },
    'unicorn':    { bodyFont: "'Quicksand', 'DM Sans', sans-serif", headingFont: "'Quicksand', sans-serif", codeFont: "'JetBrains Mono', monospace", bodySize: 17, lineHeight: 1.75, headingWeight: 700, mainWidth: 740, gap: 24, contentGap: 20, radius: 16 }
  };

  // ── State ────────────────────────────────────────────────────────
  var state = {
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
      textGlow: false, grayscale: false, colorAccents: false,
      sectionBreak: 'default', linkStyle: 'default', blockquoteStyle: 'default'
    }
  };

  var html = document.documentElement;
  var customStyleEl = null;

  // ── Initialization ──────────────────────────────────────────────
  function init() {
    loadFromURL() || loadFromStorage();
    buildPresetGrid();
    bindColorTabs();
    bindControls();
    bindEffects();
    bindExport();
    syncControlsFromState();
    applyCustomTheme();
    observeDarkModeToggle();
  }

  // ── Persistence ─────────────────────────────────────────────────
  function saveToStorage() {
    try { localStorage.setItem('custom-theme-settings', JSON.stringify(state)); } catch(e) {}
  }

  function loadFromStorage() {
    try {
      var saved = localStorage.getItem('custom-theme-settings');
      if (saved) {
        var parsed = JSON.parse(saved);
        if (parsed && parsed.version) {
          mergeState(parsed);
          return true;
        }
      }
    } catch(e) {}
    // Initialize colors from default preset
    state.colors.light = cloneObj(PRESET_COLORS['default'].light);
    state.colors.dark = cloneObj(PRESET_COLORS['default'].dark);
    return false;
  }

  function loadFromURL() {
    var params = new URLSearchParams(window.location.search);
    var encoded = params.get('t');
    if (!encoded) return false;
    try {
      var json = atob(encoded);
      var parsed = JSON.parse(json);
      if (parsed && parsed.version) {
        mergeState(parsed);
        // Clean URL without reload
        window.history.replaceState({}, '', window.location.pathname);
        return true;
      }
    } catch(e) {}
    return false;
  }

  function mergeState(src) {
    state.version = src.version || 1;
    state.basePreset = src.basePreset || 'default';
    if (src.colors) {
      state.colors.light = src.colors.light || cloneObj(PRESET_COLORS[state.basePreset].light);
      state.colors.dark = src.colors.dark || cloneObj(PRESET_COLORS[state.basePreset].dark);
    } else {
      state.colors.light = cloneObj(PRESET_COLORS[state.basePreset].light);
      state.colors.dark = cloneObj(PRESET_COLORS[state.basePreset].dark);
    }
    if (src.typography) Object.assign(state.typography, src.typography);
    if (src.layout) Object.assign(state.layout, src.layout);
    if (src.effects) Object.assign(state.effects, src.effects);
  }

  // ── Preset Grid ─────────────────────────────────────────────────
  function buildPresetGrid() {
    var grid = document.getElementById('preset-grid');
    if (!grid) return;
    grid.innerHTML = '';
    PRESETS.forEach(function(p) {
      var btn = document.createElement('button');
      btn.className = 'preset-btn' + (p.name === state.basePreset ? ' active' : '');
      btn.innerHTML =
        '<span class="preset-swatch" style="background:' + p.light + '">' +
        '<span class="preset-swatch-dark" style="background:' + p.dark + '"></span></span>' +
        '<span>' + p.label + '</span>';
      btn.addEventListener('click', function() {
        loadPreset(p.name);
      });
      grid.appendChild(btn);
    });
  }

  function loadPreset(name) {
    state.basePreset = name;
    state.colors.light = cloneObj(PRESET_COLORS[name].light);
    state.colors.dark = cloneObj(PRESET_COLORS[name].dark);
    var typo = PRESET_TYPOGRAPHY[name];
    state.typography.bodyFont = typo.bodyFont;
    state.typography.headingFont = typo.headingFont;
    state.typography.codeFont = typo.codeFont;
    state.typography.bodySize = typo.bodySize;
    state.typography.lineHeight = typo.lineHeight;
    state.typography.headingWeight = typo.headingWeight;
    state.layout.mainWidth = typo.mainWidth;
    state.layout.gap = typo.gap;
    state.layout.contentGap = typo.contentGap;
    state.layout.radius = typo.radius;
    // Reset effects
    state.effects = {
      dropCaps: false, dashedBorders: false, gridBackground: false,
      textGlow: false, grayscale: false, colorAccents: false,
      sectionBreak: 'default', linkStyle: 'default', blockquoteStyle: 'default'
    };
    syncControlsFromState();
    applyCustomTheme();
    buildPresetGrid();
    saveToStorage();
  }

  // ── Color Tabs ──────────────────────────────────────────────────
  function bindColorTabs() {
    var tabs = document.querySelectorAll('.color-tab');
    tabs.forEach(function(tab) {
      tab.addEventListener('click', function() {
        tabs.forEach(function(t) { t.classList.remove('active'); });
        tab.classList.add('active');
        var mode = tab.getAttribute('data-color-mode');
        document.getElementById('color-controls-light').style.display = mode === 'light' ? '' : 'none';
        document.getElementById('color-controls-dark').style.display = mode === 'dark' ? '' : 'none';
      });
    });
  }

  // ── Control Bindings ────────────────────────────────────────────
  function bindControls() {
    // Color inputs
    document.querySelectorAll('input[type="color"]').forEach(function(input) {
      input.addEventListener('input', function() {
        var varName = input.getAttribute('data-var');
        var mode = input.getAttribute('data-mode');
        state.colors[mode][varName] = input.value;
        applyCustomTheme();
        saveToStorage();
      });
    });

    // Typography selects
    bindSelect('body-font', function(v) { state.typography.bodyFont = v; });
    bindSelect('heading-font', function(v) { state.typography.headingFont = v; });
    bindSelect('code-font', function(v) { state.typography.codeFont = v; });
    bindSelect('heading-weight', function(v) { state.typography.headingWeight = parseInt(v); });

    // Typography sliders
    bindRange('body-size', 'body-size-val', 'px', function(v) { state.typography.bodySize = parseInt(v); });
    bindRange('line-height', 'line-height-val', '', function(v) { state.typography.lineHeight = parseFloat(v); });

    // Layout sliders
    bindRange('content-width', 'content-width-val', 'px', function(v) { state.layout.mainWidth = parseInt(v); });
    bindRange('gap', 'gap-val', 'px', function(v) { state.layout.gap = parseInt(v); });
    bindRange('content-gap', 'content-gap-val', 'px', function(v) { state.layout.contentGap = parseInt(v); });
    bindRange('radius', 'radius-val', 'px', function(v) { state.layout.radius = parseInt(v); });
  }

  function bindSelect(id, setter) {
    var el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('change', function() {
      setter(el.value);
      applyCustomTheme();
      saveToStorage();
    });
  }

  function bindRange(id, outputId, suffix, setter) {
    var el = document.getElementById(id);
    var output = document.getElementById(outputId);
    if (!el) return;
    el.addEventListener('input', function() {
      setter(el.value);
      if (output) output.textContent = el.value + suffix;
      applyCustomTheme();
      saveToStorage();
    });
  }

  // ── Effects ─────────────────────────────────────────────────────
  function bindEffects() {
    bindCheckbox('effect-dropcaps', function(v) { state.effects.dropCaps = v; });
    bindCheckbox('effect-dashed-borders', function(v) { state.effects.dashedBorders = v; });
    bindCheckbox('effect-grid-bg', function(v) { state.effects.gridBackground = v; });
    bindCheckbox('effect-text-glow', function(v) { state.effects.textGlow = v; });
    bindCheckbox('effect-grayscale', function(v) { state.effects.grayscale = v; });
    bindCheckbox('effect-color-accents', function(v) { state.effects.colorAccents = v; });

    bindSelect('effect-section-break', function(v) { state.effects.sectionBreak = v; });
    bindSelect('effect-link-style', function(v) { state.effects.linkStyle = v; });
    bindSelect('effect-blockquote-style', function(v) { state.effects.blockquoteStyle = v; });
  }

  function bindCheckbox(id, setter) {
    var el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('change', function() {
      setter(el.checked);
      applyCustomTheme();
      saveToStorage();
    });
  }

  // ── Apply Theme ─────────────────────────────────────────────────
  function applyCustomTheme() {
    // Set full-theme to custom
    html.setAttribute('data-full-theme', 'custom');
    localStorage.setItem('full-theme', 'custom');

    // Determine current mode
    var isDark = html.getAttribute('data-theme') === 'dark';
    var colors = isDark ? state.colors.dark : state.colors.light;

    // Apply color vars as inline styles
    var vars = Object.keys(colors);
    for (var i = 0; i < vars.length; i++) {
      html.style.setProperty('--' + vars[i], colors[vars[i]]);
    }

    // Layout vars
    html.style.setProperty('--main-width', state.layout.mainWidth + 'px');
    html.style.setProperty('--gap', state.layout.gap + 'px');
    html.style.setProperty('--content-gap', state.layout.contentGap + 'px');
    html.style.setProperty('--radius', state.layout.radius + 'px');

    // Typography via injected style element
    if (!customStyleEl) {
      customStyleEl = document.createElement('style');
      customStyleEl.id = 'custom-theme-style';
      document.head.appendChild(customStyleEl);
    }
    customStyleEl.textContent =
      '[data-full-theme="custom"] body, [data-full-theme="custom"] .post-content, .preview-content {' +
        'font-family: ' + state.typography.bodyFont + ';' +
        'font-size: ' + state.typography.bodySize + 'px;' +
        'line-height: ' + state.typography.lineHeight + ';' +
      '}' +
      '[data-full-theme="custom"] h1, [data-full-theme="custom"] h2, [data-full-theme="custom"] h3,' +
      '[data-full-theme="custom"] h4, [data-full-theme="custom"] h5, [data-full-theme="custom"] h6,' +
      '[data-full-theme="custom"] .logo a, [data-full-theme="custom"] .post-title,' +
      '.preview-content h1, .preview-content h2, .preview-content h3 {' +
        'font-family: ' + (state.typography.headingFont === 'inherit' ? state.typography.bodyFont : state.typography.headingFont) + ';' +
        'font-weight: ' + state.typography.headingWeight + ';' +
      '}' +
      '[data-full-theme="custom"] code, [data-full-theme="custom"] pre code, .preview-content code {' +
        'font-family: ' + state.typography.codeFont + ';' +
      '}';

    // Effect classes
    var effectClasses = [];
    if (state.effects.dropCaps) effectClasses.push('effect-dropcaps');
    if (state.effects.dashedBorders) effectClasses.push('effect-dashed-borders');
    if (state.effects.gridBackground) effectClasses.push('effect-grid-bg');
    if (state.effects.textGlow) effectClasses.push('effect-text-glow');
    if (state.effects.grayscale) effectClasses.push('effect-grayscale');
    if (state.effects.colorAccents) effectClasses.push('effect-color-accents');
    if (state.effects.sectionBreak !== 'default') effectClasses.push('effect-hr-' + state.effects.sectionBreak);
    if (state.effects.linkStyle !== 'default') effectClasses.push('effect-link-' + state.effects.linkStyle);
    if (state.effects.blockquoteStyle !== 'default') effectClasses.push('effect-bq-' + state.effects.blockquoteStyle);

    // Remove old effect classes, add new ones
    var existing = html.className.split(' ').filter(function(c) { return c && c.indexOf('effect-') !== 0; });
    html.className = existing.concat(effectClasses).join(' ').trim();
  }

  // ── Sync Controls from State ────────────────────────────────────
  function syncControlsFromState() {
    // Colors
    ['light', 'dark'].forEach(function(mode) {
      document.querySelectorAll('input[type="color"][data-mode="' + mode + '"]').forEach(function(input) {
        var varName = input.getAttribute('data-var');
        if (state.colors[mode][varName]) {
          input.value = state.colors[mode][varName];
        }
      });
    });

    // Typography
    setSelectValue('body-font', state.typography.bodyFont);
    setSelectValue('heading-font', state.typography.headingFont);
    setSelectValue('code-font', state.typography.codeFont);
    setSelectValue('heading-weight', String(state.typography.headingWeight));
    setRangeValue('body-size', state.typography.bodySize, 'body-size-val', 'px');
    setRangeValue('line-height', state.typography.lineHeight, 'line-height-val', '');

    // Layout
    setRangeValue('content-width', state.layout.mainWidth, 'content-width-val', 'px');
    setRangeValue('gap', state.layout.gap, 'gap-val', 'px');
    setRangeValue('content-gap', state.layout.contentGap, 'content-gap-val', 'px');
    setRangeValue('radius', state.layout.radius, 'radius-val', 'px');

    // Effects
    setCheckbox('effect-dropcaps', state.effects.dropCaps);
    setCheckbox('effect-dashed-borders', state.effects.dashedBorders);
    setCheckbox('effect-grid-bg', state.effects.gridBackground);
    setCheckbox('effect-text-glow', state.effects.textGlow);
    setCheckbox('effect-grayscale', state.effects.grayscale);
    setCheckbox('effect-color-accents', state.effects.colorAccents);
    setSelectValue('effect-section-break', state.effects.sectionBreak);
    setSelectValue('effect-link-style', state.effects.linkStyle);
    setSelectValue('effect-blockquote-style', state.effects.blockquoteStyle);
  }

  // ── Export / Share ──────────────────────────────────────────────
  function bindExport() {
    var copyBtn = document.getElementById('copy-css-btn');
    var shareBtn = document.getElementById('share-url-btn');
    var exportBtn = document.getElementById('export-json-btn');
    var importBtn = document.getElementById('import-json-btn');
    var importInput = document.getElementById('import-json-input');
    var feedback = document.getElementById('export-feedback');

    if (copyBtn) copyBtn.addEventListener('click', function() {
      var css = generateCSS();
      navigator.clipboard.writeText(css).then(function() {
        showFeedback(feedback, 'CSS copied to clipboard!');
      }).catch(function() {
        // Fallback: show in prompt
        prompt('Copy this CSS:', css);
      });
    });

    if (shareBtn) shareBtn.addEventListener('click', function() {
      var json = JSON.stringify(state);
      var encoded = btoa(json);
      var url = window.location.origin + '/theme-studio/?t=' + encoded;
      navigator.clipboard.writeText(url).then(function() {
        showFeedback(feedback, 'Share URL copied!');
      }).catch(function() {
        prompt('Copy this URL:', url);
      });
    });

    if (exportBtn) exportBtn.addEventListener('click', function() {
      var json = JSON.stringify(state, null, 2);
      var blob = new Blob([json], { type: 'application/json' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'theme-studio-settings.json';
      a.click();
      URL.revokeObjectURL(a.href);
      showFeedback(feedback, 'JSON downloaded!');
    });

    if (importBtn && importInput) {
      importBtn.addEventListener('click', function() { importInput.click(); });
      importInput.addEventListener('change', function(e) {
        var file = e.target.files[0];
        if (!file) return;
        var reader = new FileReader();
        reader.onload = function(ev) {
          try {
            var parsed = JSON.parse(ev.target.result);
            if (parsed && parsed.version) {
              mergeState(parsed);
              syncControlsFromState();
              applyCustomTheme();
              buildPresetGrid();
              saveToStorage();
              showFeedback(feedback, 'Theme imported!');
            }
          } catch(err) {
            showFeedback(feedback, 'Invalid JSON file');
          }
        };
        reader.readAsText(file);
        importInput.value = '';
      });
    }
  }

  function generateCSS() {
    var lines = [];
    lines.push('/* Custom Theme — Adventures in Claude */');
    lines.push(':root {');

    // Light colors
    lines.push('  /* Light mode */');
    var lightVars = Object.keys(state.colors.light);
    for (var i = 0; i < lightVars.length; i++) {
      lines.push('  --' + lightVars[i] + ': ' + state.colors.light[lightVars[i]] + ';');
    }
    lines.push('');

    // Layout
    lines.push('  /* Layout */');
    lines.push('  --main-width: ' + state.layout.mainWidth + 'px;');
    lines.push('  --gap: ' + state.layout.gap + 'px;');
    lines.push('  --content-gap: ' + state.layout.contentGap + 'px;');
    lines.push('  --radius: ' + state.layout.radius + 'px;');
    lines.push('}');
    lines.push('');

    // Dark colors
    lines.push('[data-theme="dark"] {');
    var darkVars = Object.keys(state.colors.dark);
    for (var j = 0; j < darkVars.length; j++) {
      lines.push('  --' + darkVars[j] + ': ' + state.colors.dark[darkVars[j]] + ';');
    }
    lines.push('}');
    lines.push('');

    // Typography
    lines.push('/* Typography */');
    lines.push('body, .post-content {');
    lines.push('  font-family: ' + state.typography.bodyFont + ';');
    lines.push('  font-size: ' + state.typography.bodySize + 'px;');
    lines.push('  line-height: ' + state.typography.lineHeight + ';');
    lines.push('}');
    lines.push('h1, h2, h3, h4, h5, h6 {');
    var hFont = state.typography.headingFont === 'inherit' ? state.typography.bodyFont : state.typography.headingFont;
    lines.push('  font-family: ' + hFont + ';');
    lines.push('  font-weight: ' + state.typography.headingWeight + ';');
    lines.push('}');
    lines.push('code, pre code {');
    lines.push('  font-family: ' + state.typography.codeFont + ';');
    lines.push('}');

    return lines.join('\n');
  }

  // ── Dark Mode Observer ──────────────────────────────────────────
  function observeDarkModeToggle() {
    var observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(m) {
        if (m.attributeName === 'data-theme' && html.getAttribute('data-full-theme') === 'custom') {
          applyCustomTheme();
        }
      });
    });
    observer.observe(html, { attributes: true, attributeFilter: ['data-theme'] });
  }

  // ── Helpers ─────────────────────────────────────────────────────
  function cloneObj(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function setSelectValue(id, val) {
    var el = document.getElementById(id);
    if (!el) return;
    // Try exact match first
    for (var i = 0; i < el.options.length; i++) {
      if (el.options[i].value === val) { el.selectedIndex = i; return; }
    }
    // Partial match for font families (first font name)
    var firstFont = val.split(',')[0].trim().replace(/'/g, '');
    for (var j = 0; j < el.options.length; j++) {
      if (el.options[j].value.indexOf(firstFont) !== -1) { el.selectedIndex = j; return; }
    }
  }

  function setRangeValue(id, val, outputId, suffix) {
    var el = document.getElementById(id);
    var output = document.getElementById(outputId);
    if (el) el.value = val;
    if (output) output.textContent = val + suffix;
  }

  function setCheckbox(id, val) {
    var el = document.getElementById(id);
    if (el) el.checked = val;
  }

  function showFeedback(el, msg) {
    if (!el) return;
    el.textContent = msg;
    setTimeout(function() { el.textContent = ''; }, 3000);
  }

  // ── Boot ────────────────────────────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
