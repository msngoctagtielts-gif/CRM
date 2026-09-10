#!/usr/bin/env python3
"""
Soát danh sách lớp trước khi nhập vào MNEE Management System.

Không sửa gì. Chỉ báo cáo: trùng lặp, giá trị bất thường, trường thiếu, và
những chỗ phải suy luận (level, lịch học) — để Founder xác nhận trước.

    python3 scripts/migration/validate_danh_sach_lop.py <file.tsv>
"""
import csv, re, sys
from collections import Counter, defaultdict

PATH = sys.argv[1] if len(sys.argv) > 1 else 'scripts/migration/danh_sach_lop_2026-09-10.tsv'
rows = list(csv.DictReader(open(PATH, encoding='utf-8'), delimiter='\t'))

# Thứ trong tuần kiểu Việt Nam -> weekday của Postgres (0 = Chủ nhật)
VN_WEEKDAY = {'CN': 0, 'T2': 1, 'T3': 2, 'T4': 3, 'T5': 4, 'T6': 5, 'T7': 6}
WEEKDAY_VI = ['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy']

# Chuẩn hoá level: gộp mọi biến thể chính tả về một mã duy nhất.
LEVEL_CANON = {
    'a0': 'A0', 'prea1': 'PRE_A1', 'pre a1': 'PRE_A1',
    'a1': 'A1', 'a1+': 'A1_PLUS',
    'prea2': 'PRE_A2', 'pre a2': 'PRE_A2',
    'a2+': 'A2_PLUS', 'b1+': 'B1_PLUS', 'c2': 'C2',
}

def normalise_level(raw):
    """Tách mã CEFR khỏi mục tiêu IELTS đi kèm trong cùng ô."""
    if not raw.strip():
        return None, None, 'TRỐNG'
    ielts = None
    m = re.search(r'IELTS\s*([\d.]+\s*[-–]?\s*[\d.]*\+?)', raw, re.I)
    if m:
        ielts = m.group(1).strip()
    core = re.sub(r'\(.*?\)', '', raw)
    core = re.split(r'[/(]', core)[0]
    core = core.strip().lower().replace('  ', ' ')
    code = LEVEL_CANON.get(core) or LEVEL_CANON.get(core.replace(' ', ''))
    return code, ielts, ('OK' if code else 'KHÔNG NHẬN DẠNG ĐƯỢC')

def parse_time(tok):
    """'6-7pm' / '7:30-8:30pm' / '11-12am' / '10h15' / '2pm' -> (start, end|None)."""
    tok = tok.strip().lower().replace('h', ':')
    suffix = 'pm' if 'pm' in tok else ('am' if 'am' in tok else None)
    tok = tok.replace('pm', '').replace('am', '').strip()

    def to24(hhmm, force=None):
        if ':' in hhmm:
            h, m = hhmm.split(':', 1)
            h, m = int(h), int(m or 0)
        else:
            h, m = int(hhmm), 0
        ap = force or suffix
        if ap == 'pm' and h < 12:
            h += 12
        if ap == 'am' and h == 12:
            h = 0
        return h * 60 + m

    if '-' in tok or '–' in tok:
        a, b = re.split(r'[-–]', tok, 1)
        if not a.strip() or not b.strip():
            return None, None
        return to24(a.strip()), to24(b.strip())
    if not tok:
        return None, None
    return to24(tok), None

