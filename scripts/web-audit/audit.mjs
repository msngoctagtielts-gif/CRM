#!/usr/bin/env node
/**
 * Soi lỗi website — công cụ của nhân sự "web-auditor" và "web-qa".
 *
 * Chạy:
 *   node scripts/web-audit/audit.mjs https://msngoc-elite-english.pages.dev
 *   node scripts/web-audit/audit.mjs ./duong-dan/index.html
 *   node scripts/web-audit/audit.mjs ./thu-muc-site --json
 *
 * Tuỳ chọn:
 *   --json           in kết quả dạng JSON (để agent khác đọc)
 *   --profile=X      trung-tam | ca-nhan  (mặc định: tự đoán theo tên trang)
 *   --quiet          chỉ in phần tổng kết
 *
 * Mã thoát: 1 nếu còn lỗi mức "nghiem-trong", 0 nếu không.
 * Không cần cài thêm thư viện — chỉ dùng Node >= 20.
 */

import { readFile, readdir, stat } from 'node:fs/promises'
import path from 'node:path'

// ---------------------------------------------------------------------------
// Mức độ
// ---------------------------------------------------------------------------

const MUC = {
  NGHIEM_TRONG: 'nghiem-trong',
  CAN_SUA: 'can-sua',
  NEN_CAI_THIEN: 'nen-cai-thien',
}

const NHAN_MUC = {
  [MUC.NGHIEM_TRONG]: 'NGHIÊM TRỌNG',
  [MUC.CAN_SUA]: 'CẦN SỬA',
  [MUC.NEN_CAI_THIEN]: 'NÊN CẢI THIỆN',
}

const THU_TU_MUC = [MUC.NGHIEM_TRONG, MUC.CAN_SUA, MUC.NEN_CAI_THIEN]

// ---------------------------------------------------------------------------
// Tiện ích phân tích HTML (không dùng thư viện ngoài)
// ---------------------------------------------------------------------------

/** Trả về số dòng (1-based) của vị trí ký tự `index` trong `html`. */
function dongTai(html, index) {
  if (index < 0) return 0
  let dong = 1
  for (let i = 0; i < index && i < html.length; i++) {
    if (html.charCodeAt(i) === 10) dong++
  }
  return dong
}

