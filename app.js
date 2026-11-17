import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/+esm';

const VERSION = 'Đợt 1 · 2026-11-17';
const SB_URL = 'https://yktkofupegtvrviynnjk.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlrdGtvZnVwZWd0dnJ2aXlubmprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQ5MTI5MjMsImV4cCI6MjExMDQ4ODkyM30.dRsXfxiAjIXUkwPQ65p2oMl6HfogL0QZdg27feOs9nQ';
const sb = createClient(SB_URL, SB_KEY, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });

/* ---------- helpers ---------- */
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const store = { get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v) } catch (e) { return d } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)) } catch (e) { } } };
let toastT;
function toast(msg, label, act) {
  const t = $('#toast'); t.innerHTML = ''; t.append(document.createTextNode(msg));
  if (label) { const b = document.createElement('button'); b.textContent = label; b.onclick = () => { t.classList.remove('on'); act() }; t.append(b) }
  t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), label ? 7000 : 2800);
}
function show(id) { $$('.screen').forEach(s => s.classList.toggle('active', s.id === id)); $('#btnSettings').classList.toggle('hidden', id !== 'scrHome'); window.scrollTo(0, 0) }
function openM(id) { $('#' + id).classList.add('on') }
$$('.modal').forEach(m => m.addEventListener('click', e => { if (e.target === m || e.target.closest('[data-close]')) m.classList.remove('on') }));
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
function ago(t) { if (!t) return ''; const s = (Date.now() - new Date(t)) / 1000; if (s < 60) return 'vừa xong'; if (s < 3600) return Math.floor(s / 60) + ' phút trước'; if (s < 86400) return Math.floor(s / 3600) + ' giờ trước'; return Math.floor(s / 86400) + ' ngày trước' }
function vib(p) { try { navigator.vibrate && navigator.vibrate(p) } catch (e) { } }
const canVibrate = 'vibrate' in navigator;
function errMsg(e) {
  const m = (e && (e.message || e.error_description || e)) + '';
  const map = { 'Invalid login credentials': 'Sai email hoặc mật khẩu.', 'Email not confirmed': 'Email chưa được xác nhận. Mở hộp thư và bấm link xác nhận trước nhé.', 'User already registered': 'Email này đã có tài khoản, hãy đăng nhập.', couple_exists: 'Đã có một cặp đôi trong app này. Hãy nhập mã người ấy gửi cho bạn.', couple_full: 'Không gian này đã đủ hai người rồi.', wrong_code: 'Mã không đúng, kiểm tra lại nhé.', no_couple: 'Chưa có ai tạo không gian. Một trong hai người bấm "Tạo không gian" trước nhé.' };
  for (const k in map) if (m.includes(k)) return map[k];
  if (/rate limit/i.test(m)) return 'Gửi email quá nhiều lần, đợi một lúc rồi thử lại nhé.';
  return m;
}

/* ---------- theme (shared with photobooth) ---------- */
let UI = store.get('ui', { theme: 'pastel', accent: '', font: '' });
function applyUI() {
  const r = document.documentElement; r.dataset.theme = UI.theme === 'pastel' ? '' : UI.theme;
  r.style.removeProperty('--accent'); r.style.removeProperty('--font');
  if (UI.accent) r.style.setProperty('--accent', UI.accent); if (UI.font) r.style.setProperty('--font', `'${UI.font}'`);
  $$('#sThemes button').forEach(b => b.classList.toggle('on', b.dataset.theme === UI.theme));
  const meta = document.querySelector('meta[name=theme-color]'); meta && meta.setAttribute('content', getComputedStyle(r).getPropertyValue('--bg').trim());
  store.set('ui', UI);
}
$('#sThemes').onclick = e => { const b = e.target.closest('button'); if (!b) return; UI.theme = b.dataset.theme; UI.accent = ''; applyUI() };
applyUI();

/* ---------- PWA ---------- */
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => { });
let deferredInstall = null;
const isStandalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferredInstall = e; maybeInstallBox() });
function maybeInstallBox() {
  if (isStandalone || store.get('installDismissed', false)) return;
  if (deferredInstall || isIOS) $('#installBox').classList.remove('hidden');
}
$('#btnInstall').onclick = async () => {
  if (deferredInstall) { deferredInstall.prompt(); await deferredInstall.userChoice.catch(() => { }); deferredInstall = null; $('#installBox').classList.add('hidden') }
  else openM('mIosInstall');
};
$('#btnInstallX').onclick = () => { store.set('installDismissed', true); $('#installBox').classList.add('hidden') };

