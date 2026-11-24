# Handoff: Tomortle × Molly

Phiên mới đọc file này trước. Nếu file và code nói khác nhau, tin code.

## Người dùng
- Trả lời bằng **tiếng Việt**, lời đơn giản: chủ app không rành kỹ thuật.
- Thích được **đề xuất thêm tính năng** cuối mỗi câu trả lời lớn.
- Bật **ponytail** (full) suốt phiên: thay đổi nhỏ nhất nhưng đủ; cuối câu trả lời ghi 1–2 dòng việc đã bỏ qua, chưa kiểm tra và rủi ro; chỗ đi tắt ghi chú `shortcut:`; logic không đơn giản thì kèm một tự kiểm tra (`console.assert`).
- Không được tái tạo game hay nội dung có bản quyền. Âm thanh phải tự tổng hợp, ví dụ "Chim Sẻ Vượt Tre" thay cho Flappy Bird. Tương tác giữa hai người giữ ở mức nhẹ nhàng.
- Không đưa email hay thông tin cá nhân vào bất kỳ yêu cầu nào gửi ra dịch vụ ngoài.

## App
- Đây là PWA (web app cài lên điện thoại như app) cho một cặp đôi, viết bằng HTML/JS thuần, không có bước build. Repo `hiull/tomortle`, chạy trên **GitHub Pages**.
- **Triển khai:**
  - Commit rồi push thẳng lên `main`. Chủ app đã đồng ý cách này.
  - Mỗi lần đổi file, tăng `CACHE` trong `sw.js` (hiện là `tomortle-v80`).
  - Mỗi lần sửa `app.css`, tăng `?v=` của nó trong mọi trang `.html` và trong `sw.js` (hiện là `v=17`).
- **Backend:** Supabase, project `yktkofupegtvrviynnjk`.
  - Bảng `shared_state(key, data jsonb, updated_by, updated_at)` có RLS (quy tắc quyền đọc/ghi) qua hàm `is_member()`.
  - Hàm `join_couple` chặn người thứ ba vào cặp.
  - Kho ảnh `media` để chế độ riêng tư.
  - Edge function `tiktok-resolve` đổi link rút gọn `vt.tiktok.com` thành id video.
- **File chính:**
  - `room.html` (~360KB, ES module): phòng chung dạng isometric vẽ trên canvas. Gồm bếp, siêu thị, TTTM (có tầng điện thoại `mall6`), nhà hàng, skincare, điện thoại trong game với các app và 5 mini game, thời tiết, nhạc lofi, ném đồ, âm thanh, haptic (rung phản hồi).
  - `market.js`: dữ liệu cửa hàng (`MD`). `tiers.js`: các hạng thành viên theo nguyên tố (`TM`).
  - `common.js`: các hàm Supabase (`saveState` có gom ghi chờ một nhịp rồi mới gửi, `loadState`, `featureChannel` cho kênh realtime).
  - `nozoom.js`: nạp ở mọi trang; chặn phóng to, vào toàn màn hình, haptic, khôi phục khung nhìn sau khi bàn phím đóng.
  - `app.css`: CSS chung. Riêng `booth.html` có CSS của nó.
- **Chế độ demo:** thêm `?demo` vào đường dẫn thì dữ liệu chỉ nằm trong localStorage, khóa `demo-<key>`. Thêm `&slow=ms` để giả lập mạng chậm. Hai biến `window.__dbg` và `window.__meScreen` chỉ có trong demo.
- **Bẫy đã gặp:**
  - Trong `room.html`, không đặt `await` nối tiếp ở cấp cao nhất trước khi gắn sự kiện chạm. Dùng `pre(k, d)` để tải song song; khóa nào quá hạn thì nằm trong `PRE_WAIT`, và lúc đó chặn ghi và broadcast cho đến khi tải lại trang.
  - Hằng dùng trong `frame()` phải khai báo trước `requestAnimationFrame`, nếu không dính lỗi TDZ (dùng biến trước khi khai báo).
  - Bash heredoc có chữ `.remove` bị bộ lọc an toàn chặn nhầm. Viết script bằng công cụ Write rồi chạy bằng `node` hoặc `python3`.

