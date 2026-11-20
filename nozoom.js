/* Toàn màn hình + chặn phóng to/thu nhỏ (pinch, chạm đúp, ctrl+lăn chuột, tự zoom khi gõ chữ trên iPhone) */
(function () {
  var st = document.createElement('style');
  st.textContent = 'html,body{touch-action:manipulation;-webkit-text-size-adjust:100%;text-size-adjust:100%;overscroll-behavior:none}' +
    'input,textarea,select{font-size:16px!important}' +
    '.fs-hint{position:fixed;left:12px;right:12px;bottom:calc(14px + env(safe-area-inset-bottom));z-index:99999;background:#3a2430;color:#fff;border-radius:16px;padding:12px 40px 12px 14px;font:600 13px/1.45 "Be Vietnam Pro",system-ui,sans-serif;box-shadow:0 10px 30px rgba(0,0,0,.3)}' +
    '.fs-hint button{position:absolute;top:8px;right:8px;border:0;background:rgba(255,255,255,.2);color:#fff;border-radius:50%;width:26px;height:26px;font-size:15px}';
  document.head.appendChild(st);
  var stop = function (e) { e.preventDefault(); };
  // iPhone/iPad: Safari bỏ qua user-scalable=no nên chặn cử chỉ trực tiếp
  ['gesturestart', 'gesturechange', 'gestureend'].forEach(function (t) { document.addEventListener(t, stop, { passive: false }); });
  // hai ngón tay trên màn hình → không cho trình duyệt zoom (sự kiện pointer vẫn tới app để kéo/xoay sticker)
  document.addEventListener('touchmove', function (e) { if (e.touches && e.touches.length > 1) e.preventDefault(); }, { passive: false });
  // chạm đúp: đã chặn bằng touch-action:manipulation (không chặn sự kiện để bấm nhanh 2 lần vẫn ăn)
  // trang không cuộn (vd phòng chung): sau khi bàn phím iPhone tắt, kéo màn hình về đúng chỗ cũ để hàng nút trên cùng bấm được
  var fixedPage = function () { try { return getComputedStyle(document.documentElement).overflowY === 'hidden' || getComputedStyle(document.body).position === 'fixed'; } catch (e) { return false; } };
  var resetView = function () { if (!fixedPage()) return; if (window.scrollY || document.documentElement.scrollTop || document.body.scrollTop) { window.scrollTo(0, 0); document.documentElement.scrollTop = 0; document.body.scrollTop = 0; } };
  document.addEventListener('focusout', function () { setTimeout(resetView, 60); setTimeout(resetView, 350); }, true);
  if (window.visualViewport) visualViewport.addEventListener('resize', function () { if (visualViewport.height > innerHeight * 0.85) setTimeout(resetView, 80); });
  window.addEventListener('orientationchange', function () { setTimeout(resetView, 300); });
  window.addEventListener('pageshow', resetView);
  // máy tính: ctrl + lăn chuột / ctrl + phím +/-
  document.addEventListener('wheel', function (e) { if (e.ctrlKey) e.preventDefault(); }, { passive: false });
  document.addEventListener('keydown', function (e) { if ((e.ctrlKey || e.metaKey) && /^(\+|=|-|_|0)$/.test(e.key)) e.preventDefault(); });

  // 📳 Rung phản hồi: Android dùng bộ rung thật; iPhone (iOS 18+) dùng công tắc hệ thống ẩn để tạo tiếng "tách" rung nhẹ
  var hsw = null, hlb = null;
  function iosTick() {
    try {
      if (!hlb) { hlb = document.createElement('label'); hlb.setAttribute('aria-hidden', 'true'); hlb.style.cssText = 'position:fixed;left:-99px;top:0;width:1px;height:1px;opacity:0;pointer-events:none;overflow:hidden';
        hsw = document.createElement('input'); hsw.type = 'checkbox'; hsw.setAttribute('switch', ''); hsw.tabIndex = -1; hlb.appendChild(hsw); (document.body || document.documentElement).appendChild(hlb); }
      hlb.click();
    } catch (e) {}
  }
  window.haptic = function (p) {
    try { if (localStorage.getItem('haptic') === 'off') return; } catch (e) {}
    if (p == null) p = 10;
    try { if (navigator.vibrate) { navigator.vibrate(p); return; } } catch (e) {}
    // iPhone: một "tách" cho mỗi nhịp rung trong mẫu
    var arr = Array.isArray(p) ? p : [p], t = 0;
    for (var i = 0; i < arr.length; i += 2) { (function (d) { if (d <= 0) iosTick(); else setTimeout(iosTick, d); })(t); t += (arr[i] || 0) + (arr[i + 1] || 0); if (i >= 6) break; }
  };
  // bấm nút nào cũng có rung nhẹ như app thật
  document.addEventListener('click', function (e) { var b = e.target && e.target.closest && e.target.closest('button,.btn,[role=button],.chips button,label.switch'); if (b && !b.disabled) window.haptic(6); }, true);
  // toàn màn hình
  var standalone = (window.matchMedia && (matchMedia('(display-mode: fullscreen)').matches || matchMedia('(display-mode: standalone)').matches)) || navigator.standalone;
  if (standalone) return;
  var ios = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  var de = document.documentElement, req = de.requestFullscreen || de.webkitRequestFullscreen;
  var isTouch = navigator.maxTouchPoints > 0;
  if (req && !ios && isTouch) {
    // Android: chạm lần đầu vào trang là vào toàn màn hình
    var go = function () {
      if (document.fullscreenElement || document.webkitFullscreenElement) return;
      try { var p = req.call(de, { navigationUI: 'hide' }); if (p && p.catch) p.catch(function () {}); } catch (e) {}
    };
    document.addEventListener('pointerup', go, { capture: true });
    return;
  }
  if (ios) {
    // iPhone không cho web tự vào toàn màn hình: hướng dẫn thêm vào Màn hình chính (mở như app, không thanh địa chỉ)
    try { if (localStorage.getItem('fsHint')) return; } catch (e) { return; }
    window.addEventListener('load', function () {
      var d = document.createElement('div'); d.className = 'fs-hint';
      d.innerHTML = '📱 Mở toàn màn hình như app: bấm nút <b>Chia sẻ</b> <span style="font-size:15px">⎋</span> ở thanh Safari → <b>Thêm vào MH chính</b>, rồi mở Tomortle từ biểu tượng ngoài màn hình nhé.<button aria-label="Đóng">×</button>';
      d.querySelector('button').onclick = function () { d.remove(); try { localStorage.setItem('fsHint', '1'); } catch (e) {} };
      document.body.appendChild(d);
    });
  }
})();