/* ---------- state ---------- */
let me = null, myProfile = null, partnerProfile = null, couple = null, partnerId = null;
let channel = null, dbChannel = null, partnerOnline = false;

/* ---------- AUTH ---------- */
let authMode = 'login', recovering = false;
$('#authTabs').onclick = e => {
  const b = e.target.closest('button'); if (!b) return; authMode = b.dataset.t;
  $$('#authTabs button').forEach(x => x.classList.toggle('on', x === b));
  $('#fName').classList.toggle('hidden', authMode !== 'signup');
  $('#aSubmit').textContent = authMode === 'signup' ? 'Tạo tài khoản' : 'Đăng nhập';
  $('#aPass').autocomplete = authMode === 'signup' ? 'new-password' : 'current-password';
  $('#aErr').classList.add('hidden'); $('#aOk').classList.add('hidden');
};
$('#authForm').onsubmit = async e => {
  e.preventDefault(); const btn = $('#aSubmit'); btn.disabled = true;
  $('#aErr').classList.add('hidden'); $('#aOk').classList.add('hidden');
  const email = $('#aEmail').value.trim(), password = $('#aPass').value;
  try {
    if (authMode === 'signup') {
      const name = $('#aName').value.trim();
      const { data, error } = await sb.auth.signUp({ email, password, options: { data: { name }, emailRedirectTo: location.origin + location.pathname } });
      if (error) throw error;
      if (!data.session) { const ok = $('#aOk'); ok.textContent = 'Đã tạo tài khoản! Mở email ' + email + ' và bấm link xác nhận, rồi quay lại đây đăng nhập.'; ok.classList.remove('hidden') }
    } else {
      const { error } = await sb.auth.signInWithPassword({ email, password }); if (error) throw error;
    }
  } catch (err) { const el = $('#aErr'); el.textContent = errMsg(err); el.classList.remove('hidden') }
  btn.disabled = false;
};
$('#aForgot').onclick = async () => {
  const email = $('#aEmail').value.trim(); if (!email) { $('#aEmail').focus(); toast('Nhập email trước nhé'); return }
  const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: location.origin + location.pathname });
  if (error) { const el = $('#aErr'); el.textContent = errMsg(error); el.classList.remove('hidden') }
  else { const ok = $('#aOk'); ok.textContent = 'Đã gửi email đặt lại mật khẩu.'; ok.classList.remove('hidden') }
};
$('#npSave').onclick = async () => {
  const { error } = await sb.auth.updateUser({ password: $('#npPass').value });
  if (error) { const el = $('#npErr'); el.textContent = errMsg(error); el.classList.remove('hidden'); return }
  recovering = false; toast('Đã đổi mật khẩu'); route();
};
$$('[data-logout]').forEach(b => b.onclick = async () => { await sb.auth.signOut(); location.reload() });

sb.auth.onAuthStateChange((ev, session) => {
  if (ev === 'PASSWORD_RECOVERY') { recovering = true; show('scrNewPass'); return }
  if (ev === 'SIGNED_IN' || ev === 'SIGNED_OUT') route();
});

/* ---------- ROUTING ---------- */
let routing = false;
async function route() {
  if (recovering || routing) return; routing = true;
  try {
    const { data: { session } } = await sb.auth.getSession();
    if (!session) { show('scrAuth'); return }
    me = session.user;
    await ensureProfile();
    const { data: c, error } = await sb.from('couple').select('*').maybeSingle();
    if (error) throw error;
    couple = c;
    if (!couple) { $('#pairStart').classList.remove('hidden'); $('#pairWait').classList.add('hidden'); show('scrPair'); return }
    if (!couple.user_b) { showWait(); return }
    partnerId = couple.user_a === me.id ? couple.user_b : couple.user_a;
    await enterHome();
  } catch (e) { console.error(e); toast('Lỗi tải dữ liệu: ' + errMsg(e)); show('scrAuth') }
  finally { routing = false }
}
async function ensureProfile() {
  const { data } = await sb.from('profiles').select('*').eq('id', me.id).maybeSingle();
  if (data) { myProfile = data; return }
  const name = (me.user_metadata && me.user_metadata.name) || me.email.split('@')[0];
  const { data: ins, error } = await sb.from('profiles').insert({ id: me.id, display_name: name, tz: Intl.DateTimeFormat().resolvedOptions().timeZone }).select().single();
  if (error) throw error; myProfile = ins;
}

