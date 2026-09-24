#!/usr/bin/env node
/**
 * Áp bộ thương hiệu vào trang thật.
 *
 * Chạy trong thư mục có mã nguồn website (ví dụ C:\Users\User\MNEE-OS):
 *
 *   curl.exe -sSLO https://raw.githubusercontent.com/msngoctagtielts-gif/CRM/claude/ai-agents-professional-website-oym91e/scripts/web-audit/ap-vao-trang.mjs
 *   node ap-vao-trang.mjs
 *
 * Làm gì:
 *   1. SAO LƯU toàn bộ tệp .html sẽ đụng tới, trước khi sửa bất cứ thứ gì
 *   2. Tải bộ thương hiệu (logo, favicon, og, chân dung) và mnee-blocks.css
 *   3. Chèn vào <head>: liên kết CSS, favicon, thẻ chia sẻ — CHỈ chèn thứ còn thiếu
 *   4. Soi trang trước và sau, in ra chênh lệch
 *
 * KHÔNG làm gì:
 *   Không đụng vào <body>. Khối chân dung, khối Founder và khối Đội ngũ phải do
 *   người đặt đúng chỗ — máy không biết bố cục trang của cô. Chạy xong nó in ra
 *   sẵn đoạn mã để dán.
 *
 * Tuỳ chọn:
 *   --tep=index.html   chỉ áp cho một tệp
 *   --thu              chạy thử, không ghi gì cả
 */

import { readFile, writeFile, mkdir, readdir, stat, cp } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const GOC =
  'https://raw.githubusercontent.com/msngoctagtielts-gif/CRM/claude/ai-agents-professional-website-oym91e'

const ANH = [
  'logo.png',
  'logo-dao-mau.png',
  'favicon-32.png',
  'favicon-180.png',
  'favicon-512.png',
  'og.jpg',
  'ms-ngoc-900.webp',
  'ms-ngoc-600.webp',
]

