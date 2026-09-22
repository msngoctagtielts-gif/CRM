/**
 * Thư viện kiến thức — phần "chia sẻ cộng đồng" của website.
 *
 * Nội dung nằm trong mã nguồn chứ không nằm trong cơ sở dữ liệu. Có chủ đích:
 * mỗi bài đi qua Git, nên có lịch sử sửa, có người duyệt, và không ai đăng được
 * bài mới mà không qua bước xem lại. Tới khi số bài vượt quá sức làm thủ công
 * thì mới tính chuyện đưa vào bảng `noi_dung` như tài liệu kiến trúc đã đề xuất.
 *
 * LUẬT VIẾT BÀI Ở ĐÂY — giống hệt luật đã áp cho tài liệu gửi phụ huynh:
 *   1. Không con số nào không có nguồn.
 *   2. Không cam kết đầu ra theo mốc thời gian.
 *   3. Không quy đổi cứng giữa CEFR và band IELTS.
 *   4. Không nêu tên trung tâm khác.
 *   5. Mỗi bài phải dùng được ngay cả khi người đọc không bao giờ đăng ký.
 *      Bài nào bỏ điều này đi thì chỉ còn là quảng cáo.
 */

export type Khoi =
  | { loai: 'p'; chu: string }
  | { loai: 'h2'; chu: string }
  | { loai: 'ul'; y: string[] }
  | { loai: 'trich'; chu: string }

export type TruNoiDung = 'tam_ly' | 'phuong_phap' | 'giao_tiep' | 'ielts' | 'phu_huynh'

export const TEN_TRU: Record<TruNoiDung, string> = {
  tam_ly: 'Tâm lý người học',
  phuong_phap: 'Phương pháp theo từng người',
  giao_tiep: 'Giao tiếp thực tế',
  ielts: 'IELTS',
  phu_huynh: 'Dành cho phụ huynh',
}

export type BaiViet = {
  slug: string
  tieuDe: string
  moTa: string
  tru: TruNoiDung
  ngay: string
  phutDoc: number
  than: Khoi[]
}