def parse_schedule(raw):
    """Bóc lịch học dạng chữ thành các buổi (thứ, giờ bắt đầu, thời lượng)."""
    raw = raw.strip()
    if not raw or raw == '—':
        return [], 'TRỐNG'

    # Bước 1: tách thành các đoạn, mỗi đoạn gồm danh sách thứ và (có thể) giờ.
    segments = []
    for seg in re.split(r'&|;', raw):
        seg = seg.strip().strip(',')
        if not seg:
            continue
        rng = re.match(r'^(T[2-7])\s*-\s*(T[2-7])\b', seg)   # dải liền: "T2-T6"
        if rng:
            days = list(range(VN_WEEKDAY[rng.group(1)], VN_WEEKDAY[rng.group(2)] + 1))
            rest = seg[rng.end():]
        else:
            days = [VN_WEEKDAY[d.upper()] for d in re.findall(r'\b(CN|T[2-7])\b', seg, re.I)]
            rest = re.sub(r'\b(CN|T[2-7])\b', '', seg, flags=re.I)
        segments.append((days, rest.strip(' :,'), seg))

    # Bước 2: "T3 & T4: 3-4pm" — đoạn chỉ có thứ thì dùng giờ của đoạn sau.
    # Đây là cách viết tắt bình thường của người Việt, không phải dữ liệu thiếu.
    times = [parse_time(rest) if rest else (None, None) for _, rest, _ in segments]
    for i in range(len(times) - 1, -1, -1):
        if times[i][0] is None:
            for j in range(i + 1, len(times)):
                if times[j][0] is not None:
                    times[i] = times[j]
                    break

    out, issues = [], []
    for (days, rest, seg), (start, end) in zip(segments, times):
        if not days:
            issues.append(f'không thấy thứ trong "{seg}"')
            continue
        if start is None:
            issues.append(f'không đọc được giờ trong "{seg}"')
            continue
        # "11-12am" nghĩa là 11:00–12:00 trưa, không phải 11:00–00:00.
        # Nếu giờ kết thúc không sau giờ bắt đầu thì cộng 12 tiếng, không phải 24.
        if end is not None:
            while end <= start:
                end += 12 * 60
        dur = (end - start) if end is not None else None
        # Không có am/pm và giờ <= 7 thì không thể đoán sáng hay chiều.
        ambiguous = (not re.search(r'[ap]m', rest, re.I)) and start < 8 * 60
        for d in days:
            out.append({'weekday': d, 'start_min': start, 'duration': dur,
                        'ambiguous_ampm': ambiguous})
    return out, ('OK' if out and not issues else '; '.join(issues) or 'TRỐNG')

def fmt(mins):
    return f'{mins // 60:02d}:{mins % 60:02d}'

print('=' * 78)
print('  SOÁT DANH SÁCH LỚP  ·  MS. NGỌC ELITE ENGLISH')
print('=' * 78)

# ---- Trùng lặp -------------------------------------------------------------
print('\n### 1. TRÙNG LẶP')
dup_codes = [c for c, n in Counter(r['ma_lop'] for r in rows).items() if n > 1]
if dup_codes:
    for code in dup_codes:
        same = [r for r in rows if r['ma_lop'] == code]
        states = {r['trang_thai'] for r in same}
        print(f'  ❗ {code} xuất hiện {len(same)} lần (dòng '
              f'{", ".join(r["stt"] for r in same)}) — trạng thái: {", ".join(sorted(states))}')
        print(f'     Cùng một ID sheet feedback ⇒ là một lớp, không phải hai.')
else:
    print('  Không có mã lớp trùng.')

dup_sheets = [s for s, n in Counter(r['id_sheet_feedback'] for r in rows).items() if n > 1]
for s in dup_sheets:
    same = [r['ma_lop'] for r in rows if r['id_sheet_feedback'] == s]
    if len(set(same)) > 1:
        print(f'  ❗ Một sheet feedback dùng cho nhiều lớp khác nhau: {set(same)}')

# ---- Học phí ---------------------------------------------------------------
print('\n### 2. HỌC PHÍ')
fees = []
for r in rows:
    v = r['hoc_phi_60p']
    if v.startswith('FORMULA:'):
        print(f'  ⚠ {r["ma_lop"]:<12} công thức, không phải một số: {v[8:]}')
        print(f'     ⇒ cần lưu thành: đơn giá/buổi của lớp + chiết khấu mỗi tháng')
        continue
    if not v:
        print(f'  ❗ {r["ma_lop"]:<12} CHƯA CÓ HỌC PHÍ')
        continue
    fees.append((r['ma_lop'], int(v)))

