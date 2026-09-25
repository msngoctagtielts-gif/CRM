/**
 * Sinh file PDF "Báo cáo học tập và học phí" gửi Quý phụ huynh.
 *
 * BỐ CỤC LẤY CHUẨN TỪ file mẫu cô Ngọc gửi ngày 25/09/2026:
 *   MNEE_GiaDinh_Luan-Tan-MsLinh_BaoCaoHocTap_HocPhi.pdf
 * Giữ nguyên thứ tự mục, cách đánh số 01/02/03, dải navy đầu trang, gạch vàng,
 * thẻ từng buổi có viền trái burgundy, hộp bài tập viền đứt màu vàng, và nút
 * video màu navy.
 *
 * CHẠY:
 *   node --experimental-strip-types scripts/xuat-pdf-bao-cao.mjs <file-json> <thư-mục-ra>
 *
 * Dựng PDF bằng Chromium sẵn có (--print-to-pdf) thay vì thư viện sinh PDF:
 * xem lý do ở phần BẢN IN trong src/app/globals.css.
 */
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { resolve } from 'node:path'
import { locGhiChuNoiBo, boMocThoiGian, vietHoaDau } from '../src/lib/bao-cao-in.ts'

const [fileJson, thuMucRa] = process.argv.slice(2)
const CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'

/* ---------------------------------------------------------------- dữ liệu */
const vanBan = JSON.parse(readFileSync(fileJson, 'utf8')).result
const rows = JSON.parse(
  vanBan.slice(vanBan.indexOf('[{"du_lieu"'), vanBan.lastIndexOf('}]') + 2),
)[0].du_lieu

/* ------------------------------------------------------------- tiện ích */
const esc = (s) =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const ngayVN = (d) => {
  const [y, m, dd] = String(d).slice(0, 10).split('-')
  return `${dd}/${m}/${y}`
}
const tien = (n) =>
  Number(n ?? 0).toLocaleString('vi-VN', { maximumFractionDigits: 0 }) + ' đ'

const mocGiay = (moc) => {
  if (!/^\d{1,2}(:\d{2}){1,2}$/.test(String(moc ?? '').trim())) return null
  const p = String(moc).trim().split(':').map(Number)
  return p.length === 3 ? p[0] * 3600 + p[1] * 60 + p[2] : p[0] * 60 + p[1]
}
const linkVideo = (url, moc) => {
  const m = /(?:youtu\.be\/|v=)([A-Za-z0-9_-]{11})/.exec(url ?? '')
  if (!m) return url
  const s = mocGiay(moc)
  return s ? `https://youtu.be/${m[1]}?t=${s}` : `https://youtu.be/${m[1]}`
}

/**
 * Tách văn bản thành các gạch đầu dòng.
 *
 * Hai định dạng cùng tồn tại trong hệ thống:
 *   - Mục đánh số "1." / "2." — kiểu trợ lý viết khi đọc transcript.
 *   - Một dòng dài, các ý ngăn bằng " · " — kiểu cô Phương nhập từ sheet.
 * Không tách kiểu thứ hai thì cả đoạn dồn vào một gạch đầu dòng khổng lồ,
 * đọc trên giấy rất nặng.
 */
function thanhBullet(t) {
  const s = String(t ?? '').trim()
  if (s === '') return []
  const theoDong = s
    .split(/\n(?=\s*(?:\d+[.)]|[-•*])\s)/)
    .map((d) => d.replace(/^\s*(?:\d+[.)]|[-•*])\s*/, '').trim())
    .filter(Boolean)
  if (theoDong.length > 1) return theoDong

  // Chỉ một khối: nếu dài và có dấu chấm giữa thì tách theo dấu đó
  const mot = theoDong[0] ?? s
  if (mot.length > 160 && mot.includes(' · ')) {
    return mot.split(' · ').map((x) => x.trim()).filter(Boolean)
  }
  return [mot]
}
const dsBullet = (t) => {
  const b = thanhBullet(t)
  return b.length === 0 ? '' :
    `<ul>${b.map((x) => `<li>${esc(vietHoaDau(x)).replace(/\n/g, '<br>')}</li>`).join('')}</ul>`
}
const doan = (t) =>
  String(t ?? '')
    .split(/\n{2,}/)
    .map((d) => d.trim())
    .filter(Boolean)
    .map((d) => `<p>${esc(d).replace(/\n/g, '<br>')}</p>`)
    .join('')

