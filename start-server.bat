@echo off
REM Baby Smash - HTTP Server + Edge Kiosk Launcher
REM Serves files via localhost to avoid file:// restrictions on fetch/audio
REM To exit: Close Edge (Alt+F4) then Ctrl+C in this terminal

set PORT=8080
set "APP_DIR=%~dp0"

echo Starting local server on http://localhost:%PORT% ...
echo Press Ctrl+C to stop the server after closing Edge.
echo.

REM Launch Edge after a short delay to let server start
start "" cmd /c "timeout /t 2 /nobreak >nul && start "" "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --kiosk --autoplay-policy=no-user-gesture-required --disable-pinch --overscroll-history-navigation=0 --disable-translate --no-first-run --disable-infobars --disable-session-crashed-bubble --disable-features=TranslateUI http://localhost:%PORT%/index.html"

REM Start Python HTTP server (blocking)
cd /d "%APP_DIR%"
python -m http.server %PORT% --bind 127.0.0.1