/** Bỏ comment, nội dung <script> và <style> — dùng khi soi phần chữ hiển thị. */
function chiLayChu(html) {
  return html
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<script\b[\s\S]*?<\/script\s*>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style\s*>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Đọc giá trị một thuộc tính trong chuỗi thẻ mở, ví dụ '<img alt="x">'. */
function thuocTinh(the, ten) {
  const re = new RegExp(`\\b${ten}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s"'>]+))`, 'i')
  const m = the.match(re)
  if (!m) return null
  return (m[2] ?? m[3] ?? m[4] ?? '').trim()
}

/** Có mặt thuộc tính (kể cả dạng boolean không giá trị)? */
function coThuocTinh(the, ten) {
  return new RegExp(`\\b${ten}\\b`, 'i').test(the)
}

/** Lấy mọi thẻ mở của một tên thẻ, kèm vị trí. */
function layThe(html, tenThe) {
  const re = new RegExp(`<${tenThe}\\b[^>]*>`, 'gi')
  const ra = []
  let m
  while ((m = re.exec(html)) !== null) {
    ra.push({ the: m[0], index: m.index })
  }
  return ra
}

/** Lấy <meta name|property="..."> content. */
function metaTheo(html, loai, ten) {
  const metas = layThe(html, 'meta')
  for (const { the } of metas) {
    const v = thuocTinh(the, loai)
    if (v && v.toLowerCase() === ten.toLowerCase()) {
      return thuocTinh(the, 'content')
    }
  }
  return null
}

// ---------------------------------------------------------------------------
// Bộ luật kiểm tra
// ---------------------------------------------------------------------------

/**
 * Mỗi luật nhận { html, chu, url, profile } và trả mảng phát hiện:
 * { ma, muc, nhom, thongDiep, cachSua, dong? }
 */
const LUAT = []

function luat(ma, nhom, ham) {
  LUAT.push({ ma, nhom, ham })
}

const NHOM = {
  KY_THUAT: 'Kỹ thuật',
  TIM_KIEM: 'Tìm kiếm & chia sẻ',
  TIEP_CAN: 'Khả năng tiếp cận',
  NOI_DUNG: 'Nội dung & uy tín',
  HIEU_NANG: 'Hiệu năng',
  AN_TOAN: 'An toàn',
}

// --- Kỹ thuật nền ----------------------------------------------------------

luat('html-lang', NHOM.KY_THUAT, ({ html }) => {
  const the = layThe(html, 'html')[0]
  if (!the) {
    return [
      {
        muc: MUC.NGHIEM_TRONG,
        thongDiep: 'Không tìm thấy thẻ <html>.',
        cachSua: 'Trang phải có cấu trúc <!DOCTYPE html><html lang="vi">…</html>.',
      },
    ]
  }
  const lang = thuocTinh(the.the, 'lang')
  if (!lang) {
    return [
      {
        muc: MUC.CAN_SUA,
        dong: dongTai(html, the.index),
        thongDiep: 'Thẻ <html> thiếu thuộc tính lang.',
        cachSua:
          'Đặt <html lang="vi">. Thiếu lang thì trình đọc màn hình đọc sai giọng và Google khó xác định ngôn ngữ trang.',
      },
    ]
  }
  if (!/^vi\b/i.test(lang) && !/^en\b/i.test(lang)) {
    return [
      {
        muc: MUC.NEN_CAI_THIEN,
        dong: dongTai(html, the.index),
        thongDiep: `Thuộc tính lang="${lang}" không phải vi hoặc en.`,
        cachSua: 'Trang tiếng Việt dùng lang="vi"; trang tiếng Anh dùng lang="en".',
      },
    ]
  }
  return []
})

luat('charset', NHOM.KY_THUAT, ({ html }) => {
  const co = layThe(html, 'meta').some(
    ({ the }) => coThuocTinh(the, 'charset') || /http-equiv\s*=\s*["']?content-type/i.test(the),
  )
  return co
    ? []
    : [
        {
          muc: MUC.NGHIEM_TRONG,
          thongDiep: 'Thiếu khai báo bảng mã.',
          cachSua:
            'Thêm <meta charset="utf-8"> ngay đầu <head>. Thiếu dòng này, tiếng Việt có dấu dễ hiển thị thành ký tự lỗi.',
        },
      ]
})

luat('viewport', NHOM.KY_THUAT, ({ html }) => {
  const v = metaTheo(html, 'name', 'viewport')
  if (!v) {
    return [
      {
        muc: MUC.NGHIEM_TRONG,
        thongDiep: 'Thiếu meta viewport — trang sẽ vỡ trên điện thoại.',
        cachSua: 'Thêm <meta name="viewport" content="width=device-width, initial-scale=1">.',
      },
    ]
  }
  if (/user-scalable\s*=\s*no|maximum-scale\s*=\s*1\b/i.test(v)) {
    return [
      {
        muc: MUC.CAN_SUA,
        thongDiep: 'Viewport đang chặn người dùng phóng to.',
        cachSua: 'Bỏ user-scalable=no và maximum-scale=1 — người lớn tuổi cần phóng to để đọc.',
      },
    ]
  }
  return []
})

luat('favicon', NHOM.KY_THUAT, ({ html }) => {
  const co = layThe(html, 'link').some(({ the }) => {
    const rel = (thuocTinh(the, 'rel') || '').toLowerCase()
    return rel.includes('icon')
  })
  return co
    ? []
    : [
        {
          muc: MUC.NEN_CAI_THIEN,
          thongDiep: 'Chưa có favicon.',
          cachSua:
            'Thêm <link rel="icon" href="/favicon.svg">. Tab trình duyệt không logo trông thiếu chuyên nghiệp khi phụ huynh mở nhiều tab so sánh trung tâm.',
        },
      ]
})

luat('id-trung', NHOM.KY_THUAT, ({ html }) => {
  const dem = new Map()
  const re = /\bid\s*=\s*("([^"]*)"|'([^']*)')/gi
  let m
  while ((m = re.exec(html)) !== null) {
    const id = (m[2] ?? m[3] ?? '').trim()
    if (!id) continue
    if (!dem.has(id)) dem.set(id, [])
    dem.get(id).push(dongTai(html, m.index))
  }
  return [...dem.entries()]
    .filter(([, dongs]) => dongs.length > 1)
    .map(([id, dongs]) => ({
      muc: MUC.CAN_SUA,
      dong: dongs[1],
      thongDiep: `id="${id}" bị lặp ${dongs.length} lần (dòng ${dongs.join(', ')}).`,
      cachSua:
        'id phải là duy nhất. Trùng id làm hỏng liên kết neo, label và JavaScript truy vấn phần tử.',
    }))
})

// --- Tìm kiếm & chia sẻ ----------------------------------------------------

luat('title', NHOM.TIM_KIEM, ({ html }) => {
  const m = html.match(/<title\b[^>]*>([\s\S]*?)<\/title\s*>/i)
  const noiDung = m ? m[1].replace(/\s+/g, ' ').trim() : ''
  if (!noiDung) {
    return [
      {
        muc: MUC.NGHIEM_TRONG,
        thongDiep: 'Thiếu <title> hoặc <title> rỗng.',
        cachSua:
          'Đây là dòng chữ Google hiển thị đầu tiên. Ví dụ: "Ms.Ngọc Elite English — Tiếng Anh giao tiếp online 1 kèm 1".',
      },
    ]
  }
  const ra = []
  if (noiDung.length < 15) {
    ra.push({
      muc: MUC.CAN_SUA,
      dong: dongTai(html, m.index),
      thongDiep: `<title> quá ngắn (${noiDung.length} ký tự): "${noiDung}".`,
      cachSua: 'Viết 40–60 ký tự, có tên thương hiệu và điều trang này giải quyết.',
    })
  } else if (noiDung.length > 65) {
    ra.push({
      muc: MUC.NEN_CAI_THIEN,
      dong: dongTai(html, m.index),
      thongDiep: `<title> dài ${noiDung.length} ký tự — Google sẽ cắt bớt.`,
      cachSua: 'Rút còn dưới 60 ký tự, đưa từ khoá quan trọng lên trước.',
    })
  }
  if (/^(document|untitled|home|index|trang chủ)$/i.test(noiDung)) {
    ra.push({
      muc: MUC.NGHIEM_TRONG,
      dong: dongTai(html, m.index),
      thongDiep: `<title> còn là giá trị mặc định: "${noiDung}".`,
      cachSua: 'Thay bằng tiêu đề thật. Đây là lỗi lộ rõ nhất với người xem và với Google.',
    })
  }
  return ra
})

luat('mo-ta', NHOM.TIM_KIEM, ({ html }) => {
  const d = metaTheo(html, 'name', 'description')
  if (!d) {
    return [
      {
        muc: MUC.CAN_SUA,
        thongDiep: 'Thiếu meta description.',
        cachSua:
          'Thêm <meta name="description" content="…"> dài 120–160 ký tự. Đây là đoạn chào hàng hiện dưới tiêu đề trên Google.',
      },
    ]
  }
  if (d.length < 70) {
    return [
      {
        muc: MUC.NEN_CAI_THIEN,
        thongDiep: `meta description chỉ ${d.length} ký tự — chưa tận dụng hết chỗ.`,
        cachSua: 'Viết 120–160 ký tự, nêu đối tượng học, hình thức học và điểm khác biệt.',
      },
    ]
  }
  if (d.length > 170) {
    return [
      {
        muc: MUC.NEN_CAI_THIEN,
        thongDiep: `meta description dài ${d.length} ký tự — sẽ bị cắt.`,
        cachSua: 'Rút còn 120–160 ký tự, đặt thông tin quan trọng ở đầu.',
      },
    ]
  }
  return []
})

luat('canonical', NHOM.TIM_KIEM, ({ html }) => {
  const co = layThe(html, 'link').some(
    ({ the }) => (thuocTinh(the, 'rel') || '').toLowerCase() === 'canonical',
  )
  return co
    ? []
    : [
        {
          muc: MUC.NEN_CAI_THIEN,
          thongDiep: 'Thiếu link canonical.',
          cachSua:
            'Thêm <link rel="canonical" href="https://…">. Khi một trang truy cập được qua nhiều địa chỉ, canonical cho Google biết đâu là bản chính.',
        },
      ]
})

luat('chia-se-mang-xa-hoi', NHOM.TIM_KIEM, ({ html }) => {
  const thieu = []
  for (const key of ['og:title', 'og:description', 'og:image', 'og:type', 'og:url']) {
    if (!metaTheo(html, 'property', key) && !metaTheo(html, 'name', key)) thieu.push(key)
  }
  if (thieu.length === 0) return []
  const nang = thieu.includes('og:image') || thieu.includes('og:title')
  return [
    {
      muc: nang ? MUC.CAN_SUA : MUC.NEN_CAI_THIEN,
      thongDiep: `Thiếu thẻ Open Graph: ${thieu.join(', ')}.`,
      cachSua:
        'Thiếu og:image thì khi phụ huynh dán link vào Zalo hoặc Facebook, bài hiện ra trắng trơn không ảnh — mất tin tưởng ngay từ cú nhấp đầu. Ảnh nên 1200×630.',
    },
  ]
})

luat('du-lieu-co-cau-truc', NHOM.TIM_KIEM, ({ html, profile }) => {
  const khoi = [
    ...html.matchAll(
      /<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script\s*>/gi,
    ),
  ]
  if (khoi.length === 0) {
    return [
      {
        muc: MUC.CAN_SUA,
        thongDiep: 'Chưa có dữ liệu có cấu trúc (JSON-LD).',
        cachSua:
          profile === 'ca-nhan'
            ? 'Thêm schema.org Person (tên, nghề, bằng cấp, liên kết mạng xã hội) để Google hiểu đây là hồ sơ một người thật.'
            : 'Thêm schema.org EducationalOrganization kèm name, url, logo, sameAs, areaServed và contactPoint. Đây là cách nói cho Google biết đây là một trung tâm có thật.',
      },
    ]
  }
  const ra = []
  khoi.forEach((k, i) => {
    try {
      JSON.parse(k[1])
    } catch (e) {
      ra.push({
        muc: MUC.CAN_SUA,
        dong: dongTai(html, k.index),
        thongDiep: `Khối JSON-LD thứ ${i + 1} sai cú pháp JSON: ${e.message}`,
        cachSua:
          'JSON-LD hỏng bị Google bỏ qua hoàn toàn. Kiểm tra dấu phẩy thừa và dấu ngoặc kép.',
      })
    }
  })
  const gop = khoi.map((k) => k[1]).join(' ')
  const mong =
    profile === 'ca-nhan' ? 'Person' : 'EducationalOrganization|School|LocalBusiness|Organization'
  if (!new RegExp(`"@type"\\s*:\\s*"(${mong})"`, 'i').test(gop)) {
    ra.push({
      muc: MUC.NEN_CAI_THIEN,
      thongDiep: `Có JSON-LD nhưng chưa khai báo @type phù hợp (mong đợi: ${mong.split('|').join(' hoặc ')}).`,
      cachSua:
        'Khai đúng loại thực thể thì Google mới hiển thị được thông tin mở rộng trong kết quả tìm kiếm.',
    })
  }
  return ra
})

// --- Khả năng tiếp cận -----------------------------------------------------

luat('anh-thieu-alt', NHOM.TIEP_CAN, ({ html }) => {
  return layThe(html, 'img')
    .filter(({ the }) => !coThuocTinh(the, 'alt'))
    .map(({ the, index }) => ({
      muc: MUC.CAN_SUA,
      dong: dongTai(html, index),
      thongDiep: `Ảnh thiếu alt: ${thuocTinh(the, 'src') || the.slice(0, 60)}`,
      cachSua:
        'Thêm alt mô tả nội dung ảnh. Ảnh trang trí thuần tuý thì để alt="" (rỗng nhưng phải có). Google cũng đọc alt để hiểu ảnh.',
    }))
})

luat('tieu-de-cap-bac', NHOM.TIEP_CAN, ({ html }) => {
  const heads = [...html.matchAll(/<h([1-6])\b[^>]*>/gi)].map((m) => ({
    cap: Number(m[1]),
    index: m.index,
  }))
  const ra = []
  const h1 = heads.filter((h) => h.cap === 1)
  if (h1.length === 0) {
    ra.push({
      muc: MUC.CAN_SUA,
      thongDiep: 'Trang không có <h1>.',
      cachSua:
        'Mỗi trang cần đúng một <h1> nói trang này là gì. Đây là tín hiệu mạnh nhất về chủ đề trang.',
    })
  } else if (h1.length > 1) {
    ra.push({
      muc: MUC.NEN_CAI_THIEN,
      dong: dongTai(html, h1[1].index),
      thongDiep: `Trang có ${h1.length} thẻ <h1>.`,
      cachSua: 'Giữ một <h1> duy nhất; các mục còn lại hạ xuống <h2>.',
    })
  }
  for (let i = 1; i < heads.length; i++) {
    const nhay = heads[i].cap - heads[i - 1].cap
    if (nhay > 1) {
      ra.push({
        muc: MUC.NEN_CAI_THIEN,
        dong: dongTai(html, heads[i].index),
        thongDiep: `Nhảy cấp tiêu đề: h${heads[i - 1].cap} → h${heads[i].cap}.`,
        cachSua:
          'Đi tuần tự h1 → h2 → h3. Người dùng trình đọc màn hình duyệt trang bằng danh sách tiêu đề; nhảy cấp làm họ tưởng thiếu nội dung.',
      })
    }
  }
  return ra
})

luat('lien-ket-khong-chu', NHOM.TIEP_CAN, ({ html }) => {
  const ra = []
  const re = /<a\b([^>]*)>([\s\S]*?)<\/a\s*>/gi
  let m
  while ((m = re.exec(html)) !== null) {
    const the = m[1]
    const chuTrong = chiLayChu(m[2])
    const coNhan =
      chuTrong.length > 0 ||
      thuocTinh(the, 'aria-label') ||
      thuocTinh(the, 'title') ||
      thuocTinh(the, 'aria-labelledby') ||
      /<img\b[^>]*\balt\s*=\s*("[^"]+"|'[^']+')/i.test(m[2])
    if (!coNhan) {
      ra.push({
        muc: MUC.CAN_SUA,
        dong: dongTai(html, m.index),
        thongDiep: 'Liên kết không có chữ nào để đọc (thường là nút biểu tượng).',
        cachSua:
          'Thêm aria-label="Facebook của trung tâm" chẳng hạn, hoặc cho ảnh bên trong một alt.',
      })
    }
  }
  return ra
})

luat('nut-khong-chu', NHOM.TIEP_CAN, ({ html }) => {
  const ra = []
  const re = /<button\b([^>]*)>([\s\S]*?)<\/button\s*>/gi
  let m
  while ((m = re.exec(html)) !== null) {
    const coNhan =
      chiLayChu(m[2]).length > 0 ||
      thuocTinh(m[1], 'aria-label') ||
      thuocTinh(m[1], 'aria-labelledby') ||
      thuocTinh(m[1], 'title')
    if (!coNhan) {
      ra.push({
        muc: MUC.CAN_SUA,
        dong: dongTai(html, m.index),
        thongDiep: 'Nút bấm không có nhãn đọc được.',
        cachSua: 'Thêm chữ bên trong nút, hoặc aria-label mô tả hành động ("Mở menu", "Đóng").',
      })
    }
  }
  return ra
})

luat('o-nhap-khong-nhan', NHOM.TIEP_CAN, ({ html }) => {
  const nhanFor = new Set(
    layThe(html, 'label')
      .map(({ the }) => thuocTinh(the, 'for'))
      .filter(Boolean),
  )
  const ra = []
  for (const tenThe of ['input', 'select', 'textarea']) {
    for (const { the, index } of layThe(html, tenThe)) {
      const loai = (thuocTinh(the, 'type') || '').toLowerCase()
      if (['hidden', 'submit', 'button', 'reset', 'image'].includes(loai)) continue
      const id = thuocTinh(the, 'id')
      const coNhan =
        (id && nhanFor.has(id)) ||
        thuocTinh(the, 'aria-label') ||
        thuocTinh(the, 'aria-labelledby') ||
        thuocTinh(the, 'title')
      if (!coNhan) {
        ra.push({
          muc: MUC.CAN_SUA,
          dong: dongTai(html, index),
          thongDiep: `Ô nhập <${tenThe}${loai ? ` type="${loai}"` : ''}> chưa có nhãn liên kết.`,
          cachSua:
            'Dùng <label for="id">…</label> khớp id, hoặc aria-label. Chỉ dùng placeholder là chưa đủ — chữ mờ biến mất ngay khi người ta bắt đầu gõ.',
        })
      }
    }
  }
  return ra
})

// --- Nội dung & uy tín -----------------------------------------------------

const MAU_CHO_TRONG = [
  { mau: /lorem ipsum/i, ten: 'văn bản giả Lorem ipsum' },
  { mau: /\bTODO\b|\bFIXME\b/, ten: 'ghi chú TODO/FIXME còn sót' },
  { mau: /coming soon|sắp ra mắt|đang cập nhật|đang xây dựng/i, ten: 'nội dung "đang cập nhật"' },
  { mau: /example\.com|yourdomain|your-domain|placeholder/i, ten: 'địa chỉ mẫu chưa thay' },
  { mau: /\bxxx+\b|\[\s*điền\s*\]|\{\{[^}]*\}\}/i, ten: 'chỗ trống chưa điền' },
  { mau: /0123456789|0000000000/, ten: 'số điện thoại mẫu' },
  {
    mau: /\[\s*CẦN\s+SỐ\s+THẬT[^\]]*\]/i,
    ten: 'dấu [CẦN SỐ THẬT] — con số chưa được thay bằng số thật',
  },
  // Chỗ trống dạng [SỐ], [CHỨNG CHỈ GIẢNG DẠY]: mở ngoặc, chữ hoa, không có chữ
  // thường nào tới khi đóng ngoặc. Không bắt [2026] hay [xem hình 3].
  { mau: /\[[A-ZĐ][^a-z\]\n]{1,60}\]/, ten: 'chỗ trống trong ngoặc vuông chưa điền' },
]