export const BAI_VIET: BaiViet[] = [
  {
    slug: 'biet-nhieu-ma-khong-noi-duoc',
    tieuDe: 'Vì sao bạn biết nhiều mà vẫn không nói được',
    moTa:
      'Không phải bạn thiếu từ. Là đường từ chỗ biết tới chỗ nói ra chưa bao giờ được mở.',
    tru: 'tam_ly',
    ngay: '2026-09-22',
    phutDoc: 6,
    than: [
      {
        loai: 'p',
        chu: 'Có một kiểu người học rất đặc trưng ở Việt Nam: điểm ngữ pháp cao, đọc hiểu tốt, làm bài trắc nghiệm nhanh, nhưng gặp người nước ngoài thì đứng hình. Họ thường tự kết luận là mình dốt tiếng Anh. Kết luận đó sai, và cái sai này khiến họ chữa nhầm bệnh suốt nhiều năm.',
      },
      { loai: 'h2', chu: 'Biết một cấu trúc và dùng được nó là hai việc khác nhau' },
      {
        loai: 'p',
        chu: 'Khi bạn làm bài tập chia động từ, bạn có thời gian. Bạn nhìn thấy câu, bạn nhớ ra quy tắc, bạn áp dụng, bạn khoanh đáp án. Quá trình đó có thể mất năm giây và vẫn được tính là đúng.',
      },
      {
        loai: 'p',
        chu: 'Trong hội thoại thật, bạn không có năm giây. Người đối diện hỏi xong là tới lượt bạn. Nếu cấu trúc đó chỉ nằm ở dạng quy tắc phải nhớ lại, nó sẽ không kịp ra. Thứ kịp ra chỉ là những gì đã thành thao tác — tức là những gì bạn đã *nói ra thành tiếng* đủ nhiều lần.',
      },
      {
        loai: 'trich',
        chu: 'Bạn không quên. Bạn không với tới kịp.',
      },
      { loai: 'h2', chu: 'Phần lớn thời gian học của bạn là nhận vào, không phải phát ra' },
      {
        loai: 'p',
        chu: 'Thử cộng lại cách bạn đã học trong nhiều năm: nghe giảng, đọc sách, làm bài tập, xem phim có phụ đề, học từ vựng qua ứng dụng. Tất cả đều là tiếp nhận. Nhà nghiên cứu Merrill Swain gọi phần còn thiếu là *đầu ra*: việc phải tự tạo ra câu buộc người học phát hiện chính xác chỗ mình đang hổng, điều mà nghe và đọc không làm được.',
      },
      {
        loai: 'p',
        chu: 'Nếu tổng thời gian bạn thật sự phát ra tiếng Anh thành tiếng trong cả năm qua cộng lại chưa tới vài giờ, thì việc bạn không nói được không phải là điều bí ẩn. Đó là kết quả đúng như dự đoán.',
      },
      { loai: 'h2', chu: 'Vòng xoáy làm mọi thứ tệ thêm' },
      {
        loai: 'p',
        chu: 'Mỗi lần nghẹn giữa câu, bạn ghi thêm một bằng chứng cho niềm tin "mình không nói được". Lần sau, niềm tin đó làm bạn căng hơn ngay từ giây đầu, và căng thì chiếm mất phần đầu óc lẽ ra dùng để tìm từ. Nên lần sau nghẹn sớm hơn. Đây là vòng tự nuôi, và nó không tự dừng.',
      },
      { loai: 'h2', chu: 'Chữa đúng chỗ' },
      {
        loai: 'ul',
        y: [
          '**Đổi tỉ lệ buổi học.** Nếu trong một giờ học mà bạn nói dưới một phần ba thời gian, buổi học đó đang củng cố đúng cái điểm mạnh bạn đã có sẵn.',
          '**Nói lặp theo bản mẫu.** Nghe một câu, nói đuổi theo ngay, không dịch, không phân tích. Nghe thì tầm thường nhưng đây là bài tập mở đường truy xuất tốt nhất.',
          '**Học theo chức năng, không theo thì.** Cách hỏi lại, cách xin nhắc lại, cách câu giờ. Đây là bộ khung giữ cho hội thoại không sập khi bạn bí từ.',
          '**Đo bằng thời lượng nói, không bằng số lỗi.** Chỉ số đầu đi lên thì chỉ số sau tự đi xuống. Làm ngược lại thì thường hỏng cả hai.',
        ],
      },
      { loai: 'h2', chu: 'Việc làm được ngay tuần này' },
      {
        loai: 'p',
        chu: 'Chọn một đoạn hội thoại hai phút mà bạn hiểu hết từng chữ. Mỗi ngày nghe và nói đuổi theo một lần, bảy ngày liền, vẫn đoạn đó. Ngày thứ bảy ghi âm lại chính mình. Gần như ai làm đủ bảy ngày cũng nghe ra khác biệt — và quan trọng hơn, cảm giác "câu này mình nói được" bắt đầu có chỗ bám.',
      },
      {
        loai: 'p',
        chu: 'Điều cần nói thẳng: bài tập này không thay thế được việc nói với người thật. Nó mở đường. Còn đường đó chỉ vững khi có người ở đầu bên kia trả lời bạn.',
      },
    ],
  },

  {
    slug: 'nguoi-ban-hoc-tieng-anh-the-nao',
    tieuDe: 'Người bận nên học tiếng Anh thế nào',
    moTa:
      'Nếu bạn đã bỏ dở ba khoá học, vấn đề gần như chắc chắn không nằm ở phương pháp.',
    tru: 'phuong_phap',
    ngay: '2026-09-22',
    phutDoc: 5,
    than: [
      {
        loai: 'p',
        chu: 'Người bận thường đi tìm phương pháp học nhanh hơn. Nhưng nếu nhìn lại ba lần bỏ dở gần nhất, lý do hiếm khi là "phương pháp không hiệu quả". Lý do gần như luôn là: có một tuần nào đó công việc ập tới, bỏ một buổi, rồi bỏ buổi thứ hai, rồi ngại quay lại.',
      },
      { loai: 'h2', chu: 'Kế hoạch được lập cho một tuần không có thật' },
      {
        loai: 'p',
        chu: 'Lúc đăng ký, người ta hình dung một tuần lý tưởng: tối nào cũng rảnh, cuối tuần có ba tiếng. Tuần đó không tồn tại. Kế hoạch lập trên nó đổ ngay lần đầu gặp một tuần thật.',
      },
      {
        loai: 'p',
        chu: 'Cách sửa không phải là cố gắng hơn. Là lập kế hoạch trên tuần tệ nhất của bạn, chứ không phải tuần tốt nhất. Nếu tuần tệ nhất của bạn chỉ có 45 phút, thì kế hoạch phải là 45 phút.',
      },
      { loai: 'h2', chu: 'Đều quan trọng hơn nhiều' },
      {
        loai: 'p',
        chu: 'Trí nhớ được củng cố tốt hơn khi việc ôn được rải ra theo thời gian thay vì dồn một lần — hiệu ứng giãn cách là một trong những phát hiện ổn định và lâu đời nhất trong nghiên cứu trí nhớ. Với ngôn ngữ, điều này có nghĩa rất cụ thể: ba buổi ngắn rải đều trong tuần cho kết quả tốt hơn một buổi dài rồi nghỉ mười ngày.',
      },
      {
        loai: 'p',
        chu: 'Còn một khoản lỗ ít ai tính: mỗi lần nghỉ dài rồi quay lại, một phần buổi học đầu tiên bị tiêu vào việc hâm nóng lại thứ đã nguội. Dừng đi dừng lại nhiều lần thì phần lớn công sức rơi vào chỗ đó.',
      },
      { loai: 'h2', chu: 'Bốn điều nên làm' },
      {
        loai: 'ul',
        y: [
          '**Chốt khung giờ trước, chốt thời lượng sau.** Một khung cố định trong tuần, đặt vào lịch như một cuộc họp không dời được.',
          '**Thu hẹp mục tiêu tới mức gần như buồn cười.** Không phải "giỏi tiếng Anh". Mà là "nói được trong cuộc họp với đối tác Singapore tháng sau".',
          '**Bỏ phần chờ lượt.** Trong lớp đông, phần lớn thời gian của bạn là nghe người khác luyện tập. Người ít thời gian không đủ ngân sách cho khoản đó.',
          '**Có một người chờ bạn.** Với người bận, lịch hẹn với người thật là thứ giữ được nhịp. Ứng dụng tự học không giữ được, vì bỏ một buổi chẳng ai biết.',
        ],
      },
      { loai: 'h2', chu: 'Một lời khuyên đi ngược' },
      {
        loai: 'p',
        chu: 'Đừng đăng ký gói dài với lịch dày, kể cả khi đang hào hứng và kể cả khi tính ra rẻ hơn trên mỗi buổi. Với người bận, lịch dày là cách chắc chắn nhất để bỏ dở lần nữa — và lần bỏ dở này sẽ đắt hơn, vì nó kèm theo tiền đã trả.',
      },
      {
        loai: 'p',
        chu: 'Bắt đầu bằng thứ nhỏ tới mức bạn chắc chắn giữ được. Giữ được ba tháng rồi hãy tăng.',
      },
    ],
  },

  {
    slug: 'muoi-cau-giu-nhip-hoi-thoai',
    tieuDe: 'Mười câu giữ nhịp hội thoại khi bạn chưa nghĩ ra từ',
    moTa:
      'Hội thoại không sập vì bạn thiếu từ. Nó sập vì khoảng im lặng sau đó.',
    tru: 'giao_tiep',
    ngay: '2026-09-22',
    phutDoc: 4,
    than: [
      {
        loai: 'p',
        chu: 'Người bản ngữ cũng quên từ, cũng nói lắp, cũng phải sửa giữa câu. Khác biệt là họ có sẵn một bộ câu để lấp chỗ trống, nên người nghe không nhận ra họ đang bí. Bộ câu đó không khó, chỉ là hiếm khi được dạy.',
      },
      { loai: 'h2', chu: 'Khi cần vài giây để nghĩ' },
      {
        loai: 'ul',
        y: [
          '*Let me think for a second.* — tự nhiên hơn hẳn việc im lặng.',
          '*How do I put this...* — báo cho người nghe biết bạn đang chọn chữ, không phải đang bỏ cuộc.',
          '*That is a good question.* — câu kinh điển, dùng được ở mọi nơi.',
        ],
      },
      { loai: 'h2', chu: 'Khi bạn không nhớ ra từ' },
      {
        loai: 'ul',
        y: [
          '*I am not sure of the word — it is like a ...* rồi mô tả. Kỹ năng này gọi là diễn đạt vòng, và nó cứu bạn nhiều hơn việc thuộc thêm từ.',
          '*What is the word... it is when you ...* — mô tả bằng chức năng.',
          '*You know what I mean?* — kéo người nghe vào giúp bạn.',
        ],
      },
      { loai: 'h2', chu: 'Khi bạn không nghe rõ' },
      {
        loai: 'ul',
        y: [
          '*Sorry, could you say that again?* — lịch sự, trung tính, dùng được với sếp.',
          '*Sorry, do you mean ... ?* — vừa hỏi lại vừa chứng minh bạn đang theo kịp.',
          '*I did not catch the last part.* — chính xác hơn "I do not understand", và cho người kia biết chỉ cần lặp phần cuối.',
        ],
      },
      { loai: 'h2', chu: 'Khi bạn lỡ nói sai' },
      {
        loai: 'ul',
        y: [
          '*Sorry, let me start again.* — tự sửa là dấu hiệu của người dùng ngôn ngữ thành thạo, không phải dấu hiệu yếu kém.',
        ],
      },
      { loai: 'h2', chu: 'Cách luyện cho chúng thật sự ra được' },
      {
        loai: 'p',
        chu: 'Đọc mười câu này không có tác dụng gì. Chúng chỉ hữu ích khi bật ra mà không cần nghĩ, và điều đó chỉ tới bằng lặp lại thành tiếng. Mỗi ngày chọn ba câu, nói to mười lần, trong một tuần. Tuần sau đổi ba câu khác.',
      },
      {
        loai: 'p',
        chu: 'Có một tác dụng phụ đáng giá hơn cả bản thân mấy câu này: khi biết mình có đường lui, nỗi sợ mở miệng giảm hẳn. Phần lớn nỗi sợ nói không phải sợ sai ngữ pháp, mà là sợ rơi vào khoảng im lặng không biết làm gì.',
      },
    ],
  },

  {
    slug: 'ba-viec-truoc-khi-luyen-ielts',
    tieuDe: 'Ba việc nên làm trước khi mở sách luyện IELTS',
    moTa:
      'Phần lớn thời gian luyện thi bị tiêu sai chỗ, và điều đó được quyết định ngay trong tuần đầu.',
    tru: 'ielts',
    ngay: '2026-09-22',
    phutDoc: 5,
    than: [
      {
        loai: 'p',
        chu: 'Người có hạn chót thường lao vào học ngay, đều cả bốn kỹ năng, mỗi ngày một ít. Nghe hợp lý, nhưng đó là cách tiêu thời gian kém hiệu quả nhất khi thời gian có hạn.',
      },
      { loai: 'h2', chu: 'Một — đo trước, bằng đề thật, bấm giờ thật' },
      {
        loai: 'p',
        chu: 'Trước khi lập kế hoạch, làm một đề Listening và một đề Reading đúng giờ quy định. Không tra từ, không dừng băng. Kết quả sẽ khó chịu, và đó là điểm mấu chốt: bạn cần toạ độ thật, không cần cảm giác.',
      },
      {
        loai: 'p',
        chu: 'Điểm tổng bị kéo xuống bởi kỹ năng thấp nhất. Không biết kỹ năng nào thấp nhất thì mọi kế hoạch sau đó đều là đoán.',
      },
      { loai: 'h2', chu: 'Hai — đọc thang tiêu chí chấm' },
      {
        loai: 'p',
        chu: 'Speaking và Writing được chấm theo bốn tiêu chí, và các thang mô tả này được công bố công khai trên trang chính thức của IELTS. Rất nhiều người luyện nhiều tháng mà chưa từng đọc chúng — tức là luyện mà không biết người chấm đang tìm gì.',
      },
      {
        loai: 'p',
        chu: 'Đọc hết một lượt, rồi tự chấm một bài viết của mình theo đúng bốn mục đó. Bài tập này thường chỉ ra ngay một tiêu chí đang kéo bạn xuống mà bạn chưa từng để ý.',
      },
      { loai: 'h2', chu: 'Ba — đếm số tuần còn lại và viết ra giấy' },
      {
        loai: 'p',
        chu: 'Con số tuần quyết định chiến lược nhiều hơn trình độ hiện tại. Còn nhiều tuần thì xây nền. Còn ít tuần thì bỏ hẳn việc xây nền, dồn vào dạng bài và quản lý thời gian làm bài.',
      },
      { loai: 'h2', chu: 'Sau đó mới tới việc học' },
      {
        loai: 'ul',
        y: [
          'Dồn phần lớn thời gian vào kỹ năng thấp nhất; ba kỹ năng còn lại giữ ở mức duy trì.',
          'Bấm giờ ngay từ tuần đầu. Rất nhiều điểm mất đi vì hết giờ, không phải vì không biết làm.',
          'Luyện theo dạng câu hỏi. Bài thi có bộ dạng cố định; quen dạng là phần lấy lại điểm nhanh nhất.',
          'Speaking phải luyện thành tiếng với người nghe được và phản hồi được. Nghĩ trong đầu không tính.',
        ],
      },
      { loai: 'h2', chu: 'Một lưu ý về những lời hứa' },
      {
        loai: 'p',
        chu: 'Hãy cẩn thận với mọi cam kết tăng band theo mốc thời gian. Không ai kiểm chứng được lời hứa đó trước khi bạn đã trả tiền, và tiến độ mỗi người phụ thuộc vào điểm xuất phát, thời gian thật bỏ ra, và kỹ năng nào đang yếu. Trung tâm này không cam kết đầu ra theo thời gian — và đó là câu bạn nên hỏi thẳng ở mọi nơi bạn tới.',
      },
    ],
  },

  {
    slug: 'bon-cau-hoi-khi-di-tu-van',
    tieuDe: 'Bốn câu nên hỏi khi đi tư vấn trung tâm tiếng Anh',
    moTa:
      'Các trung tâm nói giống nhau. Bốn câu này làm lộ ra khác biệt thật.',
    tru: 'phu_huynh',
    ngay: '2026-09-22',
    phutDoc: 5,
    than: [
      {
        loai: 'p',
        chu: 'Đi tư vấn ba nơi thì nghe ba bài giống nhau: giáo viên giỏi, giáo trình chuẩn quốc tế, môi trường thân thiện, cam kết đầu ra. Không có gì để so sánh. Bốn câu dưới đây khó trả lời cho có, nên chúng phân loại được.',
      },
      { loai: 'h2', chu: 'Câu 1 — Mỗi buổi con tôi nói bao nhiêu phút?' },
      {
        loai: 'p',
        chu: 'Đây là câu quan trọng nhất và ít ai hỏi. Một lớp mười lăm em trong sáu mươi phút, sau khi trừ phần giáo viên giảng và phần chuyển hoạt động, thì mỗi em còn lại bao nhiêu thời gian thật sự mở miệng? Hãy để người tư vấn tự tính ra con số đó trước mặt bạn.',
      },
      {
        loai: 'p',
        chu: 'Nếu câu trả lời là "các con được tương tác liên tục", hãy hỏi lại: *bao nhiêu phút?*',
      },
      { loai: 'h2', chu: 'Câu 2 — Ai dạy con tôi, và có đổi giáo viên giữa chừng không?' },
      {
        loai: 'p',
        chu: 'Với trẻ, quan hệ với giáo viên ảnh hưởng tới việc chịu nói hay không nhiều hơn là giáo trình. Đổi giáo viên liên tục làm hỏng phần đó. Hỏi rõ: ai dạy, dạy bao lâu, khi nghỉ thì ai thay.',
      },
      { loai: 'h2', chu: 'Câu 3 — Sau mỗi buổi tôi nhận được gì?' },
      {
        loai: 'p',
        chu: 'Câu này làm lộ ra có quy trình hay không. Hãy xin xem một báo cáo buổi học thật, đã xoá tên học viên. Nơi nào đưa ra được ngay là nơi việc đó đang diễn ra thật. Nơi nào hứa "sẽ có" thì bạn đang mua lời hứa.',
      },
      { loai: 'h2', chu: 'Câu 4 — Con tôi đang ở mức nào, và đo bằng cái gì?' },
      {
        loai: 'p',
        chu: 'Câu trả lời nên gồm một bài kiểm tra đầu vào cụ thể và một cách mô tả trình độ có thể kiểm chứng. Nếu nghe thấy một mức CEFR, hãy hỏi mức đó dựa trên cái gì — đây là chỗ hay bị nói quá nhất trong ngành.',
      },
      { loai: 'h2', chu: 'Hai điều nên cảnh giác' },
      {
        loai: 'ul',
        y: [
          '**Cam kết đầu ra theo mốc thời gian.** Tiến độ phụ thuộc điểm xuất phát, thời gian học thật và việc có luyện ở nhà hay không. Nơi nào dám hứa chắc thì nên hỏi họ hoàn tiền thế nào, bằng văn bản.',
          '**Chứng chỉ "được công nhận".** Hỏi rõ ai công nhận. Nhiều nơi cấp giấy xác nhận hoàn thành của chính mình — điều đó không sai, nhưng phải nói đúng tên. Trung tâm này cấp Giấy xác nhận hoàn thành, không phải chứng chỉ được cơ quan nhà nước công nhận.',
        ],
      },
      { loai: 'h2', chu: 'Và một việc ở nhà' },
      {
        loai: 'p',
        chu: 'Quay một đoạn 60 giây con nói tiếng Anh về bất cứ chuyện gì, hôm nay. Giữ lại. Ba tháng sau quay đoạn thứ hai rồi mở hai đoạn cạnh nhau. Đây là cách đo tiến bộ trung thực nhất, không tốn đồng nào, và không trung tâm nào tranh cãi được với nó.',
      },
    ],
  },
]

export function timBaiViet(slug: string): BaiViet | undefined {
  return BAI_VIET.find((b) => b.slug === slug)
}
