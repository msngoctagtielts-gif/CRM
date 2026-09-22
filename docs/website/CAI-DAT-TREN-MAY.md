# Mang sáu nhân sự và công cụ soi sang máy làm website

Mã nguồn hai website **không nằm trong kho mã GitHub nào**. Nó nằm trên máy Windows
của cô Ngọc, ở thư mục:

```
C:\Users\User\MNEE-OS
```

Phiên `session_01WCyrPE3GwSCJ6LE5NMYR1A` ("Miss Ngọc Elite English websites") làm
việc trực tiếp trên thư mục đó qua Claude Desktop. Phiên này (kho `CRM`) chạy trên
máy chủ đám mây, **không với tới được ổ C của cô**.

Nên sáu nhân sự và công cụ soi phải được **chép sang** thì mới dùng được ở đó.

---

## Chép sang — mở PowerShell trên máy cô Ngọc

```powershell
cd C:\Users\User\MNEE-OS

# 1. Công cụ soi lỗi
mkdir -Force scripts\web-audit
$b = 'https://raw.githubusercontent.com/msngoctagtielts-gif/CRM/claude/ai-agents-professional-website-oym91e'
curl.exe -sSL "$b/scripts/web-audit/audit.mjs" -o scripts\web-audit\audit.mjs

# 2. Sáu nhân sự
mkdir -Force .claude\agents
foreach ($a in 'web-planner','web-designer','web-copywriter','web-builder','web-qa','web-auditor') {
  curl.exe -sSL "$b/.claude/agents/$a.md" -o ".claude\agents\$a.md"
}

# 3. Ba tài liệu
mkdir -Force docs\website
foreach ($d in 'README','KE-HOACH-XAY-DUNG','UY-TIN','DANH-MUC-KIEM-TRA') {
  curl.exe -sSL "$b/docs/website/$d.md" -o "docs\website\$d.md"
}
```

## Chạy thử ngay

```powershell
node scripts\web-audit\audit.mjs .
```

Soi toàn bộ tệp `.html` trong `MNEE-OS`. Hoặc soi trang đang chạy:

```powershell
node scripts\web-audit\audit.mjs https://msngoc-elite-english.pages.dev
node scripts\web-audit\audit.mjs https://msngoc-folio.pages.dev --profile=ca-nhan
```

Cần Node 20 trở lên. Kiểm bằng `node -v`.

## Rồi gọi nhân sự

Sau khi chép xong, mở lại phiên làm việc trên `MNEE-OS` và gọi thẳng tên:

```
Dùng web-auditor soi toàn bộ thư mục này
Dùng web-qa kiểm lại trang chủ trước khi đẩy lên Cloudflare
```

---

## Vì sao không để chung một kho mã

Hiện `MNEE-OS` chưa nối GitHub. Nếu nối được thì tốt hơn hẳn — sửa ở đâu cũng thấy,
và không phải chép tay mỗi lần công cụ soi có luật mới. Nhưng đó là việc riêng, làm
sau cũng được. Chép tay như trên là đủ để bắt đầu ngay hôm nay.