/* ---------- PAIR ---------- */
let waitTimer = null;
function showWait() {
  $('#pairStart').classList.add('hidden'); $('#pairWait').classList.remove('hidden'); $('#pCodeShow').textContent = couple.invite_code; show('scrPair');
  clearInterval(waitTimer); waitTimer = setInterval(async () => {
    const { data } = await sb.from('couple').select('*').maybeSingle();
    if (data && data.user_b) { clearInterval(waitTimer); toast('Người ấy đã vào ♡'); route() }
  }, 4000);
}
$('#pCreate').onclick = async () => {
  $('#pErr').classList.add('hidden');
  const { data, error } = await sb.rpc('create_couple');
  if (error) { const el = $('#pErr'); el.textContent = errMsg(error); el.classList.remove('hidden'); return }
  couple = data; showWait();
};
$('#pJoin').onclick = async () => {
  $('#pErr').classList.add('hidden');
  const { error } = await sb.rpc('join_couple', { code: $('#pCode').value.trim() });
  if (error) { const el = $('#pErr'); el.textContent = errMsg(error); el.classList.remove('hidden'); return }
  toast('Ghép đôi thành công ♡'); route();
};
$('#pShare').onclick = async () => {
  const text = `Vào Tomortle với mình nhé ♡\n1. Mở ${location.origin + location.pathname}\n2. Tạo tài khoản\n3. Nhập mã: ${couple.invite_code}`;
  if (navigator.share) { try { await navigator.share({ title: 'Tomortle', text }); return } catch (e) { if (e.name === 'AbortError') return } }
  try { await navigator.clipboard.writeText(text); toast('Đã copy lời mời') } catch (e) { toast('Mã: ' + couple.invite_code) }
};

/* ---------- HOME ---------- */
const STATUSES = ['📚 Đang học', '💼 Đang làm', '🍜 Đang ăn', '🚌 Đang đi đường', '🎮 Đang chơi', '😴 Đi ngủ rồi', '🥺 Nhớ người ấy', '☕ Rảnh nè'];
const MOODS = [['😄', 'Vui lắm'], ['🙂', 'Ổn'], ['😐', 'Bình thường'], ['😔', 'Hơi buồn'], ['😫', 'Mệt'], ['😡', 'Bực']];
const LAMP_COLORS = ['#ff7aa2', '#ff4d4d', '#ffb347', '#ffe066', '#7ed957', '#5ec8ff', '#9b7bff', '#ffffff'];
const EMOJIS = ['🙂', '😺', '🐻', '🐰', '🐶', '🦊', '🐼', '🐸', '🐧', '🦄', '🌸', '🌙', '⭐', '🍓', '🧋', '🎀'];
let homeBuilt = false;

async function enterHome() {
  const { data } = await sb.from('profiles').select('*').eq('id', partnerId).maybeSingle();
  partnerProfile = data || { id: partnerId, display_name: 'Người ấy', emoji: '🙂' };
  store.set('name', myProfile.display_name || '');
  if (!homeBuilt) buildHome();
  renderProfiles(); renderDays(); renderCountdown(); renderLamp(couple.lamp_color, null);
  loadMoods(); loadWeather();
  show('scrHome'); maybeInstallBox(); connectRealtime();
  $('#sVersion').textContent = VERSION;
}

