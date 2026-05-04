@echo off
REM Baby Smash - Kiosk Launcher
REM Launches Edge in kiosk mode (fullscreen, no UI, neural TTS voices available)
REM To exit: Alt+F4 or kill from Task Manager

REM Find the HTML file path
set "APP_PATH=%~dp0index.html"

REM Launch Edge in kiosk mode (Edge has neural voices for better TTS quality)
start "" "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --kiosk --disable-pinch --overscroll-history-navigation=0 --disable-translate --no-first-run --disable-infobars --disable-session-crashed-bubble --disable-features=TranslateUI "%APP_PATH%"

REM Fallback: try 64-bit Edge path
if errorlevel 1 (
    start "" "C:\Program Files\Microsoft\Edge\Application\msedge.exe" --kiosk --disable-pinch --overscroll-history-navigation=0 --disable-translate --no-first-run --disable-infobars --disable-session-crashed-bubble --disable-features=TranslateUI "%APP_PATH%"
)
