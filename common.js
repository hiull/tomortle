// Shared helpers for Tomortle × Molly feature pages
// Load supabase-js with CDN fallbacks (some networks block one CDN)
let supa = null;
for (const u of ['https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/+esm', 'https://esm.sh/@supabase/supabase-js@2.45.4', 'https://unpkg.com/@supabase/supabase-js@2.45.4/dist/module/index.js?module']) {
  try { supa = await import(u); if (supa && supa.createClient) break } catch (e) { console.warn('CDN failed', u, e) }
}
if (!supa) throw new Error('Không tải được thư viện kết nối (Supabase). Kiểm tra mạng rồi tải lại trang.');
const { createClient } = supa;

export const SB_URL = 'https://yktkofupegtvrviynnjk.supabase.co';
export const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlrdGtvZnVwZWd0dnJ2aXlubmprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQ5MTI5MjMsImV4cCI6MjExMDQ4ODkyM30.dRsXfxiAjIXUkwPQ65p2oMl6HfogL0QZdg27feOs9nQ';
export const sb = createClient(SB_URL, SB_KEY, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });

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
  const set = ['💗', '💖', '💕', '❤️', '💗', '💘'];
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
// thoát một hoạt động thì về phòng chung; riêng phòng chung thì về trang Nhà
export function header(title, back = 'room.html') {
  const h = document.createElement('header');
  const lbl = back === './' ? 'Về trang Nhà' : 'Về phòng chung';
  h.innerHTML = `<a class="btn small hback" href="${back}" title="${lbl}" aria-label="${lbl}" style="text-decoration:none;color:inherit">‹ ${back === './' ? 'Nhà' : '🏠'}</a><div class="logo htitle" style="font-size:20px"><span>${esc(title)}</span></div><span class="pchip" id="pchip"><i class="pdot"></i><span id="pchipName"></span></span>`;
  document.querySelector('.app').prepend(h);
}
function renderChip(ctx) {
  const n = $('#pchipName'); if (!n) return;
  const full = ctx.partnerHere ? `${ctx.partnerName} đang ở đây` : (ctx.partnerOnline ? `${ctx.partnerName} online` : `${ctx.partnerName} offline`);
  n.textContent = ctx.partnerName; $('#pchip').title = full; $('#pchip').setAttribute('aria-label', full); // chấm xanh/vàng/xám cho biết trạng thái
  $('#pchip').classList.toggle('here', ctx.partnerHere); $('#pchip').classList.toggle('on', ctx.partnerOnline);
}

