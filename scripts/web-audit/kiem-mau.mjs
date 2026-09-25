#!/usr/bin/env node
/**
 * Kiểm tương phản màu — đọc thẳng token từ tệp CSS, không chép tay số nào.
 *
 *   node scripts/web-audit/kiem-mau.mjs
 *   node scripts/web-audit/kiem-mau.mjs duong/dan/khac.css
 *
 * Mã thoát 1 nếu có cặp nào dưới chuẩn WCAG AA 4.5:1.
 *
 * Vì sao cần: bảng màu neo vào logo, mà logo thì không sửa được. Mỗi lần ai đó
 * chỉnh một bậc màu cho "đẹp hơn", rất dễ kéo một cặp chữ/nền xuống dưới chuẩn
 * mà mắt thường không thấy. Tệp này bắt chuyện đó.
 *
 * Danh sách cặp dưới đây là những cặp THẬT SỰ xuất hiện trong mã nguồn. Thêm
 * cách dùng mới thì thêm cặp mới vào đây.
 */

import { readFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'

const NGUONG = 4.5

// --- đo tương phản -----------------------------------------------------------

function doSang(hex) {
  const c = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]
}

function tuongPhan(a, b) {
  const [x, y] = [doSang(a), doSang(b)].sort((m, n) => n - m)
  return (x + 0.05) / (y + 0.05)
}

// --- đọc token từ CSS --------------------------------------------------------

function docToken(css) {
  const token = { trắng: '#ffffff' }
  const re = /--color-([a-z0-9-]+):\s*(#[0-9a-fA-F]{6})/g
  let m
  while ((m = re.exec(css)) !== null) token[m[1]] = m[2].toLowerCase()
  return token
}

// --- các cặp thật sự dùng trong mã nguồn ------------------------------------

const CAP = [
  // chữ trên nền sáng
  ['navy-400', 'trắng', '.mnee-label và chữ phụ — chỗ dùng nhiều nhất'],
  ['navy-400', 'navy-50', 'chữ phụ trên nền body'],
  ['navy-500', 'trắng', 'chữ phụ đậm hơn'],
  ['navy-600', 'trắng', 'chữ thường'],
  ['navy-700', 'trắng', 'chữ thường'],
  ['navy-800', 'trắng', 'chữ đậm'],
  ['navy-900', 'trắng', 'chữ chính'],
  ['navy-900', 'navy-50', 'chữ chính trên nền body'],

  // chữ trên nền tối
  ['navy-300', 'navy-800', 'chữ trên thanh điều hướng'],
  ['navy-300', 'navy-900', 'chữ trên nền tối nhất'],
  ['navy-200', 'navy-800', 'chữ sáng trên nền tối'],
  ['trắng', 'navy-700', 'chữ trắng trên nền tối'],
  ['trắng', 'navy-800', 'chữ trắng trên thanh điều hướng'],
  ['trắng', 'navy-900', 'chữ trắng trên nền tối nhất'],

  // vàng
  ['gold-400', 'navy-800', 'nhãn vàng trên nền tối'],
  ['gold-400', 'navy-900', 'nhãn vàng trên nền tối nhất'],
  ['navy-900', 'gold-500', 'chữ trên nút vàng'],
  ['gold-600', 'trắng', 'chữ vàng trên nền sáng'],
  ['gold-700', 'trắng', 'chữ vàng đậm'],
  ['gold-700', 'gold-50', 'chữ vàng trên nền vàng nhạt'],
  ['gold-800', 'trắng', 'chữ vàng rất đậm'],

  // trạng thái
  ['burgundy-700', 'trắng', 'công nợ, cảnh báo — dùng 40 chỗ'],
  ['burgundy-700', 'burgundy-50', 'cảnh báo trên nền cảnh báo'],
  ['burgundy-600', 'trắng', 'cảnh báo nhạt hơn'],
  ['burgundy-800', 'trắng', 'cảnh báo đậm'],
  ['trắng', 'burgundy-700', 'chữ trắng trên nền cảnh báo'],
  ['sage-700', 'trắng', 'trạng thái tốt — dùng 25 chỗ'],
  ['sage-700', 'sage-50', 'trạng thái tốt trên nền của nó'],
  ['sage-600', 'trắng', 'trạng thái tốt nhạt hơn'],
  ['amber-soft-700', 'trắng', 'trạng thái chờ'],
  ['amber-soft-700', 'amber-soft-50', 'trạng thái chờ trên nền của nó'],
]

// --- các cặp PHẢI KHÔNG đạt (luật thương hiệu, không phải lỗi) --------------

const CAM = [
  ['gold-500', 'trắng', 'vàng logo trên nền sáng — chỉ được làm vạch, không làm chữ'],
  ['gold-500', 'navy-50', 'vàng logo trên nền body — chỉ được làm vạch'],
]

// --- chạy --------------------------------------------------------------------

async function main() {
  const tep = process.argv.slice(2).find((a) => !a.startsWith('--')) || 'src/app/globals.css'
  let css
  try {
    css = await readFile(path.resolve(process.cwd(), tep), 'utf8')
  } catch (e) {
    console.error(`Không đọc được ${tep}: ${e.message}`)
    process.exit(2)
  }

  const token = docToken(css)
  console.log(`\nKiểm tương phản — ${tep}`)
  console.log(`Đọc được ${Object.keys(token).length - 1} token màu. Chuẩn: ${NGUONG}:1\n`)

  let hong = 0
  let thieu = 0
  console.log('── Cặp phải đạt ' + '─'.repeat(52))
  for (const [a, b, ghiChu] of CAP) {
    if (!token[a] || !token[b]) {
      console.log(`  ?      ${a} / ${b}  — không tìm thấy token`)
      thieu++
      continue
    }
    const t = tuongPhan(token[a], token[b])
    const dat = t >= NGUONG
    if (!dat) hong++
    console.log(
      `  ${dat ? 'đạt   ' : 'HỎNG  '} ${(a + ' / ' + b).padEnd(30)} ${t.toFixed(2).padStart(6)}  ${ghiChu}`,
    )
  }

  console.log('\n── Cặp phải KHÔNG đạt (luật thương hiệu) ' + '─'.repeat(28))
  for (const [a, b, ghiChu] of CAM) {
    if (!token[a] || !token[b]) continue
    const t = tuongPhan(token[a], token[b])
    const dung = t < NGUONG
    if (!dung) {
      hong++
      console.log(
        `  HỎNG   ${(a + ' / ' + b).padEnd(30)} ${t.toFixed(2).padStart(6)}  giờ lại đạt — ${ghiChu}`,
      )
    } else {
      console.log(`  đúng   ${(a + ' / ' + b).padEnd(30)} ${t.toFixed(2).padStart(6)}  ${ghiChu}`)
    }
  }

  console.log('\n── Tổng kết ' + '─'.repeat(56))
  console.log(`  Cặp kiểm : ${CAP.length + CAM.length}`)
  console.log(`  Hỏng     : ${hong}`)
  if (thieu) console.log(`  Thiếu    : ${thieu} token không tìm thấy`)
  console.log('')

  if (hong > 0) {
    console.error('Có cặp màu dưới chuẩn. Đừng đẩy lên khi chưa sửa.\n')
    process.exit(1)
  }
  if (thieu > 0) process.exit(2)
}

main().catch((e) => {
  console.error(e)
  process.exit(2)
})
