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
  // máy tính: ctrl + lăn chuột / ctrl + phím +/-
  document.addEventListener('wheel', function (e) { if (e.ctrlKey) e.preventDefault(); }, { passive: false });
  document.addEventListener('keydown', function (e) { if ((e.ctrlKey || e.metaKey) && /^(\+|=|-|_|0)$/.test(e.key)) e.preventDefault(); });

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
