#!/usr/bin/env node
/**
 * Xác minh buổi học từ video lớp, bằng Gemini API (có bậc miễn phí).
 *
 * VÌ SAO PHẢI DÙNG DỊCH VỤ NGOÀI
 *   Máy chạy Claude Code bị chặn hoàn toàn youtube.com và zoom.us ở tầng cổng
 *   ra (403 CONNECT). Nên trợ lý không xem được video, cũng không lấy được phụ
 *   đề. Gemini thì TỰ TẢI video từ phía Google, nên việc máy này bị chặn không
 *   còn quan trọng.
 *
 * VÌ SAO LÀ GEMINI CHỨ KHÔNG PHẢI DỊCH VỤ KHÁC
 *   Đã thử sáu nhà: chỉ generativelanguage.googleapis.com đi ra được.
 *   api.deepseek.com, api.openai.com, api.groq.com, openrouter.ai và
 *   huggingface.co đều bị chặn.
 *
 * GIỚI HẠN PHẢI BIẾT TRƯỚC
 *   · Chỉ chạy được với video YOUTUBE công khai hoặc unlisted. Zoom Clips là
 *     link riêng tư, Gemini không tải được. Tính tới 20/09/2026, 7/13 buổi
 *     tháng 9 có video YouTube; 6 buổi còn lại chỉ có Zoom Clips.
 *   · Kết quả ghi vào cột RIÊNG (phut_thuc_te), KHÔNG ghi đè số giáo viên khai.
 *     Lương và học phí vẫn tính theo số khai cho tới khi Founder duyệt.
 *   · Nhận xét do máy viết được đánh dấu authored_by = 'ai'. Giáo viên đọc lại
 *     và sửa thì hệ thống chuyển thành 'ai_edited_by_teacher'.
 *
 * CÁCH CHẠY
 *   export GEMINI_API_KEY=...        # lấy miễn phí ở aistudio.google.com/apikey
 *   export SUPABASE_DB_URL=...       # chuỗi Session pooler, như backup.yml
 *   node scripts/phan-tich-video/phan-tich.mjs            # chạy thật
 *   node scripts/phan-tich-video/phan-tich.mjs --thu      # chỉ in ra, không ghi
 *   node scripts/phan-tich-video/phan-tich.mjs --tu 2026-09-01
 */

import { execFileSync } from 'node:child_process'

const KHOA = process.env.GEMINI_API_KEY
const DB = process.env.SUPABASE_DB_URL
const MODEL = process.env.GEMINI_MODEL ?? 'gemini-2.5-flash'
const API = 'https://generativelanguage.googleapis.com/v1beta/models'

const args = process.argv.slice(2)
const chiThu = args.includes('--thu')
const tuNgay = args[args.indexOf('--tu') + 1] ?? '2026-09-01'

if (!KHOA) loi('Thiếu GEMINI_API_KEY. Lấy miễn phí tại https://aistudio.google.com/apikey')
if (!DB) loi('Thiếu SUPABASE_DB_URL. Dùng chuỗi Session pooler, giống secret của backup.yml.')

function loi(m) {
  console.error(`\n  ✗ ${m}\n`)
  process.exit(1)
}