/* Nhãn mức tiếp thu và thái độ — chỉ hiện khi hệ thống thật sự có dữ liệu */
const SAO = { excellent: '★★★★★', good: '★★★★', average: '★★★', poor: '★★' }
const CHU_TIEP_THU = { excellent: 'Xuất sắc', good: 'Tốt', average: 'Khá', poor: 'Cần cố gắng' }
const CHU_THAI_DO = {
  excellent: 'Rất tích cực', good: 'Tích cực', average: 'Hợp tác', poor: 'Cần nhắc nhở',
}
const nhanDanhGia = (r) => {
  const a = r.muc_tiep_thu ? `<span class="the the-sao">${SAO[r.muc_tiep_thu] ?? ''} ${esc(CHU_TIEP_THU[r.muc_tiep_thu] ?? r.muc_tiep_thu)}</span>` : ''
  const b = r.thai_do ? `<span class="the the-td">${esc(CHU_THAI_DO[r.thai_do] ?? r.thai_do)}</span>` : ''
  return a + b
}

const laBuoiTang = (r) => r.tinh_phi === false

/** PRE_A1 -> Pre-A1, A2_PLUS -> A2+ — mã trong CSDL không hợp để in cho phụ huynh. */
const chuTrinhDo = (ma) =>
  !ma ? null : String(ma).replace(/_PLUS$/, '+').replace(/^PRE_/, 'Pre-').replace(/_/g, ' ')

