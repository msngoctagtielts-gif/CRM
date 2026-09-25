/**
 * Sinh file PDF báo cáo học tập gửi phụ huynh.
 *
 * DÙNG KHI Founder muốn có sẵn file PDF mà không phải mở từng trang rồi
 * Ctrl+P. Trang /bao-cao/<id> trên web vẫn là đường chính thức; script này
 * dùng CÙNG bộ lọc ghi chú nội bộ và CÙNG bố cục để hai bên ra giống nhau.
 *
 * CHẠY:  node --experimental-strip-types scripts/xuat-pdf-bao-cao.mjs <file-json> <thu-muc-ra>
 *
 * Dựng PDF bằng Chromium sẵn có trong máy (--print-to-pdf) thay vì thư viện
 * sinh PDF: xem lý do ở phần BẢN IN trong src/app/globals.css.
 */
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { join } from 'node:path'
import { locGhiChuNoiBo } from '../src/lib/bao-cao-in.ts'

const [fileJson, thuMucRa] = process.argv.slice(2)
const CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'

/* ---------- đọc dữ liệu ---------- */
const vanBan = JSON.parse(readFileSync(fileJson, 'utf8')).result
const i = vanBan.indexOf('[{"du_lieu"')
const rows = JSON.parse(vanBan.slice(i, vanBan.lastIndexOf('}]') + 2))[0].du_lieu

/* ---------- tiện ích ---------- */
const esc = (s) =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const ngayVN = (d) => {
  const [y, m, dd] = String(d).slice(0, 10).split('-')
  return `${dd}/${m}/${y}`
}
const gioVN = (iso) =>
  new Date(iso).toLocaleTimeString('vi-VN', {
    hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Ho_Chi_Minh',
  })

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

/** Văn bản nhiều dòng -> các thẻ <p>, giữ xuống dòng trong một đoạn. */
const doan = (t) =>
  String(t ?? '')
    .split(/\n{2,}/)
    .map((d) => d.trim())
    .filter(Boolean)
    .map((d) => `<p>${esc(d).replace(/\n/g, '<br>')}</p>`)
    .join('')

let stt = 0
const muc = (tieuDe, noiDung) =>
  !noiDung || noiDung.trim() === ''
    ? ''
    : `<section class="muc"><h2><span class="so">${++stt}</span>${esc(tieuDe)}</h2><div class="than">${noiDung}</div></section>`

/* ---------- CSS: bám đúng bảng màu navy–gold của hệ thống ---------- */
const CSS = `
@page { size: A4; margin: 14mm 15mm 16mm 15mm; }
* { box-sizing: border-box; }
body { margin:0; font-family:'Noto Sans','DejaVu Sans',Arial,sans-serif;
       color:#0f2040; font-size:10.5pt; line-height:1.55; }
.dau { border-bottom:2px solid #c8a24a; padding-bottom:10px;
       display:flex; justify-content:space-between; align-items:flex-start; gap:16px; }
.ten-tt { font-size:13pt; font-weight:700; letter-spacing:-0.01em; }
.cham-ngon { font-size:9pt; font-style:italic; color:#456490; margin-top:2px; }
.nhan { font-size:7.5pt; font-weight:700; letter-spacing:.07em;
        text-transform:uppercase; color:#6885ad; }
.ngay-bc { font-size:10pt; font-weight:600; color:#1d3559; margin-top:3px; }
dl { display:grid; grid-template-columns:1fr 1fr; gap:8px 24px; margin:16px 0 0; }
dd { margin:2px 0 0; font-size:10pt; }
dd.dam { font-weight:700; }
.trich { border-left:3px solid #c8a24a; background:#fdfaf1;
         padding:11px 15px; margin:18px 0; page-break-inside:avoid; }
.trich p { font-style:italic; margin:5px 0 0; font-size:10.5pt; }
.muc { margin:0 0 18px; page-break-inside:avoid; }
.muc h2 { font-size:11pt; font-weight:700; margin:0 0 8px; padding-bottom:5px;
          border-bottom:1px solid #e2e9f2; display:flex; align-items:center; gap:7px; }
.so { display:inline-flex; width:17px; height:17px; border-radius:50%;
      background:#13294b; color:#fff; font-size:8pt; font-weight:700;
      align-items:center; justify-content:center; flex:0 0 auto; }
.than p { margin:0 0 8px; }
.than p:last-child { margin-bottom:0; }
.bt-ten { font-weight:700; margin:0 0 7px; }
.mau-cau { border:1px solid #e2e9f2; background:#f2f5f9; border-radius:5px;
           padding:10px 13px; margin-top:11px; }
.mau-cau pre { margin:5px 0 0; font-family:'DejaVu Sans Mono',monospace;
               font-size:9pt; line-height:1.5; white-space:pre-wrap; }
.han { margin-top:9px; font-size:9.5pt; color:#2f4a72; }
.vid a { color:#1d3559; font-weight:600; text-decoration:underline;
         text-decoration-color:#c8a24a; word-break:break-all; }
.vid .dc { font-size:8.5pt; color:#456490; }
.chan { border-top:1px solid #e2e9f2; margin-top:26px; padding-top:10px;
        font-size:8.5pt; color:#456490; }
.chan p { margin:0 0 2px; }
`

