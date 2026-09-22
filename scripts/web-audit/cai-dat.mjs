#!/usr/bin/env node
/**
 * Chép sáu nhân sự AI và công cụ soi lỗi website về thư mục hiện tại.
 *
 * Dùng trên máy có mã nguồn website (ví dụ C:\Users\User\MNEE-OS):
 *
 *   curl.exe -sSLO https://raw.githubusercontent.com/msngoctagtielts-gif/CRM/claude/ai-agents-professional-website-oym91e/scripts/web-audit/cai-dat.mjs
 *   node cai-dat.mjs
 *
 * Chạy lại bất cứ lúc nào để lấy bản mới nhất. Tệp cũ bị ghi đè, tệp khác trong
 * thư mục không bị đụng tới.
 *
 * Tuỳ chọn:
 *   --nhanh     bỏ bước tự kiểm sau khi tải
 *   --chi-cong-cu  chỉ tải công cụ soi, không tải nhân sự và tài liệu
 */

import { mkdir, writeFile, rm } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'

const GOC =
  'https://raw.githubusercontent.com/msngoctagtielts-gif/CRM/claude/ai-agents-professional-website-oym91e'

const CONG_CU = ['scripts/web-audit/audit.mjs', 'scripts/web-audit/README.md']

const NHAN_SU = [
  'web-planner',
  'web-designer',
  'web-copywriter',
  'web-builder',
  'web-qa',
  'web-auditor',
].map((t) => `.claude/agents/${t}.md`)

const TAI_LIEU = [
  'README',
  'KE-HOACH-XAY-DUNG',
  'UY-TIN',
  'DANH-MUC-KIEM-TRA',
  'CAI-DAT-TREN-MAY',
  'khoi-founder',
].map((t) => `docs/website/${t}.md`)

// ---------------------------------------------------------------------------

function inTieuDe(chu) {
  console.log(`\n${chu}\n${'─'.repeat(chu.length)}`)
}

function kiemNode() {
  const chinh = Number(process.versions.node.split('.')[0])
  if (chinh < 20) {
    console.error(
      `Cần Node 20 trở lên, máy này đang chạy Node ${process.versions.node}.\n` +
        'Tải bản mới tại https://nodejs.org rồi chạy lại.',
    )
    process.exit(2)
  }
  console.log(`Node ${process.versions.node} — đạt.`)
}

async function tai(duongDan) {
  const res = await fetch(`${GOC}/${duongDan}`, {
    headers: { 'user-agent': 'MNEE-cai-dat/1.0' },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`)
  const noiDung = await res.text()
  if (noiDung.trim().length === 0) throw new Error('tệp rỗng')
  const dich = path.resolve(process.cwd(), duongDan)
  await mkdir(path.dirname(dich), { recursive: true })
  await writeFile(dich, noiDung, 'utf8')
  return Buffer.byteLength(noiDung, 'utf8')
}

async function taiNhom(ten, danhSach) {
  inTieuDe(ten)
  let hong = 0
  for (const d of danhSach) {
    try {
      const kb = (await tai(d)) / 1024
      console.log(`  ok    ${d}  (${kb.toFixed(1)} KB)`)
    } catch (e) {
      console.log(`  HỎNG  ${d}  — ${e.message}`)
      hong++
    }
  }
  return hong
}

/** Dựng một trang hỏng rồi soi, để chắc công cụ chạy được trên máy này. */
async function tuKiem() {
  inTieuDe('Tự kiểm')

  const thuMucTam = path.resolve(process.cwd(), '.mnee-tu-kiem-tam')
  const tepTam = path.join(thuMucTam, 'trang-hong.html')

  await mkdir(thuMucTam, { recursive: true })
  await writeFile(
    tepTam,
    '<!DOCTYPE html><html><head><title>Document</title></head>' +
      '<body><h1>x</h1><img src="a.png"><p>Lorem ipsum</p></body></html>',
    'utf8',
  )

  // Dùng đường dẫn thường, không dùng file:// URL — trên Windows, pathname của
  // file:// bắt đầu bằng "/C:/…" và Node không mở được.
  const congCu = path.resolve(process.cwd(), 'scripts/web-audit/audit.mjs')
  const { spawnSync } = await import('node:child_process')
  const ket = spawnSync(process.execPath, [congCu, tepTam, '--quiet'], {
    encoding: 'utf8',
  })

  await rm(thuMucTam, { recursive: true, force: true })

  const raQuaHong = ket.status === 1 && /NGHIÊM TRỌNG/.test(ket.stdout || '')
  if (raQuaHong) {
    console.log('  Công cụ soi chạy đúng: bắt được lỗi trên trang hỏng thử nghiệm.')
    return true
  }
  console.log('  Công cụ soi KHÔNG chạy đúng trên máy này.')
  if (ket.stderr) console.log(`  ${ket.stderr.trim().split('\n').slice(0, 5).join('\n  ')}`)
  return false
}

// ---------------------------------------------------------------------------

async function main() {
  const args = process.argv.slice(2)
  const chiMa = args.includes('--chi-cong-cu')
  const boTuKiem = args.includes('--nhanh')

  console.log('\nChép bộ làm website của Ms.Ngọc Elite English')
  console.log(`Vào thư mục: ${process.cwd()}`)

  inTieuDe('Kiểm môi trường')
  kiemNode()

  let hong = await taiNhom('Công cụ soi lỗi', CONG_CU)
  if (!chiMa) {
    hong += await taiNhom('Sáu nhân sự AI', NHAN_SU)
    hong += await taiNhom('Tài liệu', TAI_LIEU)
  }

  if (hong > 0) {
    console.error(
      `\n${hong} tệp tải không được. Kiểm lại mạng rồi chạy lại lệnh này.\n` +
        'Nếu máy đi qua proxy công ty, thử tải tay từng tệp theo\n' +
        'docs/website/CAI-DAT-TREN-MAY.md.',
    )
    process.exit(1)
  }

  if (!boTuKiem) {
    const dat = await tuKiem()
    if (!dat) process.exit(1)
  }

  inTieuDe('Xong — làm gì tiếp')
  console.log(`
  1. Soi toàn bộ mã nguồn website trong thư mục này:

       node scripts/web-audit/audit.mjs .

  2. Soi hai trang đang chạy:

       node scripts/web-audit/audit.mjs https://msngoc-elite-english.pages.dev
       node scripts/web-audit/audit.mjs https://msngoc-folio.pages.dev --profile=ca-nhan

  3. Mở phiên làm việc ở thư mục này rồi gọi nhân sự theo tên. Chạy
     web-auditor TRƯỚC để chốt hiện trạng, đừng để hai phiên sửa chồng nhau:

       Dùng web-auditor soi toàn bộ thư mục này
       Dùng web-planner lên kế hoạch từ báo cáo vừa rồi

  Đọc thêm: docs/website/README.md
`)
}

main().catch((e) => {
  console.error(`\nDừng vì lỗi: ${e.message}`)
  process.exit(2)
})