/* ------------------------------------------------------------------- CSS */
const CSS = `
@page { size: A4; margin: 13mm 14mm 15mm 14mm; }
* { box-sizing: border-box; }
body { margin:0; font-family:'DejaVu Sans',sans-serif; font-size:9.5pt;
       line-height:1.55; color:#1d3559; }
h1,h2,h3,.serif { font-family:'Liberation Serif','DejaVu Serif',serif; }

/* dải đầu trang */
.bar { background:#13294b; border-top:3px solid #c8a24a; color:#fff;
       padding:13px 18px; display:flex; justify-content:space-between;
       align-items:center; margin-bottom:20px; }
.bar .ten { font-family:'Liberation Serif',serif; font-size:14pt;
            letter-spacing:.06em; }
.bar .cn { font-size:8.5pt; font-style:italic; color:#e5c87f; }

.eyebrow { text-align:center; font-size:7.5pt; font-weight:700;
           letter-spacing:.18em; color:#7b2d3b; margin:0 0 8px; }
h1 { text-align:center; font-size:22pt; color:#13294b; margin:0; line-height:1.2; }
.sub { text-align:center; font-size:9.5pt; color:#456490; margin:6px 0 0; }
.rule-gold { width:70px; height:2px; background:#c8a24a; margin:13px auto 20px; }

/* lưới thông tin 2x2 */
.luoi { display:grid; grid-template-columns:1fr 1fr; border:1px solid #c4d2e4;
        margin-bottom:22px; }
.luoi > div { padding:9px 14px; border-right:1px solid #c4d2e4;
              border-bottom:1px solid #c4d2e4; }
.luoi > div:nth-child(2n) { border-right:none; }
.luoi > div:nth-last-child(-n+2) { border-bottom:none; }
.nhan { font-size:6.8pt; font-weight:700; letter-spacing:.12em;
        text-transform:uppercase; color:#6885ad; }
.gt { font-family:'Liberation Serif',serif; font-size:11pt; color:#13294b;
      margin-top:2px; }

/* tiêu đề mục 01 / 02 / 03 */
.muc-h { display:flex; align-items:baseline; gap:8px; margin:24px 0 9px;
         padding-bottom:6px; border-bottom:1.5px solid #c8a24a; }
.muc-h .so { font-family:'Liberation Serif',serif; font-size:10pt;
             font-weight:700; color:#c8a24a; }
.muc-h .tt { font-family:'Liberation Serif',serif; font-size:13pt;
             font-weight:700; color:#13294b; }

/* bảng */
table { width:100%; border-collapse:collapse; font-size:9pt; }
thead th { background:#13294b; color:#fff; text-align:left; font-weight:700;
           font-size:8pt; padding:7px 10px; }
thead th.p { text-align:right; }
tbody td { padding:6px 10px; border-bottom:1px solid #eef2f7; vertical-align:top; }
tbody td.p { text-align:right; white-space:nowrap; }
tbody tr:nth-child(even) td { background:#f8fafc; }
tr.tong td { background:#f2f5f9 !important; font-weight:700; color:#13294b;
             font-size:9.5pt; border-top:2px solid #c4d2e4; border-bottom:none; }
.bang-hp .dau-bang { background:#13294b; color:#fff; padding:9px 14px;
                     font-family:'Liberation Serif',serif; font-size:11pt; }
.bang-hp table tbody td { border-bottom:1px solid #eef2f7; }
.bang-hp { border:1px solid #c4d2e4; }

/* hộp ghi chú viền vàng bên trái */
.note { border-left:3px solid #c8a24a; background:#f9fafb; padding:9px 14px;
        margin:12px 0 0; font-size:8.5pt; color:#2f4a72; }

/* thẻ từng buổi */
.buoi { border:1px solid #e2e9f2; border-left:3px solid #7b2d3b;
        padding:13px 16px; margin:13px 0 0; page-break-inside:avoid; }
.buoi-h { display:flex; align-items:center; gap:9px; flex-wrap:wrap; }
.buoi-h .n { font-family:'Liberation Serif',serif; font-size:13pt; color:#13294b; }
.the { font-size:7.5pt; font-weight:700; padding:2px 8px; border-radius:11px;
       white-space:nowrap; }
.the-sao { background:#fdfaf1; color:#856630; border:1px solid #f1e0b2; }
.the-td  { background:#f2f8f4; color:#315a40; border:1px solid #cfe6d8; }
.the-tang{ background:#f9f1da; color:#7b2d3b; border:1px solid #e5c87f; }
.chu-de { color:#7b2d3b; font-weight:700; font-size:8.8pt; margin:7px 0 5px; }
.mo-ta { color:#5b7290; font-size:8.6pt; margin:0 0 9px; }
.mo-ta p { margin:0 0 5px; }
.tieu { font-size:7.2pt; font-weight:700; letter-spacing:.11em;
        text-transform:uppercase; margin:10px 0 4px; }
.tieu-m { color:#a9853a; }
.tieu-c { color:#a82e49; }
ul { margin:0; padding-left:17px; }
li { margin:0 0 4px; }
.bt { border:1px dashed #d7b058; background:#fdfbf5; padding:9px 13px;
      margin:11px 0 0; font-size:8.6pt; }
.bt b { color:#7b2d3b; }
.bt pre { font-family:'DejaVu Sans Mono',monospace; font-size:7.8pt;
          white-space:pre-wrap; margin:6px 0 0; color:#2f4a72; }
.vid { margin:11px 0 0; display:flex; align-items:center; gap:9px;
       flex-wrap:wrap; font-size:8.6pt; color:#456490; }
.vid .nut { background:#13294b; color:#fff !important; text-decoration:none;
            font-weight:700; font-size:8.2pt; padding:5px 12px;
            display:inline-block; }
.vid .dc { font-size:7.4pt; color:#8aa0bd; word-break:break-all; }
.trong { color:#8aa0bd; font-style:italic; font-size:8.8pt; margin:6px 0 0; }
.nguyen-van { border-left:2px solid #e2e9f2; padding:2px 0 2px 11px; margin:7px 0 0 3px;
              font-size:8.1pt; color:#7d8fa8; font-style:italic; }

.chan { border-top:1px solid #c4d2e4; margin-top:26px; padding-top:10px;
        font-size:8pt; color:#5b7290; }
.chan p { margin:0 0 3px; }
.ngat { page-break-before:always; }
`

