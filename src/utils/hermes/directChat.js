// src/utils/hermes/directChat.js
//
// Shared helper for one-off direct-to-gateway calls (not the full streaming
// chat widget) -- same token-mint + proxy pattern as HermesChat.tsx, reused
// here for the Morning Review page's per-headline "summarize via archive.is"
// button. See ARCHITECTURE.md Key Decisions #8 for why this bypasses
// /api/hermes entirely.

let cachedToken = null;
const REFRESH_BUFFER_MS = 60_000;

async function getDirectChatToken() {
  if (cachedToken && cachedToken.expiresAt - Date.now() > REFRESH_BUFFER_MS) {
    return cachedToken;
  }
  const res = await fetch('/api/hermes/token', { method: 'POST' });
  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      if (body?.error) detail = String(body.error);
    } catch {
      // non-JSON body -- status code is still useful
    }
    if (res.status === 401) {
      throw new Error('Not logged in — go to /login and sign back in.');
    }
    throw new Error(`Could not get a chat token: ${detail}`);
  }
  const data = await res.json();
  cachedToken = { token: data.token, expiresAt: data.expires_at, proxyUrl: data.proxy_url };
  return cachedToken;
}

// Non-streaming, single-turn call. Returns the final text content.
export async function askHermesDirect(message) {
  const chatToken = await getDirectChatToken();
  const res = await fetch(`${chatToken.proxyUrl}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${chatToken.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'hermes-agent',
      stream: false,
      messages: [{ role: 'user', content: message }],
    }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.error?.message || data?.error || `Hermes error (${res.status})`);
  }
  const data = await res.json();
  return data?.choices?.[0]?.message?.content || '';
}
