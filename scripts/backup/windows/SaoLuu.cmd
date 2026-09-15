@echo off
REM Bấm đúp tệp này để sao lưu cơ sở dữ liệu MNEE về máy.
REM Lần đầu sẽ hỏi chuỗi kết nối Supabase và mật khẩu mã hoá; các lần sau không hỏi lại.
chcp 65001 > nul
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0SaoLuu-MNEE.ps1" %*
echo.
pause