/**
 * Tách khối nguyên văn tiếng Anh của giáo viên ra khỏi phần nhận xét.
 *
 * Các báo cáo tháng 8 của cô Sheba được dịch sang tiếng Việt và giữ nguyên bản
 * gốc ở cuối, mở đầu bằng "— Nguyên văn". Nếu để nguyên trong danh sách gạch
 * đầu dòng thì cả đoạn tiếng Anh bị nhét vào một dấu chấm, đọc rất rối.
 */
function tachNguyenVan(t) {
  const s = String(t ?? '')
  const i = s.search(/\n\s*—\s*Nguyên văn/)
  if (i === -1) return { viet: s, goc: '' }
  return { viet: s.slice(0, i).trim(), goc: s.slice(i).replace(/^\s*—\s*/, '').trim() }
}

/** Cắt câu đầu làm chủ đề; phần còn lại là mô tả diễn biến. */
function tachChuDe(noiDung) {
  const t = String(noiDung ?? '').trim()
  const dongDau = t.split('\n')[0].trim()
  const conLai = t.split('\n').slice(1).join('\n').trim()

  // Bỏ nhãn rồi VIẾT HOA lại: cắt "Chủ đề: " khỏi "Chủ đề: giao tiếp xã hội"
  // để lại một ô bảng mở đầu bằng chữ thường — cô Ngọc bắt lỗi này 25/09.
  const bo = (x) => vietHoaDau(x.replace(/^(Chủ đề|Nội dung|Chu de|Noi dung)\s*:\s*/i, ''))
  if (dongDau.length <= 200) return { chuDe: bo(dongDau), moTa: conLai }

  // Dòng đầu quá dài: cắt ở dấu chấm câu, nếu không có thì ở khoảng trắng —
  // KHÔNG cắt giữa từ, vì phần đuôi rơi xuống mô tả trông như lỗi đánh máy.
  const cat = dongDau.slice(0, 200)
  const dauCau = Math.max(cat.lastIndexOf('. '), cat.lastIndexOf('; '), cat.lastIndexOf(' – '))
  const diem = dauCau > 60 ? dauCau + 1 : Math.max(cat.lastIndexOf(' '), 60)
  return {
    chuDe: bo(dongDau.slice(0, diem).trim().replace(/[.;,]$/, '')),
    moTa: [dongDau.slice(diem).trim(), conLai].filter(Boolean).join('\n\n'),
  }
}

