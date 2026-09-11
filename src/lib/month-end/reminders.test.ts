/**
 * Kiểm thử luật nhắc học phí.
 *
 *     npm run test:unit
 *
 * Đây là logic tiền: nhắc sai thì hoặc phụ huynh bị nhắc khi đã đóng đủ, hoặc
 * học viên học vượt gói mà không ai biết. Mỗi luật trong `pickReminders` có một
 * ca kiểm ở đây, kèm ca xác nhận thứ tự ưu tiên giữa các luật.
 */
import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { pickReminders, soanTinNhac, type ReminderBalance } from './reminders.ts'

const goi = (over: Partial<ReminderBalance> = {}): ReminderBalance => ({
  enrollment_id: 'e1',
  student_id: 's1',
  enrollment_code: 'ABC-PH',
  billing_mode: 'prepaid_package',
  lessons_remaining: 10,
  outstanding_amount: 0,
  price_per_lesson: 250_000,
  payer_name: 'Hoàng Uyên',
  ...over,
})

const chay = (balances: ReminderBalance[], statements: Parameters<typeof pickReminders>[0]['statements'] = []) =>
  pickReminders({ balances, statements, monthLabel: '08/2026', alertLessonsRemaining: 2 })

describe('pickReminders — gói trả trước', () => {
  it('còn nhiều buổi thì không nhắc', () => {
    assert.equal(chay([goi({ lessons_remaining: 10 })]).length, 0)
  })

  it('còn đúng ngưỡng thì nhắc, chưa coi là hết tiền', () => {
    const [r] = chay([goi({ lessons_remaining: 2 })])
    assert.equal(r.ly_do, 'Còn 2 buổi')
    assert.equal(r.gap, false)
  })

  it('hết buổi thì nhắc và đánh dấu hết tiền', () => {
    const [r] = chay([goi({ lessons_remaining: 0 })])
    assert.equal(r.ly_do, 'Còn 0 buổi')
    assert.equal(r.gap, true)
  })

  it('học vượt gói thì báo đúng số buổi vượt, không báo số âm', () => {
    const [r] = chay([goi({ lessons_remaining: -3 })])
    assert.equal(r.ly_do, 'Đã học vượt 3 buổi')
    assert.equal(r.gap, true)
  })

  it('chuỗi số từ PostgREST được hiểu như số, không so sánh theo chữ', () => {
    // numeric của Postgres về JSON là chuỗi. So chuỗi thì '10' <= 2 là false
    // nhưng '-3' < 0 cũng false — bỏ sót đúng ca nguy hiểm nhất.
    const [r] = chay([goi({ lessons_remaining: '-3' })])
    assert.equal(r.ly_do, 'Đã học vượt 3 buổi')
  })
})

describe('pickReminders — trả sau theo tháng', () => {
  const sau = goi({ billing_mode: 'monthly_postpaid', lessons_remaining: null })

  it('chưa lập phiếu tháng là lỗ hổng phải nhắc cô lập phiếu', () => {
    const [r] = chay([sau])
    assert.equal(r.ly_do, 'Chưa lập phiếu tháng 08/2026')
    assert.equal(r.gap, true)
  })

  it('phiếu đã thu đủ thì không nhắc', () => {
    const out = chay([sau], [
      { enrollment_id: 'e1', status: 'paid', net_amount: 1_000_000, paid_amount: 1_000_000 },
    ])
    assert.equal(out.length, 0)
  })

  it('phiếu thu một phần thì nhắc đúng số còn thiếu', () => {
    const [r] = chay([sau], [
      { enrollment_id: 'e1', status: 'partial', net_amount: 1_000_000, paid_amount: 400_000 },
    ])
    assert.match(r.ly_do, /còn thiếu/)
    assert.match(r.ly_do, /600/)
  })

  it('phiếu chưa đánh dấu paid nhưng tiền đã đủ thì không nhắc', () => {
    // Trạng thái phiếu có thể chậm một nhịp so với tiền đã về. Nhắc theo số
    // tiền, không nhắc theo nhãn trạng thái.
    const out = chay([sau], [
      { enrollment_id: 'e1', status: 'issued', net_amount: 1_000_000, paid_amount: 1_000_000 },
    ])
    assert.equal(out.length, 0)
  })
})

