(() => {
  let allowed = false;
  try {
    const token = new URLSearchParams(location.hash.slice(1)).get('launch');
    const key = 'etahncorp-launch-' + token;
    const ticket = /^[a-f0-9]{48}$/.test(token || '')
      ? JSON.parse(localStorage.getItem(key) || 'null') : null;
    if (ticket) localStorage.removeItem(key);
    history.replaceState(null, '', location.pathname + location.search);
    allowed = ticket && ticket.path === location.pathname &&
      Date.now() - ticket.created < 15000 && Date.now() >= ticket.created;
  } catch {}
  if (!allowed) {

    document.write('<head><title>Access blocked</title></head><body style="background:#0c0c0c;color:#ccc;font:16px Consolas,monospace;padding:30px"><h1>Access blocked</h1><p>Open this game through the ETAHNCORP Archives.</p></body><plaintext hidden>' );
    throw new Error('Launch this game through the archives.');
  }
})();


