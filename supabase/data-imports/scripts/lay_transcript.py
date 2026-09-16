"""Lay lai noi dung sheet da doc qua MCP tu ban ghi phien lam viec.

Ket qua MCP nho thi tra thang vao hoi thoai, khong luu ra tep. Nhung ban ghi
phien (.jsonl) co luu, nen doc nguoc tu do - khong ton them gi.
"""
import json, sys
p = '/root/.claude/projects/-home-user-CRM/3c0a17d4-6997-5ca5-a164-143c5c20a8bb.jsonl'
moc, ra = sys.argv[1], sys.argv[2]
tim = None
def quet(x):
    global tim
    if isinstance(x, dict):
        for v in x.values(): quet(v)
    elif isinstance(x, list):
        for v in x: quet(v)
    elif isinstance(x, str) and 'Ngày học' in x and moc in x:
        if tim is None or len(x) > len(tim): tim = x
for line in open(p, encoding='utf-8'):
    if moc in line and 'Ngày học' in line:
        quet(json.loads(line))
if not tim:
    sys.exit(f'khong thay {moc!r}')
if tim.lstrip().startswith('{'):
    tim = json.loads(tim)['fileContent']
open(ra, 'w', encoding='utf-8').write(tim)
print(f'{len(tim)} ky tu -> {ra}')