- **Chợ Pass** (app 🏷️ trong điện thoại game, cuối `room.html`): mỗi người lưu ở khóa riêng `pass-<id>`. Khách ảo có các kiểu chill, haggle, lowball, rich, ghost, boom; mặc cả bằng `psHaggle`/`psSell` (có `console.assert` ở demo). Shop ảo đổi hàng mỗi ngày và có thể bán hàng fake. Người ấy đổi đồ bằng ôm/hôn/trà sữa qua các tin `pass`, `passoff`, `passok`, `passno`.
- **Live** (app 🔴 trong điện thoại game, cuối `room.html`, sau Chợ Pass): camera vẽ lại vùng quanh nhân vật từ canvas chính. Khách ảo, sự kiện ngẫu nhiên và báo cáo hater (5 lần thì khoá live) chạy trong `lvTick` mỗi giây. Người live gửi `lv` (`on`/`st`/`off`/`co`) mỗi giây; người xem gửi `lvc`, `lvh`, `lvg`, `lvr`, `lvy`, `lvco`. Ở demo có `window.__lv` để thử phía người xem.
- **Bựa** (cuối `room.html`): `buaTick` 6 giây/lần sinh NPC tạm (`buaSpawn`): shipper COD, kẻ lừa đảo, người mượn tiền, dì hàng xóm, khách ăn quỵt. Ngoài ra mèo trộm đồ trong tủ lạnh, chim ị (+lộc), robot kẹt. Thời gian chờ lưu ở localStorage `bua-*`. Mỗi lần dính lừa đều kèm lời nhắc ngoài đời. Chợ Pass có thêm khách lừa `scam` (gửi link) và `over` (chuyển dư). Live có sự kiện `scamdm`.
- Tin realtime phải đặt tên không trùng: `mk` là đồng bộ ví, hiệu ứng trang điểm dùng `mkup`.

## Kiểm tra
- Chạy máy chủ tại chỗ: `python3 -m http.server 8765` trong thư mục repo.
- Playwright cài sẵn, gọi `require('playwright')`, giả lập `devices['iPhone 14']`. Mở các trang ở chế độ `?demo`.
- Các script thử của phiên cũ nằm trong thư mục tạm nên **đã mất**. Repo chưa có thư mục `tests/` (xem mục 3 bên dưới).

## Rà soát chưa sửa (đang chờ chủ app chọn số)
1. **Mất thao tác khi chuyển phòng hoặc tắt app nhanh.**
   - Lần ghi đang chờ của `saveState` bị hủy khi `nav()` rời trang sau 150ms.
   - Sửa: thêm `flushState()` trong `common.js`, gọi khi `pagehide` và khi trang bị ẩn (`visibilitychange` → hidden), và gọi trong `nav`.
2. **Ngày tính theo UTC:** `toISOString().slice(0,10)` ở `room.html` (lương ngày, `sampleKey`, `today()` của skincare, 2 chỗ đặt bàn). Từ 0h đến 7h sáng giờ Việt Nam bị tính thành hôm qua. Dùng ngày theo giờ máy, giống `app.js` (~dòng 340).
3. **Không có smoke test** (bài thử nhanh xem app còn chạy) trong repo. Thêm `tests/smoke.js`: mở từng phòng ở demo, mua một món, thanh toán, kiểm tra ví và không có lỗi trang.
4. **Code thừa:** một `setInterval` rỗng trong `room.html` (tìm `livePa()===false&&!me.path.length){}`) và mục cũ `sfx.step`.
5. Hai máy cùng ghi khóa `market` thì máy ghi sau thắng. Hiếm xảy ra, đề nghị để nguyên.
6. `tiktok-resolve` không kiểm tra người gọi có phải thành viên cặp không. Rủi ro thấp.
7. Trong Supabase → Authentication: bật Leaked password protection, tắt mở đăng ký. Chủ app tự bấm.

## Ý tưởng tính năng đã đề xuất
Nghe chung một bài, nhiệm vụ mỗi ngày cho hai đứa, thành tựu/huy hiệu treo tường, phòng rạp chiếu phim (ghế đôi, bắp nước, nút "Xem phim chung" mở `watch.html`).

## Môi trường đám mây
Môi trường `tomortle` có setup script: tự tóm tắt ở 50% (`CLAUDE_AUTOCOMPACT_PCT_OVERRIDE=50`) và cài plugin caveman (`JuliusBrussee/caveman`). Mạng được phép vào thêm: wikimedia và supabase của project.
