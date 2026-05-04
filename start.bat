@echo off
REM Baby Smash - Kiosk Launcher (file:// mode)
REM NOTE: Use start-server.bat instead for reliable audio/image loading!
REM This launcher uses file:// which may block fetch() for manifests.
REM To exit: Alt+F4 or kill from Task Manager

REM Find the HTML file path
set "APP_PATH=%~dp0index.html"

REM Launch Edge in kiosk mode
REM --allow-file-access-from-files: needed for fetch() from file:// URLs
REM --autoplay-policy=no-user-gesture-required: allow audio playback
start "" "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --kiosk --allow-file-access-from-files --autoplay-policy=no-user-gesture-required --disable-pinch --overscroll-history-navigation=0 --disable-translate --no-first-run --disable-infobars --disable-session-crashed-bubble --disable-features=TranslateUI "%APP_PATH%"

REM Fallback: try 64-bit Edge path
if errorlevel 1 (
    start "" "C:\Program Files\Microsoft\Edge\Application\msedge.exe" --kiosk --allow-file-access-from-files --autoplay-policy=no-user-gesture-required --disable-pinch --overscroll-history-navigation=0 --disable-translate --no-first-run --disable-infobars --disable-session-crashed-bubble --disable-features=TranslateUI "%APP_PATH%"
)
