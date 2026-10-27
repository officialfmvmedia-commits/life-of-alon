// DOM UI: title, HUD, prompt, toasts, computer desktop.
const $ = (id) => document.getElementById(id);
const show = (el, v) => el.classList.toggle('hidden', !v);

export const UI = {
  loading(v) { show($('loading'), v); },
  title(v) { show($('title'), v); },
  hud(v) { show($('hud'), v); },
  prompt(text, actions = false) {
    const p = $('prompt'); if (!text) { show(p, false); this._pk = null; return; }
    const key = text + '|' + actions; if (this._pk !== key) { this._pk = key; p.innerHTML = actions ? `<kbd>E</kbd><span>${text.replace(/^Press E to talk to /, 'Talk to ')}</span><kbd>F</kbd><span>Actions</span>` : `<kbd>E</kbd><span></span>`; if (!actions) p.querySelector('span').textContent = text; }
    show(p, true);
  },
  toast(text, ms = 2200) {
    const t = $('toast'); t.textContent = text; show(t, true);
    clearTimeout(this._tt); this._tt = setTimeout(() => show(t, false), ms);
  },
  computer(v) {
    show($('computer'), v);
  },
  onStart(fn) { $('startBtn').addEventListener('click', fn); },
};
