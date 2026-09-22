/**
 * Sáu chân dung người học — lõi chuyên môn của website công khai.
 *
 * ĐÂY KHÔNG PHẢI TRẮC NGHIỆM TÍNH CÁCH. Không có MBTI, không có "bạn thuộc
 * nhóm nào". Sáu chân dung này là sáu *tình huống học* khác nhau, và mỗi tình
 * huống cần một cách bắt đầu khác nhau. Cùng một người có thể rơi vào chân dung
 * khác sau sáu tháng — đó là chuyện bình thường và đáng mừng.
 *
 * Cơ sở của cách phân nhóm, nêu để người đọc kiểm chứng được chứ không phải để
 * trang trí:
 *
 *   - **Lo lắng ngôn ngữ** (foreign language anxiety) — Horwitz, Horwitz &
 *     Cope, 1986. Lo lắng trong lớp ngoại ngữ là một dạng lo lắng riêng, không
 *     phải do thiếu năng lực. Người lo lắng cao học *chậm hơn mức năng lực thật
 *     của họ*, nên hạ lo lắng là can thiệp có hiệu quả trước cả dạy thêm từ.
 *   - **Sẵn sàng giao tiếp** (willingness to communicate) — MacIntyre và cộng
 *     sự, 1998. Việc một người có mở miệng hay không phụ thuộc vào tình huống
 *     nhiều hơn vào vốn từ.
 *   - **Biết ≠ dùng được.** Kiến thức tường minh về ngữ pháp không tự chuyển
 *     thành phản xạ. Phải có đầu ra thật và lặp lại — Swain, 1985, giả thuyết
 *     đầu ra.
 *   - **Động cơ công cụ và động cơ hoà nhập** — Gardner. Người thi IELTS và
 *     người muốn nói chuyện với đồng nghiệp cần hai giáo trình khác nhau, dù
 *     trình độ bằng nhau.
 *   - **Từ vựng tần suất cao.** Vài nghìn họ từ phổ biến nhất che phủ phần lớn
 *     hội thoại thường ngày — Nation. Người mất gốc nên học đúng khối đó trước,
 *     không học từ hiếm.
 *
 * KHÔNG ghi con số phần trăm, số band, số tháng ở bất cứ đâu trong file này.
 * Không có nguồn thì không ghi — đúng nguyên tắc đã áp cho bảng lộ trình.
 */

export type MaChanDung =
  | 'ngai_noi'
  | 'so_sai'
  | 'ban_ron'
  | 'mat_goc'
  | 'ielts_gap'
  | 'phu_huynh'

export type ChanDung = {
  ma: MaChanDung
  ten: string
  /** Một câu người đọc phải thấy đúng về mình ngay lập tức. */
  motCau: string
  dauHieu: string[]
  /** Cơ chế — vì sao chuyện này xảy ra. Đây là phần "thấu hiểu". */
  viSao: string[]
  /** Cách học phù hợp. Đây là phần "dẫn lối". */
  phuongPhap: string[]
  /** Ba việc làm được ngay tuần này, không cần đăng ký gì. */
  vieclamNgay: string[]
  /** Điều dễ làm sai nhất với đúng chân dung này. */
  canhBao: string
  /** Lớp nào ở trung tâm hợp với tình huống này. */
  hopVoi: string
}