function buildHome() {
  homeBuilt = true;
  $('#statusChips').innerHTML = STATUSES.map(s => `<button data-s="${esc(s)}">${esc(s)}</button>`).join('');
  $('#statusChips').onclick = async e => {
    const b = e.target.closest('button'); if (!b) return; const s = b.dataset.s;
    const val = myProfile.status === s ? null : s;
    myProfile.status = val; myProfile.status_at = new Date().toISOString(); renderProfiles();
    await sb.from('profiles').update({ status: val, status_at: myProfile.status_at }).eq('id', me.id);
    channel && channel.send({ type: 'broadcast', event: 'status', payload: {} });
  };
  $('#moodBtns').innerHTML = MOODS.map(([e, t]) => `<button data-m="${e}" title="${t}">${e}</button>`).join('');
  $('#moodBtns').onclick = async e => {
    const b = e.target.closest('button'); if (!b) return;
    $$('#moodBtns button').forEach(x => x.classList.toggle('on', x === b));
    const { error } = await sb.from('moods').insert({ mood: b.dataset.m });
    if (error) toast(errMsg(error)); else { toast('Đã gửi tâm trạng'); loadMoods() }
  };
  $('#swatches').innerHTML = LAMP_COLORS.map(c => `<button data-c="${c}" style="background:${c}"></button>`).join('');
  $('#swatches').onclick = async e => {
    const b = e.target.closest('button'); if (!b) return; const c = b.dataset.c;
    renderLamp(c, me.id); vib(30);
    channel && channel.send({ type: 'broadcast', event: 'lamp', payload: { c, by: me.id } });
    await sb.from('couple').update({ lamp_color: c }).eq('id', 1);
  };
  $('#btnLampFull').onclick = () => openLampFull();
  $('#btnMeet').onclick = () => {
    $('#meetAt').value = couple.next_meet ? toLocalInput(couple.next_meet) : '';
    $('#meetNote').value = couple.next_meet_note || ''; openM('mMeet');
  };
  $('#meetSave').onclick = async () => {
    const v = $('#meetAt').value; if (!v) { toast('Chọn ngày giờ gặp nhé'); return }
    const patch = { next_meet: new Date(v).toISOString(), next_meet_note: $('#meetNote').value.trim() || null };
    const { error } = await sb.from('couple').update(patch).eq('id', 1);
    if (error) { toast(errMsg(error)); return }
    Object.assign(couple, patch); renderCountdown(); $('#mMeet').classList.remove('on'); toast('Đã đặt lịch gặp ♡');
    channel && channel.send({ type: 'broadcast', event: 'couple', payload: {} });
  };
  $('#meetClear').onclick = async () => {
    await sb.from('couple').update({ next_meet: null, next_meet_note: null }).eq('id', 1);
    couple.next_meet = null; couple.next_meet_note = null; renderCountdown(); $('#mMeet').classList.remove('on');
    channel && channel.send({ type: 'broadcast', event: 'couple', payload: {} });
  };
  setInterval(() => { renderCountdown(); renderPartnerTime(); renderProfiles() }, 30000);
  setInterval(() => { if (couple && couple.next_meet) renderCountdown() }, 1000);
  setupTouch(); setupHug(); setupSettings();
  $('#tileBooth').onclick = inviteBooth;
  $('#touchNote').textContent = canVibrate ? '' : 'Máy bạn không rung được, sẽ hiện hiệu ứng sáng';
}

