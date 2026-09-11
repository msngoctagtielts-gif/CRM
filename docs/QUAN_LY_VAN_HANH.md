# Cách các nơi khác quản lý buổi dạy và trả lương — và MNEE nên làm gì

*Nghiên cứu ngày 11/09/2026. Đọc cùng `DECISIONS.md`.*

---

## 1. Kết luận

Mô hình hiện tại của trung tâm — *giáo viên tự ghi số buổi và ngày giờ vào
feedback, trung tâm căn cứ vào đó trả tiền* — có **một lỗ hổng kiểm soát**:
người được trả tiền là nhân chứng duy nhất cho việc buổi học đã diễn ra. Các nền
tảng dạy trực tuyến lớn đều không làm như vậy; họ luôn có **nguồn xác nhận thứ
hai** trước khi tiền chuyển đi. Hệ thống vừa xây đã bịt phần lớn lỗ hổng này về
mặt kỹ thuật, nhưng còn **một việc thuộc về thói quen vận hành** mà phần mềm
không làm thay được, và **một nghĩa vụ thuế** nằm ngoài phần mềm mà trung tâm
nhiều khả năng đang bỏ sót.

---

## 2. Bằng chứng

> ### ⚠ Giới hạn của đợt nghiên cứu này
>
> Môi trường làm việc của tôi **bị chặn truy cập gần hết trang gốc** tôi cần đọc
> (Preply, italki, thuvienphapluat, meinvoice đều trả về `EGRESS_BLOCKED`). Vì
> vậy các phát hiện dưới đây dựa trên **bản tóm tắt của công cụ tìm kiếm** về
> những trang đó, không phải bản thân trang gốc. Theo đúng nguyên tắc của trung
> tâm, tôi hạ mức bằng chứng xuống **B** và ghi rõ ở đây thay vì lờ đi.
>
> **Riêng mục thuế, cô cần hỏi lại kế toán trước khi làm theo.**

| # | Khẳng định | Mức | Nguồn | Ngày | Điều gì làm đổi kết luận |
|---|---|:--:|---|---|---|
| 1 | Trên Preply, buổi học chỉ được xác nhận sau khi hết giờ đã hẹn; dạy trong lớp học của nền tảng thì **tự xác nhận sau 15 phút**, dạy ngoài thì **tự xác nhận sau 72 giờ** nếu không ai khiếu nại | B | Trang trợ giúp Preply (đọc qua bản tóm tắt) | 11/09/2026 | Preply đổi chính sách |
| 2 | Trên italki, **buổi học chưa được trả tiền cho tới khi hết giờ và buổi học được xác nhận** | B | Trang trợ giúp italki (đọc qua bản tóm tắt) | 11/09/2026 | italki đổi chính sách |
| 3 | Phần mềm quản lý trung tâm (Teachworks, Pike13) lấy **cùng một bản ghi buổi học** để vừa xuất hoá đơn cho phụ huynh vừa tính lương giáo viên | B | Trang sản phẩm của hãng — **là tài liệu tiếp thị, bên bán có lợi khi nói hay** | 11/09/2026 | Đọc được tài liệu kỹ thuật thay vì trang bán hàng |
| 4 | Tổ chức trả tiền cho cá nhân **không ký hợp đồng lao động hoặc ký dưới 3 tháng**, mỗi lần trả **từ 2.000.000 ₫ trở lên**, phải **khấu trừ 10% thuế TNCN** trước khi trả. Căn cứ: **Thông tư 111/2013/TT-BTC** (ban hành 15/08/2013, hiệu lực 01/10/2013), Điều 25, khoản 1, điểm i | B | Nhiều nguồn kế toán độc lập cùng dẫn đúng một điều khoản; ngày ban hành và hiệu lực khớp với cổng thông tin Chính phủ. **Không đọc được toàn văn bản gốc** | 11/09/2026 | Đọc toàn văn, hoặc có văn bản sửa đổi mới |
| 5 | Cá nhân đủ điều kiện (cư trú, một nguồn thu nhập duy nhất, ước tính chưa đến mức phải nộp thuế) có thể làm **cam kết mẫu 08/CK-TNCN** để tạm chưa bị khấu trừ | B | Cùng nhóm nguồn trên | 11/09/2026 | như trên |
| 6 | Mô hình hiện tại của MNEE: giáo viên ghi số buổi + ngày giờ vào feedback, trung tâm trả tiền theo đó | D | Founder mô tả | 11/09/2026 | — |
| 7 | Hệ thống đã xây **từ chối sinh buổi tính lương** nếu thiếu giờ dạy hoặc chưa điểm danh đủ học viên | C | Mã nguồn `fn_generate_payable_lesson`, có kiểm thử tự động | 11/09/2026 | — |
| 8 | Doanh thu học phí và tiền lương giáo viên đều sinh ra từ **cùng một dòng buổi học** nên không thể lệch nhau | C | `lesson_consumptions` và `teacher_payable_lessons`, có kiểm thử | 11/09/2026 | — |
| 9 | Kỳ lương **đã trả rồi thì không sửa lại được** kể cả khi báo cáo thay đổi về sau | C | Kiểm thử mục 11e | 11/09/2026 | — |

