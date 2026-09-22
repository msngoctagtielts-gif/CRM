# Tư vấn: hệ trợ lý AI cho marketing MNEE

> Viết cho cô Ngọc, ngày 22/09/2026, sau khi cô đưa sơ đồ 8 ô
> (Manager → Research / Content / Media → Publishing → kênh → Community → Analytics).
>
> Cô nói *"tôi chỉ nghiên cứu nhưng không chắc"*. Tài liệu này trả lời đúng chỗ
> chưa chắc đó: **ô nào thật sự cần là một AI agent, ô nào chỉ là một cái prompt
> hoặc một đoạn code, và chúng nối với nhau bằng cái gì.**

---

## 1. Kết luận trước, giải thích sau

Ba câu, nếu chỉ đọc được ba câu:

1. **Sơ đồ của cô là sơ đồ tổ chức nhân sự, không phải kiến trúc agent.**
   Nó vẽ *ai báo cáo cho ai*. Máy không cần cấp bậc — máy cần biết *dữ liệu đi
   đâu*. Đây là cái bẫy phổ biến nhất khi dựng hệ agent: cứ mỗi chức danh người
   lại đẻ ra một agent, cuối cùng có 8 con AI ngồi chat với nhau và không con
   nào chịu trách nhiệm.

2. **Trong 8 ô, nhiều nhất chỉ 3 ô xứng đáng là agent.** Còn lại là *skill*
   (một prompt tốt + một khuôn mẫu) hoặc *code thuần* (cron, gọi API, câu SQL).
   Gọi mọi thứ là "agent" làm hệ thống đắt gấp mười lần và không thể dò lỗi.

3. **Thứ cô đang thiếu trong sơ đồ lại chính là thứ cô nhắc tới trong câu hỏi:
   kiểm chất lượng và kiểm duyệt.** Chúng không phải một nhánh riêng bên cạnh
   Content — chúng là **cái cổng chặn giữa Content và Publishing**. Không có
   cổng đó thì toàn bộ phần còn lại là máy sản xuất rủi ro thương hiệu với tốc
   độ cao.

Khuyến nghị gọn: **đừng dựng 8 agent. Dựng 1 cái bảng + 3 cái cổng + tái dùng
những skill cô đã có.** Nó cho 80% giá trị với 10% độ phức tạp.

---

## 2. Sơ đồ của cô sai ở đâu

### 2.1 Có "Manager" điều phối bằng AI

Ô 🧠 AI MARKETING MANAGER là ô nguy hiểm nhất. Một LLM đứng giữa quyết định gọi
agent nào là: đắt nhất (mọi thứ đi qua nó hai lần), chậm nhất, và **không dò lỗi
được** — hôm nay nó gọi Research trước Content, mai nó đổi ý, cô không biết vì sao.

Quy trình marketing của trung tâm là quy trình *cố định*: nghiên cứu → viết →
làm hình → duyệt → đăng → đo. Cái gì cố định thì dùng máy trạng thái, không dùng
LLM. **"Manager" = cô + một cái bảng trong Supabase.**

### 2.2 Không có cổng duyệt của người

Sơ đồ đi thẳng Media → Publishing → Facebook. Nghĩa là một câu AI bịa ra có thể
lên trang chính thức mà không ai đọc.

Dự án này đã có nguyên tắc đó ở chỗ khác rồi, và nó đúng: giả định **A13** —
*hệ thống không bao giờ tự gửi nhận xét cho phụ huynh, luôn phải có người bấm*.
Marketing phải theo đúng luật ấy. Bài đăng ra ngoài rủi ro hơn nhận xét gửi một
phụ huynh, chứ không phải ít hơn.

### 2.3 Các agent nối với nhau bằng mũi tên, không bằng dữ liệu

Mũi tên trong sơ đồ ngụ ý "agent A nói với agent B". Đừng làm thế. Agent nói
chuyện với nhau qua chat là nguồn gốc của mọi hệ agent hỏng: không lưu vết,
không chạy lại được, lỗi của A lặng lẽ thành đầu vào của B.

