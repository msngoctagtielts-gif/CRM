"""Boc bang feedback cua mot lop tu ket qua Google Drive MCP thanh JSON.

Bang feedback dung chung mot khuon cho ca 21 lop: co mot dong tieu de cot, tu
dong sau do moi dong la mot buoi hoc. Cot duoc nhan theo TU KHOA trong tieu de
chu khong theo vi tri, vi vai bang co the them bot cot.
"""
import json, re, sys

KHOA = {
    "ngay":      ["ngay hoc", "class date", "teaching date"],
    "giao_vien": ["giao vien", "teacher"],
    "gio_vao":   ["gio bat dau", "start time"],
    "gio_ra":    ["gio ket thuc", "end time"],
    "phut":      ["thoi luong", "duration"],
    "so_buoi":   ["so buoi", "session no"],
    "chu_de":    ["chu de", "topic"],
    "noi_dung":  ["noi dung bai hoc", "lesson content"],
    "muc_do":    ["muc do tiep thu", "comprehension"],
    "thai_do":   ["thai do", "attitude"],
    "diem_manh": ["diem manh", "strengths", "student strengths"],
    "cai_thien": ["can cai thien", "areas to improve", "areas for improvement"],
    "bai_tap":   ["bai tap", "homework"],
    # Moi lop dat ten cot video mot kieu: "Link Video", "Video Link",
    # "Video/Recording Link"... Nhan theo tu khoa chung nhat.
    "video":     ["link video", "video link", "video/recording", "recording link"],
    "ghi_chu":   ["ghi chu gv", "teacher notes", "ghi chu qa", "internal qa"],
    "da_gui":    ["da gui", "sent to parent"],
    "trang_thai": ["trang thai", "status"],
}

DAU = str.maketrans(
    "aaaaaaaaaaaaaaaaaeeeeeeeeeeeiiiiiooooooooooooooooouuuuuuuuuuuyyyyyd"
    "AAAAAAAAAAAAAAAAAEEEEEEEEEEEIIIIIOOOOOOOOOOOOOOOOOUUUUUUUUUUUYYYYYD",
    "aaaaaaaaaaaaaaaaaeeeeeeeeeeeiiiiiooooooooooooooooouuuuuuuuuuuyyyyyd"
    "AAAAAAAAAAAAAAAAAEEEEEEEEEEEIIIIIOOOOOOOOOOOOOOOOOUUUUUUUUUUUYYYYYD",
)

import unicodedata


def khong_dau(s):
    """Bo dau tieng Viet de so khop tieu de cot on dinh."""
    s = unicodedata.normalize("NFD", s)
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    return s.replace("đ", "d").replace("Đ", "D").lower()


def sach(s):
    """Bo ky tu rac cua bang markdown va emoji hong."""
    s = s.replace("\\", "").replace("[merged]", "")
    # Emoji bi hong khi xuat ra markdown -> bo cac ky tu khong in duoc.
    s = "".join(c for c in s if unicodedata.category(c)[0] != "C")
    s = re.sub(r"[�ð¤ª°»]", "", s)
    return s.strip()


import datetime


NAM_CO_DU_LIEU = (2025, 2026)

THANG = {"jan": 1, "feb": 2, "mar": 3, "apr": 4, "may": 5, "jun": 6,
         "jul": 7, "aug": 8, "sep": 9, "oct": 10, "nov": 11, "dec": 12}


