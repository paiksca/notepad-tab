// Fakes the chrome.storage API with localStorage so the pad runs on a plain page.
// Only used by preview.html; the installed extension never loads this.
window.chrome = window.chrome || {};
const _listeners = [];

chrome.storage = {
  local: {
    get(defaults, cb) {
      const out = {};
      for (const k of Object.keys(defaults)) {
        const v = localStorage.getItem('np:' + k);
        out[k] = v === null ? defaults[k] : JSON.parse(v);
      }
      cb(out);
    },
    set(obj) {
      const changes = {};
      for (const [k, v] of Object.entries(obj)) {
        changes[k] = { newValue: v };
        localStorage.setItem('np:' + k, JSON.stringify(v));
      }
      _listeners.forEach((f) => f(changes, 'local'));
    },
  },
  onChanged: {
    addListener(f) { _listeners.push(f); },
  },
};

// the storage event only fires in *other* tabs, which gives us cross-tab sync
window.addEventListener('storage', (e) => {
  if (!e.key || !e.key.startsWith('np:') || e.newValue === null) return;
  const changes = { [e.key.slice(3)]: { newValue: JSON.parse(e.newValue) } };
  _listeners.forEach((f) => f(changes, 'local'));
});