function renderProfiles() {
  if (!myProfile || !partnerProfile) return;
  $('#avMe span').textContent = myProfile.emoji || '🙂';
  $('#avThem span').textContent = partnerProfile.emoji || '🙂';
  $('#nmMe').textContent = myProfile.display_name || 'Bạn';
  $('#nmThem').textContent = partnerProfile.display_name || 'Người ấy';
  $('#stMe').textContent = myProfile.status ? myProfile.status : '';
  $('#stThem').textContent = partnerProfile.status ? `${partnerProfile.status} · ${ago(partnerProfile.status_at)}` : (partnerOnline ? 'Đang online' : '');
  $('#avThem .dot').classList.toggle('on', partnerOnline);
  $$('#statusChips button').forEach(b => b.classList.toggle('on', b.dataset.s === myProfile.status));
  $('#moodThemLbl').textContent = partnerProfile.display_name || 'Người ấy';
}
function renderDays() {
  if (!couple.started_on) { $('#daysBox').innerHTML = `<button class="btn small" id="setStartBtn">Đặt ngày bắt đầu yêu nhau</button>`; $('#setStartBtn').onclick = () => { openSettings(); setTimeout(() => $('#sStart').focus(), 200) }; return }
  const [y, m, d] = couple.started_on.split('-').map(Number); const start = new Date(y, m - 1, d); const now = new Date(); const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const n = Math.floor((today - start) / 86400000) + 1;
  const ann = (now.getMonth() === start.getMonth() && now.getDate() === start.getDate() && now.getFullYear() > start.getFullYear()) ? `<div class="note">🎉 Hôm nay là kỷ niệm ${now.getFullYear() - start.getFullYear()} năm!</div>` : (n % 100 === 0 ? `<div class="note">🎉 Tròn ${n} ngày!</div>` : '');
  $('#daysBox').innerHTML = `Ngày thứ <b>${n}</b> bên nhau ♡${ann}`;
}
function toLocalInput(iso) { const d = new Date(iso); const p = n => String(n).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}` }
function renderCountdown() {
  const box = $('#cdBox'); if (!couple) return;
  if (!couple.next_meet) { box.innerHTML = '<p class="note">Chưa có lịch gặp. Bấm "Đặt lịch" để cả hai cùng đếm ngược.</p>'; return }
  const t = new Date(couple.next_meet), diff = t - Date.now();
  const when = t.toLocaleString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  if (diff <= 0) { box.innerHTML = `<p class="center" style="font-weight:800;font-size:20px">Hôm nay gặp nhau rồi! 🥰</p><p class="note center">${esc(couple.next_meet_note || '')}</p>`; return }
  const d = Math.floor(diff / 86400000), h = Math.floor(diff / 3600000) % 24, m = Math.floor(diff / 60000) % 60, s = Math.floor(diff / 1000) % 60;
  box.innerHTML = `<div class="cd"><div><b>${d}</b><span>ngày</span></div><div><b>${h}</b><span>giờ</span></div><div><b>${m}</b><span>phút</span></div><div><b>${s}</b><span>giây</span></div></div><p class="note center">${esc(when)}${couple.next_meet_note ? ' · ' + esc(couple.next_meet_note) : ''}</p>`;
}

async function loadMoods() {
  const since = new Date(Date.now() - 36 * 3600e3).toISOString();
  const { data } = await sb.from('moods').select('*').gte('created_at', since).order('created_at', { ascending: false }).limit(20);
  const fmt = r => { if (!r) return 'Chưa chọn'; const t = MOODS.find(m => m[0] === r.mood); return `<span style="font-size:22px">${r.mood}</span> ${t ? t[1] : ''} · ${ago(r.created_at)}` };
  const mine = (data || []).find(r => r.user_id === me.id), theirs = (data || []).find(r => r.user_id === partnerId);
  $('#moodMe').innerHTML = fmt(mine); $('#moodThem').innerHTML = fmt(theirs);
  if (mine) $$('#moodBtns button').forEach(x => x.classList.toggle('on', x.dataset.m === mine.mood));
}

/* weather */
const WX = { 0: ['☀️', 'Trời quang'], 1: ['🌤️', 'Ít mây'], 2: ['⛅', 'Có mây'], 3: ['☁️', 'Nhiều mây'], 45: ['🌫️', 'Sương mù'], 48: ['🌫️', 'Sương mù'], 51: ['🌦️', 'Mưa phùn'], 53: ['🌦️', 'Mưa phùn'], 55: ['🌧️', 'Mưa phùn dày'], 61: ['🌧️', 'Mưa nhỏ'], 63: ['🌧️', 'Mưa vừa'], 65: ['🌧️', 'Mưa to'], 80: ['🌦️', 'Mưa rào'], 81: ['🌧️', 'Mưa rào'], 82: ['⛈️', 'Mưa rào lớn'], 95: ['⛈️', 'Dông'], 96: ['⛈️', 'Dông'], 99: ['⛈️', 'Dông lớn'] };
let partnerTz = null;
async function loadWeather() {
  const p = partnerProfile; partnerTz = p.tz || null;
  if (p.lat == null) { $('#wxCity').textContent = ''; $('#wxNow').textContent = '--'; $('#wxDesc').textContent = (p.display_name || 'Người ấy') + ' chưa đặt thành phố trong Cài đặt'; renderPartnerTime(); return }
  $('#wxCity').textContent = p.city || '';
  try {
    const r = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${p.lat}&longitude=${p.lon}&current=temperature_2m,weather_code,is_day&timezone=auto`);
    const j = await r.json(); partnerTz = j.timezone || partnerTz;
    const w = WX[j.current.weather_code] || ['🌡️', ''];
    const icon = (!j.current.is_day && w[0] === '☀️') ? '🌙' : w[0];
    $('#wxNow').textContent = `${icon} ${Math.round(j.current.temperature_2m)}°C`; $('#wxDesc').textContent = w[1];
  } catch (e) { $('#wxDesc').textContent = 'Không tải được thời tiết' }
  renderPartnerTime();
}
function renderPartnerTime() {
  try { $('#wxTime').textContent = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', timeZone: partnerTz || undefined }) } catch (e) { }
}

/* ---------- REALTIME ---------- */
function connectRealtime() {
  if (channel) return;
  channel = sb.channel('couple-' + couple.channel_key, { config: { presence: { key: me.id }, broadcast: { self: false } } });
  channel
    .on('presence', { event: 'sync' }, () => {
      const st = channel.presenceState(); const was = partnerOnline; partnerOnline = !!st[partnerId];
      renderProfiles(); if (partnerOnline && !was) toast((partnerProfile.display_name || 'Người ấy') + ' vừa online ♡');
    })
    .on('broadcast', { event: 'touch' }, ({ payload }) => onTouch(payload))
    .on('broadcast', { event: 'hug' }, ({ payload }) => onHug(payload))
    .on('broadcast', { event: 'miss' }, () => onMiss())
    .on('broadcast', { event: 'lamp' }, ({ payload }) => { renderLamp(payload.c, payload.by); vib([60, 60, 60]); toast((partnerProfile.display_name || 'Người ấy') + ' vừa bật đèn nhớ bạn 💡') })
    .on('broadcast', { event: 'status' }, () => refreshPartner())
    .on('broadcast', { event: 'mood' }, () => loadMoods())
    .on('broadcast', { event: 'couple' }, () => refreshCouple())
    .on('broadcast', { event: 'booth' }, ({ payload }) => { vib([100, 80, 100]); toast((partnerProfile.display_name || 'Người ấy') + ' mời bạn chụp photobooth 📸', 'Vào', () => location.href = payload.url) })
    .subscribe(status => { if (status === 'SUBSCRIBED') channel.track({ at: Date.now() }) });
  dbChannel = sb.channel('db-changes')
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles' }, p => { if (p.new.id === partnerId) { partnerProfile = p.new; renderProfiles(); loadWeather() } })
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'moods' }, p => { loadMoods(); if (p.new.user_id === partnerId) toast((partnerProfile.display_name || 'Người ấy') + ' vừa cập nhật tâm trạng ' + p.new.mood) })
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'couple' }, p => { const lampChanged = p.new.lamp_color !== couple.lamp_color; couple = p.new; renderDays(); renderCountdown(); if (lampChanged) renderLamp(couple.lamp_color, null) })
    .subscribe();
  document.addEventListener('visibilitychange', () => { if (!document.hidden) { refreshPartner(); refreshCouple(); loadMoods() } });
}
async function refreshPartner() { const { data } = await sb.from('profiles').select('*').eq('id', partnerId).maybeSingle(); if (data) { partnerProfile = data; renderProfiles() } }
async function refreshCouple() { const { data } = await sb.from('couple').select('*').maybeSingle(); if (data) { couple = data; renderDays(); renderCountdown(); renderLamp(couple.lamp_color, null) } }
const send = (event, payload = {}) => channel && channel.send({ type: 'broadcast', event, payload });