def ngay_ung_vien(o):
    """Tra ve cac ngay ISO co the dung cho o ngay nay.

    Bang feedback duoc nhieu giao vien dien, moi nguoi mot kieu: 24/09/2025
    (ngay/thang), 10/15/25 (thang/ngay kieu My), 2025-12-05 (ISO). Khong the
    doan tu mot o le. Nen o day sinh HET moi cach doc hop le, roi de buoc sau
    doi chieu voi ngay that trong he thong: chi mot ung vien khop thi dung,
    khong khop hoac khop nhieu hon mot thi bo qua va bao ra.
    """
    o = (o or "").strip()
    if not o:
        return []
    m = re.match(r"^(\d{4})-(\d{1,2})-(\d{1,2})$", o)
    if m:
        y, a, b = (int(x) for x in m.groups())
        try:
            return [datetime.date(y, a, b).isoformat()]
        except ValueError:
            return []
    # Co GV ghi bang chu: "August 10, 2026". Dang nay khong nhap nhang
    # ngay/thang nen chi sinh DUNG MOT ung vien.
    m = re.match(r"^([A-Za-z]{3,9})\.?\s+(\d{1,2}),?\s+(\d{4})$", o)
    if m and m.group(1).lower()[:3] in THANG:
        try:
            return [datetime.date(int(m.group(3)), THANG[m.group(1).lower()[:3]],
                                  int(m.group(2))).isoformat()]
        except ValueError:
            return []

    # Vai o chi ghi ngay/thang, khong co nam ("24/7" - lop Hoang/Hue). Sinh het
    # cac cach doc cua ca hai nam trung tam co du lieu roi de buoc doi chieu voi
    # CSDL chon. Van dung dung luat: chi mot ung vien khop thi lay.
    m = re.match(r"^(\d{1,2})[/-](\d{1,2})$", o)
    if m:
        a, b = int(m.group(1)), int(m.group(2))
        ra = []
        for y in NAM_CO_DU_LIEU:
            for d, mo in ((a, b), (b, a)):
                try:
                    iso = datetime.date(y, mo, d).isoformat()
                except ValueError:
                    continue
                if iso not in ra:
                    ra.append(iso)
        return ra

    m = re.match(r"^(\d{1,2})[/-](\d{1,2})[/-](\d{2}|\d{4})$", o)
    if not m:
        return []
    a, b, y = int(m.group(1)), int(m.group(2)), int(m.group(3))
    if y < 100:
        y += 2000
    ra = []
    for d, mo in ((a, b), (b, a)):          # ngay/thang truoc, roi thang/ngay
        try:
            iso = datetime.date(y, mo, d).isoformat()
        except ValueError:
            continue
        if iso not in ra:
            ra.append(iso)
    return ra


def cot(line):
    return [sach(p) for p in line.split("|")]


