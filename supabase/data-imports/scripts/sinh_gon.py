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
    # Gia tri dropdown cua bang Be Ngan. Nam cung bac voi "can nhac nho" tren
    # thang thai do; chu goc cua GV van duoc giu trong cot comments.
    "chua tap trung": "needs_improvement",
    "khong hop tac": "concerning",
    "very positive": "excellent", "very active": "excellent",
    "active": "good",
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
    """Bo sao, emoji, khoang trang thua -> con lai chu.

    O danh gia chi chua mot NHAN ngan (Tot, Kha, Rat tich cuc...). Vai bang cu
    co cot lech nen o nay lai chua ca doan van nhan xet. Doan van khong phai
    nhan: tra None va de buoc goi bao ra, con phan chu van nam nguyen o cot
    Diem manh / Can cai thien nen khong mat gi.
    """
    if not v:
        return None
    v = RAC.sub(" ", v)
    v = re.sub(r"\s+", " ", v).strip()
    if len(v) > 60:
        return None
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
    if isinstance(v, list):
        return [u for u in v if isinstance(u, str) and u.startswith("http")]
    return [u for u in re.split(r"[\s,]+", v or "") if u.startswith("http")]


def trang_thai_bao_cao(v):
    """Sheet ghi 'Hoan thanh' hoac 'Can xac minh ...'."""
    if v and "xac minh" in kd(v):
        return "needs_review"
    return "submitted"


def chay(ten_lop, file_json, file_ngay, ra):
    sheet = json.load(open(file_json))
    db = {d.strip() for d in open(file_ngay) if d.strip()}

    # Buoc 1: ung vien nao co that trong he thong.
    khop_moi_dong = [[n for n in b.get("ngay_ung_vien", []) if n in db] for b in sheet]

    # Buoc 2: o nao con hai cach doc deu co that (08/02 = 8 thang 2 hay 2 thang 8?)
    # thi dua vao THU TU DONG trong sheet de chon. Bang feedback duoc dien theo
    # thu tu buoi hoc, nen ngay cua mot dong phai nam giua dong chac chan truoc
    # no va dong chac chan sau no. Chi mot ung vien lot vao khoang do -> lay,
    # va ghi ra la da suy theo thu tu. Van con hai -> bo qua.
    truoc = [None] * len(sheet)
    moc = None
    for i, k in enumerate(khop_moi_dong):
        truoc[i] = moc
        if len(k) == 1:
            moc = k[0]
    sau = [None] * len(sheet)
    moc = None
    for i in range(len(sheet) - 1, -1, -1):
        sau[i] = moc
        if len(khop_moi_dong[i]) == 1:
            moc = khop_moi_dong[i][0]

    # Vai bang cu bi lech cot: o "Noi dung bai hoc" lai chua nhan danh gia.
    # Nhan ra thi tra ve dung cho cua no, khong de chuoi "Xuat sac" nam trong
    # phan noi dung bai hoc.
    for b in sheet:
        nd = (b.get("noi_dung") or "").strip()
        if nd and (nd.startswith("\u2b50") or kd(RAC.sub(" ", nd).strip()) in MUC_DO):
            if not b.get("muc_do"):
                b["muc_do"] = nd
            b["noi_dung"] = None

    rows, chon, suy, bo_qua, la = [], [], [], [], set()
    for i, b in enumerate(sheet):
        khop = khop_moi_dong[i]
        if len(khop) > 1:
            lot = [n for n in khop
                   if (truoc[i] is None or n >= truoc[i])
                   and (sau[i] is None or n <= sau[i])]
            if len(lot) == 1:
                suy.append((b.get("ngay_goc"), lot[0], truoc[i], sau[i]))
                khop = lot
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
        if hien and do_dai + co > 21000:
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
    for a, b_, t, sa in suy:
        print(f"    SUY THU TU: o ghi {a} -> {b_}  (giua {t} va {sa})")
    for n, s_, c, vi in bo_qua:
        print(f"    BO QUA   : {n} buoi {s_} {c}  ({vi})")
    for x in sorted(la):
        print(f"    LA NHAN  : {x}   -> de trong, can nguoi xem")


def sinh_cau(ten_lop, payload, n_sheet, n_ghep, n_bo, n_trung, k, tong_manh):
    """Tu 15/09/2026 phan SQL lap lai da chuyen thanh ham fn_nhap_feedback
    trong CSDL (migration 0024), nen o day chi con du lieu."""
    return (f"-- {ten_lop} · manh {k}/{tong_manh} · sheet {n_sheet} dong"
            f" · ghep {n_ghep} buoi · bo qua {n_bo} · trung ngay {n_trung}\n"
            f"select * from fn_nhap_feedback('{ten_lop.replace(chr(39), chr(39)*2)}',\n"
            f"'{payload}'::jsonb);\n")


if __name__ == "__main__":
    chay(sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4])