/* ---------- TOUCH ---------- */
let vibLoop = null, theirBlob = null;
function setupTouch() {
  const pad = $('#pad'); let down = false, last = 0, myBlob = null;
  const pos = e => { const r = pad.getBoundingClientRect(); return { x: Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)), y: Math.max(0, Math.min(1, (e.clientY - r.top) / r.height)) } };
  const place = (el, p) => { el.style.left = (p.x * 100) + '%'; el.style.top = (p.y * 100) + '%' };
  pad.addEventListener('pointerdown', e => { down = true; pad.setPointerCapture(e.pointerId); const p = pos(e); myBlob = document.createElement('div'); myBlob.className = 'blob me'; place(myBlob, p); pad.appendChild(myBlob); send('touch', { on: true, ...p }); vib(20) });
  pad.addEventListener('pointermove', e => { if (!down) return; const p = pos(e); place(myBlob, p); const now = Date.now(); if (now - last > 70) { last = now; send('touch', { on: true, ...p }) } });
  const up = () => { if (!down) return; down = false; myBlob && myBlob.remove(); myBlob = null; send('touch', { on: false }) };
  pad.addEventListener('pointerup', up); pad.addEventListener('pointercancel', up);
}
let touchTimeout = null;
function onTouch(p) {
  const pad = $('#pad');
  if (p.on) {
    if (!theirBlob) { theirBlob = document.createElement('div'); theirBlob.className = 'blob'; pad.appendChild(theirBlob); toastTouch() }
    theirBlob.style.left = (p.x * 100) + '%'; theirBlob.style.top = (p.y * 100) + '%';
    if (!vibLoop && canVibrate) { vib(400); vibLoop = setInterval(() => vib(400), 380) }
    clearTimeout(touchTimeout); touchTimeout = setTimeout(() => onTouch({ on: false }), 1500);
  } else {
    theirBlob && theirBlob.remove(); theirBlob = null; clearInterval(vibLoop); vibLoop = null; vib(0); clearTimeout(touchTimeout);
  }
}
let touchToastAt = 0;
function toastTouch() { if (Date.now() - touchToastAt < 8000) return; touchToastAt = Date.now(); if (document.querySelector('#scrHome.active')) { const r = $('#pad').getBoundingClientRect(); if (r.top < 0 || r.bottom > innerHeight) toast((partnerProfile.display_name || 'Người ấy') + ' đang chạm vào bạn 🤲', 'Xem', () => $('#pad').scrollIntoView({ behavior: 'smooth', block: 'center' })) } }