amounts = [a for _, a in fees]
med = sorted(amounts)[len(amounts) // 2]
for code, a in fees:
    if a > med * 5:
        print(f'  ❗ {code:<12} {a:,} ₫/buổi — gấp {a // med:,} lần mức phổ biến '
              f'({med:,} ₫). Gần chắc là lỗi nhập.')
print(f'  Khoảng giá hợp lệ: {min(a for _, a in fees if a < med * 5):,} – '
      f'{max(a for _, a in fees if a < med * 5):,} ₫/buổi (trung vị {med:,} ₫)')

# ---- Lương giáo viên -------------------------------------------------------
print('\n### 3. LƯƠNG GIÁO VIÊN / 60 PHÚT')
by_teacher = defaultdict(set)
for r in rows:
    by_teacher[r['giao_vien']].add(int(r['luong_gv_60p']))
for t, rates in sorted(by_teacher.items()):
    tag = '  ← đơn giá KHÁC NHAU giữa các lớp' if len(rates) > 1 else ''
    print(f'  {t:<14} {", ".join(f"{x:,} ₫" for x in sorted(rates))}{tag}')
print('  ⇒ Đơn giá phải gắn theo LỚP, không phải theo giáo viên.')

# ---- Level -----------------------------------------------------------------
print('\n### 4. LEVEL — cần chuẩn hoá')
seen = {}
for r in rows:
    code, ielts, status = normalise_level(r['level'])
    seen.setdefault(r['level'], (code, ielts, status))
for raw, (code, ielts, status) in sorted(seen.items()):
    extra = f'  + mục tiêu IELTS: {ielts}' if ielts else ''
    mark = '  ' if status == 'OK' else '❗'
    print(f'  {mark} "{raw}"{" " * max(0, 22 - len(raw))}→ {code or "?"}{extra}')
print('  ⇒ Mục tiêu IELTS nên là một cột riêng, không nhét vào level.')

# ---- Lịch học --------------------------------------------------------------
print('\n### 5. LỊCH HỌC — bóc được bao nhiêu')
ok = miss = 0
for r in rows:
    slots, status = parse_schedule(r['lich_hoc'])
    if status == 'OK':
        ok += 1
        desc = '; '.join(
            f'{WEEKDAY_VI[s["weekday"]]} {fmt(s["start_min"])}'
            + (f'–{fmt(s["start_min"] + s["duration"])}' if s['duration'] else ' (chưa rõ thời lượng)')
            for s in slots)
        flag = '' if all(s['duration'] for s in slots) else '  ⚠ thiếu giờ kết thúc'
        if any(s.get('ambiguous_ampm') for s in slots):
            flag += '  ⚠ không rõ sáng hay chiều'
        print(f'     {r["ma_lop"]:<12} {desc}{flag}')
    else:
        miss += 1
        print(f'  ❗ {r["ma_lop"]:<12} {status}  (ô gốc: "{r["lich_hoc"]}")')
print(f'  Bóc được {ok}/{len(rows)} dòng; {miss} dòng cần Founder điền lịch.')

# ---- Hình thức đóng & trạng thái ------------------------------------------
print('\n### 6. HÌNH THỨC ĐÓNG & TRẠNG THÁI')
for k in ('hinh_thuc_dong', 'trang_thai'):
    print(f'  {k}:')
    for v, n in Counter(r[k] for r in rows).most_common():
        mark = '❗' if v in ('Chưa xác định', '') else '  '
        print(f'    {mark} {v or "(trống)"}: {n}')

# ---- Học viên & lớp nhóm ---------------------------------------------------
print('\n### 7. HỌC VIÊN')
students = defaultdict(list)
for r in rows:
    students[r['hoc_vien']].append(r['ma_lop'])
print(f'  {len(students)} học viên / {len(rows)} dòng lớp')
for name, codes in sorted(students.items()):
    if len(set(codes)) > 1:
        print(f'  • {name}: {len(set(codes))} lớp ({", ".join(sorted(set(codes)))}) '
              f'— học nhiều giáo viên cùng lúc')
    if re.search(r'\(.*,.*\)', name):
        members = [m.strip() for m in re.search(r'\((.*)\)', name).group(1).split(',')]
        print(f'  ❗ {name}')
        print(f'     ⇒ đây là LỚP NHÓM {len(members)} người: {", ".join(members)}')
        print(f'     ⇒ phải tách thành {len(members)} học viên riêng trong hệ thống')
