@echo off
title Crochet Tumbler 3D Studio - Preview Lokal
cd /d "%~dp0"
echo ============================================================
echo   Membuka 3D Crochet Tumbler Studio (Sceptile ^& Dragonite)
echo ============================================================
echo.

where python >nul 2>nul
if %errorlevel%==0 (
  echo Menjalankan server lokal di http://127.0.0.1:8765/index.html ...
  start "" "http://127.0.0.1:8765/index.html"
  python -m http.server 8765 --bind 127.0.0.1
  goto :eof
)

if exist "output\Preview_3D_Perajut_Standalone.html" (
  echo Python tidak ditemukan. Membuka file Standalone HTML langsung...
  start "" "output\Preview_3D_Perajut_Standalone.html"
  goto :eof
)

echo Tidak dapat menemukan Python atau file Preview_3D_Perajut_Standalone.html.
pause
