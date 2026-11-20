/* Thẻ thành viên chung của hai đứa: mỗi hạng là một nguyên tố, càng lên càng hiếm trong bảng tuần hoàn.
   [điểm tích luỹ, tên hạng, biểu tượng, % giảm, chi tiết] · 10.000đ = 1 điểm × hệ số */
const T = (pts, name, ico, off, o) => [pts, name, ico, off, o];
export const TIERS = [
  T(0, 'Thành viên', '🤍', 0, { sym: 'H', num: 1, el: 'Hydro', mass: '1.008', col: '#e3f2fd', col2: '#bbdefb', mult: 1, daily: 0, gift: 0, fact: 'Nguyên tố phổ biến nhất vũ trụ, ai cũng bắt đầu từ đây' }),
  T(1000000, 'Bạc', '🥈', 0, { sym: 'Ag', num: 47, el: 'Bạc', mass: '107.87', col: '#eceff1', col2: '#b0bec5', mult: 1, daily: 0, gift: 0, fact: 'Dẫn điện tốt nhất trong mọi kim loại' }),
  T(3000000, 'Vàng', '🥇', 3, { sym: 'Au', num: 79, el: 'Vàng', mass: '196.97', col: '#fff3c4', col2: '#ffca28', mult: 1, daily: 0, gift: 0, fact: 'Không bao giờ gỉ, như tình yêu hai đứa' }),
  T(8000000, 'Kim cương', '💎', 5, { sym: 'C', num: 6, el: 'Cacbon', mass: '12.011', col: '#e1f5fe', col2: '#4fc3f7', mult: 1.2, daily: 50000, gift: 0, fact: 'Cacbon nén dưới áp suất cực lớn thành kim cương' }),
  T(20000000, 'Bạch kim', '🤍', 6, { sym: 'Pt', num: 78, el: 'Platin', mass: '195.08', col: '#f5f5f5', col2: '#9e9e9e', mult: 1.3, daily: 100000, gift: 100000, fact: 'Hiếm hơn vàng khoảng 30 lần' }),
  T(40000000, 'Palladi', '⚪', 7, { sym: 'Pd', num: 46, el: 'Palladi', mass: '106.42', col: '#eceff1', col2: '#78909c', mult: 1.4, daily: 150000, gift: 200000, fact: 'Hút được lượng hiđro gấp 900 lần thể tích của nó' }),
  T(70000000, 'Rhodi', '🪩', 8, { sym: 'Rh', num: 45, el: 'Rhodi', mass: '102.91', col: '#f3e5f5', col2: '#ab47bc', mult: 1.5, daily: 200000, gift: 300000, fact: 'Từng là kim loại quý đắt nhất thế giới' }),
  T(120000000, 'Osmi', '🔷', 9, { sym: 'Os', num: 76, el: 'Osmi', mass: '190.23', col: '#e8eaf6', col2: '#3949ab', mult: 1.6, daily: 300000, gift: 500000, fact: 'Nguyên tố đặc nhất trong tự nhiên, ánh xanh lam' }),
  T(200000000, 'Iridi', '🌈', 10, { sym: 'Ir', num: 77, el: 'Iridi', mass: '192.22', col: '#fce4ec', col2: '#8e24aa', mult: 1.8, daily: 400000, gift: 800000, fact: 'Rơi xuống Trái Đất cùng thiên thạch diệt khủng long' }),
  T(320000000, 'Rheni', '⚙️', 12, { sym: 'Re', num: 75, el: 'Rheni', mass: '186.21', col: '#eceff1', col2: '#455a64', mult: 2, daily: 500000, gift: 1200000, fact: 'Nguyên tố bền cuối cùng loài người tìm ra' }),
  T(500000000, 'Poloni', '☢️', 14, { sym: 'Po', num: 84, el: 'Poloni', mass: '(209)', col: '#e0f7e9', col2: '#00c853', mult: 2.2, daily: 700000, gift: 2000000, fact: 'Do Marie Curie tìm ra, phát sáng xanh trong bóng tối' }),
  T(800000000, 'Actini', '✴️', 15, { sym: 'Ac', num: 89, el: 'Actini', mass: '(227)', col: '#e0f7fa', col2: '#00acc1', mult: 2.4, daily: 1000000, gift: 3000000, fact: 'Tên từ tiếng Hy Lạp "aktis": tia sáng' }),
  T(1250000000, 'Californi', '🌟', 17, { sym: 'Cf', num: 98, el: 'Californi', mass: '(251)', col: '#fff3e0', col2: '#ff6d00', mult: 2.6, daily: 1500000, gift: 5000000, fact: 'Khoảng 27 triệu USD một gram, đắt nhất hành tinh' }),
  T(2000000000, 'Franxi', '🔥', 20, { sym: 'Fr', num: 87, el: 'Franxi', mass: '(223)', col: '#fff8e1', col2: '#ff3d00', mult: 3, daily: 2000000, gift: 8000000, fact: 'Cả vỏ Trái Đất chỉ có khoảng 30 gram' }),
  T(3200000000, 'Astatin', '🌌', 22, { sym: 'At', num: 85, el: 'Astatin', mass: '(210)', col: '#ede7f6', col2: '#651fff', mult: 3.5, daily: 3000000, gift: 15000000, fact: 'Nguyên tố tự nhiên hiếm nhất: dưới 1 gram trên cả Trái Đất' }),
  T(5000000000, 'Oganesson', '♾️', 25, { sym: 'Og', num: 118, el: 'Oganesson', mass: '(294)', col: '#fff', col2: '#ff4081', mult: 5, daily: 5000000, gift: 50000000, rainbow: 1, fact: 'Cuối bảng tuần hoàn, cả lịch sử chỉ vài nguyên tử từng tồn tại' }),
];
// quyền lợi từng hạng (để hiển thị)
export function perksOf(i) {
  const [, , , off, o] = TIERS[i], P = [];
  if (off) P.push(`🏷️ Giảm ${off}% mọi hoá đơn siêu thị, TTTM, nhà hàng`);
  if (o.mult > 1) P.push(`✖️ Điểm thưởng ×${o.mult}`);
  if (o.daily) P.push(`💰 Ví chung được nạp thêm ${o.daily.toLocaleString('vi-VN')}đ mỗi ngày`);
  if (o.gift) P.push(`🎁 Quà tặng kèm mỗi lần thanh toán (trị giá tới ${o.gift.toLocaleString('vi-VN')}đ)`);
  if (i >= 4) P.push('✨ Hào quang nguyên tố quanh nhân vật, ký hiệu nguyên tố cạnh tên');
  if (i >= 6) P.push('🙇 Nhân viên & phục vụ cúi chào đúng tên hạng thẻ');
  if (i >= 7) P.push('⚛️ Electron bay quanh người (càng lên hạng càng nhiều)');
  if (i >= 8) P.push('🥂 Nhà hàng tặng champagne mỗi bữa');
  if (i >= 10) P.push('☢️ Phát sáng phóng xạ (vô hại, chỉ đẹp thôi)');
  if (i >= 12) P.push('🚁 Thảm đỏ trải dưới chân khi đi TTTM');
  if (i >= 15) P.push('🌈 Hào quang cầu vồng, cả bảng tuần hoàn nghiêng mình');
  return P;
}
