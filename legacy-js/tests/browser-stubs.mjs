// Minimal browser globals so the game modules can be imported under Node.
const ctx = new Proxy({}, {
  get: (t, k) => (k in t ? t[k] : k === 'createRadialGradient'
    ? () => ({ addColorStop() {} })
    : () => {}),
  set: (t, k, v) => { t[k] = v; return true; },
});
const canvas = { width: 0, height: 0, style: {}, getContext: () => ctx };
globalThis.location ??= { search: '', href: 'http://localhost/' };
globalThis.window ??= globalThis;
globalThis.addEventListener ??= () => {};
globalThis.document ??= {
  createElement: () => ({ ...canvas }),
  getElementById: () => null,
  body: {},
};
export {};