describe('pickReminders — thứ tự ưu tiên', () => {
  it('một hợp đồng chỉ sinh một lý do', () => {
    // Vừa sắp hết buổi vừa còn công nợ: chỉ ra một dòng, để tin nhắn không kể
    // hai chuyện cùng lúc.
    const out = chay([goi({ lessons_remaining: 1, outstanding_amount: 500_000 })])
    assert.equal(out.length, 1)
    assert.equal(out[0].ly_do, 'Còn 1 buổi')
  })

  it('gói còn nhiều buổi nhưng còn nợ thì vẫn nhắc vì nợ', () => {
    const [r] = chay([goi({ lessons_remaining: 10, outstanding_amount: 500_000 })])
    assert.match(r.ly_do, /Công nợ/)
    assert.equal(r.gap, false)
  })

  it('hợp đồng chưa xác định cách đóng mà không nợ thì bỏ qua', () => {
    assert.equal(chay([goi({ billing_mode: 'undetermined', outstanding_amount: 0 })]).length, 0)
  })

  it('phiếu của hợp đồng khác không bị gán sai chỗ', () => {
    const out = chay(
      [goi({ enrollment_id: 'e1', billing_mode: 'monthly_postpaid', lessons_remaining: null })],
      [{ enrollment_id: 'e2', status: 'paid', net_amount: 1_000_000, paid_amount: 1_000_000 }],
    )
    assert.equal(out[0].ly_do, 'Chưa lập phiếu tháng 08/2026')
  })
})

describe('soanTinNhac', () => {
  const base = {
    hocVien: 'Bé Ngân',
    nguoiDong: 'Hoàng Uyên',
    lyDo: 'Còn 1 buổi',
    soBuoiConLai: 1,
    donGia: 190_000,
    congNo: 0,
    traTruoc: true,
  }

  it('gọi tên người đóng tiền, không gọi tên học viên', () => {
    const t = soanTinNhac(base)
    assert.match(t.split('\n')[0], /Hoàng Uyên/)
  })

  it('không biết người đóng thì xưng hô trung tính, không để trống', () => {
    const t = soanTinNhac({ ...base, nguoiDong: null })
    assert.equal(t.split('\n')[0], 'Dạ chào anh/chị,')
    assert.ok(!t.includes('undefined') && !t.includes('null'))
  })

  it('học vượt gói thì nói số buổi dương và không gây áp lực đòi tiền', () => {
    const t = soanTinNhac({ ...base, soBuoiConLai: -3 })
    assert.match(t, /học vượt 3 buổi/)
    assert.ok(!t.includes('-3'))
    assert.match(t, /vẫn giữ lịch học bình thường/)
  })

  it('trả sau có công nợ thì nêu đúng số tiền cần thanh toán', () => {
    const t = soanTinNhac({ ...base, traTruoc: false, soBuoiConLai: null, congNo: 600_000 })
    assert.match(t, /cần thanh toán/)
    assert.match(t, /600/)
  })

  it('không nêu đơn giá khi hệ thống chưa có đơn giá', () => {
    const t = soanTinNhac({ ...base, donGia: 0 })
    assert.ok(!t.includes('/buổi'))
  })
})

