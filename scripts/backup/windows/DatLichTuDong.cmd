@echo off
REM Bấm đúp MỘT LẦN để máy tự sao lưu mỗi ngày lúc 22:00.
chcp 65001 > nul
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0SaoLuu-MNEE.ps1" -DatLichHangNgay
echo.
pause
