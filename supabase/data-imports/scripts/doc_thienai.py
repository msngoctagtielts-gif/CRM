"""Boc bang feedback lop Thien Ai - Mr. Kobe.

Bang nay KHONG dung khuon chung cua 20 lop kia. No la bang cham diem kieu
IELTS: moi buoi chiem 4 dong lien tiep, moi dong mot tieu chi (Fluency &
Coherence, Vocabulary, Grammar, Pronunciation) kem band diem va nhan xet
rieng. Gop 4 dong lai thanh mot buoi.

Ngay viet kieu 31/5/2025 hoac 6/6 (thieu nam). Thieu nam thi suy ra tu buoi
truoc do va bao ra; khong khop duoc thi bo qua.
"""
import json, re, sys, unicodedata, datetime

def sach(s):
    s = s.replace("\\", "").replace("[merged]", "")
    s = "".join(c for c in s if unicodedata.category(c)[0] != "C")
    s = re.sub(r"[�ð¤ª°»✅]", "", s)
    return re.sub(r"\s+", " ", s).strip()

def doc(path):
    txt = json.load(open(path))["fileContent"] if path.endswith(".json") else open(path).read()
    buoi, hien = [], None
    nam_gan = None
    for l in txt.split("\n"):
        c = [sach(p) for p in l.split("|")]
        if len(c) < 11:
            continue
        ngay_o, tieu_chi, band, nx = c[4], c[7], c[8], c[9]
        m = re.search(r"(\d{1,2})/(\d{1,2})(?:/(\d{4}))?", ngay_o)
        if m:
            d, mo, y = int(m.group(1)), int(m.group(2)), m.group(3)
            # O ngay thieu nam (vi du "6/6") thi khong duoc doan. Sinh ca hai
            # nam co the - nam cua buoi truoc va nam ke tiep - roi de buoc doi
            # chieu voi he thong chon ra cai dung.
            ung_vien = []
            for nam in ([int(y)] if y else ([nam_gan, nam_gan + 1] if nam_gan else [])):
                try:
                    ung_vien.append(datetime.date(nam, mo, d).isoformat())
                except ValueError:
                    pass
            if y:
                nam_gan = int(y)
            iso = ung_vien[0] if ung_vien else None
            if iso and (hien is None or hien["ngay"] != iso or hien["chu_de"] != c[3]):
                hien = {"ngay": iso, "ung_vien": ung_vien, "unit": c[1], "chu_de": c[3], "gv": c[5],
                        "phut": c[6], "band": [], "nx": [], "bai_tap": c[11] if len(c) > 11 else "",
                        "video": c[12] if len(c) > 12 else ""}
                buoi.append(hien)
        if hien is None:
            continue
        # O gop (merged cell) khien moi tieu chi xuat hien hai lan tren ban
        # markdown. Chi giu ban dau tien.
        if tieu_chi and band and re.match(r"^\d", band):
            dong = f"{tieu_chi}: {band}"
            if dong not in hien["band"]:
                hien["band"].append(dong)
                if nx:
                    hien["nx"].append(f"{tieu_chi} ({band}) — {nx}")
        for k, i in (("bai_tap", 11), ("video", 12)):
            if len(c) > i and c[i] and not hien[k]:
                hien[k] = c[i]
    return buoi

def sang_khuon(b):
    """Doi sang khuon chung de dung lai sinh_gon.py."""
    import doc_sheet
    return {
        "ngay_ung_vien": b.get("ung_vien") or [b["ngay"]],
        "ngay_goc": b["ngay"],
        "chu_de": b["chu_de"] or None,
        "noi_dung": (f'Unit {b["unit"]}' if b["unit"] else None),
        "diem_manh": "\n\n".join(b["nx"]) or None,
        "cai_thien": None,
        "bai_tap": b["bai_tap"] or None,
        "ghi_chu": ("Điểm band theo thang IELTS do giáo viên chấm — "
                    + " · ".join(b["band"])) if b["band"] else None,
        "muc_do": None, "thai_do": None, "nhan_goc": None,
        "trang_thai": "submitted",
        "video": [u for u in re.split(r"[\s,]+", b["video"]) if u.startswith("http")],
    }

if __name__ == "__main__":
    ds = doc(sys.argv[1])
    print(f"{len(ds)} buoi")
    for b in ds[:4]:
        print(" ", b["ngay"], b["chu_de"][:50], "| band", len(b["band"]), "| video", bool(b["video"]))
    json.dump([sang_khuon(b) for b in ds], open(sys.argv[2], "w"), ensure_ascii=False)
