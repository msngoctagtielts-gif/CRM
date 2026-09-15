"""Sinh MOT cau lenh SQL duy nhat cho mot lop, du lieu di kem dang JSON.

Ban dau moi buoi sinh 3-4 cau lenh rieng -> 110KB cho rieng lop Luan, 21 lop la
khong kham noi. Gop lai: toan bo noi dung di trong mot mang JSON, phan SQL chi
viet mot lan.

CHOT AN TOAN VE NGAY: bang feedback duoc nhieu giao vien dien, moi nguoi mot
kieu (24/09/2025, 10/15/25 kieu My, 2025-12-05). doc_sheet.py sinh HET cac cach
doc hop le cua mot o; o day doi chieu voi ngay that trong he thong. Dung MOT
ung vien khop -> lay. Khong khop, hoac khop tu hai tro len -> BO QUA va bao ra.
Khong bao gio doan.

ANH XA NHAN DANH GIA: sheet ghi tieng Viet, CSDL rang buoc 5 ma co dinh
(excellent/good/average/needs_improvement/concerning). Anh xa theo VI TRI TREN
THANG chu khong dich tung chu. Day la DIEN GIAI cua he thong, khong phai su
that tuyet doi - nen chu goc cua giao vien duoc giu nguyen trong cot comments
de khong mat gi. Gia tri la khong nhan ra duoc thi BAO RA, khong tu doan.
"""
import json, re, sys, datetime

MUC_DO = {
    "xuat sac": "excellent", "rat tot": "excellent",
    "tot": "good",
    "kha": "average", "trung binh": "average",
    "can co gang": "needs_improvement", "yeu": "needs_improvement",
    "kem": "concerning",
    # Vai giao vien dien bang tieng Anh (dropdown song ngu).
    "excellent": "excellent", "very good": "excellent",
    "good": "good",
    "average": "average", "fair": "average",
    "needs improvement": "needs_improvement", "weak": "needs_improvement",
    "poor": "concerning",
}

THAI_DO = {
    "rat tich cuc": "excellent",
    "tich cuc": "good", "tich cuc, co gang": "good",
    "hop tac": "average", "binh thuong": "average",
    "can nhac nho": "needs_improvement",
    "khong hop tac": "concerning",
    "very positive": "excellent",
    "positive": "good", "enthusiastic": "good",
    "cooperative": "average", "neutral": "average",
    "needs reminder": "needs_improvement",
    "uncooperative": "concerning",
}

import unicodedata


def kd(s):
    s = unicodedata.normalize("NFD", s or "")
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    return s.replace("đ", "d").replace("Đ", "D").lower().strip()


RAC = re.compile(r"[^\w\s,]", re.UNICODE)


def lam_sach_nhan(v):
    """Bo sao, emoji, khoang trang thua -> con lai chu."""
    if not v:
        return None
    v = RAC.sub(" ", v)
    v = re.sub(r"\s+", " ", v).strip()
    return v or None


def ma_hoa(v, bang, la, ghi_nhan):
    """Doi nhan tieng Viet sang ma chuan. Khong nhan ra thi bao ra."""
    nhan = lam_sach_nhan(v)
    if not nhan:
        return None
    ma = bang.get(kd(nhan))
    if ma is None:
        ghi_nhan.add(f"{la}: {nhan!r}")
    return ma


def dao_ngay(n):
    y, m, d = n.split("-")
    try:
        datetime.date(int(y), int(d), int(m))
        return f"{y}-{d}-{m}"
    except ValueError:
        return None


def videos(v):
    return [u for u in re.split(r"[\s,]+", v or "") if u.startswith("http")]


def trang_thai_bao_cao(v):
    """Sheet ghi 'Hoan thanh' hoac 'Can xac minh ...'."""
    if v and "xac minh" in kd(v):
        return "needs_review"
    return "submitted"