luat('noi-dung-cho-trong', NHOM.NOI_DUNG, ({ html, chu }) => {
  const ra = []
  for (const { mau, ten } of MAU_CHO_TRONG) {
    const m = chu.match(mau)
    if (m) {
      const viTri = html.search(mau)
      ra.push({
        muc: MUC.NGHIEM_TRONG,
        dong: viTri >= 0 ? dongTai(html, viTri) : undefined,
        thongDiep: `Còn ${ten} trên trang đang chạy: "${m[0]}".`,
        cachSua:
          'Phụ huynh đọc thấy chỗ chưa làm xong sẽ nghĩ trung tâm cũng làm dở dang. Thay bằng nội dung thật, hoặc ẩn hẳn khối đó tới khi có nội dung.',
      })
    }
  }
  return ra
})

luat('lien-ket-chet', NHOM.NOI_DUNG, ({ html }) => {
  const ra = []
  for (const { the, index } of layThe(html, 'a')) {
    const href = thuocTinh(the, 'href')
    if (href === null) continue
    if (href === '' || href === '#') {
      ra.push({
        muc: MUC.CAN_SUA,
        dong: dongTai(html, index),
        thongDiep: `Liên kết trỏ vào hư vô (href="${href}").`,
        cachSua:
          'Người bấm vào mà trang không đi đâu là mất niềm tin. Hoặc nối đúng địa chỉ, hoặc bỏ liên kết đó đi.',
      })
    }
    if (/^https?:\/\/(localhost|127\.0\.0\.1)/i.test(href)) {
      ra.push({
        muc: MUC.NGHIEM_TRONG,
        dong: dongTai(html, index),
        thongDiep: `Liên kết còn trỏ về máy lập trình: ${href}`,
        cachSua: 'Thay bằng địa chỉ thật trước khi phát hành.',
      })
    }
  }
  return ra
})