> **Luật số 1 của kiến trúc này: agent nói chuyện với nhau qua BẢNG, không qua chat.**
> Mỗi agent đọc vài cột, ghi vài cột, rồi dừng. Cô mở bảng ra là thấy toàn bộ
> trạng thái. Chạy lại một bước không cần chạy lại cả chuỗi.

Cô đã có Supabase. Không cần thêm hạ tầng gì.

### 2.4 Vòng lặp Analytics → Manager chưa có ý nghĩa

"Analytics trả về để tối ưu vòng sau" chỉ đúng khi cô **truy được lead đến từ bài
nào**. Nếu không, con số lượt xem chỉ là tiếng ồn, và AI sẽ tối ưu theo tiếng ồn
một cách rất tự tin.

Phải có cơ chế quy nguồn *trước*, dù thô: mỗi bài một mã, và khi có người nhắn
tin thì hỏi/ghi "biết trung tâm qua đâu". Một cột `nguon` trong bảng học viên
tiềm năng có giá trị hơn cả một Analytics Agent.

---

## 3. Cái gì là agent, cái gì không

| Ô trong sơ đồ | Thật ra là gì | Vì sao |
|---|---|---|
| 🧠 Marketing Manager | **Code** (máy trạng thái) + cô | Quy trình cố định. Không cần LLM điều phối. |
| 🔎 Research đối thủ | **Agent thật** | Phải tìm, mở, đọc, đối chiếu, lặp nhiều vòng. Đây đúng là việc của agent. |
| ✍️ Content | **Skill** (prompt + giọng thương hiệu) | Một lần gọi, có đầu vào rõ, có khuôn mẫu. Không cần vòng lặp. |
| 🎬 Media | **Gọi công cụ** | Canva / Gamma / dựng video. Máy không cần tự quyết. |
| 📅 Publishing | **Code thuần — tuyệt đối không phải LLM** | Nút "đăng ra thế giới" không bao giờ giao cho mô hình xác suất. |
| 💬 Community (comment/inbox) | **Agent, nhưng chỉ được viết nháp** | Chạm khách hàng thật, dễ hứa bậy về giá và đầu ra. |
| 📊 Analytics | **SQL + một lần tóm tắt** | Lấy số là việc của code. LLM chỉ viết mấy dòng nhận định cuối. |
| ✅ Kiểm chất lượng / kiểm duyệt | **Cổng chặn** (nửa checklist, nửa LLM) | Ô cô thiếu trong sơ đồ. Xem mục 5. |

Vậy: **agent thật = Research, Community (nháp), và cổng kiểm duyệt.** Còn lại là
skill và code.

---

## 4. Kiến trúc đề xuất

Một đường ống, bốn cổng, một bảng làm trung tâm.

```
   Nguồn ý tưởng
   (cô  +  🔎 Research Agent  +  báo cáo học viên có thật)
            │
            ▼
 ┌──────────────────────────────────────────────┐
 │   BẢNG  noi_dung  (Supabase)                  │   ← mọi agent chỉ chạm vào đây
 │   một dòng = một bài, có cột trang_thai       │
 └──────────────────────────────────────────────┘
            │  y_tuong
            ▼
   ✍️ Soạn nội dung  (skill, không phải agent)
            │  ban_nhap
            ▼
   ══ CỔNG 1 ── Chất lượng máy  (stop-slop + checklist cứng)
            │  đạt → tiếp;  không đạt → trả về ban_nhap kèm lý do
            ▼
   ══ CỔNG 2 ── Kiểm duyệt rủi ro  (luật ở mục 5)
            │  cho_duyet
            ▼
   ══ CỔNG 3 ── 👩‍💼 CÔ NGỌC BẤM DUYỆT   ← người, bắt buộc, không bỏ qua được
            │  da_duyet
            ▼
   🎬 Làm hình / video  (Canva, Gamma, dựng video)
            │  da_co_hinh
            ▼
   📅 Lên lịch + đăng  (code / Make, KHÔNG phải LLM)
            │  da_dang  + luu ma_quy_nguon
            ▼
   Facebook · Zalo · TikTok · YouTube · Shorts
            │
            ├──► 💬 Tương tác về → agent viết NHÁP trả lời → cô bấm gửi
            │
            └──► 📊 Số liệu (Supermetrics/nhập tay) ghi ngược vào bảng
                        │
                        ▼
                 Báo cáo tuần một trang cho cô
                 (không có "AI tự tối ưu vòng sau")
```