### Điều rút ra từ mục 1–3

Ba nguồn khác nhau, cùng một nguyên tắc: **người được trả tiền không bao giờ là
nhân chứng duy nhất.** Preply và italki dùng học viên hoặc nhật ký lớp học của
chính nền tảng. Phần mềm quản lý trung tâm thì buộc điểm danh trước, rồi mới cho
buổi học chảy sang cả hoá đơn lẫn bảng lương.

Đây không phải chuyện nghi ngờ giáo viên. Đây là chuyện: khi chỉ có một nguồn
ghi nhận, **một lỗi gõ nhầm cũng không ai phát hiện ra** — và người chịu thiệt
có thể là chính giáo viên, nếu họ ghi thiếu một buổi.

---

## 3. Bốn rủi ro của mô hình hiện tại

| # | Rủi ro | Hệ thống đã xử lý chưa |
|---|---|---|
| 1 | **Một nguồn ghi nhận duy nhất.** Không ai đối chiếu số buổi giáo viên khai | 🟡 Một phần — xem mục 4.1 |
| 2 | **Số buổi trả lương và số buổi thu học phí trôi lệch nhau.** Trả lương 9 buổi trong khi chỉ trừ học phí 8 buổi; một năm, hai mươi học viên, sai số cộng dồn | ✅ Đã xử lý triệt để |
| 3 | **Không có mốc chốt sổ.** "Giáo viên cập nhật feedback" — cập nhật đến bao giờ thì chốt? Chưa chốt thì con số còn đổi được sau khi đã trả tiền | ✅ Đã xử lý |
| 4 | **Nghĩa vụ khấu trừ thuế TNCN.** Hai trong bốn giáo viên đang dạy có mức chi trả vượt ngưỡng 2 triệu — xem bảng ở mục 3.1 | ❌ Nằm ngoài phần mềm |

### 3.1 Con số thật của trung tâm

*Dữ liệu nội bộ, tính từ lịch học đã nhập, ngày 11/09/2026.*

> **Đây là ước tính từ LỊCH, không phải số buổi đã dạy thật.** Trung tâm chưa
> sinh buổi học nào trong hệ thống, và 5 lớp còn chưa có lịch. Con số thật sẽ
> khác. Dùng bảng này để thấy độ lớn, không dùng để tính lương.

| Giáo viên | Buổi/tuần | ~Buổi/tháng | Đơn giá 60 phút | ~Mỗi tháng | Vượt ngưỡng 2 triệu? |
|---|--:|--:|--:|--:|:--:|
| Ms. Phương | 18 | ~78 | 120.000 ₫ | ~9.360.000 ₫ | **Có** |
| Ms. Sheba | 8 | ~35 | 120.000 ₫ | ~4.160.000 ₫ | **Có** |
| Ms. Hòa | 3 | ~13 | 120.000 ₫ | ~1.560.000 ₫ | Không |
| Ms. Rose | 2 | ~9 | 120.000 ₫ | ~1.040.000 ₫ | Không |
| Mr. Kobe | 0 | 0 | 150.000 ₫ | 0 ₫ | — (lớp tạm ngưng) |
| Ms. Nhi | 0 | 0 | 120.000 ₫ | 0 ₫ | — (lớp tạm ngưng) |

*Ms. Phương còn có hai lớp đơn giá riêng: 140.000 ₫ (lớp Ms. Hoàng) và 160.000 ₫
(lớp Y Khoa), nên con số thật của cô ấy cao hơn bảng trên.*

Hai điều đọc ra được:

**Một — ngưỡng thuế phụ thuộc vào kỳ trả lương.** Quy định tính theo *mỗi lần chi
trả*, không theo tháng. Trả theo tháng thì Ms. Phương và Ms. Sheba vượt ngưỡng.
Trả theo tuần thì cả bốn người đều dưới ngưỡng. **Tôi không khuyên đổi kỳ trả
lương để né ngưỡng** — cơ quan thuế có xem xét trường hợp chia nhỏ nhiều lần
trong tháng. Đây là câu hỏi cho kế toán, không phải mẹo.

**Hai — trung tâm đang dồn quá nhiều vào một người.** Ms. Phương giữ **18 trên 31
buổi mỗi tuần** và 9 trên 20 lớp. Cô ấy nghỉ một tuần là gần nửa trung tâm dừng.
Đây là rủi ro vận hành lớn hơn cả chuyện thuế, và không có phần mềm nào chữa được
— chỉ có tuyển thêm hoặc san lớp.

### Vì sao rủi ro 2 đáng lo hơn vẻ ngoài

Trên Google Sheets, số buổi trả lương nằm ở sheet feedback của giáo viên, còn số
buổi trừ học phí nằm ở bảng giá. Hai con số **không có gì buộc chúng bằng nhau**.
Không ai cố tình làm sai, nhưng chúng vẫn sẽ lệch — vì hai người khác nhau gõ
vào hai chỗ khác nhau vào hai thời điểm khác nhau.

Hệ thống mới sinh cả hai từ **một dòng buổi học duy nhất**, nên chúng lệch nhau
là điều không thể xảy ra về mặt cấu trúc. Đây là thứ Teachworks và Pike13 cũng
làm, và là lý do chính đáng nhất để bỏ Google Sheets.

---

## 4. Đề xuất — bốn việc, xếp theo giá trị trên công sức

### 4.1 Thêm nguồn xác nhận thứ hai — *việc quan trọng nhất*

Hệ thống đã siết hơn Sheets một bậc: buổi học phải **có sẵn trong lịch**, giáo
viên phải **ghi giờ dạy thực tế** và **điểm danh từng học viên**, thiếu một thứ
là buổi đó không vào bảng lương. Nhưng cả ba thứ đó vẫn do giáo viên nhập.

Ba cách thêm nhân chứng, chọn theo sức của trung tâm:

| Cách | Công sức | Nhận xét |
|---|---|---|
| **Founder duyệt theo tuần** | Thấp — ước tính 15 phút mỗi tuần | **Khuyên làm ngay.** Không cần code thêm. Mỗi tuần mở trang Buổi học, đối chiếu với lịch, thấy bất thường thì hỏi ngay khi còn nhớ |
| **Link video là bằng chứng** | Đã có sẵn | Link video đã là 1 trong 6 tiêu chí chất lượng. Buổi nào có tranh cãi thì video là trọng tài |
| **Phụ huynh xác nhận** | Cao — phải làm cổng phụ huynh | Đây là cách Preply làm. Để Giai đoạn sau, chưa cần với 20 học viên |

Với 6 giáo viên và 20 học viên, **Founder duyệt theo tuần là đủ**. Quy mô này còn
nhỏ để một người nhìn hết. Đừng xây cổng phụ huynh chỉ để giải quyết việc này.

### 4.2 Chốt sổ cố định mỗi tháng

Đặt một ngày cố định — ví dụ **ngày 3 tháng sau** — là hạn cuối để giáo viên bổ
sung báo cáo tháng trước. Sau ngày đó Founder bấm tính bảng lương, duyệt, rồi trả.

Hệ thống đã buộc đúng thứ tự: *nháp → chờ duyệt → đã duyệt → đã trả*, và **kỳ đã
trả thì khoá cứng**, báo cáo sửa về sau cũng không làm đổi số tiền đã trả. Cái
còn thiếu chỉ là một ngày cố định trong đầu mọi người.

### 4.3 Hỏi kế toán về khấu trừ 10% thuế TNCN

Đây là việc duy nhất trong tài liệu này **nằm ngoài phần mềm** và có thể phát
sinh nghĩa vụ với cơ quan thuế.

Mang ba câu hỏi này đi hỏi kế toán:

1. Sáu giáo viên đang thuộc diện nào — hợp đồng lao động, hợp đồng dịch vụ, hay
   chưa có hợp đồng gì?
2. Với mức chi trả ở bảng mục 3.1 — cao nhất khoảng 9,4 triệu/tháng — trung tâm
   có phải khấu trừ 10% trước khi trả không, và tính theo mỗi lần trả hay theo
   tháng?