describe('ảnh chụp dữ liệu thật', () => {
  // Giữ lại ảnh chụp này làm kiểm thử hồi quy: nó bắt được đúng loại lỗi mà
  // dữ liệu bịa không bắt được — numeric của Postgres về JSON dưới dạng CHUỖI,
  // nên mọi phép so sánh số phải đi qua Number() trước.
  
  // 17 hợp đồng đang hiệu lực, lấy nguyên văn từ v_enrollment_balances của CSDL
  // thật lúc 11/09/2026. numeric của Postgres về JSON dưới dạng CHUỖI.
  const real = [
    ['HD260005','prepaid_package','10.00','2190000.00','219000.00'],
    ['HD260006','prepaid_package','10.00','2190000.00','219000.00'],
    ['HD260013','prepaid_package','10.00','2500000.00','250000.00'],
    ['HD260016','prepaid_package','10.00','2490000.00','249000.00'],
    ['HD260017','prepaid_package','10.00','2190000.00','219000.00'],
    ['HD260018','prepaid_package','10.00','3000000.00','300000.00'],
    ['HD260019','prepaid_package','10.00','2800000.00','280000.00'],
    ['HD260020','prepaid_package','10.00','2500000.00','250000.00'],
    ['HD260001','monthly_postpaid',null,'0','190000.00'],
    ['HD260002','monthly_postpaid',null,'0','190000.00'],
    ['HD260003','monthly_postpaid',null,'0','190000.00'],
    ['HD260004','monthly_postpaid',null,'0','190000.00'],
    ['HD260007','monthly_postpaid',null,'0','190000.00'],
    ['HD260008','monthly_postpaid',null,'0','249000.00'],
    ['HD260009','monthly_postpaid',null,'0','260000.00'],
    ['HD260010','monthly_postpaid',null,'0','360000.00'],
    ['HD260012','undetermined',null,'0','249000.00'],
  ].map(([code, mode, rem, out, price], i) => ({
    enrollment_id: `e${i}`, student_id: `s${i}`, enrollment_code: code as string,
    billing_mode: mode as 'prepaid_package' | 'monthly_postpaid' | 'undetermined',
    lessons_remaining: rem as string | null, outstanding_amount: out as string,
    price_per_lesson: price as string, payer_name: null,
  }))
  
  it('dữ liệu thật: 16/17 hợp đồng cần nhắc, hợp đồng chưa xác định bị bỏ qua', () => {
    const out = pickReminders({
      balances: real, statements: [], monthLabel: '08/2026', alertLessonsRemaining: 2,
    })
    assert.equal(out.length, 16)
    assert.ok(!out.some((r) => r.balance.enrollment_code === 'HD260012'))
  
    const prepaid = out.filter((r) => r.balance.billing_mode === 'prepaid_package')
    assert.equal(prepaid.length, 8)
    // Gói còn 10 buổi nhưng chưa thu tiền -> nhắc vì công nợ, không vì hết buổi.
    assert.ok(prepaid.every((r) => r.ly_do.startsWith('Công nợ')), prepaid.map(r=>r.ly_do).join('|'))
    assert.ok(prepaid.every((r) => r.gap === false))
  
    const postpaid = out.filter((r) => r.balance.billing_mode === 'monthly_postpaid')
    assert.equal(postpaid.length, 8)
    assert.ok(postpaid.every((r) => r.ly_do === 'Chưa lập phiếu tháng 08/2026' && r.gap))
  
    // Số tiền trong lý do phải là số thật, không phải NaN hay "0".
    assert.match(out.find((r) => r.balance.enrollment_code === 'HD260018')!.ly_do, /3\.000\.000/)
  })
  
  it('dữ liệu thật: mọi tin nhắn soạn ra đều sạch, không lọt null/NaN', () => {
    const out = pickReminders({
      balances: real, statements: [], monthLabel: '08/2026', alertLessonsRemaining: 2,
    })
    for (const r of out) {
      const t = soanTinNhac({
        hocVien: 'Bé A', nguoiDong: r.balance.payer_name, lyDo: r.ly_do,
        soBuoiConLai: r.balance.lessons_remaining === null ? null : Number(r.balance.lessons_remaining),
        donGia: Number(r.balance.price_per_lesson ?? 0),
        congNo: Number(r.balance.outstanding_amount ?? 0),
        traTruoc: r.balance.billing_mode === 'prepaid_package',
      })
      assert.ok(!/NaN|undefined|null|—/.test(t), `${r.balance.enrollment_code}: ${t}`)
      assert.match(t, /^Dạ chào anh\/chị,/)
    }
  })
})