/* ------------------------------------------------- một thẻ buổi học */
function theBuoi(r, k) {
  // Hai lớp lọc cho bản gửi phụ huynh:
  //   1. bỏ đoạn ghi chú nội bộ (lương, nghi vấn giáo viên, chuyện riêng)
  //   2. bỏ mốc thời gian video — cô Ngọc chốt 25/09: không ghi giây phút
  const loc = (t) => boMocThoiGian(locGhiChuNoiBo(t))
  const coND = Boolean(r.lesson_content)
  const tang = laBuoiTang(r)
    ? `<span class="the the-tang">${k === 0 ? 'TẶNG TRẢI NGHIỆM' : 'MIỄN PHÍ'}</span>`
    : ''

  if (!coND) {
    return `<div class="buoi">
      <div class="buoi-h"><span class="n">Buổi ${k + 1} · ${ngayVN(r.ngay)}</span>${tang}</div>
      <p class="trong">Nhận xét chi tiết của buổi này trung tâm sẽ gửi bổ sung.</p>
      ${(r.video ?? []).length === 0 ? '<p class="trong">Buổi này chưa có video lưu lại.</p>' : nutVideo(r)}
    </div>`
  }

  // Chủ đề là CÂU đầu tiên, không phải cả dòng đầu — nhiều báo cáo nhập từ
  // sheet có dòng đầu dài cả đoạn, để nguyên thì dòng chủ đề màu đỏ chiếm
  // bốn dòng và mất tác dụng dẫn mắt.
  const { chuDe, moTa } = tachChuDe(loc(r.lesson_content))

  const bt = r.bai_tap
  const khoiBT = !bt ? '' : `<div class="bt"><b>Bài tập về nhà:</b> ${esc(bt.title)}${
    bt.description ? ' — ' + esc(loc(bt.description).replace(/\n+/g, ' ').slice(0, 900)) : ''
  }${bt.due_date ? ` <i>(hạn ${ngayVN(bt.due_date)})</i>` : ''}${
    bt.sentence_patterns ? `<pre>${esc(bt.sentence_patterns)}</pre>` : ''
  }</div>`

  return `<div class="buoi">
    <div class="buoi-h"><span class="n">Buổi ${k + 1} · ${ngayVN(r.ngay)}</span>${nhanDanhGia(r)}${tang}</div>
    <p class="chu-de">${esc(chuDe)}</p>
    ${moTa ? `<div class="mo-ta">${doan(moTa)}</div>` : ''}
    ${r.student_quote ? `<div class="tieu tieu-m">Câu học viên nói được</div><p style="font-style:italic;margin:0">${esc(boMocThoiGian(r.student_quote))}</p>` : ''}
    ${khoiNhanXet('Điểm mạnh', 'tieu-m', loc(r.strengths))}
    ${khoiNhanXet('Cần cải thiện', 'tieu-c', loc(r.improvements))}
    ${khoiBT}
    ${nutVideo(r)}
  </div>`
}

/** Một khối nhận xét: tiêu đề + gạch đầu dòng + (nếu có) nguyên văn của giáo viên. */
function khoiNhanXet(tieuDe, lop, text) {
  const { viet, goc } = tachNguyenVan(text)
  const bullets = dsBullet(viet)
  if (!bullets && !goc) return ''
  return `<div class="tieu ${lop}">${tieuDe}</div>${bullets}` +
    (goc ? `<div class="nguyen-van">${esc(goc).replace(/\n/g, '<br>')}</div>` : '')
}

function nutVideo(r) {
  const vids = r.video ?? []
  if (vids.length === 0) return ''
  const nut = vids.map((u, i) => {
    const href = linkVideo(u, i === 0 ? r.video_timestamp : null)
    const ten = vids.length > 1 ? `▶ Phần ${i + 1}` : '▶ Xem lại buổi học'
    return `<a class="nut" href="${esc(href)}">${ten}</a><span class="dc">${esc(href)}</span>`
  }).join(' ')
  return `<div class="vid"><span>Video buổi học</span>${nut}</div>`
}