export const CHAN_DUNG: Record<MaChanDung, ChanDung> = {
  ngai_noi: {
    ma: 'ngai_noi',
    ten: 'Biết nhiều, nói không ra',
    motCau:
      'Bạn đọc hiểu tốt, làm bài ngữ pháp tốt, nhưng khi cần mở miệng thì câu chữ ở đâu mất hết.',
    dauHieu: [
      'Nghe người khác nói thì hiểu, đến lượt mình thì đứng hình vài giây',
      'Sau cuộc hội thoại mới nghĩ ra câu lẽ ra nên nói',
      'Viết email tiếng Anh ổn, gọi điện thì né',
      'Đã học nhiều năm, điểm bài tập cao, nhưng vẫn thấy mình "không biết tiếng Anh"',
    ],
    viSao: [
      'Biết một cấu trúc và dùng được nó trong một giây rưỡi là hai năng lực khác nhau. Cái thứ nhất học bằng mắt, cái thứ hai chỉ có được bằng cách lặp lại thao tác nói ra.',
      'Phần lớn thời gian học của bạn cho tới giờ là *nhận vào* — đọc, nghe, làm bài. Đầu ra gần như bằng không, nên đường truy xuất chưa bao giờ được mở.',
      'Mỗi lần nghẹn lại củng cố niềm tin "mình không nói được", và niềm tin đó khiến lần sau nghẹn sớm hơn.',
    ],
    phuongPhap: [
      'Đổi tỉ lệ: mỗi buổi học phải có phần lớn thời gian là bạn đang phát ra tiếng, không phải đang nghe giảng.',
      'Nói lặp theo bản mẫu (shadowing) — nghe một câu, nói đuổi theo ngay, không dịch. Cái này mở đường truy xuất nhanh hơn mọi bài tập ngữ pháp.',
      'Luyện theo *chức năng giao tiếp* chứ không theo thì: cách hỏi lại, cách xin nhắc lại, cách câu giờ khi chưa nghĩ ra từ.',
      'Học 1 kèm 1 trong giai đoạn đầu để không phải chờ lượt và không bị so sánh.',
    ],
    vieclamNgay: [
      'Chọn một đoạn hội thoại hai phút bạn hiểu hết. Nghe và nói đuổi theo mỗi ngày một lần, trong bảy ngày, cùng một đoạn.',
      'Học thuộc năm câu câu giờ: "Let me think for a second." · "How do I put this..." · "What I mean is..." · "Sorry, could you say that again?" · "I am not sure of the word, it is like..."',
      'Ghi âm chính mình trả lời một câu hỏi quen thuộc trong 60 giây. Nghe lại. Đừng sửa gì. Làm lại vào ngày thứ bảy rồi so.',
    ],
    canhBao:
      'Đừng quay lại học thêm một khoá ngữ pháp nữa. Đó chính là việc bạn đã làm nhiều năm và nó không chữa được cái đang hỏng.',
    hopVoi: 'Lớp giao tiếp Speak Now 1 kèm 1, trọng tâm phản xạ nói.',
  },

  so_sai: {
    ma: 'so_sai',
    ten: 'Sợ sai, sợ bị cười',
    motCau:
      'Bạn biết mình nói được, nhưng có người nghe là cổ họng khoá lại.',
    dauHieu: [
      'Trong lớp đông thì im, học một mình thì nói được',
      'Sợ nhất là bị sửa lỗi giữa câu',
      'Từng có một lần bị chê hoặc bị cười, và vẫn nhớ',
      'Tim đập nhanh khi tới lượt mình, dù câu trả lời đã nghĩ sẵn',
    ],
    viSao: [
      'Lo lắng trong lớp ngoại ngữ là một hiện tượng riêng, đã được mô tả trong nghiên cứu từ những năm 1980 — nó không phải dấu hiệu bạn kém.',
      'Khi lo lắng cao, phần trí nhớ làm việc bị chiếm chỗ bởi chính nỗi lo, nên vốn từ bạn có thật sự bị chặn lại. Bạn không quên — bạn không với tới được.',
      'Lớp đông làm mọi thứ nặng hơn: mỗi lần nói là một lần bị đánh giá trước nhiều người.',
    ],
    phuongPhap: [
      'Hạ rủi ro trước, nâng độ khó sau. Bắt đầu ở nơi sai không mất gì: 1 kèm 1, không ai nghe ngoài giáo viên.',
      'Thoả thuận trước với giáo viên: **không sửa lỗi giữa câu**. Ghi lại, sửa ở cuối lượt.',
      'Có kịch bản trước. Biết trước sẽ nói về cái gì làm lo lắng giảm rõ rệt — đó không phải gian lận, đó là bắc giàn giáo.',
      'Đo tiến bộ bằng thời lượng bạn nói, không bằng số lỗi. Chỉ số đó đi lên thì lo lắng đi xuống.',
    ],
    vieclamNgay: [
      'Nói một mình với điện thoại, hai phút, về việc bạn vừa làm hôm nay. Không ai nghe. Mục tiêu là *nói hết hai phút*, sai bao nhiêu cũng được.',
      'Viết ra câu bạn sợ nhất khi bị hỏi. Chuẩn bị sẵn câu trả lời. Nỗi sợ thường nằm ở một câu cụ thể, không phải cả ngôn ngữ.',
      'Nhắn cho người sẽ dạy bạn: "Tôi ngại nói. Xin đừng sửa giữa câu." Câu này thay đổi buổi học đầu tiên nhiều hơn bạn nghĩ.',
    ],
    canhBao:
      'Đừng ép mình vào lớp đông để "luyện bản lĩnh". Với chân dung này, lớp đông thường làm nỗi sợ chắc thêm chứ không mòn đi.',
    hopVoi: 'Lớp 1 kèm 1, giáo viên được dặn trước về quy ước sửa lỗi.',
  },

  ban_ron: {
    ma: 'ban_ron',
    ten: 'Bận, thời gian vụn',
    motCau:
      'Vấn đề của bạn không phải phương pháp. Là lịch.',
    dauHieu: [
      'Đã mua khoá học và không học hết',
      'Tuần nào cũng định bắt đầu lại vào thứ Hai',
      'Có tuần học ba buổi, có tháng không buổi nào',
      'Thời gian rảnh có thật nhưng vụn, mười lăm phút một lần',
    ],
    viSao: [
      'Kế hoạch học của người bận thường thất bại vì nó được lập cho một tuần lý tưởng chứ không phải tuần thật.',
      'Học ngôn ngữ ăn nhau ở chỗ *đều*, không ở chỗ nhiều. Ba buổi ngắn rải đều hơn hẳn một buổi dài rồi nghỉ hai tuần — hiệu ứng giãn cách đã được biết tới từ lâu trong nghiên cứu trí nhớ.',
      'Mỗi lần dừng rồi bắt đầu lại, bạn mất thời gian hâm nóng lại những gì đã quên. Dừng nhiều lần là mất phần lớn công sức vào việc hâm nóng.',
    ],
    phuongPhap: [
      'Chốt một khung giờ cố định trong tuần và đặt nó trước mọi thứ khác. Khung giờ quan trọng hơn thời lượng.',
      'Thu hẹp mục tiêu tới mức gần như buồn cười: một tình huống công việc, không phải "giỏi tiếng Anh".',
      'Học 1 kèm 1 vì nó bỏ được phần chờ lượt — mỗi phút là phút của bạn.',
      'Có một người chờ bạn vào giờ đó. Với người bận, lịch hẹn với người thật là thứ giữ được nhịp, ứng dụng tự học thì không.',
    ],
    vieclamNgay: [
      'Mở lịch, đặt một buổi lặp lại hằng tuần, ngay bây giờ, trước khi đọc tiếp.',
      'Chọn đúng một tình huống bạn thật sự gặp trong tháng này — gọi cho đối tác, nói chuyện ở sân bay, họp với người nước ngoài. Chỉ một.',
      'Bỏ hết ứng dụng học tiếng Anh đang mở dở trên điện thoại. Chúng đang tạo cảm giác đang học mà không tạo tiến bộ.',
    ],
    canhBao:
      'Đừng đăng ký gói dài với lịch dày. Với chân dung này, lịch dày là cách chắc chắn nhất để bỏ dở lần nữa.',
    hopVoi: 'Lớp 1 kèm 1, lịch cố định, mục tiêu hẹp theo tình huống công việc.',
  },

  mat_goc: {
    ma: 'mat_goc',
    ten: 'Mất gốc, đã bắt đầu lại nhiều lần',
    motCau:
      'Mỗi lần bắt đầu lại đều từ bài một, và chưa lần nào đi qua được bài mười.',
    dauHieu: [
      'Nhìn chữ không chắc đọc thế nào',
      'Nghe người bản ngữ nói thì không tách được đâu là hết từ này, đầu từ kia',
      'Đã học đi học lại thì hiện tại đơn nhiều lần',
      'Thấy mình quá tuổi để bắt đầu',
    ],
    viSao: [
      'Phần lớn khoá "mất gốc" bắt đầu bằng ngữ pháp, trong khi thứ đang chặn bạn là *âm* — không nhận ra được âm thì không nghe ra được từ, dù từ đó bạn có biết.',
      'Học dàn trải khiến bạn tiêu thời gian vào những từ hiếm khi gặp. Khối từ phổ biến nhất mới là khối che phủ phần lớn hội thoại thường ngày.',
      'Bỏ cuộc thường xảy ra vào tuần thứ ba đến thứ sáu — quãng đã hết hứng mới nhưng chưa thấy kết quả. Nếu không có cách đo tiến bộ ngắn hạn, quãng này gần như luôn thắng.',
    ],
    phuongPhap: [
      'Bắt đầu từ âm, không từ ngữ pháp. Nhận mặt âm và nối âm trước.',
      'Học khối từ tần suất cao trước, và học chúng trong câu có thể nói ra được ngay, không học danh sách rời.',
      'Đặt mốc đo mỗi hai tuần, nhỏ và cụ thể: tự giới thiệu 60 giây không ngập ngừng, đặt được năm câu hỏi về người đối diện.',
      'Chấp nhận đi chậm ở tháng đầu. Nền móng làm dối thì tháng thứ tư phải làm lại.',
    ],
    vieclamNgay: [
      'Tự giới thiệu 30 giây, ghi âm lại. Đây là mốc số không của bạn — giữ file đó.',
      'Chọn 20 từ bạn dùng hằng ngày bằng tiếng Việt. Tra cách phát âm. Đó là 20 từ đầu tiên đáng học.',
      'Đừng mua giáo trình mới. Lấy cuốn đang có, mở lại trang một, nhưng lần này đọc to mọi thứ.',
    ],
    canhBao:
      'Đừng đặt mục tiêu theo chứng chỉ ở giai đoạn này. Mục tiêu xa quá làm quãng tuần thứ ba càng khó vượt.',
    hopVoi: 'Lớp nền tảng, ưu tiên phát âm và khối từ lõi trước khi vào giao tiếp mở.',
  },

  ielts_gap: {
    ma: 'ielts_gap',
    ten: 'Cần IELTS, có hạn chót',
    motCau:
      'Bạn không cần giỏi tiếng Anh nói chung. Bạn cần đúng số điểm đó, trước đúng ngày đó.',
    dauHieu: [
      'Đã có hạn nộp hồ sơ hoặc hạn visa',
      'Biết mình cần band bao nhiêu nhưng không chắc đang ở đâu',
      'Đang học dàn trải cả bốn kỹ năng mà không biết kỹ năng nào đang kéo lùi',
      'Đã thi một lần và không đạt kỹ năng mình chủ quan nhất',
    ],
    viSao: [
      'IELTS là bài thi có dạng câu hỏi cố định. Một phần điểm mất đi không phải vì tiếng Anh yếu mà vì chưa quen dạng bài và chưa quản được thời gian.',
      'Khi có hạn chót, học dàn đều bốn kỹ năng là cách tiêu thời gian kém hiệu quả nhất. Điểm tổng bị kéo xuống bởi kỹ năng thấp nhất, nên phải đo trước rồi dồn vào đó.',
      'Speaking và Writing được chấm theo thang tiêu chí công bố công khai. Không đọc thang tiêu chí mà luyện là luyện mù.',
    ],
    phuongPhap: [
      'Đo trước, học sau. Một bài thi thử đầy đủ, đúng giờ, trước khi lên kế hoạch.',
      'Dồn phần lớn thời gian vào kỹ năng thấp nhất, giữ ba kỹ năng kia ở mức duy trì.',
      'Luyện theo dạng bài, bấm giờ thật từ tuần đầu, không để tới cuối mới bấm giờ.',
      'Đọc thang tiêu chí chấm Speaking và Writing của IELTS, rồi tự chấm bài của mình theo đúng bốn mục đó.',
    ],
    vieclamNgay: [
      'Đếm số tuần còn lại tới ngày thi. Viết con số đó ra giấy.',
      'Làm một đề Listening và một đề Reading đúng giờ. Đây là toạ độ thật của bạn, không phải cảm giác.',
      'Tải thang tiêu chí Speaking công bố trên trang chính thức của IELTS và đọc hết một lượt.',
    ],
    canhBao:
      'Cẩn thận với mọi lời cam kết tăng band theo mốc thời gian. Không ai kiểm chứng được lời hứa đó trước khi bạn đã trả tiền — trung tâm này không hứa như vậy và bạn nên hỏi kỹ nơi nào có hứa.',
    hopVoi: 'Lộ trình IELTS có đo đầu vào bằng đề thi thử, ưu tiên kỹ năng yếu nhất.',
  },

  phu_huynh: {
    ma: 'phu_huynh',
    ten: 'Phụ huynh chọn cho con',
    motCau:
      'Người học là con bạn, nhưng người phải chọn đúng là bạn — và hai việc đó cần hai loại thông tin khác nhau.',
    dauHieu: [
      'Con học đã một thời gian mà bạn không rõ con đang ở đâu',
      'Con điểm cao ở trường nhưng gặp người nước ngoài thì im',
      'Bạn đang so sánh vài trung tâm và các bên nói giống nhau',
      'Bạn lo ép quá thì con ghét tiếng Anh, thả quá thì con không đi tới đâu',
    ],
    viSao: [
      'Điểm ở trường đo kiến thức ngữ pháp và từ vựng, không đo khả năng dùng. Hai cái lệch nhau là chuyện rất thường, không phải dấu hiệu con có vấn đề.',
      'Với trẻ, thái độ với môn học hình thành sớm và bền. Một giai đoạn bị ép có thể trả giá bằng nhiều năm né tránh về sau.',
      'Thứ khó nhìn nhất từ ngoài là **bằng chứng**: con đã nói được những gì, tuần này khác tuần trước ở chỗ nào. Không có bằng chứng thì mọi trung tâm nghe đều giống nhau.',
    ],
    phuongPhap: [
      'Hỏi bốn câu khi đi tư vấn bất cứ đâu: Mỗi buổi con nói bao nhiêu phút? · Ai dạy con, và có đổi giáo viên giữa chừng không? · Tôi nhận được gì sau mỗi buổi? · Con đang ở mức nào và đo bằng cái gì?',
      'Xin xem một báo cáo buổi học thật, đã xoá tên, của một học viên khác. Nơi nào có thứ đó là nơi có quy trình.',
      'Ở nhà, đừng kiểm tra từ vựng. Hỏi "hôm nay con nói được câu gì?" thay vì "hôm nay con học từ gì?"',
      'Đặt mốc theo hành vi chứ không theo điểm: con dám hỏi lại khi không hiểu, con nói hết câu không chuyển sang tiếng Việt giữa chừng.',
    ],
    vieclamNgay: [
      'Quay một đoạn 60 giây con nói tiếng Anh về bất cứ chuyện gì. Giữ lại. Ba tháng nữa quay lại đoạn thứ hai — đây là cách đo tiến bộ trung thực nhất và không tốn gì.',
      'Hỏi con: "Lúc học tiếng Anh, chỗ nào làm con thấy chán nhất?" Câu trả lời thường chỉ thẳng vào vấn đề.',
      'Viết ra điều bạn thật sự muốn cho con trong hai năm tới. Nếu nó không phải một con số điểm, hãy tìm trung tâm đo được đúng cái bạn viết.',
    ],
    canhBao:
      'Cảnh giác với nơi cam kết đầu ra theo mốc thời gian, và với nơi không cho bạn xem con học bằng chứng gì. Trung tâm này cấp Giấy xác nhận hoàn thành, không cấp chứng chỉ được cơ quan nhà nước công nhận — và bạn nên hỏi câu đó ở mọi nơi bạn tới.',
    hopVoi: 'Lớp thiếu nhi Kid\u2019s Box, có báo cáo sau từng buổi gửi về cho phụ huynh.',
  },
}

export const DANH_SACH_CHAN_DUNG = Object.values(CHAN_DUNG)
