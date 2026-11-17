// Shared helpers for Tomortle × Molly feature pages
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/+esm';

export const SB_URL = 'https://yktkofupegtvrviynnjk.supabase.co';
export const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlrdGtvZnVwZWd0dnJ2aXlubmprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQ5MTI5MjMsImV4cCI6MjExMDQ4ODkyM30.dRsXfxiAjIXUkwPQ65p2oMl6HfogL0QZdg27feOs9nQ';
export const sb = createClient(SB_URL, SB_KEY, { auth: { persistSession: true, autoRefreshToken: true } });

export const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
export const store = { get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v) } catch (e) { return d } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)) } catch (e) { } } };
export const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
export const canVibrate = 'vibrate' in navigator;
export function vib(p) { try { navigator.vibrate && navigator.vibrate(p) } catch (e) { } }

let toastT;
export function toast(msg, label, act) {
  let t = $('#toast'); if (!t) { t = document.createElement('div'); t.id = 'toast'; document.body.appendChild(t) }
  t.innerHTML = ''; t.append(document.createTextNode(msg));
  if (label) { const b = document.createElement('button'); b.textContent = label; b.onclick = () => { t.classList.remove('on'); act() }; t.append(b) }
  t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), label ? 7000 : 2800);
}
export function hearts(n = 10) {
  let fx = $('#fx'); if (!fx) { fx = document.createElement('div'); fx.id = 'fx'; fx.className = 'fx'; document.body.appendChild(fx) }
  const set = ['💗', '💖', '💕', '❤️', '🩷', '💘'];
  for (let i = 0; i < n; i++) { const h = document.createElement('div'); h.className = 'fheart'; h.textContent = set[i % set.length]; h.style.left = Math.random() * 95 + 'vw'; h.style.fontSize = (20 + Math.random() * 26) + 'px'; h.style.animationDuration = (2.6 + Math.random() * 2) + 's'; h.style.animationDelay = (Math.random() * .8) + 's'; fx.appendChild(h); setTimeout(() => h.remove(), 5500) }
}
export function floatEmoji(e, n = 6) {
  let fx = $('#fx'); if (!fx) { fx = document.createElement('div'); fx.id = 'fx'; fx.className = 'fx'; document.body.appendChild(fx) }
  for (let i = 0; i < n; i++) { const h = document.createElement('div'); h.className = 'fheart'; h.textContent = e; h.style.left = (60 + Math.random() * 35) + 'vw'; h.style.fontSize = (24 + Math.random() * 20) + 'px'; h.style.animationDuration = (2.2 + Math.random() * 1.5) + 's'; h.style.animationDelay = (Math.random() * .5) + 's'; fx.appendChild(h); setTimeout(() => h.remove(), 4500) }
}

export function applyTheme() {
  const UI = store.get('ui', { theme: 'pastel', accent: '', font: '' }); const r = document.documentElement;
  r.dataset.theme = UI.theme === 'pastel' ? '' : UI.theme;
  if (UI.accent) r.style.setProperty('--accent', UI.accent); if (UI.font) r.style.setProperty('--font', `'${UI.font}'`);
}
applyTheme();

/* auth + couple context; redirects home if not ready */
export async function boot() {
  const { data: { session } } = await sb.auth.getSession();
  if (!session) { location.href = './'; throw new Error('no session') }
  const me = session.user;
  const { data: couple } = await sb.from('couple').select('*').maybeSingle();
  if (!couple || !couple.user_b) { location.href = './'; throw new Error('no couple') }
  const partnerId = couple.user_a === me.id ? couple.user_b : couple.user_a;
  const { data: profs } = await sb.from('profiles').select('*').in('id', [me.id, partnerId]);
  const myProfile = (profs || []).find(p => p.id === me.id) || { id: me.id, display_name: 'Bạn', emoji: '🙂' };
  const partnerProfile = (profs || []).find(p => p.id === partnerId) || { id: partnerId, display_name: 'Người ấy', emoji: '🙂' };
  return { me, couple, partnerId, myProfile, partnerProfile, partnerName: partnerProfile.display_name || 'Người ấy', myName: myProfile.display_name || 'Bạn', partnerOnline: false, partnerHere: false };
}

/* header with back button + partner presence */
export function header(title) {
  const h = document.createElement('header');
  h.innerHTML = `<a class="btn small" href="./" style="text-decoration:none;color:inherit">← Nhà</a><div class="logo" style="font-size:20px">${esc(title)}</div><div class="sp"></div><span class="pchip" id="pchip"><i class="pdot"></i><span id="pchipName"></span></span>`;
  document.querySelector('.app').prepend(h);
}
function renderChip(ctx) {
  const n = $('#pchipName'); if (!n) return;
  n.textContent = ctx.partnerHere ? `${ctx.partnerName} đang ở đây` : (ctx.partnerOnline ? `${ctx.partnerName} online` : `${ctx.partnerName} offline`);
  $('#pchip').classList.toggle('here', ctx.partnerHere); $('#pchip').classList.toggle('on', ctx.partnerOnline);
}

/* main couple channel: presence (which page), invites, hearts */
export function joinMain(ctx, page, onPresence) {
  const ch = sb.channel('couple-' + ctx.couple.channel_key, { config: { presence: { key: ctx.me.id }, broadcast: { self: false } } });
  ch.on('presence', { event: 'sync' }, () => {
    const st = ch.presenceState(); const metas = st[ctx.partnerId] || [];
    const wasHere = ctx.partnerHere;
    ctx.partnerOnline = metas.length > 0; ctx.partnerHere = metas.some(m => m.page === page);
    renderChip(ctx); onPresence && onPresence(ctx);
    if (ctx.partnerHere && !wasHere) { toast(`${ctx.partnerName} đã vào ♡`); vib(40) }
  })
    .on('broadcast', { event: 'invite' }, ({ payload }) => { if (payload.page === page) return; vib([80, 60, 80]); toast(`${ctx.partnerName} rủ bạn: ${payload.title}`, 'Vào', () => location.href = payload.url) })
    .on('broadcast', { event: 'booth' }, ({ payload }) => { vib([80, 60, 80]); toast(`${ctx.partnerName} mời bạn chụp photobooth 📸`, 'Vào', () => location.href = payload.url) })
    .on('broadcast', { event: 'miss' }, () => { hearts(12); vib([80, 60, 80]); toast(`${ctx.partnerName} đang nhớ bạn 💗`) })
    .subscribe(s => { if (s === 'SUBSCRIBED') ch.track({ page, at: Date.now() }) });
  ctx.main = ch; renderChip(ctx);
  return ch;
}
export function invite(ctx, page, title) {
  const url = location.href.split('#')[0];
  ctx.main && ctx.main.send({ type: 'broadcast', event: 'invite', payload: { page, title, url } });
  toast(`Đã rủ ${ctx.partnerName} ♡`);
}

/* per-feature realtime channel */
export function featureChannel(ctx, name) {
  return sb.channel(`couple-${ctx.couple.channel_key}-${name}`, { config: { broadcast: { self: false, ack: false } } });
}

/* persisted shared state */
export async function loadState(key, def = {}) {
  const { data } = await sb.from('shared_state').select('data,updated_at,updated_by').eq('key', key).maybeSingle();
  return data ? data.data : def;
}
const saveTimers = {};
export function saveState(key, data, delay = 0) {
  clearTimeout(saveTimers[key]);
  const run = () => sb.from('shared_state').upsert({ key, data }).then(({ error }) => { if (error) console.warn('saveState', error) });
  if (delay) saveTimers[key] = setTimeout(run, delay); else return run();
}