3. Giáo viên nào đủ điều kiện làm cam kết **08/CK-TNCN** để tạm chưa khấu trừ?

**Đừng tự quyết theo tài liệu này.** Tôi không đọc được bản gốc của Thông tư, và
tình trạng hợp đồng của từng giáo viên thì tôi không biết.

### 4.4 Giữ đúng thứ tự vận hành

```
Giáo viên nộp báo cáo  →  Founder chấm chất lượng  →  Tính bảng lương
                                                            ↓
                                              Duyệt  →  Đánh dấu đã trả
```

Hệ thống bắt buộc thứ tự này ở tầng cơ sở dữ liệu: không duyệt thì không đánh dấu
trả được, và giáo viên không tự duyệt lương của mình được (đã kiểm thử).

---

## 5. Điều **không** nên bắt chước trung tâm lớn

| Họ làm | Vì sao MNEE không nên |
|---|---|
| App riêng cho phụ huynh | Chỉ đáng khi có hàng nghìn học viên. Với 20 học viên, tin nhắn kèm báo cáo viết tay còn được đọc kỹ hơn |
| Quy trình duyệt nhiều tầng | Họ cần vì quản lý không quen giáo viên. Founder MNEE biết cả 6 giáo viên |
| Báo cáo theo mẫu chung | Đây chính là **khoảng trống** để MNEE khác biệt — xem dưới |

### Khoảng trống MNEE nên chiếm

Chuỗi lớn **không thể** làm hai việc ở quy mô hàng nghìn học viên:

1. **Báo cáo sâu, cá nhân hoá tới từng câu học viên nói.** Hệ thống đã ép đúng
   điều này: trích nguyên văn một câu học viên nói là một trong sáu tiêu chí chấm
   chất lượng, và AI bị chặn không cho bịa câu trích.
2. **Founder trực tiếp đọc và chấm từng báo cáo.**

Đây là chỗ đáng dồn sức, không phải chỗ đua quy trình với chuỗi lớn.

---

## 6. Điểm chưa rõ

- **Không đọc được trang gốc nào.** Proxy chặn Preply, italki, thuvienphapluat,
  meinvoice. Mọi phát hiện ngoài đều ở mức B.
- **Không biết tình trạng hợp đồng của 6 giáo viên**, nên không kết luận được
  chắc chắn về nghĩa vụ thuế.
- **Chưa biết trung tâm đang trả lương theo chu kỳ nào** — tháng, tuần, hay theo
  buổi. Điều này đổi cả mốc chốt sổ ở mục 4.2 lẫn ngưỡng thuế ở mục 3.1.
- **Bảng mục 3.1 tính từ lịch, không phải buổi đã dạy.** Năm lớp chưa có lịch nên
  chưa được tính; con số thật sẽ cao hơn.
- **Chưa khảo sát nhóm đối thủ trực tiếp** (trung tâm nhỏ và giáo viên cá nhân
  dạy online). Tài liệu này chỉ trả lời về *cách quản lý*, chưa trả lời về *giá
  và cách bán*.

---

## 7. Nguồn

- Preply — Lesson confirmation: <https://help.preply.com/en/articles/4171244-lesson-confirmation>
- Preply — When and how you get paid: <https://help.preply.com/en/articles/4171348-when-and-how-you-get-paid-for-lessons>
- italki — Lesson Policy: <https://support.italki.com/hc/en-us/articles/360020529954-Lesson-Policy>
- Teachworks — Tutoring management software: <https://www.teachworks.com/tutoring-management-software>
- Pike13 — Education: <https://www.pike13.com/industries/education>
- Thư viện pháp luật — Khấu trừ 10% trước khi trả cho cá nhân: <https://thuvienphapluat.vn/phap-luat-doanh-nghiep/cong-viec-phap-ly/truong-hop-khau-tru-10-tren-thu-nhap-truoc-khi-tra-cho-ca-nhan-40.html>
- MISA — Cam kết không khấu trừ thuế TNCN (mẫu 08/CK-TNCN): <https://sme.misa.vn/343997/cam-ket-khong-khau-tru-thue-tncn/>
- Cổng thông tin Chính phủ — Thông tư 111/2013/TT-BTC: <https://vanban.chinhphu.vn/?pageid=27160&docid=169566>

*Tất cả truy cập ngày 11/09/2026. Các trang gốc bị chặn ở môi trường làm việc —
cô mở trực tiếp được.*