/* ---------- HUG & MISS ---------- */
let iHold = false, theyHold = false, hugEl = null, hugVib = null, theyHoldTimer = null;
function setupHug() {
  const b = $('#btnHug');
  const start = e => { e.preventDefault(); if (iHold) return; iHold = true; b.classList.add('holding'); b.textContent = '🤗 Đang dang tay…'; send('hug', { on: true }); vib(30); updateHug() };
  const stop = () => { if (!iHold) return; iHold = false; b.classList.remove('holding'); b.textContent = '🤗 Giữ để ôm'; send('hug', { on: false }); updateHug() };
  b.addEventListener('pointerdown', start); ['pointerup', 'pointercancel', 'pointerleave'].forEach(t => b.addEventListener(t, stop));
  b.addEventListener('contextmenu', e => e.preventDefault());
  // keep-alive while holding so partner knows
  setInterval(() => { if (iHold) send('hug', { on: true }) }, 1200);
  $('#btnMiss').onclick = () => { send('miss'); hearts(6); vib(30); toast('Đã gửi nỗi nhớ 💗') };
}
function onHug(p) {
  theyHold = !!p.on; clearTimeout(theyHoldTimer);
  if (theyHold) theyHoldTimer = setTimeout(() => { theyHold = false; updateHug() }, 3000);
  updateHug();
}
function updateHug() {
  const name = partnerProfile.display_name || 'Người ấy';
  $('#hugHint').textContent = theyHold && !iHold ? `${name} đang dang tay chờ ôm… giữ nút ôm đi!` : (iHold && !theyHold ? `Đang chờ ${name} giữ nút ôm…` : '');
  if (theyHold && !iHold && canVibrate) vib(80);
  const both = iHold && theyHold;
  if (both && !hugEl) {
    hugEl = document.createElement('div'); hugEl.className = 'hug'; hugEl.innerHTML = `<div>🫂</div><p>Đang ôm ${esc(name)}…</p>`; document.body.appendChild(hugEl);
    hearts(10); if (canVibrate) { vib([300, 120, 300]); hugVib = setInterval(() => vib([300, 120, 300]), 1100) }
  } else if (!both && hugEl) { hugEl.remove(); hugEl = null; clearInterval(hugVib); hugVib = null; vib(0) }
}
function onMiss() { hearts(14); vib([80, 60, 80, 60, 200]); toast((partnerProfile.display_name || 'Người ấy') + ' đang nhớ bạn lắm 💗', 'Nhớ lại', () => { send('miss'); hearts(6) }) }
function hearts(n) {
  const fx = $('#fx'); const set = ['💗', '💖', '💕', '❤️', '🩷', '💘'];
  for (let i = 0; i < n; i++) { const h = document.createElement('div'); h.className = 'fheart'; h.textContent = set[i % set.length]; h.style.left = Math.random() * 95 + 'vw'; h.style.fontSize = (20 + Math.random() * 26) + 'px'; h.style.animationDuration = (2.6 + Math.random() * 2) + 's'; h.style.animationDelay = (Math.random() * .8) + 's'; fx.appendChild(h); setTimeout(() => h.remove(), 5500) }
}

