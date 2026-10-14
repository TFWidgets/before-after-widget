/*!
 * TF Widgets — Before/After Slider v1
 * Встраивание: <script src=".../embed.js" data-id="CLIENT_ID"></script>
 * Конфиг клиента: configs/CLIENT_ID.json
 * Слайдер «до/после»: два фото одно над другим, посетитель тянет ручку и сравнивает.
 * До 6 пар, переключение миниатюрами, метки Before/After и подпись под парой.
 * Фото клиент даёт ссылками (https), мы их не храним. Виджет встаёт на место тега <script>.
 * Все стили ограничены классом .bhw-ba, чтобы не спорить с другими виджетами и темой сайта.
 */
(function () {
    'use strict';
    var VERSION = '1.0.0';
    var LOG = '[TFW Before/After]';
    var MAX_PAIRS = 6;
    // Где работает живое превью BHWBeforeAfter.render() (конфигуратор на сайте)
    var PREVIEW_DOMAINS = ['tf-widgets.com', '*.tf-widgets.com', '9ac5za-h1.myshopify.com'];
    var RATIOS = { '16:9': '16 / 9', '3:2': '3 / 2', '4:3': '4 / 3', '1:1': '1 / 1', '4:5': '4 / 5' };

    var ICONS = {
        arrows: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M9.4 6.6 4 12l5.4 5.4 1.4-1.4L6.8 12l4-4zM14.6 6.6 13.2 8l4 4-4 4 1.4 1.4L20 12z"/></svg>'
    };

    var inlineCSS = `
        .bhw-ba { font-family: var(--bhw-font, 'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif); -webkit-font-smoothing: antialiased;
            display: block; position: relative; width: 100%; max-width: var(--bhw-max, 900px); margin: 0 auto; padding: var(--bhw-pad, 0px);
            background: var(--bhw-bg, transparent); color: var(--bhw-text, #111827); border-radius: calc(var(--bhw-r, 16px) + 6px);
            line-height: 1.45; font-size: 15px; text-align: left; box-sizing: border-box; }
        .bhw-ba *, .bhw-ba *::before, .bhw-ba *::after { box-sizing: border-box; }
        .bhw-ba .bhw-ba-h { margin: 0 0 14px; padding: 0; font-size: 24px; font-weight: 700; line-height: 1.25; letter-spacing: -.01em; color: inherit; }

        /* сцена со слайдером */
        .bhw-ba .bhw-ba-stage { position: relative; width: 100%; aspect-ratio: var(--bhw-ratio, 3 / 2); overflow: hidden; border-radius: var(--bhw-r, 16px);
            background: #e5e7eb; cursor: ew-resize; user-select: none; -webkit-user-select: none; touch-action: pan-y; -webkit-tap-highlight-color: transparent;
            box-shadow: 0 1px 2px rgba(0,0,0,.06), 0 12px 32px -18px rgba(0,0,0,.35); isolation: isolate; }
        .bhw-ba .bhw-ba-layer { position: absolute; inset: 0; margin: 0; padding: 0; }
        .bhw-ba .bhw-ba-layer img { position: absolute; inset: 0; width: 100% !important; height: 100% !important; max-width: none !important; margin: 0 !important; padding: 0 !important;
            border: 0 !important; border-radius: 0 !important; box-shadow: none !important; object-fit: cover; display: block; pointer-events: none; -webkit-user-drag: none; }
        .bhw-ba .bhw-ba-before { z-index: 1; clip-path: inset(0 calc(100% - var(--bhw-pos, 50%)) 0 0); }
        .bhw-ba .bhw-ba-layer.bhw-ba-broken img { display: none; }
        .bhw-ba .bhw-ba-layer.bhw-ba-broken { background: repeating-linear-gradient(45deg, #e5e7eb 0 12px, #d1d5db 12px 24px); }
        .bhw-ba .bhw-ba-before.bhw-ba-broken { background: repeating-linear-gradient(-45deg, #f3f4f6 0 12px, #e5e7eb 12px 24px); }
        .bhw-ba .bhw-ba-broken::after { content: attr(data-msg); position: absolute; bottom: 14px; right: 14px; padding: 6px 12px; border-radius: 8px; background: rgba(17,24,39,.75); color: #fff; font-size: 13px; font-weight: 600; }
        .bhw-ba .bhw-ba-before.bhw-ba-broken::after { right: auto; left: 14px; }

        /* метки */
        .bhw-ba .bhw-ba-tag { position: absolute; top: 14px; z-index: 3; margin: 0; padding: 6px 12px; border-radius: 999px; pointer-events: none;
            background: rgba(17,24,39,.62); color: #fff; font-size: 12.5px; font-weight: 700; letter-spacing: .04em; text-transform: uppercase; line-height: 1.2;
            -webkit-backdrop-filter: blur(6px); backdrop-filter: blur(6px); transition: opacity .2s; max-width: 42%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .bhw-ba .bhw-ba-tag-b { left: 14px; }
        .bhw-ba .bhw-ba-tag-a { right: 14px; }
        .bhw-ba .bhw-ba-tag.bhw-ba-hide { opacity: 0; }

        /* ручка */
        .bhw-ba .bhw-ba-line { position: absolute; top: 0; bottom: 0; left: var(--bhw-pos, 50%); z-index: 4; width: 3px; margin-left: -1.5px;
            background: var(--bhw-handle, #fff); box-shadow: 0 0 0 1px rgba(0,0,0,.08), 0 0 12px rgba(0,0,0,.25); pointer-events: none; }
        .bhw-ba .bhw-ba-knob { position: absolute; top: 50%; left: var(--bhw-pos, 50%); z-index: 5; display: grid; place-items: center;
            width: 48px; height: 48px; margin: -24px 0 0 -24px; padding: 0; border: 0; border-radius: 50%; cursor: ew-resize;
            background: var(--bhw-handle, #fff); color: var(--bhw-handle-ico, #111827); box-shadow: 0 6px 18px rgba(0,0,0,.3); transition: transform .15s; touch-action: none; }
        .bhw-ba .bhw-ba-knob svg { width: 26px; height: 26px; display: block; }
        .bhw-ba .bhw-ba-stage:hover .bhw-ba-knob, .bhw-ba.bhw-ba-drag .bhw-ba-knob { transform: scale(1.08); }
        .bhw-ba .bhw-ba-knob:focus-visible { outline: 3px solid var(--bhw-accent, #2563eb); outline-offset: 3px; }

        /* подпись */
        .bhw-ba .bhw-ba-cap { margin: 14px 0 0; padding: 0; }
        .bhw-ba .bhw-ba-cap:empty { display: none; }
        .bhw-ba .bhw-ba-ct { display: block; margin: 0; font-size: 17px; font-weight: 700; line-height: 1.3; color: inherit; }
        .bhw-ba .bhw-ba-cx { display: block; margin: 4px 0 0; font-size: 15px; line-height: 1.5; opacity: .72; white-space: pre-line; color: inherit; }

        /* миниатюры */
        .bhw-ba .bhw-ba-thumbs { display: flex; gap: 10px; margin: 14px 0 0; padding: 2px 2px 4px; overflow-x: auto; scrollbar-width: thin; }
        .bhw-ba .bhw-ba-th { position: relative; flex: none; width: 92px; aspect-ratio: var(--bhw-ratio, 3 / 2); max-height: 92px; margin: 0; padding: 0; border: 0; border-radius: calc(var(--bhw-r, 16px) * .5);
            overflow: hidden; cursor: pointer; background: #e5e7eb; opacity: .6; transition: opacity .2s, box-shadow .2s; box-shadow: none; }
        .bhw-ba .bhw-ba-th img { width: 100% !important; height: 100% !important; max-width: none !important; margin: 0 !important; object-fit: cover; display: block; border: 0 !important; border-radius: 0 !important; }
        .bhw-ba .bhw-ba-th:hover { opacity: .9; }
        .bhw-ba .bhw-ba-th.bhw-on { opacity: 1; box-shadow: 0 0 0 3px var(--bhw-accent, #2563eb); }
        .bhw-ba .bhw-ba-th:focus-visible { outline: 3px solid var(--bhw-accent, #2563eb); outline-offset: 2px; }
        .bhw-ba .bhw-ba-th span { position: absolute; left: 6px; bottom: 5px; padding: 1px 6px; border-radius: 6px; background: rgba(17,24,39,.6); color: #fff; font-size: 11px; font-weight: 700; }

        .bhw-ba .bhw-ba-empty { display: grid; place-items: center; text-align: center; padding: 24px; cursor: default; color: #4b5563; font-size: 15px; font-weight: 600;
            background: repeating-linear-gradient(45deg, #f3f4f6 0 14px, #e5e7eb 14px 28px); }

        .bhw-ba .bhw-ba-stage.bhw-ba-fade .bhw-ba-layer { animation: bhw-ba-in .35s ease; }
        @keyframes bhw-ba-in { from { opacity: 0; } to { opacity: 1; } }

        @media (max-width: 560px) {
            .bhw-ba .bhw-ba-h { font-size: 20px; }
            .bhw-ba .bhw-ba-knob { width: 42px; height: 42px; margin: -21px 0 0 -21px; }
            .bhw-ba .bhw-ba-tag { top: 10px; padding: 5px 10px; font-size: 11.5px; }
            .bhw-ba .bhw-ba-tag-b { left: 10px; } .bhw-ba .bhw-ba-tag-a { right: 10px; }
            .bhw-ba .bhw-ba-th { width: 72px; }
        }
        @media (prefers-reduced-motion: reduce) { .bhw-ba, .bhw-ba * { animation: none !important; transition: none !important; } }

        /* защита от тем сайта, которые красят текст и кнопки через !important */
        .bhw-ba .bhw-ba-h, .bhw-ba .bhw-ba-ct, .bhw-ba .bhw-ba-cx { color: var(--bhw-text, #111827) !important; }
        .bhw-ba .bhw-ba-tag, .bhw-ba .bhw-ba-th span, .bhw-ba .bhw-ba-broken::after { color: #fff !important; }
        .bhw-ba .bhw-ba-knob { background: var(--bhw-handle, #fff) !important; color: var(--bhw-handle-ico, #111827) !important; border: 0 !important; min-height: 0 !important; min-width: 0 !important; }
        .bhw-ba .bhw-ba-th { border: 0 !important; min-height: 0 !important; min-width: 0 !important; background: #e5e7eb !important; }
        .bhw-ba :where(h3, p, span, b, button, strong) { font-family: inherit !important; letter-spacing: normal; }
        .bhw-ba .bhw-ba-tag { letter-spacing: .04em !important; text-transform: uppercase !important; }
    `;

    /* =========================================================
       ПУБЛИЧНЫЕ API
       ========================================================= */
    window.BusinessHoursWidgets = window.BusinessHoursWidgets || {};
    window.BusinessHoursWidgets.beforeAfter = window.BusinessHoursWidgets.beforeAfter || {};

    // Живое превью для конфигуратора: BHWBeforeAfter.render(container, config) -> { update, destroy, el }
    var api = window.BHWBeforeAfter = window.BHWBeforeAfter || {};
    api.version = VERSION;
    api.defaults = getDefaultConfig;
    api.checkAccess = bhwCheckAccess;
    api.render = function (container, config) {
        var noop = { destroy: function () {}, update: function () {}, el: null };
        if (!bhwCheckAccess({ domains: PREVIEW_DOMAINS }).ok) { console.warn(LOG, 'preview is only available on tf-widgets.com'); return noop; }
        injectBaseStyles();
        if (container._bhwBaDestroy) container._bhwBaDestroy();
        var cls = container.__bhwBaClass || (container.__bhwBaClass = 'bhw-ba-preview-' + Math.random().toString(36).slice(2, 8));
        var widget = null, first = true;
        var ctrl = {
            el: null,
            update: function (cfg) {
                var n = normalizeConfig(cfg || {});
                var state = widget ? widget.state() : null;
                // поменяли стартовую позицию ручки — показываем её, а не ту, что была
                if (state && widget.config.start !== n.start) state.pos = null;
                if (widget) widget.destroy();
                widget = mountWidget(n, cls, 'preview', { inline: container, state: state, hint: first });
                first = false;
                ctrl.el = widget.root;
            },
            show: function (i) { if (widget) widget.show(i); },
            index: function () { return widget ? widget.state().index : 0; },
            destroy: function () { if (widget) widget.destroy(); widget = null; ctrl.el = null; container._bhwBaDestroy = null; }
        };
        ctrl.update(config);
        container._bhwBaDestroy = ctrl.destroy;
        return ctrl;
    };

    /* =========================================================
       АВТОЗАПУСК ПО <script data-id="..."> (только свой тег)
       ========================================================= */
    try {
        var currentScript = document.currentScript || (function () {
            var scripts = document.getElementsByTagName('script');
            return scripts[scripts.length - 1];
        })();
        if (currentScript && currentScript.dataset && currentScript.dataset.id && currentScript.dataset.bhwMounted !== '1') {
            currentScript.dataset.bhwMounted = '1';
            var debug = currentScript.dataset.debug === '1';
            var clientId = normalizeId(currentScript.dataset.id);
            var baseUrl = getBasePath(currentScript.src);
            loadConfig(clientId, baseUrl)
                .then(function (fetched) {
                    var access = bhwCheckAccess(fetched);
                    if (!access.ok) {
                        console.warn(LOG, 'widget "' + clientId + '" is not active on ' + (location.hostname || 'this page') + ': ' + access.reason);
                        return;
                    }
                    var cfg = normalizeConfig(fetched);
                    if (debug) console.log(LOG, 'config "' + clientId + '":', cfg);
                    injectBaseStyles();
                    var mount = function () {
                        var w = mountWidget(cfg, 'bhw-ba-' + clientId.replace(/[^a-z0-9_-]/gi, '') + '-' + Date.now(), clientId, { anchor: currentScript, hint: true });
                        window.BusinessHoursWidgets.beforeAfter[clientId] = w;
                    };
                    if (document.body) mount(); else document.addEventListener('DOMContentLoaded', mount);
                })
                .catch(function (error) {
                    console.warn(LOG, 'config "' + clientId + '" not loaded:', error.message);
                });
        }
    } catch (error) {
        console.error(LOG, 'critical error:', error);
    }

    /* =========================================================
       ФУНКЦИИ
       ========================================================= */
    function injectBaseStyles() {
        if (!document.getElementById('tfw-before-after-styles')) {
            var style = document.createElement('style');
            style.id = 'tfw-before-after-styles';
            style.textContent = inlineCSS;
            (document.head || document.documentElement).appendChild(style);
        }
    }

    /* ---------------------------------------------------------
       ДОСТУП (общий блок для всех виджетов TF Widgets — копировать без изменений)
       --------------------------------------------------------- */
    function bhwCheckAccess(config) {
        config = config || {};
        if (config.active === false) return { ok: false, reason: 'widget is switched off ("active": false)' };
        var host = String(location.hostname || '').toLowerCase().replace(/^www\./, '');
        if (!host || host === 'localhost' || host === '127.0.0.1' || location.protocol === 'file:') return { ok: true };
        var list = config.domains;
        if (typeof list === 'string') list = list.split(/[\s,]+/);
        if (!Array.isArray(list) || !list.length) return { ok: false, reason: 'no "domains" in config' };
        for (var i = 0; i < list.length; i++) {
            var d = String(list[i] || '').trim().toLowerCase()
                .replace(/^[a-z]+:\/\//, '').replace(/[\/:].*$/, '').replace(/^www\./, '');
            if (!d) continue;
            if (d.indexOf('*.') === 0) {
                var base = d.slice(2);
                if (host === base || host.slice(-(base.length + 1)) === '.' + base) return { ok: true };
            } else if (host === d) {
                return { ok: true };
            }
        }
        return { ok: false, reason: 'domain is not in "domains"' };
    }

    function normalizeId(id) { return String(id || 'demo').replace(/\.(json|js)$/i, ''); }
    function getBasePath(src) {
        if (!src) return './';
        try { var url = new URL(src, location.href); return url.origin + url.pathname.replace(/\/[^\/]*$/, '/'); }
        catch (error) { return './'; }
    }
    function loadConfig(clientId, baseUrl) {
        if (clientId === 'local') {
            var el = document.querySelector('#bhw-ba-local-config');
            if (!el) return Promise.reject(new Error('#bhw-ba-local-config not found'));
            try { return Promise.resolve(JSON.parse(el.textContent)); } catch (e) { return Promise.reject(e); }
        }
        var url = baseUrl + 'configs/' + encodeURIComponent(clientId) + '.json?v=' + Date.now();
        return fetch(url, { cache: 'no-store', headers: { 'Accept': 'application/json' } })
            .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); });
    }

    function getDefaultConfig() {
        return {
            heading: '',                         // заголовок над слайдером (необязательно)
            pairs: [],                           // до 6 пар: { before: 'https://...', after: 'https://...', title: '', text: '' }
            labels: { show: true, before: 'Before', after: 'After' },
            start: 50,                           // где стоит ручка при загрузке, % слева
            ratio: '3:2',                        // 16:9 | 3:2 | 4:3 | 1:1 | 4:5
            hint: true,                          // ручка слегка покачивается, когда слайдер появляется на экране
            style: {
                fontFamily: "'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif",
                colors: {
                    background: '',              // фон блока; пусто — прозрачный
                    text: '#111827',
                    handle: '#ffffff',
                    accent: '#2563eb'            // рамка выбранной миниатюры
                },
                sizes: { maxWidth: 900, radius: 16 }
            }
        };
    }

    function normalizeConfig(raw) {
        raw = raw || {};
        var pairs = Array.isArray(raw.pairs) ? raw.pairs : [];
        var cfg = mergeDeep(getDefaultConfig(), raw);
        cfg.pairs = pairs.slice(0, MAX_PAIRS).map(function (p) {
            p = p || {};
            return { before: safeImg(p.before), after: safeImg(p.after), title: String(p.title || '').trim(), text: String(p.text || '').trim() };
        }).filter(function (p) { return p.before || p.after; });
        cfg.ratio = RATIOS[cfg.ratio] ? cfg.ratio : '3:2';
        cfg.start = Math.min(95, Math.max(5, num(cfg.start, 50)));
        cfg.style.sizes.maxWidth = Math.min(1400, Math.max(320, num(cfg.style.sizes.maxWidth, 900)));
        cfg.style.sizes.radius = Math.min(32, Math.max(0, num(cfg.style.sizes.radius, 16)));
        return cfg;
    }

    function isObj(v) { return v && typeof v === 'object' && !Array.isArray(v); }
    function mergeDeep(base, over) {
        var out = {};
        Object.keys(base || {}).forEach(function (k) { out[k] = isObj(base[k]) ? mergeDeep(base[k], {}) : base[k]; });
        Object.keys(over || {}).forEach(function (k) {
            var v = over[k];
            if (isObj(v) && isObj(out[k])) out[k] = mergeDeep(out[k], v);
            else if (v !== undefined) out[k] = v;
        });
        return out;
    }
    function cssValue(v, fallback) { if (v === undefined || v === null || v === '') return fallback; return String(v).replace(/[;{}<>]/g, ''); }
    function num(v, fallback) { var n = Number(v); return isFinite(n) && v !== '' && v !== null ? n : fallback; }
    function escapeHtml(text) {
        return String(text == null ? '' : text).replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    }
    // https-ссылка на картинку; в превью конфигуратора ещё и data:image (демо-фото)
    function safeImg(url) {
        var u = String(url || '').trim();
        if (/^https:\/\/[^\s"'<>]+$/i.test(u)) return u;
        if (/^data:image\/(svg\+xml|png|jpe?g|webp)[;,]/i.test(u) && u.length < 400000) return u;
        return '';
    }
    function hexToRgb(hex) {
        var h = String(hex || '').replace('#', '');
        if (h.length === 3) h = h.split('').map(function (c) { return c + c; }).join('');
        if (!/^[0-9a-f]{6}$/i.test(h)) return null;
        var n = parseInt(h, 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    }
    function isDark(hex) {
        var c = hexToRgb(hex); if (!c) return false;
        return (0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]) / 255 < 0.5;
    }

    function applyCustomStyles(uniqueClass, cfg) {
        var id = 'bhw-ba-style-' + uniqueClass;
        var el = document.getElementById(id);
        if (!el) { el = document.createElement('style'); el.id = id; (document.head || document.documentElement).appendChild(el); }
        var s = cfg.style || {}, c = s.colors || {}, z = s.sizes || {};
        var bg = cssValue(c.background, '');
        var handle = cssValue(c.handle, '#ffffff');
        el.textContent = '.' + uniqueClass + '{' +
            '--bhw-font:' + cssValue(s.fontFamily, "'Inter', system-ui, sans-serif") + ';' +
            '--bhw-bg:' + (bg || 'transparent') + ';' +
            '--bhw-pad:' + (bg ? '20px' : '0px') + ';' +
            '--bhw-text:' + cssValue(c.text, '#111827') + ';' +
            '--bhw-handle:' + handle + ';' +
            '--bhw-handle-ico:' + (isDark(handle) ? '#ffffff' : '#111827') + ';' +
            '--bhw-accent:' + cssValue(c.accent, '#2563eb') + ';' +
            '--bhw-max:' + num(z.maxWidth, 900) + 'px;' +
            '--bhw-r:' + num(z.radius, 16) + 'px;' +
            '--bhw-ratio:' + RATIOS[cfg.ratio] + ';' +
            '}';
        return id;
    }

    function mountWidget(cfg, uniqueClass, id, opts) {
        opts = opts || {};
        var inline = opts.inline || null;
        var styleId = applyCustomStyles(uniqueClass, cfg);
        var pairs = cfg.pairs;
        var st = opts.state || {};
        var index = Math.min(Math.max(0, st.index || 0), Math.max(0, pairs.length - 1));
        var pos = st.pos != null ? st.pos : cfg.start;
        var L = cfg.labels || {};

        var root = document.createElement('div');
        root.id = 'tfw-before-after-' + id;
        root.className = 'bhw-ba ' + uniqueClass;

        var thumbs = '';
        if (pairs.length > 1) {
            thumbs = '<div class="bhw-ba-thumbs" role="tablist" aria-label="Choose a project">' + pairs.map(function (p, i) {
                var img = p.after || p.before;
                return '<button type="button" class="bhw-ba-th" role="tab" data-i="' + i + '" aria-label="' + escapeHtml(p.title || 'Project ' + (i + 1)) + '">' +
                    (img ? '<img alt="" loading="lazy" src="' + escapeHtml(img) + '">' : '') + '<span>' + (i + 1) + '</span></button>';
            }).join('') + '</div>';
        }

        root.innerHTML =
            (cfg.heading ? '<h3 class="bhw-ba-h">' + escapeHtml(cfg.heading) + '</h3>' : '') +
            (pairs.length
                ? '<div class="bhw-ba-stage">' +
                    '<div class="bhw-ba-layer bhw-ba-after" data-msg="After photo not found"><img alt="" draggable="false"></div>' +
                    '<div class="bhw-ba-layer bhw-ba-before" data-msg="Before photo not found"><img alt="" draggable="false"></div>' +
                    (L.show !== false
                        ? (L.before ? '<span class="bhw-ba-tag bhw-ba-tag-b">' + escapeHtml(L.before) + '</span>' : '') +
                          (L.after ? '<span class="bhw-ba-tag bhw-ba-tag-a">' + escapeHtml(L.after) + '</span>' : '')
                        : '') +
                    '<span class="bhw-ba-line" aria-hidden="true"></span>' +
                    '<button type="button" class="bhw-ba-knob" role="slider" aria-valuemin="0" aria-valuemax="100" aria-label="Drag to compare before and after">' + ICONS.arrows + '</button>' +
                  '</div>' +
                  '<div class="bhw-ba-cap" aria-live="polite"></div>' + thumbs
                : '<div class="bhw-ba-stage bhw-ba-empty">Add a before and an after photo to see the slider</div>');

        if (inline) inline.appendChild(root);
        else if (opts.anchor && opts.anchor.parentNode) opts.anchor.parentNode.insertBefore(root, opts.anchor.nextSibling);
        else document.body.appendChild(root);

        var cleanups = [], timers = [], raf = 0, touched = false, dragging = false;
        function on(t, e, h, o) { t.addEventListener(e, h, o); cleanups.push(function () { t.removeEventListener(e, h, o); }); }

        var widget = {
            root: root, config: cfg, id: id,
            state: function () { return { index: index, pos: pos }; },
            show: function () {},
            destroy: function () {
                cleanups.forEach(function (f) { try { f(); } catch (e) {} });
                timers.forEach(clearTimeout);
                if (raf) cancelAnimationFrame(raf);
                root.remove();
                var s = document.getElementById(styleId); if (s) s.remove();
            }
        };
        if (!pairs.length) return widget;

        var stage = root.querySelector('.bhw-ba-stage');
        var knob = root.querySelector('.bhw-ba-knob');
        var cap = root.querySelector('.bhw-ba-cap');
        var tagB = root.querySelector('.bhw-ba-tag-b'), tagA = root.querySelector('.bhw-ba-tag-a');
        var layerB = root.querySelector('.bhw-ba-before'), layerA = root.querySelector('.bhw-ba-after');
        var imgB = layerB.querySelector('img'), imgA = layerA.querySelector('img');

        function setPos(p) {
            pos = Math.min(100, Math.max(0, p));
            stage.style.setProperty('--bhw-pos', pos + '%');
            knob.setAttribute('aria-valuenow', String(Math.round(pos)));
            if (tagB) tagB.classList.toggle('bhw-ba-hide', pos < 18);
            if (tagA) tagA.classList.toggle('bhw-ba-hide', pos > 82);
        }

        function loadImg(layer, img, src) {
            layer.classList.remove('bhw-ba-broken');
            img.onerror = function () { layer.classList.add('bhw-ba-broken'); };
            if (src) img.src = src; else { img.removeAttribute('src'); layer.classList.add('bhw-ba-broken'); }
        }

        function show(i, fade) {
            index = (i + pairs.length) % pairs.length;
            var p = pairs[index];
            loadImg(layerA, imgA, p.after);
            loadImg(layerB, imgB, p.before);
            imgA.alt = (p.title ? p.title + ' — ' : '') + (L.after || 'After');
            imgB.alt = (p.title ? p.title + ' — ' : '') + (L.before || 'Before');
            cap.innerHTML = (p.title ? '<strong class="bhw-ba-ct">' + escapeHtml(p.title) + '</strong>' : '') +
                (p.text ? '<span class="bhw-ba-cx">' + escapeHtml(p.text) + '</span>' : '');
            root.querySelectorAll('.bhw-ba-th').forEach(function (b, k) {
                b.classList.toggle('bhw-on', k === index);
                b.setAttribute('aria-selected', k === index ? 'true' : 'false');
            });
            if (fade) { stage.classList.remove('bhw-ba-fade'); void stage.offsetWidth; stage.classList.add('bhw-ba-fade'); }
        }
        widget.show = function (i) { show(i, true); setPos(cfg.start); };

        function fromEvent(e) {
            var r = stage.getBoundingClientRect();
            if (!r.width) return pos;
            return (e.clientX - r.left) / r.width * 100;
        }
        function stopHint() { touched = true; if (raf) { cancelAnimationFrame(raf); raf = 0; } }

        on(stage, 'pointerdown', function (e) {
            if (e.button !== undefined && e.button !== 0) return;
            stopHint();
            dragging = true;
            root.classList.add('bhw-ba-drag');
            try { stage.setPointerCapture(e.pointerId); } catch (err) {}
            setPos(fromEvent(e));
            if (e.pointerType === 'mouse') e.preventDefault();
        });
        on(stage, 'pointermove', function (e) { if (dragging) setPos(fromEvent(e)); });
        function end() { dragging = false; root.classList.remove('bhw-ba-drag'); }
        on(stage, 'pointerup', end);
        on(stage, 'pointercancel', end);
        on(stage, 'lostpointercapture', end);
        on(knob, 'keydown', function (e) {
            var step = e.shiftKey ? 10 : 4, k = e.key;
            if (k === 'ArrowLeft' || k === 'ArrowDown') setPos(pos - step);
            else if (k === 'ArrowRight' || k === 'ArrowUp') setPos(pos + step);
            else if (k === 'Home') setPos(0);
            else if (k === 'End') setPos(100);
            else return;
            stopHint(); e.preventDefault();
        });
        root.querySelectorAll('.bhw-ba-th').forEach(function (b) {
            on(b, 'click', function () { stopHint(); show(Number(b.getAttribute('data-i')), true); setPos(cfg.start); });
        });

        // лёгкое покачивание ручки, чтобы было понятно, что её можно тянуть
        function hint() {
            if (touched || !cfg.hint) return;
            var t0 = 0, base = pos, dur = 1600;
            function step(t) {
                if (touched) return;
                if (!t0) t0 = t;
                var k = Math.min(1, (t - t0) / dur);
                setPos(base + Math.sin(k * Math.PI * 2) * 12 * (1 - k));
                if (k < 1) raf = requestAnimationFrame(step); else { raf = 0; setPos(base); }
            }
            raf = requestAnimationFrame(step);
        }
        var reduce = false;
        try { reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
        if (opts.hint && cfg.hint && !reduce) {
            if ('IntersectionObserver' in window) {
                var io = new IntersectionObserver(function (en) {
                    if (en[0] && en[0].isIntersecting) { io.disconnect(); timers.push(setTimeout(hint, 400)); }
                }, { threshold: 0.5 });
                io.observe(stage);
                cleanups.push(function () { io.disconnect(); });
            } else {
                timers.push(setTimeout(hint, 800));
            }
        }

        show(index, false);
        setPos(pos);
        return widget;
    }
})();