luat('kenh-lien-he', NHOM.NOI_DUNG, ({ html, chu }) => {
  const coDienThoai = /href\s*=\s*["']tel:/i.test(html) || /\b0\d{9}\b/.test(chu)
  const coEmail = /href\s*=\s*["']mailto:/i.test(html) || /[\w.+-]+@[\w-]+\.[\w.]+/.test(chu)
  const coNhanTin = /zalo|messenger|m\.me|facebook\.com|wa\.me|whatsapp/i.test(html)
  const co = [coDienThoai && 'điện thoại', coEmail && 'email', coNhanTin && 'nhắn tin'].filter(
    Boolean,
  )
  if (co.length === 0) {
    return [
      {
        muc: MUC.NGHIEM_TRONG,
        thongDiep: 'Không tìm thấy bất kỳ cách liên hệ nào trên trang.',
        cachSua:
          'Một trang trung tâm không có số điện thoại hay Zalo thì không thể ra học viên. Đặt ít nhất một kênh ở đầu trang và một ở chân trang.',
      },
    ]
  }
  if (co.length === 1) {
    return [
      {
        muc: MUC.NEN_CAI_THIEN,
        thongDiep: `Chỉ có một kênh liên hệ (${co[0]}).`,
        cachSua:
          'Mỗi người quen một kênh khác nhau. Có cả Zalo, điện thoại và biểu mẫu để lại số thì tỷ lệ liên hệ cao hơn hẳn.',
      },
    ]
  }
  return []
})

luat('bang-chung-uy-tin', NHOM.NOI_DUNG, ({ chu, profile }) => {
  if (profile === 'ca-nhan') return []
  const tinHieu = [
    {
      mau: /cảm nhận|học viên nói|phụ huynh nói|review|đánh giá|testimonial/i,
      ten: 'lời chứng thực của học viên',
    },
    { mau: /chứng chỉ|bằng cấp|IELTS|TESOL|CELTA|TKT|cử nhân|thạc sĩ/i, ten: 'bằng cấp giáo viên' },
    {
      mau: /lộ trình|giáo trình|khung năng lực|CEFR|đầu ra|cam kết học/i,
      ten: 'lộ trình và chuẩn đầu ra',
    },
    { mau: /học phí|chi phí|giá|buổi học|mức phí/i, ten: 'thông tin học phí' },
  ]
  return tinHieu
    .filter(({ mau }) => !mau.test(chu))
    .map(({ ten }) => ({
      muc: MUC.NEN_CAI_THIEN,
      thongDiep: `Trang chưa có ${ten}.`,
      cachSua:
        'Đây là bốn thứ phụ huynh tìm trước khi quyết định. Thiếu bất kỳ thứ nào là họ phải đi hỏi nơi khác — và thường không quay lại.',
    }))
})

const HUA_QUA_MUC = [
  /cam kết\s*100\s*%/i,
  /chắc chắn\s*(đậu|đỗ|thành công)/i,
  /giỏi\s*(sau|trong)\s*\d+\s*(ngày|tuần|tháng)/i,
  /tốt nhất việt nam/i,
  /số\s*1\s*(việt nam|thị trường|cả nước)/i,
  /duy nhất tại việt nam/i,
]

luat('hua-qua-muc', NHOM.NOI_DUNG, ({ html, chu }) => {
  const ra = []
  for (const mau of HUA_QUA_MUC) {
    const m = chu.match(mau)
    if (m) {
      const viTri = html.search(mau)
      ra.push({
        muc: MUC.CAN_SUA,
        dong: viTri >= 0 ? dongTai(html, viTri) : undefined,
        thongDiep: `Lời hứa không kiểm chứng được: "${m[0]}".`,
        cachSua:
          'Khẳng định tuyệt đối làm giảm uy tín chứ không tăng, và có thể vi phạm quy định quảng cáo. Thay bằng con số thật có nguồn: "32 trong 40 học viên khoá 2026 lên một bậc CEFR sau 24 buổi".',
      })
    }
  }
  return ra
})

luat('ielts-sai-thang-diem', NHOM.NOI_DUNG, ({ html, chu }) => {
  // Band 0 của IELTS nghĩa là "không dự thi", band 1 mới là trình độ thấp nhất.
  // Viết "IELTS: 0.0" như một điểm xuất phát là sai thang điểm.
  const mau = /IELTS[^.\n]{0,24}\b0\s*[.,]\s*0\b/i
  const m = chu.match(mau)
  if (!m) return []
  const viTri = html.search(mau)
  return [
    {
      muc: MUC.CAN_SUA,
      dong: viTri >= 0 ? dongTai(html, viTri) : undefined,
      thongDiep: `Sai thang điểm IELTS: "${m[0].trim()}".`,
      cachSua:
        'Band 0 của IELTS nghĩa là "không dự thi", không phải trình độ thấp nhất — band 1 mới là "Non user". ' +
        'Người biết IELTS đọc ra ngay. Viết "Luyện IELTS từ mất gốc đến mục tiêu 7.0" thay vì một khoảng số.',
    },
  ]
})

luat('do-day-noi-dung', NHOM.NOI_DUNG, ({ chu }) => {
  const soTu = chu.split(/\s+/).filter(Boolean).length
  if (soTu < 120) {
    return [
      {
        muc: MUC.CAN_SUA,
        thongDiep: `Trang chỉ có khoảng ${soTu} từ nội dung đọc được.`,
        cachSua:
          'Quá mỏng để Google xếp hạng và quá mỏng để người đọc tin. Một trang giới thiệu trung tâm nên có ít nhất 400–600 từ nội dung thật.',
      },
    ]
  }
  return []
})

// --- An toàn ---------------------------------------------------------------

luat('noi-dung-hon-hop', NHOM.AN_TOAN, ({ html }) => {
  const ra = []
  const re = /\b(src|href)\s*=\s*["'](http:\/\/[^"']+)["']/gi
  let m
  while ((m = re.exec(html)) !== null) {
    ra.push({
      muc: MUC.CAN_SUA,
      dong: dongTai(html, m.index),
      thongDiep: `Tài nguyên tải qua http không mã hoá: ${m[2]}`,
      cachSua:
        'Trình duyệt chặn hoặc cảnh báo "không an toàn" trên trang https. Đổi sang https://.',
    })
  }
  return ra
})

luat('target-blank', NHOM.AN_TOAN, ({ html }) => {
  const ra = []
  for (const { the, index } of layThe(html, 'a')) {
    if ((thuocTinh(the, 'target') || '').toLowerCase() !== '_blank') continue
    const rel = (thuocTinh(the, 'rel') || '').toLowerCase()
    if (!rel.includes('noopener')) {
      ra.push({
        muc: MUC.NEN_CAI_THIEN,
        dong: dongTai(html, index),
        thongDiep: `Liên kết mở tab mới nhưng thiếu rel="noopener": ${thuocTinh(the, 'href') || ''}`,
        cachSua: 'Thêm rel="noopener noreferrer" để trang đích không can thiệp được vào tab gốc.',
      })
    }
  }
  return ra
})

// --- Hiệu năng -------------------------------------------------------------

luat('anh-thieu-kich-thuoc', NHOM.HIEU_NANG, ({ html }) => {
  return layThe(html, 'img')
    .filter(({ the }) => {
      if (coThuocTinh(the, 'width') && coThuocTinh(the, 'height')) return false
      const style = thuocTinh(the, 'style') || ''
      return !(/\bwidth\s*:/i.test(style) && /\baspect-ratio\s*:/i.test(style))
    })
    .map(({ the, index }) => ({
      muc: MUC.NEN_CAI_THIEN,
      dong: dongTai(html, index),
      thongDiep: `Ảnh chưa khai kích thước: ${thuocTinh(the, 'src') || the.slice(0, 60)}`,
      cachSua:
        'Thêm width và height. Thiếu hai thuộc tính này, trang giật nhảy khi ảnh tải xong — người đang đọc bị mất dòng, và Google chấm điểm trải nghiệm thấp.',
    }))
})

luat('anh-khong-tai-lui', NHOM.HIEU_NANG, ({ html }) => {
  const anh = layThe(html, 'img')
  if (anh.length <= 3) return []
  const thieu = anh.slice(3).filter(({ the }) => (thuocTinh(the, 'loading') || '') !== 'lazy')
  if (thieu.length === 0) return []
  return [
    {
      muc: MUC.NEN_CAI_THIEN,
      dong: dongTai(html, thieu[0].index),
      thongDiep: `${thieu.length} ảnh nằm dưới màn hình đầu nhưng vẫn tải ngay.`,
      cachSua:
        'Thêm loading="lazy" cho ảnh từ vị trí thứ tư trở đi. Trên 3G ở quê, đây là khác biệt giữa trang mở được và người dùng bỏ đi.',
    },
  ]
})

luat('script-chan-ve', NHOM.HIEU_NANG, ({ html }) => {
  const head = (html.match(/<head\b[\s\S]*?<\/head\s*>/i) || [''])[0]
  const ra = []
  for (const { the, index } of layThe(head, 'script')) {
    const src = thuocTinh(the, 'src')
    if (!src) continue
    if (
      !coThuocTinh(the, 'defer') &&
      !coThuocTinh(the, 'async') &&
      (thuocTinh(the, 'type') || '') !== 'module'
    ) {
      ra.push({
        muc: MUC.NEN_CAI_THIEN,
        dong: dongTai(html, html.indexOf(the, index)),
        thongDiep: `Script trong <head> chặn hiển thị: ${src}`,
        cachSua: 'Thêm defer (hoặc async nếu độc lập) để trang hiện chữ trước, chạy mã sau.',
      })
    }
  }
  return ra
})

luat('trang-nang', NHOM.HIEU_NANG, ({ html }) => {
  const kb = Math.round(Buffer.byteLength(html, 'utf8') / 1024)
  if (kb > 300) {
    return [
      {
        muc: MUC.NEN_CAI_THIEN,
        thongDiep: `Riêng phần HTML đã nặng ${kb} KB.`,
        cachSua:
          'Tách CSS và JS ra tệp riêng để trình duyệt lưu đệm giữa các trang, thay vì nhúng hết vào HTML.',
      },
    ]
  }
  return []
})

// ---------------------------------------------------------------------------
// Chạy
// ---------------------------------------------------------------------------

function doanProfile(nhan) {
  return /folio|portfolio|ca-nhan|cv|hoso/i.test(nhan) ? 'ca-nhan' : 'trung-tam'
}

async function layNguon(muc) {
  // URL
  if (/^https?:\/\//i.test(muc)) {
    const res = await fetch(muc, {
      redirect: 'follow',
      headers: { 'user-agent': 'MNEE-web-audit/1.0' },
    })
    if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`)
    return [{ nhan: muc, html: await res.text() }]
  }
  // Tệp hoặc thư mục
  const tt = await stat(muc)
  if (tt.isFile()) {
    return [{ nhan: muc, html: await readFile(muc, 'utf8') }]
  }
  const ten = await readdir(muc, { recursive: true })
  const nguon = []
  for (const t of ten) {
    if (!/\.html?$/i.test(t)) continue
    const p = path.join(muc, t)
    nguon.push({ nhan: p, html: await readFile(p, 'utf8') })
  }
  if (nguon.length === 0) throw new Error(`Không tìm thấy tệp .html nào trong ${muc}`)
  return nguon
}

function soi({ nhan, html }, profile) {
  const chu = chiLayChu(html)
  const boiCanh = { html, chu, nhan, profile }
  const phatHien = []
  for (const { ma, nhom, ham } of LUAT) {
    let ket
    try {
      ket = ham(boiCanh) || []
    } catch (e) {
      ket = [
        {
          muc: MUC.NEN_CAI_THIEN,
          thongDiep: `Luật "${ma}" gặp lỗi khi chạy: ${e.message}`,
          cachSua: 'Báo lỗi này cho người bảo trì công cụ soi.',
        },
      ]
    }
    for (const p of ket) phatHien.push({ ma, nhom, ...p })
  }
  return { nhan, profile, phatHien }
}

function inBaoCao(ketQua, { quiet }) {
  for (const { nhan, profile, phatHien } of ketQua) {
    console.log(`\n${'='.repeat(72)}`)
    console.log(`  ${nhan}   [hồ sơ: ${profile}]`)
    console.log('='.repeat(72))

    if (phatHien.length === 0) {
      console.log('\n  Không phát hiện vấn đề nào. Vẫn nên kiểm tra thủ công theo')
      console.log('  docs/website/DANH-MUC-KIEM-TRA.md.\n')
      continue
    }

    if (!quiet) {
      for (const muc of THU_TU_MUC) {
        const nhomMuc = phatHien.filter((p) => p.muc === muc)
        if (nhomMuc.length === 0) continue
        console.log(
          `\n── ${NHAN_MUC[muc]} (${nhomMuc.length}) ${'─'.repeat(Math.max(0, 50 - NHAN_MUC[muc].length))}`,
        )
        for (const p of nhomMuc) {
          const viTri = p.dong ? ` (dòng ${p.dong})` : ''
          console.log(`\n  [${p.nhom}] ${p.thongDiep}${viTri}`)
          console.log(`      → ${p.cachSua}`)
          console.log(`      mã luật: ${p.ma}`)
        }
      }
    }

    console.log(`\n── Tổng kết ${'─'.repeat(50)}`)
    for (const muc of THU_TU_MUC) {
      const n = phatHien.filter((p) => p.muc === muc).length
      console.log(`  ${NHAN_MUC[muc].padEnd(16)} ${n}`)
    }
    console.log('')
  }
}

async function main() {
  const args = process.argv.slice(2)
  const co = (c) => args.includes(c)
  const muc = args.filter((a) => !a.startsWith('--'))

  if (muc.length === 0) {
    console.error(
      'Cách dùng: node scripts/web-audit/audit.mjs <url | tệp .html | thư mục> [--json] [--quiet] [--profile=trung-tam|ca-nhan]',
    )
    process.exit(2)
  }

  const epProfile = args.find((a) => a.startsWith('--profile='))
  const ketQua = []

  for (const m of muc) {
    let nguon
    try {
      nguon = await layNguon(m)
    } catch (e) {
      console.error(`Không đọc được "${m}": ${e.message}`)
      if (/fetch failed|EGRESS|403/i.test(e.message)) {
        console.error(
          '  Nếu đang chạy trong môi trường bị chặn mạng, hãy tải trang về tệp .html rồi soi tệp đó.',
        )
      }
      process.exitCode = 2
      continue
    }
    const profile = epProfile ? epProfile.split('=')[1] : doanProfile(m)
    for (const n of nguon) ketQua.push(soi(n, profile))
  }

  if (ketQua.length === 0) process.exit(process.exitCode || 2)

  if (co('--json')) {
    console.log(JSON.stringify(ketQua, null, 2))
  } else {
    inBaoCao(ketQua, { quiet: co('--quiet') })
  }

  const coNghiemTrong = ketQua.some((k) => k.phatHien.some((p) => p.muc === MUC.NGHIEM_TRONG))
  process.exit(coNghiemTrong ? 1 : process.exitCode || 0)
}

main().catch((e) => {
  console.error(e)
  process.exit(2)
})