Khác biệt cốt lõi so với sơ đồ của cô: **không có ô nào ở giữa ra lệnh cho ô nào.**
Mỗi bước chỉ nhìn cột `trang_thai`, làm phần việc của mình, đổi trạng thái, rồi
dừng lại.

---

## 5. Ba cổng — luật cụ thể

Cổng chỉ có giá trị khi luật của nó viết được thành dòng kiểm tra. Luật mơ hồ
kiểu "nội dung phải hay" thì cổng nào cũng cho qua.

### Cổng 1 — Chất lượng (đã có sẵn skill `stop-slop`)

Chặn khi: văn AI chung chung, câu sáo rỗng, **số liệu không nguồn**, mức CEFR
bịa, lời hứa đầu ra không kiểm chứng được. Đây đúng là việc `stop-slop` đang làm
cho tài liệu giảng dạy — chỉ cần áp cho bài marketing.

### Cổng 2 — Rủi ro (cổng quan trọng nhất, và chưa ai làm)

Bốn luật cứng, trả về *chặn* chứ không phải *góp ý*:

| Luật | Vì sao |
|---|---|
| **Không cam kết đầu ra.** Cấm "cam kết lên 2 band", "đảm bảo giao tiếp sau 3 tháng", "100% học viên…" | Quảng cáo giáo dục ở Việt Nam bị ràng buộc về quảng cáo gây nhầm lẫn. Và một lời hứa không giữ được là một phụ huynh đòi hoàn phí. |
| **Không dùng hình/tiếng học viên khi chưa có xác nhận đồng ý.** Cổng phải tra bảng học viên, thấy cột đồng ý = có thì mới cho qua. | Trẻ em. Không có cách sửa sau khi đã đăng. |
| **Mọi con số phải trỏ về một dòng dữ liệu thật trong hệ thống.** "Học viên tiến bộ 40%" phải dẫn được ra buổi học nào, bài kiểm tra nào. | Đúng nguyên tắc `feedback.ts` đã đặt: *AI không được bịa lời học viên*. Marketing bịa số cũng là bịa. |
| **Không nêu tên, chê, hoặc so sánh trực tiếp trung tâm khác.** | Research đọc về VUS/ILA/Apollo là để cô hiểu thị trường, không phải để lên bài. Rất dễ trượt tay. |

### Cổng 3 — Cô

Không tự động hoá được, và đừng tìm cách. Một màn hình trong hệ thống, giống
hệt màn `/review` và `/xac-minh` đang có: danh sách chờ, bấm duyệt hoặc trả lại
kèm lý do. Lý do trả lại được lưu — sau 30 bài, đọc lại đống lý do đó là tài
liệu huấn luyện prompt tốt nhất cô có thể có.

---

## 6. Agent nào nối với agent nào

Bảng này trả lời thẳng câu hỏi của cô. Đọc cột "Đọc gì / Ghi gì" là thấy dây nối.

