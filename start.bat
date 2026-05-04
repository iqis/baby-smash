@echo off
REM Baby Smash - Kiosk Launcher
REM Launches Chrome in kiosk mode (fullscreen, no address bar, no tabs, no exit shortcuts)
REM To exit: Alt+F4 (or Ctrl+Shift+Q if on ChromeOS) or kill from Task Manager

REM Find the HTML file path
set "APP_PATH=%~dp0index.html"

REM Launch Chrome in kiosk mode
start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" --kiosk --disable-pinch --overscroll-history-navigation=0 --disable-translate --no-first-run --disable-infobars --disable-session-crashed-bubble --disable-features=TranslateUI "%APP_PATH%"