// Thẻ chèn vào <head>. `co` trả true nếu trang ĐÃ có thứ đó rồi.
const THE = [
  {
    ten: 'liên kết CSS',
    co: (h) => /mnee-blocks\.css/i.test(h),
    ma: '<link rel="stylesheet" href="mnee-blocks.css">',
  },
  {
    ten: 'favicon',
    co: (h) => /<link[^>]+rel=["']?(shortcut )?icon/i.test(h),
    ma:
      '<link rel="icon" href="thuong-hieu/favicon-32.png" sizes="32x32">\n' +
      '  <link rel="icon" href="thuong-hieu/favicon-512.png" sizes="512x512">\n' +
      '  <link rel="apple-touch-icon" href="thuong-hieu/favicon-180.png">',
  },
  {
    ten: 'ảnh chia sẻ',
    co: (h) => /property=["']?og:image/i.test(h),
    ma:
      '<meta property="og:image" content="thuong-hieu/og.jpg">\n' +
      '  <meta property="og:image:width" content="1200">\n' +
      '  <meta property="og:image:height" content="630">',
  },
  {
    ten: 'og:type',
    co: (h) => /property=["']?og:type/i.test(h),
    ma: '<meta property="og:type" content="website">',
  },
]

const KHOI_DAN = `
<!-- Khối chân dung — đặt ở đầu trang chủ, trên phần hero -->
<div class="mnee-portrait" style="height: 560px">
  <img src="thuong-hieu/ms-ngoc-900.webp"
       alt="Ms. Ngọc, người sáng lập Ms.Ngọc Elite English"
       width="900" height="1200">
</div>

<!-- Khối Founder — đặt ngay dưới khối chân dung -->
<section class="mnee-founder">
  <p class="mnee-founder__eyebrow">NGƯỜI SÁNG LẬP</p>
  <h2 class="mnee-founder__name">Ms. Ngọc</h2>
  <p class="mnee-founder__motto">Thấu hiểu để dẫn lối.</p>
  <div class="mnee-founder__rule" aria-hidden="true"></div>
  <p class="mnee-founder__proof">
    Chứng chỉ TESOL · 8 năm giảng dạy<br>
    Dạy kèm cá nhân hoá theo từng học viên
  </p>
</section>

<!-- Khối Đội ngũ — khối riêng, KHÔNG gộp vào khối Founder -->
<section class="mnee-team">
  <p class="mnee-team__eyebrow">ĐỘI NGŨ GIÁO VIÊN</p>
  <h2 class="mnee-team__heading">Ghép giáo viên trước khi vào học</h2>
  <div class="mnee-team__rule" aria-hidden="true"></div>
  <p class="mnee-team__body">
    Trung tâm trao đổi với học viên về mục tiêu, trình độ và lịch học,
    rồi mới chọn giáo viên phù hợp — không xếp lớp trước rồi mới báo.
  </p>
  <p class="mnee-team__fact">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
         stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M20 6 9 17l-5-5"></path>
    </svg>
    <span>Toàn bộ giáo viên có chứng chỉ giảng dạy.</span>
  </p>
</section>
`

// ---------------------------------------------------------------------------

function tieuDe(chu) {
  console.log(`\n${chu}\n${'─'.repeat(Math.min(chu.length, 70))}`)
}

async function tai(duongDan, dich) {
  const res = await fetch(`${GOC}/${duongDan}`, { headers: { 'user-agent': 'MNEE-ap/1.0' } })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const buf = Buffer.from(await res.arrayBuffer())
  if (buf.length === 0) throw new Error('tệp rỗng')
  await mkdir(path.dirname(dich), { recursive: true })
  await writeFile(dich, buf)
  return buf.length
}

async function timHtml(thuMuc, chiMot) {
  if (chiMot) return [chiMot]
  const ten = await readdir(thuMuc)
  const ra = []
  for (const t of ten) {
    if (!/\.html?$/i.test(t)) continue
    const tt = await stat(path.join(thuMuc, t))
    if (tt.isFile()) ra.push(t)
  }
  return ra
}

/** Chèn `ma` ngay trước </head>, giữ nguyên thụt lề. */
function chenVaoHead(html, ma) {
  const m = html.match(/([ \t]*)<\/head\s*>/i)
  if (!m) return null
  const thut = m[1] || '  '
  return html.replace(/([ \t]*)<\/head\s*>/i, `${thut}  ${ma}\n${thut}</head>`)
}

async function soi(tep) {
  const congCu = path.resolve(process.cwd(), 'scripts/web-audit/audit.mjs')
  if (!existsSync(congCu)) return null
  const { spawnSync } = await import('node:child_process')
  const k = spawnSync(process.execPath, [congCu, tep, '--json'], { encoding: 'utf8' })
  try {
    const d = JSON.parse(k.stdout)
    const p = d[0]?.phatHien || []
    return {
      nghiem: p.filter((x) => x.muc === 'nghiem-trong').length,
      sua: p.filter((x) => x.muc === 'can-sua').length,
    }
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------

async function main() {
  const args = process.argv.slice(2)
  const thu = args.includes('--thu')
  const chiMot = args.find((a) => a.startsWith('--tep='))?.split('=')[1]

  console.log('\nÁp bộ thương hiệu MNEE vào trang thật')
  console.log(`Thư mục: ${process.cwd()}`)
  if (thu) console.log('CHẠY THỬ — không ghi gì cả.')

  const danhSach = await timHtml(process.cwd(), chiMot)
  if (danhSach.length === 0) {
    console.error('\nKhông tìm thấy tệp .html nào ở thư mục này.')
    console.error('Chạy lệnh trong đúng thư mục có mã nguồn website.')
    process.exit(2)
  }
  console.log(`Tìm thấy ${danhSach.length} tệp .html: ${danhSach.join(', ')}`)

  // 1. Sao lưu
  const dau = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  const luu = `.mnee-sao-luu-${dau}`
  if (!thu) {
    tieuDe('1. Sao lưu trước khi sửa')
    await mkdir(luu, { recursive: true })
    for (const t of danhSach) {
      await cp(t, path.join(luu, t))
      console.log(`  đã lưu  ${t}`)
    }
    console.log(`\n  Bản gốc nằm ở ${luu}/ — hỏng gì thì chép ngược lại là xong.`)
  }

  // 2. Tải tài nguyên
  tieuDe('2. Tải bộ thương hiệu')
  let hong = 0
  for (const a of ANH) {
    const dich = path.join('thuong-hieu', a)
    try {
      if (thu) {
        console.log(`  (thử)  thuong-hieu/${a}`)
      } else {
        const n = await tai(`docs/website/mau/thuong-hieu/${a}`, dich)
        console.log(`  ok     thuong-hieu/${a}  (${(n / 1024).toFixed(0)} KB)`)
      }
    } catch (e) {
      console.log(`  HỎNG   thuong-hieu/${a} — ${e.message}`)
      hong++
    }
  }
  try {
    if (thu) console.log('  (thử)  mnee-blocks.css')
    else {
      const n = await tai('docs/website/mau/mnee-blocks.css', 'mnee-blocks.css')
      console.log(`  ok     mnee-blocks.css  (${(n / 1024).toFixed(1)} KB)`)
    }
  } catch (e) {
    console.log(`  HỎNG   mnee-blocks.css — ${e.message}`)
    hong++
  }
  if (hong > 0) {
    console.error(`\n${hong} tệp tải không được. Kiểm mạng rồi chạy lại. Chưa sửa tệp .html nào.`)
    process.exit(1)
  }

  // 3. Chèn thẻ vào <head>
  tieuDe('3. Chèn vào <head> — chỉ thứ còn thiếu')
  const truoc = {}
  for (const tep of danhSach) {
    const t = await soi(tep)
    if (t) truoc[tep] = t

    let html = await readFile(tep, 'utf8')
    const goc = html
    const them = []
    const bo = []
    for (const { ten, co, ma } of THE) {
      if (co(html)) {
        bo.push(ten)
        continue
      }
      const moi = chenVaoHead(html, ma)
      if (moi === null) {
        console.log(`  ${tep}: không tìm thấy </head> — bỏ qua tệp này`)
        break
      }
      html = moi
      them.push(ten)
    }
    console.log(`\n  ${tep}`)
    if (them.length) console.log(`    thêm     : ${them.join(', ')}`)
    if (bo.length) console.log(`    đã có sẵn: ${bo.join(', ')}`)
    if (!them.length && !bo.length) console.log('    không đổi gì')
    if (html !== goc && !thu) await writeFile(tep, html, 'utf8')
  }

  // 4. Soi lại
  const sau = {}
  for (const tep of danhSach) {
    const s = await soi(tep)
    if (s) sau[tep] = s
  }
  if (Object.keys(truoc).length) {
    tieuDe('4. Soi trước và sau')
    for (const tep of Object.keys(truoc)) {
      const a = truoc[tep]
      const b = sau[tep] || a
      console.log(
        `  ${tep}:  nghiêm trọng ${a.nghiem} → ${b.nghiem}   ·   cần sửa ${a.sua} → ${b.sua}`,
      )
    }
  } else {
    tieuDe('4. Soi trước và sau')
    console.log('  Chưa có công cụ soi trong thư mục này.')
    console.log('  Chạy cai-dat.mjs trước thì bước này mới đo được.')
  }

  // 5. Phần người phải tự làm
  tieuDe('5. Ba khối phải tự đặt — máy không biết bố cục trang của cô')
  console.log(KHOI_DAN)
  console.log('  Dán ba khối trên vào đúng chỗ trong <body>, rồi chạy:')
  console.log('    node scripts/web-audit/audit.mjs .\n')
  console.log('  Nhớ XOÁ vệt chéo đỏ–vàng ở góc dưới trái khối hero khỏi HTML')
  console.log('  (tìm phần tử có nền #7b2d3b hoặc #a82e49). Đừng chỉ display:none.\n')
}

main().catch((e) => {
  console.error(`\nDừng vì lỗi: ${e.message}`)
  process.exit(2)
})