/* --------------------------------------------- toàn bộ báo cáo một học viên */
function baoCaoHocVien(hv, ds) {
  const d0 = ds[0]
  const tinhPhi = ds.filter((r) => r.tinh_phi !== false)
  const donGia = Number(d0.don_gia ?? 0)
  const tongTien = tinhPhi.length * donGia
  const soTang = ds.length - tinhPhi.length
  const gv = [...new Set(ds.map((r) => r.gv).filter(Boolean))].join(', ')
  const tuNgay = ngayVN(ds[0].ngay)
  const denNgay = ngayVN(ds[ds.length - 1].ngay)

  const hangBuoi = ds.map((r, k) => {
    // Không có nội dung thì nói thẳng vì sao, đừng hứa suông. Buổi không có
    // bản ghi thì không ai tổng hợp lại được nội dung — viết "sẽ được cập nhật"
    // là hứa một việc không làm được.
    const coVideoTam = Array.isArray(r.video) && r.video.length > 0
    let cd = r.lesson_content
      ? tachChuDe(boMocThoiGian(locGhiChuNoiBo(r.lesson_content))).chuDe
      : coVideoTam
        ? 'Nội dung đang được tổng hợp từ bản ghi buổi học'
        : 'Buổi học đã diễn ra; không có bản ghi nên trung tâm chưa tổng hợp lại được nội dung'
    // Cắt ở RANH GIỚI TỪ, không cắt giữa chừng. "Nghe hội thoại Steve – Emm…"
    // đọc như lỗi đánh máy; cắt ở khoảng trắng gần nhất thì vẫn gọn mà sạch.
    if (cd.length > 105) {
      const tho = cd.slice(0, 105)
      const khoangTrang = tho.lastIndexOf(' ')
      cd = (khoangTrang > 70 ? tho.slice(0, khoangTrang) : tho)
        .replace(/[\s,;:–—-]+$/, '') + '…'
    }
    const hp = r.tinh_phi === false
      ? `<span style="color:#a9853a;font-weight:700">Được tặng</span>`
      : tien(donGia)
    // Cột bằng chứng: cô Ngọc chốt 25/09 — học phí căn cứ vào video hoặc link.
    // Buổi nào không có bản ghi thì nói thẳng là chưa có, kèm lý do nếu biết.
    const coVideo = Array.isArray(r.video) && r.video.length > 0
    const bc = coVideo
      ? `<span style="color:#3d6f4f;font-weight:700">Có bản ghi</span>`
      : `<span style="color:#7b2d3b">${esc(r.ly_do_khong_video ?? 'Chưa có bản ghi')}</span>`
    return `<tr><td class="p">${k + 1}</td><td>${ngayVN(r.ngay)}</td>
            <td>${esc(cd)}</td><td class="p">${bc}</td><td class="p">${hp}</td></tr>`
  }).join('')

  const gt = String(d0.ghi_chu_hv ?? '')
    .split(/\n{2,}/)
    .find((x) => x.trim().startsWith('QUÀ TẶNG'))
  const hopTang = gt
    ? `<div class="note"><b>Quà tặng của trung tâm:</b> ${esc(
        gt.replace(/^QUÀ TẶNG:\s*/, '').split('Hai buổi này chưa')[0].trim(),
      )}</div>`
    : ''

  return `
<div class="bar"><span class="ten">MS.NGỌC ELITE ENGLISH</span>
     <span class="cn">"Thấu hiểu để dẫn lối"</span></div>

<p class="eyebrow">BÁO CÁO HỌC TẬP VÀ HỌC PHÍ · ${tuNgay} – ${denNgay}</p>
<h1>${esc(hv)}</h1>
<p class="sub">${esc(d0.ten_lop ?? d0.class_code)}${d0.trinh_do ? ' · ' + esc(chuTrinhDo(d0.trinh_do)) : ''}</p>
<div class="rule-gold"></div>

<div class="luoi">
  <div><div class="nhan">Giáo viên phụ trách</div><div class="gt">${esc(gv || '—')}</div></div>
  <div><div class="nhan">Trình độ</div><div class="gt">${esc(chuTrinhDo(d0.trinh_do) ?? 'Đang đánh giá')}</div></div>
  <div><div class="nhan">Kỳ báo cáo</div><div class="gt">${tuNgay} – ${denNgay}</div></div>
  <div><div class="nhan">Số buổi đã học</div><div class="gt">${ds.length} buổi${soTang ? ` · ${soTang} buổi được tặng` : ''}</div></div>
</div>

<div class="muc-h"><span class="so">01</span><span class="tt">Học phí kỳ này</span></div>
<div class="bang-hp">
  <div class="dau-bang">Bảng tính học phí</div>
  <table><tbody>
    <tr><td>Học phí mỗi buổi ${d0.phut} phút</td><td class="p">${tien(donGia)}</td></tr>
    <tr><td>Số buổi có tính phí</td><td class="p">${tinhPhi.length} buổi</td></tr>
    ${soTang ? `<tr><td>Số buổi được trung tâm tặng</td><td class="p" style="color:#a9853a;font-weight:700">${soTang} buổi · 0 đ</td></tr>` : ''}
    <tr class="tong"><td>TỔNG HỌC PHÍ KỲ NÀY</td><td class="p">${tien(tongTien)}</td></tr>
  </tbody></table>
</div>
<div class="note">Học phí chỉ tính trên số buổi thực học; buổi nghỉ hoặc hoãn lịch không tính phí. Buổi đầu tiên của khoá là buổi trung tâm tặng trải nghiệm, không tính phí.</div>
${hopTang}

<div class="muc-h"><span class="so">02</span><span class="tt">Danh sách buổi học</span></div>
<table><thead><tr><th class="p" style="width:34px">Buổi</th><th style="width:76px">Ngày học</th>
  <th>Nội dung</th><th class="p" style="width:82px">Bằng chứng</th>
  <th class="p" style="width:82px">Học phí</th></tr></thead>
  <tbody>${hangBuoi}
    <tr class="tong"><td class="p">${ds.length}</td><td colspan="3">Tổng cộng</td>
        <td class="p">${tien(tongTien)}</td></tr></tbody></table>
<div class="note">Cột <b>Bằng chứng</b> cho biết buổi học đó có bản ghi hình lưu lại hay không.
Trung tâm chỉ tính học phí trên những buổi đối chiếu được với bản ghi; buổi nào chưa có bản ghi,
trung tâm ghi rõ lý do để Quý phụ huynh cùng nắm.</div>

<div class="muc-h"><span class="so">03</span><span class="tt">Nhận xét chi tiết từng buổi</span></div>
${ds.map(theBuoi).join('')}

<footer class="chan">
  <p>Ms.Ngọc Elite English · "Thấu hiểu để dẫn lối" · Báo cáo lập ngày ${ngayVN(new Date().toISOString())}.</p>
  <p>Mọi thắc mắc về nội dung học hoặc học phí, kính mời Quý phụ huynh và học viên liên hệ trực tiếp với trung tâm.</p>
</footer>`
}

