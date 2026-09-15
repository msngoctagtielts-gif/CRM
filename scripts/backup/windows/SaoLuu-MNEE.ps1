<#
.SYNOPSIS
    Sao lưu cơ sở dữ liệu MNEE về máy Windows, có mã hoá.

.DESCRIPTION
    Bản song song của scripts/backup/dump.sh, dành cho máy Windows của Founder.

    VÌ SAO CẦN CẢ HAI:
      · Job trên GitHub giữ tệp dưới dạng artifact, và artifact BỊ XOÁ sau 90
        ngày. Nó cũng tự tắt nếu repo không có commit nào trong 60 ngày.
      · Một bản nằm trên máy của chính Founder là bản không phụ thuộc vào
        GitHub, Supabase hay bất kỳ dịch vụ nào còn sống hay không.

    Tệp kết quả dùng CHUNG ĐỊNH DẠNG với bản trên GitHub (tar + gpg AES-256),
    nên scripts/backup/restore.sh phục hồi được cả hai.

.PARAMETER ThuMucLuu
    Nơi cất tệp sao lưu. Mặc định: Documents\MNEE-SaoLuu

.PARAMETER DatLichHangNgay
    Đăng ký tác vụ chạy tự động mỗi ngày lúc 22:00 giờ máy.

.PARAMETER QuenKetNoi
    Xoá chuỗi kết nối đã lưu, để nhập lại từ đầu.

.EXAMPLE
    .\SaoLuu-MNEE.ps1
    .\SaoLuu-MNEE.ps1 -DatLichHangNgay
#>