/* ---------- LAMP ---------- */
let lampColor = null, lampBy = null, lampFullEl = null;
function renderLamp(c, by) {
  lampColor = c || null; if (by !== undefined) lampBy = by;
  const l = $('#lamp');
  if (!c) { l.style.background = 'var(--soft)'; l.style.boxShadow = 'none'; $('#lampNote').textContent = 'Chọn một màu để bật đèn bên máy người ấy.'; }
  else { l.style.background = c; l.style.boxShadow = `0 0 30px 10px ${c}aa, 0 0 80px 20px ${c}55`; $('#lampNote').textContent = lampBy === me.id ? 'Bạn đã bật đèn màu này cho người ấy.' : (lampBy ? (partnerProfile.display_name || 'Người ấy') + ' bật đèn này cho bạn ♡' : 'Đèn đang sáng ♡') }
  if (lampFullEl) lampFullEl.style.background = `radial-gradient(circle at 50% 45%, ${c || '#333'}, #000 110%)`;
}
function openLampFull() {
  if (lampFullEl) return;
  lampFullEl = document.createElement('div'); lampFullEl.className = 'lampfull';
  lampFullEl.innerHTML = '<p>Chạm để tắt chế độ đèn</p>'; document.body.appendChild(lampFullEl); renderLamp(lampColor);
  lampFullEl.onclick = () => { lampFullEl.remove(); lampFullEl = null };
  try { navigator.wakeLock && navigator.wakeLock.request('screen').catch(() => { }) } catch (e) { }
}

/* ---------- BOOTH invite ---------- */
function inviteBooth() {
  const a = 'abcdefghjkmnpqrstuvwxyz23456789'; let code = ''; for (let i = 0; i < 6; i++) code += a[Math.floor(Math.random() * a.length)];
  const base = location.origin + location.pathname.replace(/[^/]*$/, '') + 'booth.html';
  send('booth', { url: base + '?room=' + code });
  location.href = base + '?room=' + code + '&host=1';
}

/* ---------- SETTINGS ---------- */
let pickedCity = null, pickedEmoji = null;
function setupSettings() {
  $('#btnSettings').onclick = openSettings;
  $('#sEmoji').innerHTML = EMOJIS.map(e => `<button data-e="${e}" style="font-size:20px">${e}</button>`).join('');
  $('#sEmoji').onclick = e => { const b = e.target.closest('button'); if (!b) return; pickedEmoji = b.dataset.e; $$('#sEmoji button').forEach(x => x.classList.toggle('on', x === b)) };
  $('#sCityFind').onclick = findCity; $('#sCity').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); findCity() } });
  $('#sSave').onclick = saveSettings;
}
function openSettings() {
  $('#sName').value = myProfile.display_name || ''; $('#sCity').value = myProfile.city || ''; $('#cityList').innerHTML = '';
  $('#sStart').value = couple.started_on || ''; pickedCity = null; pickedEmoji = myProfile.emoji;
  $$('#sEmoji button').forEach(x => x.classList.toggle('on', x.dataset.e === pickedEmoji)); applyUI(); openM('mSettings');
}
async function findCity() {
  const q = $('#sCity').value.trim(); if (!q) return; $('#cityList').innerHTML = '<p class="note">Đang tìm…</p>';
  try {
    const r = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=6&language=vi`); const j = await r.json();
    const res = j.results || []; if (!res.length) { $('#cityList').innerHTML = '<p class="note">Không thấy, thử gõ không dấu hoặc tên khác.</p>'; return }
    $('#cityList').innerHTML = res.map((c, i) => `<button data-i="${i}">${esc(c.name)}${c.admin1 ? ', ' + esc(c.admin1) : ''} · ${esc(c.country || '')}</button>`).join('');
    $('#cityList').onclick = e => { const b = e.target.closest('button'); if (!b) return; const c = res[+b.dataset.i]; pickedCity = { city: c.name, lat: c.latitude, lon: c.longitude, tz: c.timezone }; $('#sCity').value = c.name; $('#cityList').innerHTML = `<p class="note">Đã chọn: ${esc(c.name)} ✓</p>` };
  } catch (e) { $('#cityList').innerHTML = '<p class="note">Lỗi mạng, thử lại nhé.</p>' }
}
async function saveSettings() {
  const patch = { display_name: $('#sName').value.trim() || myProfile.display_name, emoji: pickedEmoji || myProfile.emoji, updated_at: new Date().toISOString() };
  if (pickedCity) Object.assign(patch, pickedCity);
  const { data, error } = await sb.from('profiles').update(patch).eq('id', me.id).select().single();
  if (error) { toast(errMsg(error)); return }
  myProfile = data; store.set('name', myProfile.display_name || '');
  const st = $('#sStart').value || null;
  if (st !== (couple.started_on || null)) { const { error: e2 } = await sb.from('couple').update({ started_on: st }).eq('id', 1); if (!e2) { couple.started_on = st; send('couple') } }
  send('status'); renderProfiles(); renderDays(); $('#mSettings').classList.remove('on'); toast('Đã lưu');
}

/* ---------- boot ---------- */
route();