/* ------------------------------------------------------------- xuất file */
mkdirSync(thuMucRa, { recursive: true })
const theoHV = new Map()
for (const r of rows) {
  if (!theoHV.has(r.hv)) theoHV.set(r.hv, [])
  theoHV.get(r.hv).push(r)
}
const khongDau = (s) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd').replace(/[^A-Za-z0-9]+/g, '_')

for (const [hv, ds] of theoHV) {
  ds.sort((a, b) => String(a.ngay).localeCompare(String(b.ngay)))
  const html = `<!doctype html><html lang="vi"><head><meta charset="utf-8">
<title>Báo cáo học tập — ${esc(hv)}</title><style>${CSS}</style></head>
<body>${baoCaoHocVien(hv, ds)}</body></html>`

  const tam = resolve(thuMucRa, `.${khongDau(hv)}.html`)
  const ra = resolve(thuMucRa, `MNEE_BaoCaoHocTap_HocPhi_${khongDau(hv)}.pdf`)
  writeFileSync(tam, html, 'utf8')
  execFileSync(CHROME, ['--headless', '--disable-gpu', '--no-sandbox',
    '--no-pdf-header-footer', `--print-to-pdf=${ra}`, `file://${tam}`], { stdio: 'pipe' })
  rmSync(tam)
  console.log(`${ds.length} buổi · ${hv}  ->  ${ra}`)
}