[CmdletBinding()]
param(
    [string] $ThuMucLuu = (Join-Path ([Environment]::GetFolderPath('MyDocuments')) 'MNEE-SaoLuu'),
    [switch] $DatLichHangNgay,
    [switch] $QuenKetNoi
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

$ThuMucCaiDat = Join-Path $env:LOCALAPPDATA 'MNEE-SaoLuu'
$TepCauHinh   = Join-Path $ThuMucCaiDat 'ket-noi.dat'

function Ghi($ThongDiep, $Mau = 'Gray') { Write-Host $ThongDiep -ForegroundColor $Mau }
function GhiBuoc($ThongDiep) { Write-Host "> $ThongDiep" -ForegroundColor Cyan }
function GhiLoi($ThongDiep) { Write-Host "LỖI: $ThongDiep" -ForegroundColor Red }
function GhiTot($ThongDiep) { Write-Host "  $ThongDiep" -ForegroundColor Green }

# ---------------------------------------------------------------------------
# Kiểm chuỗi kết nối — cùng luật với dump.sh
#
# Ngày 15/09/2026 job trên GitHub hỏng với "password authentication failed for
# user postgres". Mật khẩu không sai. Pooler dùng chung của Supabase đòi tên
# đăng nhập dạng postgres.<project-ref>; postgres trơn chỉ đúng cho kết nối
# trực tiếp. Postgres lại báo lỗi như thể sai mật khẩu, nên người ta đi đổi một
# mật khẩu vốn đúng. Kiểm ở đây để chỉ thẳng chỗ hỏng.
# ---------------------------------------------------------------------------
function KiemChuoiKetNoi {
    param([Parameter(Mandatory)] [string] $Chuoi)

    if ($Chuoi -notmatch '^postgres(ql)?://') {
        return 'Chuỗi phải bắt đầu bằng postgresql:// — copy trọn chuỗi từ nút Connect của Supabase.'
    }

    $sauScheme = $Chuoi -replace '^[^:]+://', ''
    if ($sauScheme -notmatch '@') {
        return 'Chuỗi thiếu phần tên đăng nhập và mật khẩu.'
    }

    $viTri     = $sauScheme.LastIndexOf('@')
    $dinhDanh  = $sauScheme.Substring(0, $viTri)
    $phanMayChu = $sauScheme.Substring($viTri + 1)
    $nguoiDung = ($dinhDanh -split ':', 2)[0]
    $mayChu    = ($phanMayChu -split '[:/]', 2)[0]

    if ($dinhDanh -match 'YOUR-PASSWORD') {
        return 'Chuỗi còn nguyên chỗ giữ [YOUR-PASSWORD]. Thay bằng mật khẩu cơ sở dữ liệu thật.'
    }

    if ($mayChu -like '*pooler.supabase.com' -and $nguoiDung -notmatch '\.') {
        return @"
Tên đăng nhập '$nguoiDung' thiếu mã dự án.
      Pooler dùng chung đòi dạng postgres.<project-ref>, không phải postgres.
      Máy chủ đang dùng: $mayChu
      Cách sửa: Supabase -> Connect -> Session pooler -> copy TRỌN chuỗi,
      chỉ thay mỗi phần mật khẩu. Đừng tự ghép chuỗi bằng tay.
"@
    }

    return $null   # hợp lệ
}

function TenNguoiDung {
    param([string] $Chuoi)
    $sauScheme = $Chuoi -replace '^[^:]+://', ''
    $dinhDanh  = $sauScheme.Substring(0, $sauScheme.LastIndexOf('@'))
    return ($dinhDanh -split ':', 2)[0]
}

function TenMayChu {
    param([string] $Chuoi)
    $sauScheme = $Chuoi -replace '^[^:]+://', ''
    $phan = $sauScheme.Substring($sauScheme.LastIndexOf('@') + 1)
    return ($phan -split '[:/]', 2)[0]
}

# ---------------------------------------------------------------------------
# Lưu chuỗi kết nối bằng DPAPI của Windows.
#
# ConvertFrom-SecureString mã hoá theo TÀI KHOẢN WINDOWS đang đăng nhập — máy
# khác hoặc người dùng khác mở tệp này ra chỉ thấy chuỗi băm vô nghĩa. Nhờ vậy
# lần sau chạy không phải gõ lại mật khẩu cơ sở dữ liệu.
# ---------------------------------------------------------------------------
function LuuChuoiKetNoi {
    param([Parameter(Mandatory)] [securestring] $Chuoi)
    New-Item -ItemType Directory -Force -Path $ThuMucCaiDat | Out-Null
    ConvertFrom-SecureString -SecureString $Chuoi | Set-Content -Path $TepCauHinh -Encoding ASCII
}

function DocChuoiKetNoi {
    if (-not (Test-Path $TepCauHinh)) { return $null }
    try {
        $mahoa = Get-Content -Path $TepCauHinh -Raw
        return ConvertTo-SecureString -String $mahoa.Trim()
    } catch {
        Ghi '  (Không đọc được chuỗi đã lưu — sẽ hỏi lại.)' 'Yellow'
        return $null
    }
}

function ChuoiThuong {
    param([securestring] $Bimat)
    return [Runtime.InteropServices.Marshal]::PtrToStringAuto(
        [Runtime.InteropServices.Marshal]::SecureStringToBSTR($Bimat))
}

# ---------------------------------------------------------------------------
# Công cụ dòng lệnh của PostgreSQL.
#
# Dùng gói BINARIES (tệp zip) chứ không dùng bộ cài đầy đủ: máy của Founder chỉ
# cần pg_dump và psql để ĐỌC dữ liệu, không cần chạy một máy chủ PostgreSQL.
# Bộ cài đầy đủ nặng hơn nhiều và còn hỏi đặt mật khẩu quản trị lúc cài.
#
# EDB không giữ một đường dẫn "mới nhất" cố định, nên script dò lần lượt các
# bản 17.x từ mới tới cũ và lấy bản đầu tiên tải được. Ghim cứng một số hiệu là
# đến lúc EDB gỡ bản đó thì script chết.
# ---------------------------------------------------------------------------
$BanPostgresUngVien = @('17.7-1', '17.6-2', '17.6-1', '17.5-1', '17.4-1', '17.2-1', '17.0-1')

function TimPgDump {
    # 1) Đã cài sẵn ở đâu đó trong PATH?
    $sanCo = Get-Command pg_dump.exe -ErrorAction SilentlyContinue
    if ($sanCo) { return $sanCo.Source }

    # 2) Lần trước script này đã tải về?
    $daTai = Join-Path $ThuMucCaiDat 'pgsql\bin\pg_dump.exe'
    if (Test-Path $daTai) { return $daTai }

    # 3) Bộ cài đầy đủ của PostgreSQL trên máy?
    $thongThuong = Get-ChildItem 'C:\Program Files\PostgreSQL' -Directory -ErrorAction SilentlyContinue |
                   Sort-Object Name -Descending
    foreach ($thuMuc in $thongThuong) {
        $ungVien = Join-Path $thuMuc.FullName 'bin\pg_dump.exe'
        if (Test-Path $ungVien) { return $ungVien }
    }

    return $null
}

function TaiPostgresClient {
    GhiBuoc 'Tải công cụ PostgreSQL 17 (chỉ phần dòng lệnh, không cài máy chủ)'
    New-Item -ItemType Directory -Force -Path $ThuMucCaiDat | Out-Null
    $tepZip = Join-Path $env:TEMP 'postgresql-binaries.zip'

    foreach ($ban in $BanPostgresUngVien) {
        $duongDan = "https://get.enterprisedb.com/postgresql/postgresql-$ban-windows-x64-binaries.zip"
        try {
            Ghi "  thử bản $ban ..."
            Invoke-WebRequest -Uri $duongDan -OutFile $tepZip -UseBasicParsing -ErrorAction Stop
        } catch {
            continue
        }

        GhiBuoc "Giải nén bản $ban"
        Expand-Archive -Path $tepZip -DestinationPath $ThuMucCaiDat -Force
        Remove-Item $tepZip -Force -ErrorAction SilentlyContinue

        $ketQua = Join-Path $ThuMucCaiDat 'pgsql\bin\pg_dump.exe'
        if (Test-Path $ketQua) {
            GhiTot "đã cài vào $ThuMucCaiDat"
            return $ketQua
        }
    }

    throw @"
Không tải được công cụ PostgreSQL 17 từ EnterpriseDB.
      Cách làm thủ công: mở https://www.enterprisedb.com/download-postgresql-binaries
      tải bản Windows x64 của PostgreSQL 17, giải nén vào:
        $ThuMucCaiDat
      sao cho có tệp $ThuMucCaiDat\pgsql\bin\pg_dump.exe rồi chạy lại script này.
"@
}

function TimGpg {
    $sanCo = Get-Command gpg.exe -ErrorAction SilentlyContinue
    if ($sanCo) { return $sanCo.Source }

    foreach ($ungVien in @(
        "$env:ProgramFiles\GnuPG\bin\gpg.exe",
        "${env:ProgramFiles(x86)}\GnuPG\bin\gpg.exe",
        "$env:LOCALAPPDATA\Programs\GnuPG\bin\gpg.exe"
    )) {
        if ($ungVien -and (Test-Path $ungVien)) { return $ungVien }
    }
    return $null
}

function CaiGpg {
    # Gpg4win để mã hoá tệp sao lưu. Dùng gpg chứ không dùng cách mã hoá riêng
    # của Windows, để tệp tạo trên máy này và tệp tạo trên GitHub CÙNG MỘT ĐỊNH
    # DẠNG — cùng một script phục hồi mở được cả hai.
    if (-not (Get-Command winget.exe -ErrorAction SilentlyContinue)) {
        throw @"
Máy chưa có winget nên không tự cài Gpg4win được.
      Cách làm thủ công: tải Gpg4win ở https://gpg4win.org rồi chạy lại script này.
"@
    }

    GhiBuoc 'Cài Gpg4win để mã hoá tệp sao lưu'
    & winget.exe install --exact --id GnuPG.Gpg4win --silent `
        --accept-package-agreements --accept-source-agreements | Out-Null

    # winget vừa cài xong thì PATH của cửa sổ hiện tại chưa cập nhật.
    $env:Path = [Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' +
                [Environment]::GetEnvironmentVariable('Path', 'User')

    $ketQua = TimGpg
    if (-not $ketQua) {
        throw 'Đã cài Gpg4win nhưng chưa tìm thấy gpg.exe. Đóng cửa sổ này, mở lại rồi chạy lần nữa.'
    }
    GhiTot "gpg tại $ketQua"
    return $ketQua
}

function DatLich {
    param([Parameter(Mandatory)] [string] $DuongDanScript)

    $tenTacVu = 'MNEE - Sao luu co so du lieu'
    GhiBuoc "Đăng ký tác vụ chạy tự động hằng ngày lúc 22:00"

    $hanhDong = New-ScheduledTaskAction -Execute 'powershell.exe' `
        -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$DuongDanScript`" -ThuMucLuu `"$ThuMucLuu`""
    $khiNao = New-ScheduledTaskTrigger -Daily -At '22:00'

    # Chạy được cả khi máy đang dùng pin, và chạy bù nếu đến giờ mà máy đang tắt
    # — máy cá nhân hay tắt buổi tối, không có phần này thì lịch coi như vô dụng.
    $caiDat = New-ScheduledTaskSettingsSet `
        -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries `
        -StartWhenAvailable -ExecutionTimeLimit (New-TimeSpan -Hours 1)

    Register-ScheduledTask -TaskName $tenTacVu -Action $hanhDong -Trigger $khiNao `
        -Settings $caiDat -Description 'Sao lưu cơ sở dữ liệu MNEE về máy, có mã hoá.' `
        -Force | Out-Null

    GhiTot "đã đặt lịch. Xem hoặc tắt trong Task Scheduler, tên tác vụ: $tenTacVu"
}

# ===========================================================================
# CHẠY
# ===========================================================================

Ghi ''
Ghi '  MNEE — Sao lưu cơ sở dữ liệu về máy' 'White'
Ghi '  Ms.Ngọc Elite English' 'DarkGray'
Ghi ''

if ($QuenKetNoi -and (Test-Path $TepCauHinh)) {
    Remove-Item $TepCauHinh -Force
    GhiTot 'Đã xoá chuỗi kết nối cũ.'
}

# --- Chuỗi kết nối ---------------------------------------------------------
$bimat = DocChuoiKetNoi
if ($bimat) {
    GhiBuoc 'Dùng chuỗi kết nối đã lưu trên máy này'
} else {
    Ghi ''
    Ghi '  Cần chuỗi kết nối Supabase. Lấy như sau:' 'Yellow'
    Ghi '    1. supabase.com -> project MNEE Management System -> nút Connect'
    Ghi '    2. Chọn tab Session pooler'
    Ghi '    3. Copy TRỌN chuỗi, thay mỗi phần [YOUR-PASSWORD] bằng mật khẩu thật'
    Ghi ''
    Ghi '  Chuỗi sẽ được mã hoá theo tài khoản Windows này, không lưu dạng chữ thường.' 'DarkGray'
    Ghi ''
    $bimat = Read-Host -Prompt '  Dán chuỗi kết nối' -AsSecureString
}

$chuoiKetNoi = ChuoiThuong $bimat
$loi = KiemChuoiKetNoi $chuoiKetNoi
if ($loi) {
    Ghi ''
    GhiLoi $loi
    Ghi ''
    Ghi '  Chạy lại với tham số -QuenKetNoi để nhập chuỗi mới.' 'Yellow'
    exit 1
}
GhiTot ("người dùng {0} · máy chủ {1}" -f (TenNguoiDung $chuoiKetNoi), (TenMayChu $chuoiKetNoi))

# --- Mật khẩu mã hoá tệp ---------------------------------------------------
if ($env:BACKUP_PASSPHRASE) {
    $matKhauMaHoa = $env:BACKUP_PASSPHRASE
} else {
    Ghi ''
    Ghi '  Mật khẩu để MÃ HOÁ tệp sao lưu (khác mật khẩu cơ sở dữ liệu).' 'Yellow'
    Ghi '  Dùng đúng mật khẩu đã đặt trong secret BACKUP_PASSPHRASE trên GitHub thì' 'DarkGray'
    Ghi '  một mật khẩu mở được cả hai nơi. Mất mật khẩu này là mất luôn tệp.' 'DarkGray'
    Ghi ''
    $matKhauMaHoa = ChuoiThuong (Read-Host -Prompt '  Mật khẩu mã hoá' -AsSecureString)
}
if ([string]::IsNullOrWhiteSpace($matKhauMaHoa)) {
    GhiLoi 'Mật khẩu mã hoá để trống — không mã hoá thì tệp sao lưu là dữ liệu học viên nằm trần.'
    exit 1
}

# --- Công cụ ---------------------------------------------------------------
Ghi ''
$pgDump = TimPgDump
if ($pgDump) { GhiTot "pg_dump tại $pgDump" } else { $pgDump = TaiPostgresClient }
$psql = Join-Path (Split-Path $pgDump -Parent) 'psql.exe'

$gpg = TimGpg
if ($gpg) { GhiTot "gpg tại $gpg" } else { $gpg = CaiGpg }

# --- Kiểm phiên bản --------------------------------------------------------
Ghi ''
GhiBuoc 'Kiểm phiên bản pg_dump so với máy chủ'
$banMayChu = (& $psql $chuoiKetNoi -tAc 'show server_version').Trim()
if ($LASTEXITCODE -ne 0) {
    GhiLoi 'Không kết nối được tới cơ sở dữ liệu. Kiểm lại chuỗi kết nối và mạng.'
    exit 1
}
$banMayChuChinh = [int]($banMayChu -split '\.')[0]
$banClient = [int]((& $pgDump --version) -replace '[^0-9]', ' ').Trim().Split(' ')[0]
Ghi "  máy chủ $banMayChu · pg_dump $banClient"
if ($banClient -lt $banMayChuChinh) {
    GhiLoi "pg_dump $banClient cũ hơn máy chủ $banMayChuChinh — pg_dump sẽ từ chối chạy."
    exit 1
}

# --- Dump ------------------------------------------------------------------
$moc = Get-Date -Format 'yyyyMMdd-HHmmss'
$thuMucTam = Join-Path $env:TEMP "mnee-backup-$moc"
New-Item -ItemType Directory -Force -Path $thuMucTam | Out-Null
New-Item -ItemType Directory -Force -Path $ThuMucLuu | Out-Null

try {
    GhiBuoc 'Dump schema public (cấu trúc + dữ liệu)'
    & $pgDump $chuoiKetNoi --schema=public --format=custom --compress=9 `
        --no-owner --no-privileges --file=(Join-Path $thuMucTam 'public.dump')
    if ($LASTEXITCODE -ne 0) { throw 'pg_dump schema public thất bại.' }

    # Chỉ lấy DỮ LIỆU của schema auth. Cấu trúc do Supabase tự quản lý và tự tạo
    # lại ở project mới. Thiếu phần này thì phục hồi xong không ai đăng nhập được.
    GhiBuoc 'Dump tài khoản đăng nhập (auth)'
    & $pgDump $chuoiKetNoi --data-only --format=plain --no-owner --no-privileges `
        --table=auth.users --table=auth.identities `
        --file=(Join-Path $thuMucTam 'auth_data.sql')
    if ($LASTEXITCODE -ne 0) { throw 'pg_dump schema auth thất bại.' }

    # pg_dump --schema=public KHÔNG ghi câu CREATE EXTENSION. Thiếu tệp này thì
    # lúc phục hồi các cột kiểu citext báo "type does not exist", bảng không tạo
    # được, và cả bản sao lưu thành vô dụng.
    GhiBuoc 'Ghi danh sách extension'
    & $psql $chuoiKetNoi -tAc @"
select 'create extension if not exists ' || quote_ident(extname) || ';'
  from pg_extension where extname <> 'plpgsql' order by extname
"@ | Set-Content -Path (Join-Path $thuMucTam 'extensions.sql') -Encoding UTF8

    $soBang = (& $psql $chuoiKetNoi -tAc @"
select count(*) from information_schema.tables
 where table_schema='public' and table_type='BASE TABLE'
"@).Trim()

    @"
Bản sao lưu MNEE Management System
Thời điểm (UTC) : $((Get-Date).ToUniversalTime().ToString('yyyy-MM-dd HH:mm:ss'))
Tạo trên        : máy Windows của Founder
Máy chủ Postgres: $banMayChu
pg_dump         : $(& $pgDump --version)
Số bảng public  : $soBang

Cách phục hồi: xem scripts/backup/restore.sh và docs/FREE_TIER.md
"@ | Set-Content -Path (Join-Path $thuMucTam 'MANIFEST.txt') -Encoding UTF8

    GhiBuoc 'Đóng gói và mã hoá'
    $tepTar = Join-Path $env:TEMP "mnee-backup-$moc.tar"
    & tar.exe -C $thuMucTam -cf $tepTar public.dump auth_data.sql extensions.sql MANIFEST.txt
    if ($LASTEXITCODE -ne 0) { throw 'Đóng gói tar thất bại.' }

    $tepKetQua = Join-Path $ThuMucLuu "mnee-backup-$moc.tar.gpg"
    $matKhauMaHoa | & $gpg --batch --yes --symmetric --cipher-algo AES256 `
        --passphrase-fd 0 --output $tepKetQua $tepTar
    if ($LASTEXITCODE -ne 0) { throw 'Mã hoá gpg thất bại.' }
    Remove-Item $tepTar -Force -ErrorAction SilentlyContinue

    $dungLuong = '{0:N1} MB' -f ((Get-Item $tepKetQua).Length / 1MB)
    GhiTot "xong: $tepKetQua ($dungLuong)"

    # Một bản sao lưu không mở ra được thì vô nghĩa, và phải biết điều đó ngay
    # hôm nay chứ không phải hôm mất dữ liệu.
    GhiBuoc 'Thử giải mã lại để chắc chắn tệp dùng được'
    $tepThu = Join-Path $env:TEMP "verify-$moc.tar"
    $matKhauMaHoa | & $gpg --batch --yes --decrypt --passphrase-fd 0 --output $tepThu $tepKetQua 2>$null
    if ($LASTEXITCODE -ne 0) { throw 'Giải mã thử thất bại — tệp sao lưu KHÔNG dùng được.' }
    & tar.exe -tf $tepThu | Out-Null
    if ($LASTEXITCODE -ne 0) { throw 'Tệp giải mã ra nhưng không đọc được danh sách bên trong.' }
    Remove-Item $tepThu -Force -ErrorAction SilentlyContinue
    GhiTot 'giải mã và đọc được — bản sao lưu hợp lệ'

    # Lưu chuỗi kết nối chỉ khi đã chạy trót lọt, để không cất một chuỗi hỏng.
    if (-not (Test-Path $TepCauHinh)) {
        LuuChuoiKetNoi $bimat
        GhiTot 'đã nhớ chuỗi kết nối, lần sau không phải nhập lại'
    }

    # Dọn bản cũ, giữ 30 bản gần nhất.
    $banCu = Get-ChildItem $ThuMucLuu -Filter 'mnee-backup-*.tar.gpg' |
             Sort-Object LastWriteTime -Descending | Select-Object -Skip 30
    if ($banCu) {
        $banCu | Remove-Item -Force
        GhiTot "đã dọn $($banCu.Count) bản cũ, giữ lại 30 bản gần nhất"
    }
}
finally {
    Remove-Item $thuMucTam -Recurse -Force -ErrorAction SilentlyContinue
}

if ($DatLichHangNgay) {
    Ghi ''
    DatLich -DuongDanScript $PSCommandPath
}

Ghi ''
Ghi '  XONG.' 'Green'
Ghi "  Tệp nằm ở: $ThuMucLuu" 'Green'
Ghi ''
Ghi '  Nên để thư mục này bên trong Google Drive hoặc OneDrive — máy hỏng thì' 'DarkGray'
Ghi '  bản sao lưu nằm cùng máy cũng mất theo.' 'DarkGray'
Ghi ''