def chay(ten_lop, file_json, file_ngay, ra):
    sheet = json.load(open(file_json))
    db = {d.strip() for d in open(file_ngay) if d.strip()}

    rows, chon, bo_qua, la = [], [], [], set()
    for b in sheet:
        khop = [n for n in b.get("ngay_ung_vien", []) if n in db]
        if len(khop) != 1:
            bo_qua.append((b.get("ngay_goc"), b.get("so_buoi"),
                           (b.get("chu_de") or "")[:45],
                           "khong khop" if not khop else f"khop {len(khop)} ngay"))
            continue
        n = khop[0]
        if b.get("ngay_ung_vien", [None])[0] != n:
            chon.append((b.get("ngay_goc"), n))

        md_goc = lam_sach_nhan(b.get("muc_do"))
        td_goc = lam_sach_nhan(b.get("thai_do"))
        goc = " · ".join(
            x for x in (
                f"Mức độ tiếp thu: {md_goc}" if md_goc else None,
                f"Thái độ: {td_goc}" if td_goc else None,
            ) if x
        )

        rows.append({
            "ngay": n,
            "chu_de": b.get("chu_de"),
            "noi_dung": b.get("noi_dung"),
            "diem_manh": b.get("diem_manh"),
            "cai_thien": b.get("cai_thien"),
            "bai_tap": b.get("bai_tap"),
            "ghi_chu": b.get("ghi_chu"),
            "muc_do": ma_hoa(b.get("muc_do"), MUC_DO, "mức độ", la),
            "thai_do": ma_hoa(b.get("thai_do"), THAI_DO, "thái độ", la),
            "nhan_goc": goc or None,
            "trang_thai": trang_thai_bao_cao(b.get("trang_thai")),
            "video": videos(b.get("video")),
        })

    # Mot ngay chi giu MOT dong. Vai bang co dong trung ngay (giao vien dien
    # lai). Giu dong co nhieu noi dung nhat de khong mat du lieu.
    tot_nhat = {}
    for r in rows:
        cu = tot_nhat.get(r["ngay"])
        dem = sum(1 for k in ("noi_dung", "diem_manh", "cai_thien", "bai_tap") if r.get(k))
        if cu is None or dem > cu[0]:
            tot_nhat[r["ngay"]] = (dem, r)
    trung = len(rows) - len(tot_nhat)
    rows = [v[1] for v in tot_nhat.values()]

    # execute_sql nhan tung cau mot, ma ca lop co the toi 65 KB — qua lon de
    # truyen di mot lan. Chia thanh nhieu manh, moi manh la mot cau hoan chinh
    # chay doc lap duoc. Cac cau deu co "not exists" nen chay lai khong nhan doi.
    manh, hien, do_dai = [], [], 0
    for r in rows:
        co = len(json.dumps(r, ensure_ascii=False))
        if hien and do_dai + co > 17000:
            manh.append(hien)
            hien, do_dai = [], 0
        hien.append(r)
        do_dai += co
    if hien:
        manh.append(hien)

    tep = []
    for k, phan in enumerate(manh, 1):
        payload = json.dumps(phan, ensure_ascii=False).replace("'", "''")
        sql = sinh_cau(ten_lop, payload, len(sheet), len(rows), len(bo_qua), trung, k, len(manh))
        ten_tep = ra if len(manh) == 1 else ra.replace(".sql", f"_{k}.sql")
        open(ten_tep, "w").write(sql)
        tep.append((ten_tep, len(sql)))

    print(f"{ten_lop}: ghep {len(rows)}/{len(sheet)} dong"
          f" · bo qua {len(bo_qua)} · trung ngay {trung} · {len(manh)} manh")
    for t, n in tep:
        print(f"    {t}  {n} ky tu")
    for a, b_ in chon:
        print(f"    DOC LAI  : o ghi {a} -> he thong {b_}")
    for n, s_, c, vi in bo_qua:
        print(f"    BO QUA   : {n} buoi {s_} {c}  ({vi})")
    for x in sorted(la):
        print(f"    LA NHAN  : {x}   -> de trong, can nguoi xem")


def sinh_cau(ten_lop, payload, n_sheet, n_ghep, n_bo, n_trung, k, tong_manh):
    return f"""-- Nhap noi dung buoi hoc tu bang feedback -- {ten_lop}
-- Manh {k}/{tong_manh} · sheet {n_sheet} dong · ghep {n_ghep} buoi · bo qua {n_bo} · trung ngay {n_trung}
with d as (
  select * from jsonb_to_recordset('{payload}'::jsonb)
    as t(ngay date, chu_de text, noi_dung text, diem_manh text, cai_thien text,
         bai_tap text, ghi_chu text, muc_do text, thai_do text, nhan_goc text,
         trang_thai text, video jsonb)
),
b as (
  select d.*, l.id as lesson_id, l.class_id, l.teacher_id
    from d join classes c on c.name = '{ten_lop.replace("'", "''")}'
           join lessons l on l.class_id = c.id and l.lesson_date = d.ngay
),
sua_topic as (
  update lessons l set topic = b.chu_de from b
   where l.id = b.lesson_id and b.chu_de is not null
     and (l.topic is null or l.topic = '')
  returning 1
),
them_bao_cao as (
  insert into teaching_reports
    (lesson_id, class_id, teacher_id, report_date, lesson_content,
     strengths, improvements, homework_summary, qc_notes, status, authored_by)
  select b.lesson_id, b.class_id, b.teacher_id, b.ngay, b.noi_dung,
         b.diem_manh, b.cai_thien, b.bai_tap, b.ghi_chu,
         b.trang_thai::report_status, 'teacher'
    from b
   where not exists (select 1 from teaching_reports t where t.lesson_id = b.lesson_id)
  returning id, lesson_id
),
them_hoc_vien as (
  insert into teaching_report_students
    (report_id, student_id, performance, attitude, comments)
  select r.id, cs.student_id, b.muc_do, b.thai_do, b.nhan_goc
    from them_bao_cao r
    join b on b.lesson_id = r.lesson_id
    join class_students cs on cs.class_id = b.class_id and cs.status = 'active'
   where b.muc_do is not null or b.thai_do is not null or b.nhan_goc is not null
  returning 1
),
them_video as (
  insert into recordings (lesson_id, class_id, url, provider, title, visible_to_parent)
  select b.lesson_id, b.class_id, v.url, 'sheet_feedback',
         case when jsonb_array_length(b.video) > 1 then 'Phần ' || v.i::text end, true
    from b cross join lateral (
      select value #>> '{{}}' as url, ordinality as i
        from jsonb_array_elements(b.video) with ordinality
    ) v
   where not exists (select 1 from recordings x
                      where x.lesson_id = b.lesson_id and x.url = v.url)
  returning 1
)
select (select count(*) from b)              as buoi_ghep_duoc,
       (select count(*) from them_bao_cao)   as bao_cao_moi,
       (select count(*) from them_hoc_vien)  as danh_gia_moi,
       (select count(*) from them_video)     as video_moi;
"""


if __name__ == "__main__":
    chay(sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4])