/* ---------- dựng một trang báo cáo ---------- */
function trang(r) {
  stt = 0
  const loc = (t) => locGhiChuNoiBo(t)
  const bt = r.bai_tap
  const vids = r.video ?? []

  const khoiBaiTap = !bt
    ? ''
    : `<p class="bt-ten">${esc(bt.title)}</p>${doan(loc(bt.description))}` +
      (bt.sentence_patterns
        ? `<div class="mau-cau"><div class="nhan">Mẫu câu và từ vựng</div><pre>${esc(bt.sentence_patterns)}</pre></div>`
        : '') +
      (bt.due_date ? `<p class="han"><span class="nhan">Hạn nộp</span> ${ngayVN(bt.due_date)}</p>` : '')

  const khoiVideo = vids.length === 0 ? '' :
    `<p>${r.video_timestamp
      ? `Bấm vào link dưới đây để xem lại buổi học. Link mở đúng phút ${esc(r.video_timestamp)} — khoảnh khắc được nhắc trong báo cáo.`
      : 'Bấm vào link dưới đây để xem lại toàn bộ buổi học.'}</p>` +
    `<div class="vid">${vids.map((u, k) => {
      const href = linkVideo(u, k === 0 ? r.video_timestamp : null)
      const ten = vids.length > 1 ? `Video phần ${k + 1}` : 'Video buổi học'
      return `<p><a href="${esc(href)}">${ten}</a> <span class="dc">${esc(href)}</span></p>`
    }).join('')}</div>`

  return `<div class="bao-cao">
  <header class="dau">
    <div><div class="ten-tt">Ms.Ngọc Elite English</div>
         <div class="cham-ngon">Thấu hiểu để dẫn lối.</div></div>
    <div style="text-align:right">
      <div class="nhan">Báo cáo học tập</div>
      <div class="ngay-bc">${ngayVN(r.ngay)}</div></div>
  </header>
  <dl>
    <div><div class="nhan">Học viên</div><dd class="dam">${esc(r.hv ?? '—')}</dd></div>
    <div><div class="nhan">Giáo viên</div><dd>${esc(r.gv ?? 'Chưa phân công')}</dd></div>
    <div><div class="nhan">Lớp</div><dd>${esc(r.ten_lop ?? r.class_code)}</dd></div>
    <div><div class="nhan">Thời lượng</div><dd>${gioVN(r.bat_dau)}–${gioVN(r.ket_thuc)} · ${r.phut} phút</dd></div>
  </dl>
  ${muc('Nội dung buổi học', doan(loc(r.lesson_content)))}
  ${r.student_quote ? `<div class="trich"><div class="nhan">Câu học viên nói được trong buổi</div><p>${esc(r.student_quote)}</p></div>` : ''}
  ${muc('Điểm mạnh', doan(loc(r.strengths)))}
  ${muc('Cần cải thiện', doan(loc(r.improvements)))}
  ${muc('Nhận xét của giáo viên', doan(loc(r.teacher_comments)))}
  ${muc('Bài tập về nhà', khoiBaiTap)}
  ${muc('Định hướng buổi sau', doan(loc(r.next_lesson_recommendation)))}
  ${muc('Xem lại buổi học', khoiVideo)}
  <footer class="chan">
    <p>Ms.Ngọc Elite English · &ldquo;Thấu hiểu để dẫn lối.&rdquo; · Lập từ hệ thống MNEE ngày ${ngayVN(new Date().toISOString())}</p>
    <p>Mọi nhận xét trong báo cáo này đều dẫn về một mốc thời gian cụ thể trong video buổi học.</p>
  </footer>
</div>`
}

/* ---------- gom theo học viên, mỗi em một file ---------- */
mkdirSync(thuMucRa, { recursive: true })
const theoHV = new Map()
for (const r of rows) {
  const k = r.hv ?? 'Khong ro'
  if (!theoHV.has(k)) theoHV.set(k, [])
  theoHV.get(k).push(r)
}

const khongDau = (s) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd').replace(/[^A-Za-z0-9]+/g, '_')

const daTao = []
for (const [hv, ds] of theoHV) {
  ds.sort((a, b) => String(a.ngay).localeCompare(String(b.ngay)))
  const than = ds.map(trang).join('<div style="page-break-before:always"></div>')
  const html = `<!doctype html><html lang="vi"><head><meta charset="utf-8">
<title>Bao cao hoc tap — ${esc(hv)}</title><style>${CSS}</style></head><body>${than}</body></html>`

  const tam = join(thuMucRa, `.${khongDau(hv)}.html`)
  const ra = join(thuMucRa, `Bao_cao_hoc_tap_${khongDau(hv)}_T9-2026.pdf`)
  writeFileSync(tam, html, 'utf8')
  execFileSync(CHROME, [
    '--headless', '--disable-gpu', '--no-sandbox', '--no-pdf-header-footer',
    `--print-to-pdf=${ra}`, `file://${tam}`,
  ], { stdio: 'pipe' })
  rmSync(tam)
  daTao.push({ hv, soBuoi: ds.length, ra })
}

for (const t of daTao) console.log(`${t.soBuoi} buoi · ${t.hv}  ->  ${t.ra}`)