/** Chạy SQL qua psql và trả về JSON. */
function sql(cau) {
  const out = execFileSync('psql', [DB, '-At', '-c', cau], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
  return out.trim() ? JSON.parse(out) : []
}

const YEU_CAU = `Bạn đang xem bản ghi một buổi học tiếng Anh trực tuyến một kèm một của trung tâm Ms.Ngọc Elite English.

Trả lời CHÍNH XÁC theo những gì nghe và thấy được trong video. Không suy đoán. Chỗ nào không chắc thì ghi null.

Trả về DUY NHẤT một object JSON, không kèm giải thích, không kèm dấu markdown:

{
  "phut_thuc_te": <số phút học thực tế, tính từ lúc bắt đầu dạy tới lúc kết thúc, TRỪ các khoảng chết trên 30 giây>,
  "phut_tong_video": <tổng độ dài video, phút>,
  "thoi_gian_hv_noi": <số phút học viên nói, làm tròn>,
  "gian_doan": [
    { "tu": "mm:ss", "den": "mm:ss", "so_giay": <số>, "dien_ra_gi": "<mô tả ngắn: chờ gì, vì sao dừng — ví dụ mất mạng, học viên đi lấy sách, giáo viên tìm tài liệu, học viên im lặng suy nghĩ, trục trặc micro>" }
  ],
  "khong_khi_lop": "<2-3 câu tiếng Việt mô tả không khí: học viên có chủ động không, có ngập ngừng không, giáo viên dẫn dắt thế nào, nhịp buổi học ra sao>",
  "noi_dung_bai": "<tiếng Việt, nội dung đã dạy trong buổi, bám sát video>",
  "diem_manh": "<tiếng Việt, gửi phụ huynh. Dẫn câu học viên NÓI THẬT trong video kèm mốc thời gian>",
  "can_cai_thien": "<tiếng Việt, gửi phụ huynh. Dẫn lỗi CỤ THỂ nghe được kèm mốc thời gian, và cách nói đúng>",
  "bai_tap": "<tiếng Việt, bài tập giáo viên giao trong video. Không có thì ghi null>"
}

Quy tắc bắt buộc:
- "gian_doan" chỉ liệt kê khoảng dừng TRÊN 30 GIÂY. Không có thì trả mảng rỗng.
- "diem_manh" và "can_cai_thien" PHẢI dẫn được câu hoặc lỗi có thật trong video kèm mốc thời gian. Nếu chất lượng âm thanh không đủ nghe, trả null thay vì viết chung chung.
- Viết tiếng Việt, xưng hô gọi học viên là "con" nếu là trẻ em, "chị"/"anh" nếu là người lớn.`

async function goiGemini(urls) {
  const parts = [{ text: YEU_CAU }, ...urls.map((u) => ({ file_data: { file_uri: u } }))]
  const res = await fetch(`${API}/${MODEL}:generateContent?key=${KHOA}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: { temperature: 0, responseMimeType: 'application/json' },
    }),
  })
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${(await res.text()).slice(0, 400)}`)
  const data = await res.json()
  const txt = data?.candidates?.[0]?.content?.parts?.[0]?.text
  if (!txt) throw new Error('Gemini không trả về nội dung. Phản hồi: ' + JSON.stringify(data).slice(0, 400))
  return JSON.parse(txt)
}

const buoi = sql(`
  select coalesce(json_agg(x), '[]') from (
    select l.id, c.class_code, l.lesson_date::text as ngay, l.duration_minutes as phut_khai,
           array_agg(r.url) as videos
      from lessons l
      join classes c on c.id = l.class_id
      join recordings r on r.lesson_id = l.id
      left join teaching_reports tr on tr.lesson_id = l.id
     where l.status = 'completed'
       and l.lesson_date >= '${tuNgay}'
       and r.url like '%youtu%'
       and tr.phut_thuc_te is null
     group by l.id, c.class_code, l.lesson_date, l.duration_minutes
     order by l.lesson_date
  ) x`)

if (buoi.length === 0) {
  console.log('\n  Không có buổi nào cần xác minh. Mọi buổi có video YouTube đều đã xác minh rồi.\n')
  process.exit(0)
}

console.log(`\n  ${buoi.length} buổi cần xác minh${chiThu ? '  (CHẠY THỬ — không ghi vào cơ sở dữ liệu)' : ''}\n`)

let xong = 0
let hong = 0

for (const b of buoi) {
  process.stdout.write(`  ${b.class_code}  ${b.ngay}  (khai ${b.phut_khai}p, ${b.videos.length} video) ... `)
  try {
    const kq = await goiGemini(b.videos)
    const lech = (kq.phut_thuc_te ?? 0) - b.phut_khai
    console.log(`thực tế ${kq.phut_thuc_te}p  (lệch ${lech >= 0 ? '+' : ''}${lech}p) · HV nói ${kq.thoi_gian_hv_noi}p · ${kq.gian_doan?.length ?? 0} lần gián đoạn`)

    if (chiThu) { console.log('     ' + (kq.khong_khi_lop ?? '').slice(0, 150)); xong++; continue }

    const esc = (v) => (v == null ? 'null' : `'${String(v).replace(/'/g, "''")}'`)
    sql(`
      update teaching_reports set
        phut_thuc_te     = ${kq.phut_thuc_te ?? 'null'},
        thoi_gian_hv_noi = ${kq.thoi_gian_hv_noi ?? 'null'},
        gian_doan        = ${esc(JSON.stringify(kq.gian_doan ?? []))}::jsonb,
        khong_khi_lop    = ${esc(kq.khong_khi_lop)},
        nguon_xac_minh   = 'gemini',
        xac_minh_luc     = now(),
        lesson_content   = coalesce(lesson_content,   ${esc(kq.noi_dung_bai)}),
        strengths        = coalesce(strengths,        ${esc(kq.diem_manh)}),
        improvements     = coalesce(improvements,     ${esc(kq.can_cai_thien)}),
        homework_summary = coalesce(homework_summary, ${esc(kq.bai_tap)}),
        authored_by      = case when strengths is null then 'ai'::report_author else authored_by end
      where lesson_id = '${b.id}';
      select '[]'::json`)
    xong++
  } catch (e) {
    console.log(`HỎNG — ${e.message.slice(0, 160)}`)
    hong++
  }
}

console.log(`\n  Xong ${xong} buổi${hong ? `, hỏng ${hong} buổi` : ''}.`)
console.log('  Xem đối chiếu số khai và số thật ở màn hình /xac-minh, hoặc view v_xac_minh_buoi_hoc.')
console.log('  Lương và học phí VẪN tính theo số giáo viên khai cho tới khi cô Ngọc duyệt.\n')
