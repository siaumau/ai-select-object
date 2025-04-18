@echo off
chcp 65001 > nul
echo 正在安裝必要套件...
call npm install

echo.
echo 正在啟動服務器...
start cmd /k "chcp 65001 > nul && node server.js"

echo.
echo 等待服務器啟動...
timeout /t 3 /nobreak > nul

echo.
echo 正在開啟應用程式...
start %~dp0index.html

echo.
echo 安裝和啟動完成！
echo 請勿關閉命令視窗，關閉將導致服務停止。
echo.
pause 