| # | Việc | Loại | Ai kích hoạt | Đọc gì | Ghi gì | Được ra internet? |
|---|---|---|---|---|---|---|
| 1 | Research đối thủ & thị trường | Agent | Cô, hoặc lịch hằng tuần | — | dòng mới `trang_thai = y_tuong` | Có (đọc) |
| 2 | Soạn nội dung | Skill | Trạng thái `y_tuong` | ý tưởng + giọng thương hiệu + dữ liệu học viên thật | `ban_nhap` | Không |
| 3 | Cổng chất lượng | Cổng | Trạng thái `ban_nhap` | bản nháp | `dat_chuan` hoặc trả lại + lý do | Không |
| 4 | Cổng rủi ro | Cổng | Trạng thái `dat_chuan` | bản nháp + bảng đồng ý hình ảnh + dữ liệu gốc của số liệu | `cho_duyet` hoặc chặn + lý do | Không |
| 5 | **Cô duyệt** | **Người** | Trạng thái `cho_duyet` | tất cả | `da_duyet` | — |
| 6 | Làm hình/video | Công cụ | Trạng thái `da_duyet` | bản đã duyệt | `da_co_hinh` + link file | Có (Canva/Gamma) |
| 7 | Đăng & lên lịch | **Code** | Trạng thái `da_co_hinh` + tới giờ | bản đã duyệt + hình | `da_dang` + link bài + mã quy nguồn | **Có (ghi) — chỉ mình nó** |
| 8 | Nháp trả lời tương tác | Agent | Có comment/inbox mới | bài gốc + bảng giá + câu hỏi thường gặp | nháp trả lời, `cho_gui` | Không |
| 9 | Thu số liệu | Code | Lịch hằng ngày | link bài | cột lượt xem / tương tác / lead | Có (đọc) |
| 10 | Báo cáo tuần | Skill | Lịch thứ Hai | toàn bảng | một trang tóm tắt | Không |

Ba điều đáng chú ý trong bảng:

- **Chỉ đúng một ô (#7) được phép ghi ra thế giới bên ngoài, và ô đó không phải AI.**
- **Không ô nào gọi thẳng ô nào.** Tất cả đều nhìn `trang_thai`.
- **Chuỗi luôn đứt ở #5.** Không có đường vòng.

---

## 7. Bảng `noi_dung` — đề xuất tối thiểu

```
noi_dung
  id
  trang_thai        y_tuong | ban_nhap | dat_chuan | cho_duyet | da_duyet
                    | da_co_hinh | da_lich | da_dang | tu_choi
  kenh              facebook | zalo | tiktok | youtube | shorts
  tieu_de
  noi_dung_bai
  nguon_du_lieu     trỏ tới lesson_id / student_id đã sinh ra số liệu trong bài
  ma_quy_nguon      mã để biết lead đến từ bài nào
  ket_qua_cong_1    đạt / trả lại + lý do
  ket_qua_cong_2    đạt / chặn + luật nào bị vi phạm
  nguoi_duyet       ai bấm, lúc nào
  ly_do_tra_lai
  link_bai_da_dang
  luot_xem, tuong_tac, so_lead     ← agent thu số liệu ghi vào
  tao_boi           ai/người — giống cột authored_by đang dùng cho nhận xét
```

Giữ nguyên thói quen tốt của dự án: **cột riêng cho số máy đọc, không ghi đè số
người khai** (đúng như `phut_thuc_te` trong phần xác minh buổi học).

---

## 8. Cô đã có sẵn hơn cô nghĩ

Đây là phần làm thay đổi khối lượng công việc nhiều nhất. Phần lớn "agent"
trong sơ đồ **đã tồn tại** dưới dạng skill hoặc kết nối:

| Ô trong sơ đồ | Cái đã có |
|---|---|
| 🔎 Research | skill `deepseek-research`, `deep-research`, `video-intel` (xem và bóc tách video đối thủ) |
| ✍️ Content | `prompt-master` để chuẩn hoá yêu cầu; giọng thương hiệu navy–gold đã định nghĩa |
| 🎬 Media | `brand-video-editor`, `slide-cinema`, `canvas-design`, `listening-studio` + kết nối Canva, Gamma |
| ✅ Kiểm chất lượng | `stop-slop` — đúng Cổng 1, không phải viết mới |
| 🧠 Điều phối | `task-router` — nhưng chỉ dùng khi cô ngồi làm, không dùng để chạy tự động |
| 💬 Community | `community-lab` (phần sự kiện, giữ chân, referral) |
| 📊 Analytics | kết nối **Supermetrics** — có sẵn Facebook, TikTok, YouTube. Đây gần như là Analytics Agent đã dựng xong. |
| 📅 Publishing | kết nối **Make** — có module đăng bài các nền tảng. Dùng cái này thay vì tự viết tích hợp Facebook Graph API. |

Nghĩa là việc thật sự còn phải làm rất gọn: **bảng `noi_dung`, màn duyệt, Cổng 2,
và mấy sợi dây nối.** Không phải dựng 8 agent từ đầu.

---

## 9. Lộ trình

Làm theo thứ tự này. Mỗi giai đoạn phải chạy được một mình.

**Giai đoạn 0 — một tuần, không có AI nào cả.**
Dựng bảng `noi_dung` + màn duyệt. Cô tự viết bài, tự đưa vào bảng, tự duyệt, tự
copy sang Facebook. Nghe có vẻ vô ích, nhưng: *nếu quy trình không chạy khi người
làm thủ công, thêm AI vào không sửa được gì — chỉ làm nó hỏng nhanh hơn.*
Đây là bước kiểm chứng rẻ nhất trong toàn bộ dự án.

**Giai đoạn 1 — soạn nháp + Cổng 1.**
Nối skill soạn nội dung và `stop-slop`. Vẫn đăng bằng tay. Đo một con số duy
nhất: trong 10 bản nháp máy viết, cô sửa nhiều hay ít?

**Giai đoạn 2 — Cổng 2 + quy nguồn.**
Bốn luật cứng ở mục 5, và mã quy nguồn cho mỗi bài. Giờ mới có dữ liệu để nói
bài nào ra lead.

**Giai đoạn 3 — số liệu.**
Nối Supermetrics, hoặc nhập tay. *Ở quy mô của trung tâm, mỗi tuần nhập 5 con số
bằng tay vẫn nhanh hơn ba tuần đi làm tích hợp API.* Chỉ tự động hoá khi việc
nhập tay bắt đầu thấy phiền.

**Giai đoạn 4 — đăng tự động, MỘT kênh thôi.**
Facebook Page trước, vì đường API dễ nhất. Zalo OA cần xác minh doanh nghiệp,
TikTok cần duyệt quyền đăng bài — đừng để hai cái đó chặn cả dự án.

**Giai đoạn 5 — nháp trả lời tương tác.**
Làm cuối cùng vì rủi ro cao nhất: nó chạm khách hàng thật và rất dễ hứa bậy về
học phí, lịch học, đầu ra.

---

## 10. Những điều KHÔNG nên làm

- **Đừng cho AI bấm nút đăng.** Kể cả khi nó đúng 99 lần. Lần thứ 100 là cái
  screenshot phụ huynh gửi cho nhau.
- **Đừng để agent gọi agent.** Qua bảng, luôn luôn.
- **Đừng dựng "Manager Agent".** Cái cô cần là một cột `trang_thai`.
- **Đừng để AI bịa số liệu học viên.** Dự án đã chọn lập trường này ở phần nhận
  xét — giữ nguyên nó ở marketing.
- **Đừng làm cả 5 kênh cùng lúc.** Một kênh chạy trơn hơn năm kênh nửa vời.
- **Đừng tin vòng "AI tự tối ưu".** Ở quy mô vài chục bài, số liệu quá ít để rút
  ra kết luận thống kê; AI sẽ tự tin suy diễn từ nhiễu. Người đọc báo cáo tuần
  và tự quyết vẫn tốt hơn.

---

## 11. Bốn câu cần cô quyết trước khi viết dòng code nào

1. **Mục tiêu của hệ này là gì?** Số lead mới mỗi tháng, hay giữ chân học viên
   cũ? Hai cái này cho ra hai hệ hoàn toàn khác nhau.
2. **Mỗi tuần cô muốn ra bao nhiêu bài?** Nếu câu trả lời là 2–3, phần lớn tài
   liệu này là thừa — chỉ cần Cổng 1 và một cái bảng.
3. **Ai bấm duyệt khi cô bận?** Nếu không ai, cổng sẽ thành nút cổ chai và người
   ta sẽ tìm cách đi vòng. Thà quyết trước.
4. **Đã có văn bản đồng ý dùng hình ảnh học viên chưa?** Chưa thì đây là việc
   làm đầu tiên, trước mọi thứ khác trong tài liệu này.
