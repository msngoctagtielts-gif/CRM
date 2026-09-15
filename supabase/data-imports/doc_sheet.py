"""Boc bang feedback cua mot lop tu ket qua Google Drive MCP thanh JSON.

Bang feedback dung chung mot khuon cho ca 21 lop: co mot dong tieu de cot, tu
dong sau do moi dong la mot buoi hoc. Cot duoc nhan theo TU KHOA trong tieu de
chu khong theo vi tri, vi vai bang co the them bot cot.
"""
import json, re, sys

KHOA = {
    "ngay":      ["ngay hoc", "class date"],
    "giao_vien": ["giao vien", "teacher"],
    "gio_vao":   ["gio bat dau", "start time"],
    "gio_ra":    ["gio ket thuc", "end time"],
    "phut":      ["thoi luong", "duration"],
    "so_buoi":   ["so buoi", "session no"],
    "chu_de":    ["chu de", "topic"],
    "noi_dung":  ["noi dung bai hoc", "lesson content"],
    "muc_do":    ["muc do tiep thu", "comprehension"],
    "thai_do":   ["thai do", "attitude"],
    "diem_manh": ["diem manh", "strengths"],
    "cai_thien": ["can cai thien", "areas to improve"],
    "bai_tap":   ["bai tap", "homework"],
    "video":     ["link video", "video link"],
    "ghi_chu":   ["ghi chu gv", "teacher notes"],
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
    s = s.replace("\\|", "|").replace("[merged]", "").replace("\\", "")
    # Emoji bi hong khi xuat ra markdown -> bo cac ky tu khong in duoc.
    s = "".join(c for c in s if unicodedata.category(c)[0] != "C")
    s = re.sub(r"[�ð¤ª°»]", "", s)
    return s.strip()


import datetime


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

    i_hdr = None
    for i, l in enumerate(lines):
        kd = khong_dau(l)
        if "ngay hoc" in kd and "gio bat dau" in kd:
            i_hdr = i
            break
    if i_hdr is None:
        sys.exit("Khong tim thay dong tieu de")

    hdr = cot(lines[i_hdr])
    idx = {}
    for ten, tu_khoa in KHOA.items():
        for j, h in enumerate(hdr):
            hl = khong_dau(h)
            if any(k in hl for k in tu_khoa):
                idx[ten] = j
                break

    thieu = [k for k in ("ngay", "gio_vao", "noi_dung") if k not in idx]
    if thieu:
        sys.exit(f"Bang thieu cot bat buoc: {thieu}")

    buoi = []
    for l in lines[i_hdr + 1:]:
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
            b[ten] = v or None
        buoi.append(b)
    return buoi


if __name__ == "__main__":
    ds = doc(sys.argv[1])
    print(f"{len(ds)} buoi")
    json.dump(ds, open(sys.argv[2], "w"), ensure_ascii=False, indent=1)