/* main couple channel: presence (which page), invites, hearts */
export function joinMain(ctx, page, onPresence) {
  const ch = sb.channel('couple-' + ctx.couple.channel_key, { config: { presence: { key: ctx.me.id }, broadcast: { self: false } } });
  ch.on('presence', { event: 'sync' }, () => {
    const st = ch.presenceState(); const metas = st[ctx.partnerId] || [];
    const wasHere = ctx.partnerHere;
    ctx.partnerOnline = metas.length > 0; ctx.partnerHere = metas.some(m => m.page === page); ctx.partnerPage = metas.length ? metas[metas.length - 1].page : null;
    renderChip(ctx); onPresence && onPresence(ctx);
    if (ctx.partnerHere && !wasHere) { toast(`${ctx.partnerName} đã vào ♡`); vib(40) }
  })
    .on('broadcast', { event: 'invite' }, ({ payload }) => { if (payload.page === page) return; vib([80, 60, 80]); toast(`${ctx.partnerName} rủ bạn: ${payload.title}`, 'Vào', () => location.href = payload.url) })
    .on('broadcast', { event: 'booth' }, ({ payload }) => { vib([80, 60, 80]); toast(`${ctx.partnerName} mời bạn chụp photobooth 📸`, 'Vào', () => location.href = payload.url) })
    .on('broadcast', { event: 'miss' }, () => { hearts(12); vib([80, 60, 80]); toast(`${ctx.partnerName} đang nhớ bạn 💗`) })
    .on('broadcast', { event: 'vgift' }, ({ payload }) => { giftPopup(ctx.partnerName, payload.gifts || payload.gift, payload.message); markGiftsSeen() })
    .on('broadcast', { event: 'letter' }, () => { if (page !== 'letters') { vib([80, 60, 80]); toast(`${ctx.partnerName} vừa gửi thư cho bạn 💌`, 'Xem', () => location.href = 'letters.html') } })
    .on('broadcast', { event: 'note' }, () => { if (page !== 'fridge') toast(`${ctx.partnerName} vừa dán note lên tủ lạnh 📝`, 'Xem', () => location.href = 'fridge.html') })
    .on('broadcast', { event: 'voice' }, () => { if (page !== 'voice') { vib([80, 60, 80]); toast(`${ctx.partnerName} vừa gửi lời chào 🎙️`, 'Nghe', () => location.href = 'voice.html') } });
  ch.on('broadcast', { event: 'hey' }, ({ payload }) => { if (payload.page === page) return; vib([60, 40, 60]); toast(`${ctx.partnerName} ${payload.text}`, 'Xem', () => location.href = payload.url) });
  setTimeout(() => ch.subscribe(s => { if (s === 'SUBSCRIBED') ch.track({ page, at: Date.now() }) }), 0);
  ctx.main = ch; renderChip(ctx); initBell(ctx);
  if (page !== 'backup') driveNudge(ctx);
  ['hey','letter','note','voice','vgift'].forEach(ev => ch.on('broadcast', { event: ev }, () => refreshBell()));
  return ch;
}
export function invite(ctx, page, title) {
  const url = location.href.split('#')[0];
  ctx.main && ctx.main.send({ type: 'broadcast', event: 'invite', payload: { page, title, url } });
  notifyPush(ctx, 'rủ bạn: ' + title, url, 'invite');
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

/* ---------- media (Supabase Storage, private bucket "media") ---------- */
export async function compressImage(file, max = 1600, q = .85) {
  if (!file.type.startsWith('image/') || file.type === 'image/gif') return file;
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url });
    const s = Math.min(1, max / Math.max(img.width, img.height)); const c = document.createElement('canvas'); c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    return await new Promise(r => c.toBlob(b => r(b || file), 'image/jpeg', q));
  } catch (e) { return file } finally { URL.revokeObjectURL(url) }
}
const EXT = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/gif': 'gif', 'image/webp': 'webp', 'audio/mp4': 'm4a', 'audio/webm': 'webm', 'audio/ogg': 'ogg', 'audio/mpeg': 'mp3', 'video/mp4': 'mp4', 'video/webm': 'webm', 'video/quicktime': 'mov' };
export async function uploadMedia(ctx, blob, folder) {
  const type = (blob.type || 'application/octet-stream').split(';')[0];
  const ext = EXT[type] || (type.split('/')[1] || 'bin');
  const path = `${ctx.me.id}/${folder}/${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await sb.storage.from('media').upload(path, blob, { contentType: type, upsert: false });
  if (error) throw error;
  return { path, type };
}
const urlCache = {};
export async function mediaUrl(path) {
  const c = urlCache[path]; if (c && c.exp > Date.now()) return c.url;
  const { data, error } = await sb.storage.from('media').createSignedUrl(path, 3600);
  if (error) throw error; urlCache[path] = { url: data.signedUrl, exp: Date.now() + 3300e3 }; return data.signedUrl;
}
export async function renderMedia(att) {
  const url = await mediaUrl(att.path); const t = att.type || '';
  if (t.startsWith('image/')) return `<img src="${url}" alt="" style="width:100%;border-radius:12px;display:block;margin:8px 0">`;
  if (t.startsWith('audio/')) return `<audio controls preload="metadata" src="${url}" style="width:100%;margin:8px 0"></audio>`;
  if (t.startsWith('video/')) return `<video controls playsinline preload="metadata" src="${url}" style="width:100%;border-radius:12px;margin:8px 0"></video>`;
  return `<a href="${url}" target="_blank">Tệp đính kèm</a>`;
}

/* ---------- voice recorder ---------- */
export function pickAudioMime() {
  if (!window.MediaRecorder) return null;
  for (const m of ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus']) { try { if (MediaRecorder.isTypeSupported(m)) return m } catch (e) { } }
  return '';
}
export function createRecorder() {
  let rec = null, chunks = [], stream = null, started = 0;
  return {
    async start() {
      stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      const mime = pickAudioMime(); rec = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
      chunks = []; rec.ondataavailable = e => { if (e.data && e.data.size) chunks.push(e.data) }; rec.start(250); started = Date.now();
    },
    stop() {
      return new Promise(res => {
        if (!rec) return res(null);
        rec.onstop = () => { stream.getTracks().forEach(t => t.stop()); const type = (rec.mimeType || chunks[0]?.type || 'audio/webm').split(';')[0]; res({ blob: new Blob(chunks, { type }), duration: (Date.now() - started) / 1000 }) };
        rec.stop();
      });
    },
    elapsed() { return started ? (Date.now() - started) / 1000 : 0 },
    cancel() { try { rec && rec.state !== 'inactive' && rec.stop() } catch (e) { } stream && stream.getTracks().forEach(t => t.stop()) }
  };
}
export function fmtLeft(ms) {
  if (ms <= 0) return 'mở được rồi';
  const d = Math.floor(ms / 864e5), h = Math.floor(ms / 36e5) % 24, m = Math.floor(ms / 6e4) % 60, s = Math.floor(ms / 1e3) % 60;
  if (d > 0) return `${d} ngày ${h} giờ`; if (h > 0) return `${h} giờ ${m} phút`; return `${m} phút ${s} giây`;
}
export function ago(t) { if (!t) return ''; const s = (Date.now() - new Date(t)) / 1000; if (s < 60) return 'vừa xong'; if (s < 3600) return Math.floor(s / 60) + ' phút trước'; if (s < 86400) return Math.floor(s / 3600) + ' giờ trước'; return Math.floor(s / 86400) + ' ngày trước' }
const PUSH_TXT = { letter: ['gửi bạn một bức thư 💌', 'letters.html'], vgift: ['tặng bạn quà 🎁', 'gifts.html'], note: ['dán note mới lên tủ lạnh 📝', 'fridge.html'], voice: ['gửi bạn lời nhắn thoại 🎙️', 'voice.html'], 'letter-opened': ['đã mở thư của bạn 💌', 'letters.html'] };
export function ping(ctx, event, payload = {}) { ctx.main && ctx.main.send({ type: 'broadcast', event, payload }); const t = PUSH_TXT[event]; if (t) notifyPush(ctx, t[0], t[1], event) }

export function giftPopup(fromName, gifts, message, onClose) {
  const list = (Array.isArray(gifts) ? gifts : [{ gift: gifts, qty: 1 }]).filter(Boolean);
  const parts = list.map(g => { const [e, ...rest] = String(g.gift || '🎁').split(' '); return { e, name: rest.join(' '), qty: g.qty || 1 } });
  const el = document.createElement('div'); el.className = 'giftpop';
  const icons = parts.map(p => `<span style="display:inline-block;margin:0 4px">${esc(p.e)}${p.qty > 1 ? `<sup style="font-size:28px;color:#fff;font-weight:800">×${p.qty}</sup>` : ''}</span>`).join('');
  const names = parts.map(p => (p.qty > 1 ? p.qty + ' ' : '') + p.name).join(', ');
  el.innerHTML = `<div class="g" style="font-size:${parts.length > 2 ? 80 : 120}px">${icons}</div><p>${esc(fromName)} tặng bạn ${esc(names)}</p>${message ? `<div class="msg">${esc(message)}</div>` : ''}<p style="font-size:13px;font-weight:600;opacity:.8">Chạm để đóng</p>`;
  el.onclick = () => { el.remove(); onClose && onClose() }; document.body.appendChild(el); hearts(14); vib([100, 60, 100, 60, 200]);
}
export function markGiftsSeen() { return sb.rpc('vgifts_seen_all').then(() => { }, () => { }) }

export function hey(ctx, page, text, url) { ctx.main && ctx.main.send({ type: 'broadcast', event: 'hey', payload: { page, text, url: url || (page + '.html') } }); notifyPush(ctx, text, url || (page + '.html'), page) }
export const todayStr = (d = new Date()) => { const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000); return z.toISOString().slice(0, 10) };

/* ---------- 🔔 notification bell (all pages) ---------- */
const BELL = { ctx: null, items: [], t: null };
function bellCss() {
  if (document.getElementById('bellCss')) return;
  const s = document.createElement('style'); s.id = 'bellCss';
  s.textContent = `.bellbtn{position:relative;border:1px solid var(--line);background:var(--card);border-radius:50%;width:40px;height:40px;font-size:19px;cursor:pointer;display:grid;place-items:center;padding:0;flex:0 0 auto;margin-left:6px}
.bellbtn b{position:absolute;top:-4px;right:-4px;background:#ff3b6b;color:#fff;border-radius:999px;font-size:11px;min-width:18px;height:18px;line-height:18px;padding:0 4px;font-weight:800;border:2px solid var(--card)}
.bellbtn{}header .pchip{max-width:40vw;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.bellbtn.ring{animation:bellring 1.2s ease-in-out 3}
@keyframes bellring{0%,100%{transform:rotate(0)}15%{transform:rotate(16deg)}30%{transform:rotate(-14deg)}45%{transform:rotate(10deg)}60%{transform:rotate(-6deg)}75%{transform:rotate(3deg)}}
.bellist a{display:flex;gap:10px;align-items:center;padding:10px;border-radius:14px;text-decoration:none;color:var(--ink);margin:4px 0;background:var(--soft)}
.bellist a.old{background:transparent;opacity:.7}
.bellist a i{font-style:normal;font-size:24px}.bellist a span{flex:1;font-size:14px}.bellist a small{display:block;color:var(--muted);font-size:12px}
.bellist a em{font-style:normal;font-size:10px;font-weight:800;background:var(--accent);color:var(--accent-ink);border-radius:6px;padding:1px 6px}`;
  document.head.appendChild(s);
}
export function initBell(ctx) {
  if (BELL.ctx) return; BELL.ctx = ctx; bellCss();
  const h = document.querySelector('header'); if (!h) return;
  const b = document.createElement('button'); b.className = 'bellbtn'; b.id = 'bellBtn'; b.title = 'Thông báo'; b.innerHTML = '🔔<b class="hidden" id="bellN"></b>'; h.appendChild(b);
  const m = document.createElement('div'); m.className = 'modal'; m.id = 'bellModal';
  m.innerHTML = `<div class="sheet"><h3>🔔 Thông báo<small style="margin-left:auto"><button class="btn small" id="bellRead">Đã xem hết</button></small></h3><div class="bellist" id="bellList"></div><p class="note" id="bellEmpty">Chưa có gì mới. Khi ${esc(ctx.partnerName)} để lại quà, thư, lời nhắn… sẽ hiện ở đây.</p><button class="btn block" style="margin-top:8px" onclick="this.closest('.modal').classList.remove('on')">Đóng</button></div>`;
  document.body.appendChild(m);
  m.addEventListener('click', e => { if (e.target === m) m.classList.remove('on') });
  b.onclick = () => { renderBell(); m.classList.add('on'); setSeen(Date.now()); setTimeout(refreshBell, 400) };
  m.querySelector('#bellRead').onclick = () => { setSeen(Date.now()); refreshBell() };
  refreshBell(); setInterval(refreshBell, 60000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) refreshBell() });
}
const seenKey = () => 'bellSeen-' + BELL.ctx.me.id;
function getSeen() { return Math.max(store.get(seenKey(), 0), BELL.remoteSeen || 0) || (Date.now() - 3 * 864e5) }
function setSeen(t) { store.set(seenKey(), t); BELL.remoteSeen = t; saveState('seen-' + BELL.ctx.me.id, { at: t }) }
export async function refreshBell() {
  const ctx = BELL.ctx; if (!ctx) return; clearTimeout(BELL.t);
  BELL.t = setTimeout(async () => {
    try {
      const me = ctx.me.id, pa = ctx.partnerId, since = new Date(Date.now() - 14 * 864e5).toISOString();
      const td = todayStr();
      const [rs, L, G, V, N, D, A, E, B, S, P] = await Promise.all([
        BELL.remoteSeen == null ? loadState('seen-' + me, {}) : Promise.resolve({ at: BELL.remoteSeen }),
        sb.from('letters').select('id,title,kind,unlock_at,created_at').eq('to_id', me).is('opened_at', null).order('created_at', { ascending: false }).limit(20),
        sb.from('vgifts').select('id,gift,qty,message,created_at').eq('to_id', me).is('seen_at', null).order('created_at', { ascending: false }).limit(30),
        sb.from('voices').select('id,kind,note,created_at').eq('to_id', me).is('listened_at', null).order('created_at', { ascending: false }).limit(10),
        sb.from('notes').select('id,text,emoji,created_at').eq('from_id', pa).is('seen_at', null).order('created_at', { ascending: false }).limit(20),
        sb.rpc('daily_status', { d: td }),
        sb.from('album').select('id,source,caption,created_at').eq('by', pa).gte('created_at', since).order('created_at', { ascending: false }).limit(20),
        sb.from('events').select('id,title,emoji,day,created_at').eq('by', pa).gte('created_at', since).limit(20),
        sb.from('bucket').select('id,title,done,done_at,created_at').eq('by', pa).gte('created_at', since).limit(20),
        sb.from('savings').select('id,amount,note,created_at').eq('by', pa).gte('created_at', since).limit(20),
        sb.from('places').select('id,name,kind,created_at').eq('by', pa).gte('created_at', since).limit(20)
      ]);
      if (BELL.remoteSeen == null) BELL.remoteSeen = (rs && rs.at) || 0;
      const seen = getSeen(), now = Date.now(), it = [], P_ = ctx.partnerName;
      const push = (o, sticky) => { o.ts = new Date(o.at).getTime(); o.isNew = sticky || o.ts > seen; it.push(o) };
      (L.data || []).forEach(l => { const locked = l.unlock_at && new Date(l.unlock_at).getTime() > now; push({ i: locked ? '🔒' : '💌', t: locked ? `${P_} gửi một bức thư hẹn giờ` : `${P_} gửi bạn một bức thư${l.title ? ': “' + l.title + '”' : ''}`, s: locked ? 'Mở được vào ' + new Date(l.unlock_at).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : 'Chưa mở', at: l.created_at, u: 'letters.html' }, !locked) });
      if ((G.data || []).length) { const n = G.data.reduce((s, g) => s + (g.qty || 1), 0); push({ i: '🎁', t: `${P_} tặng bạn ${n} món quà`, s: G.data.slice(0, 6).map(g => g.gift).join(' ') + (G.data.find(g => g.message) ? ' · “' + G.data.find(g => g.message).message + '”' : ''), at: G.data[0].created_at, u: 'gifts.html' }, true) }
      (V.data || []).forEach(v => push({ i: '🎙️', t: `${P_} gửi ${v.kind === 'morning' ? 'lời chào buổi sáng' : v.kind === 'night' ? 'lời chúc ngủ ngon' : 'một lời nhắn thoại'}`, s: v.note || 'Chưa nghe', at: v.created_at, u: 'voice.html' }, true));
      (N.data || []).forEach(n => push({ i: n.emoji || '📝', t: `${P_} dán note lên tủ lạnh`, s: n.text, at: n.created_at, u: 'fridge.html' }, true));
      if (D.data && D.data.partner && !D.data.me) push({ i: '❓', t: `${P_} đã trả lời câu hỏi hôm nay`, s: 'Trả lời để xem người ấy viết gì', at: new Date().toISOString(), u: 'daily.html' }, true);
      (A.data || []).forEach(a => push({ i: a.source === 'booth' ? '📸' : '🗂️', t: `${P_} thêm ảnh vào Album`, s: a.caption || '', at: a.created_at, u: 'album.html' }));
      (E.data || []).forEach(e => push({ i: e.emoji || '📅', t: `${P_} thêm lịch: ${e.title}`, s: new Date(e.day + 'T00:00:00').toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit' }), at: e.created_at, u: 'calendar.html' }));
      (B.data || []).forEach(b => push({ i: b.done ? '🎉' : '🌟', t: `${P_} ${b.done ? 'đã làm xong' : 'thêm vào bucket list'}: ${b.title}`, s: '', at: b.done_at || b.created_at, u: 'bucket.html' }));
      (S.data || []).filter(s => s.amount > 0).forEach(s => push({ i: '🐷', t: `${P_} bỏ heo ${Number(s.amount).toLocaleString('vi-VN')}đ`, s: s.note || '', at: s.created_at, u: 'fund.html' }));
      (P.data || []).forEach(p => push({ i: p.kind === 'been' ? '❤️' : '⭐', t: `${P_} ghim ${p.name} lên bản đồ`, s: '', at: p.created_at, u: 'map.html' }));
      { const d0 = new Date(); if (d0.getDate() <= 5) { const pm = new Date(d0.getFullYear(), d0.getMonth() - 1, 1); const k = 'recapSeen-' + pm.getFullYear() + '-' + (pm.getMonth() + 1); if (!store.get(k, null) && !localStorage.getItem(k)) push({ i: '📊', t: `Tổng kết tháng ${pm.getMonth() + 1} của hai đứa đã có!`, s: 'Xem lại cả tháng đã làm gì cho nhau', at: new Date(d0.getFullYear(), d0.getMonth(), 1).toISOString(), u: 'recap.html' }, true) } }
      it.sort((a, b) => (b.isNew - a.isNew) || (b.ts - a.ts));
      const prevN = BELL.items.filter(x => x.isNew).length;
      BELL.items = it; const n = it.filter(x => x.isNew).length;
      const badge = document.getElementById('bellN'); if (badge) { badge.textContent = n > 99 ? '99+' : n; badge.classList.toggle('hidden', !n) }
      if (n > prevN && BELL.loaded) { const btn = document.getElementById('bellBtn'); btn && (btn.classList.remove('ring'), void btn.offsetWidth, btn.classList.add('ring')) }
      BELL.loaded = true;
      try { n ? navigator.setAppBadge && navigator.setAppBadge(n) : navigator.clearAppBadge && navigator.clearAppBadge() } catch (e) { }
      document.title = document.title.replace(/^\(\d+\+?\) /, '');
      if (n) document.title = `(${n}) ` + document.title;
    } catch (e) { console.warn('bell', e) }
  }, 300);
}
function renderBell() {
  const L = document.getElementById('bellList'); if (!L) return;
  const it = BELL.items.slice(0, 40);
  document.getElementById('bellEmpty').classList.toggle('hidden', it.length > 0);
  L.innerHTML = it.map(x => `<a href="${x.u}" class="${x.isNew ? '' : 'old'}"><i>${x.i}</i><span>${esc(x.t)}${x.s ? `<small>${esc(String(x.s).slice(0, 90))}</small>` : ''}<small>${ago(x.at)}</small></span>${x.isNew ? '<em>MỚI</em>' : ''}</a>`).join('');
}

/* ---------- WebRTC ICE servers: Metered TURN if configured (key kept in DB, not in repo) ---------- */
export async function getIce(fallback) {
  const base = [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }];
  try {
    const c = JSON.parse(sessionStorage.getItem('iceCache') || 'null'); if (c && c.exp > Date.now()) return { iceServers: c.list };
    const cfg = await loadState('turn', null); if (!cfg || !cfg.app || !cfg.key) return fallback || { iceServers: base };
    const r = await fetch(`https://${cfg.app}.metered.live/api/v1/turn/credentials?apiKey=${encodeURIComponent(cfg.key)}`);
    if (!r.ok) throw new Error('turn ' + r.status);
    const list = [...base, ...(await r.json())];
    sessionStorage.setItem('iceCache', JSON.stringify({ list, exp: Date.now() + 50 * 60e3 }));
    return { iceServers: list };
  } catch (e) { console.warn('ICE', e); return fallback || { iceServers: base } }
}

/* ---------- Web Push ---------- */
export const VAPID_PUBLIC = 'BPr9Gm27iHkxeN5Yk8-2iM-oCYjpivEI_EJr6Q6vJIIW6ThKE_U6dacEwFagCEd1srMPWSNnkVhU8z0m_4DK_7Y';
const b64u = s => { const p = '='.repeat((4 - s.length % 4) % 4); const b = atob((s + p).replace(/-/g, '+').replace(/_/g, '/')); return Uint8Array.from(b, c => c.charCodeAt(0)) };
export const isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
export const isStandalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
export const pushSupported = () => 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
export async function pushState() { if (!pushSupported()) return isIOS() && !isStandalone() ? 'ios-install' : 'unsupported'; if (Notification.permission === 'denied') return 'denied'; try { const reg = await navigator.serviceWorker.getRegistration(); const sub = reg && await reg.pushManager.getSubscription(); return sub && Notification.permission === 'granted' ? 'on' : 'off' } catch (e) { return 'off' } }
export async function enablePush() {
  if (!pushSupported()) throw new Error(isIOS() && !isStandalone() ? 'Trên iPhone/iPad: thêm app ra Màn hình chính trước (Chia sẻ → Thêm vào MH chính), rồi mở từ icon đó' : 'Trình duyệt này chưa hỗ trợ thông báo');
  const perm = await Notification.requestPermission(); if (perm !== 'granted') throw new Error('Bạn chưa cho phép thông báo');
  const reg = await navigator.serviceWorker.register('sw.js'); await navigator.serviceWorker.ready;
  const sub = (await reg.pushManager.getSubscription()) || await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64u(VAPID_PUBLIC) });
  const { error } = await sb.from('push_subs').upsert({ endpoint: sub.endpoint, sub: sub.toJSON(), ua: navigator.userAgent.slice(0, 200) }); if (error) throw error;
  return true;
}
export async function disablePush() { try { const reg = await navigator.serviceWorker.getRegistration(); const sub = reg && await reg.pushManager.getSubscription(); if (sub) { await sb.from('push_subs').delete().eq('endpoint', sub.endpoint); await sub.unsubscribe() } } catch (e) { } }
export async function testPush() { const { data, error } = await sb.functions.invoke('notify', { body: { title: 'Tomortle × Molly', body: 'Thông báo đã hoạt động 💗', url: './', test: true } }); if (error) throw error; return data }
const pushLast = {};
export function notifyPush(ctx, text, url, tag = 'tmx') {
  try { if (Date.now() - (pushLast[tag] || 0) < 15000) return; pushLast[tag] = Date.now();
    sb.functions.invoke('notify', { body: { title: ctx.myName || 'Tomortle × Molly', body: text, url: url || './', tag } }).catch(() => { }) } catch (e) { }
}

/* nhắc sao lưu Google Drive khi đến hạn (cài ở trang Sao lưu) */
async function driveNudge(ctx) {
  try { if (sessionStorage.getItem('gnudge')) return; sessionStorage.setItem('gnudge', '1') } catch (e) { return }
  try {
    const c = await loadState('gdrive_client', {}); if (!c.id) return;
    const st = await loadState('gdrive-' + ctx.me.id, {}); const every = st.every || 7, days = st.last ? (Date.now() - st.last) / 864e5 : Infinity;
    if (days < every) return;
    setTimeout(() => toast(st.last ? `☁️ Đã ${Math.floor(days)} ngày chưa sao lưu lên Google Drive` : '☁️ Sao lưu kỷ niệm lên Google Drive lần đầu nhé', 'Sao lưu', () => location.href = 'backup.html?drive=1'), 2500);
  } catch (e) { }
}