def doc(path):
    """Nhan ca file .json (co khoa fileContent) lan file .md tho."""
    raw = open(path, encoding="utf-8").read()
    if path.endswith(".json"):
        txt = json.loads(raw)["fileContent"]
    else:
        txt = raw
    lines = txt.split("\n")

    # Truoc day doi dong tieu de phai co ca "ngay hoc" lan "gio bat dau".
    # Bang nhom Y Khoa khong co cot gio nen bi truot. Gio cham diem: dong tieu
    # de la dong co cot ngay VA it nhat 4 nhom cot khac nhan ra duoc - du chat
    # de khong nham voi dong huong dan, du rong de chiu duoc bang thieu cot.
    # Mot tep co the chua NHIEU bang feedback. Lop Hoang/Hue la vi du: thang 5
    # ghi o mot bang theo khuon cu (Teaching Date / Lesson Content), tu thang 6
    # chuyen sang khuon moi (Ngay hoc / Chu de). Truoc day chi doc bang dau nen
    # 6 buoi thang 5 bi bo im lang. Gio doc het moi bang tim duoc.
    #
    # Tep cua Founder con chua ca bang luong, hoc phi va loi nhuan. Nhung bang
    # do khong co cot ngay hoc + 4 cot feedback nen khong lot qua duoc bo loc
    # duoi day - khong co so tien nao bi nap vao CSDL.
    dau_bang = []
    for i, l in enumerate(lines):
        # Do khop theo TUNG O, va chi tinh o NGAN. Tieu de cot la nhan ngan;
        # o du lieu la doan van dai co the tinh co chua chu "homework" hay
        # "strengths". Neu khong chan, mot dong du lieu se bi nhan nham la tieu
        # de bang moi va cat doi bang that - lop Diep - Ms. Rose tung tut tu 22
        # buoi xuong 8 vi loi nay.
        o_ngan = [khong_dau(x) for x in cot(l) if len(x) <= 60]
        if not any(t in o for o in o_ngan for t in KHOA["ngay"]):
            continue
        diem = sum(1 for ten, tu in KHOA.items()
                   if ten != "ngay" and any(t in o for o in o_ngan for t in tu))
        if diem >= 4:
            dau_bang.append(i)
    if not dau_bang:
        sys.exit("Khong tim thay dong tieu de")

    buoi = []
    for k, i_hdr in enumerate(dau_bang):
        het = dau_bang[k + 1] if k + 1 < len(dau_bang) else len(lines)
        hdr = cot(lines[i_hdr])
        idx = {}
        for ten, tu_khoa in KHOA.items():
            for j, h in enumerate(hdr):
                hl = khong_dau(h)
                if any(t in hl for t in tu_khoa):
                    idx[ten] = j
                    break

        # Chi cot ngay la bat buoc that. Gio bat dau khong nhap vao he thong
        # (D38), con noi dung bai hoc thi nhieu GV viet thang vao cot Diem manh
        # - bang nhom Y Khoa con khong co cot do.
        if "ngay" not in idx:
            continue
        if "noi_dung" not in idx and "diem_manh" not in idx:
            continue

        for l in lines[i_hdr + 1:het]:
            c = cot(l)
            if len(c) <= max(idx.values()):
                continue
            ung_vien = ngay_ung_vien(c[idx["ngay"]])
            if not ung_vien:
                continue
            b = {"ngay_ung_vien": ung_vien, "ngay_goc": c[idx["ngay"]]}
            for ten, j in idx.items():
                if ten == "ngay":
                    continue
                v = c[j] if j < len(c) else ""
                # Vai GV go "0" vao o bai tap de y la "khong giao bai". De
                # nguyen thi phu huynh doc duoc dong "Bai tap ve nha: 0".
                if ten == "bai_tap" and v.strip() in ("0", "-", "x", "X"):
                    v = ""
                b[ten] = v or None
            # Cung mot buoi co the xuat hien o hai bang (bang tong hop lai
            # noi dung bang chi tiet). Giu ban DAY DU hon, khong nhan doi.
            khoa = tuple(ung_vien)
            do_day = sum(len(v or "") for k_, v in b.items() if k_ != "ngay_ung_vien")
            cu = next((x for x in buoi
                       if tuple(x["ngay_ung_vien"]) == khoa), None)
            if cu is not None:
                cu_day = sum(len(v or "") for k_, v in cu.items()
                             if k_ != "ngay_ung_vien")
                if do_day > cu_day:
                    buoi[buoi.index(cu)] = b
                continue
            buoi.append(b)
    # Dong khong co chu de, noi dung, diem manh, can cai thien lan bai tap thi
    # KHONG nap. Mot bao cao rong con te hon la khong co bao cao: man hinh Chat
    # luong se dem buoi do la "da co ho so" trong khi that ra chua co gi.
    co_chu = [b for b in buoi
              if any((b.get(k) or "").strip()
                     for k in ("chu_de", "noi_dung", "diem_manh",
                               "cai_thien", "bai_tap"))]
    if len(dau_bang) > 1:
        print(f"    ({len(dau_bang)} bang feedback trong tep)")
    for b in buoi:
        if b not in co_chu:
            print(f"    BO QUA   : {b['ngay_goc'][:12]!r} khong co noi dung nao")
    return co_chu


if __name__ == "__main__":
    ds = doc(sys.argv[1])
    print(f"{len(ds)} buoi")
    json.dump(ds, open(sys.argv[2], "w"), ensure_ascii=False, indent=1)
