"""Chi giu cac dong ma buoi tuong ung CHUA co bao cao trong he thong.

Ham fn_nhap_feedback da co "not exists" nen chay lai khong hong du lieu, nhung
moi lan gui du lieu qua MCP la mot lan tra phi. Loc truoc cho nhe.
"""
import json, sys
rows = json.load(open(sys.argv[1]))
thieu = {d.strip() for d in open(sys.argv[2]) if d.strip()}
giu = [r for r in rows if any(n in thieu for n in r.get("ngay_ung_vien", []))]
json.dump(giu, open(sys.argv[3], "w"), ensure_ascii=False)
print(f"{len(giu)}/{len(rows)} dong con lai")
