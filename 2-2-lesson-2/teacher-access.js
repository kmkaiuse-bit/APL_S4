(() => {
  'use strict';
  const payload = JSON.parse(document.getElementById('teacher-payload').textContent);
  const cacheName = 'hkit-teacher-access-v1';
  const lifetime = 8 * 60 * 60 * 1000;
  const decode = value => Uint8Array.from(atob(value), char => char.charCodeAt(0));
  const encode = value => btoa(String.fromCharCode(...new Uint8Array(value)));
  const form = document.getElementById('teacher-login');
  const status = document.getElementById('login-status');
  const button = form.querySelector('button');
  const clear = () => { try { sessionStorage.removeItem(cacheName); } catch (_) {} };
  let expiresAt = 0;

  async function unlock(key, expiration) {
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: decode(payload.iv), additionalData: new TextEncoder().encode(payload.page) },
      key, decode(payload.ciphertext)
    );
    const content = new TextDecoder().decode(decrypted);
    expiresAt = expiration;
    let persisted = false;
    try {
      sessionStorage.setItem(cacheName, JSON.stringify({
        salt: payload.salt, key: encode(await crypto.subtle.exportKey('raw', key)), expiresAt
      }));
      persisted = true;
    } catch (_) { /* This page can still open when browser storage is unavailable. */ }
    const parsed = new DOMParser().parseFromString(content, 'text/html');
    const logout = parsed.createElement('button');
    logout.type = 'button';
    logout.className = 'btn';
    logout.id = 'teacher-logout';
    logout.textContent = '登出教師頁';
    (parsed.querySelector('.topbar') || parsed.body).append(logout);
    // A fresh document preserves the original pages' ordered/deferred scripts.
    document.open();
    document.write('<!doctype html>' + parsed.documentElement.outerHTML);
    document.close();
    document.addEventListener('click', event => {
      if (event.target.closest('#teacher-logout')) { clear(); location.reload(); }
    });
    const expire = () => {
      let signedOut = false;
      if (persisted) {
        try { signedOut = !sessionStorage.getItem(cacheName); } catch (_) { signedOut = true; }
      }
      if (signedOut || Date.now() >= expiresAt) { clear(); location.reload(); }
    };
    window.addEventListener('pageshow', expire);
    document.addEventListener('visibilitychange', expire);
    setTimeout(expire, Math.max(0, expiresAt - Date.now()));
  }

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!crypto.subtle) { status.textContent = '請使用HTTPS網址或本機localhost開啟教師頁。'; return; }
    button.disabled = true;
    status.textContent = '正在驗證…';
    const input = document.getElementById('teacher-password');
    try {
      const material = await crypto.subtle.importKey('raw', new TextEncoder().encode(input.value), 'PBKDF2', false, ['deriveKey']);
      input.value = '';
      const key = await crypto.subtle.deriveKey(
        { name: 'PBKDF2', salt: decode(payload.salt), iterations: payload.iterations, hash: 'SHA-256' },
        material, { name: 'AES-GCM', length: 256 }, true, ['decrypt']
      );
      await unlock(key, Date.now() + lifetime);
    } catch (_) {
      clear();
      status.textContent = '密碼不正確，請再試一次。';
      button.disabled = false;
      input.focus();
    }
  });

  (async () => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(cacheName) || 'null');
      if (!saved || saved.salt !== payload.salt || saved.expiresAt <= Date.now()) { clear(); return; }
      const key = await crypto.subtle.importKey('raw', decode(saved.key), 'AES-GCM', true, ['decrypt']);
      await unlock(key, saved.expiresAt);
    } catch (_) { clear(); }
  })();
})();
