@echo off
setlocal EnableDelayedExpansion
chcp 65001 >nul 2>&1
title PRODIGY [BRAND] // SOLVEX v4.0 [PRODUCT] - Autonomous AI Assessment Engine Installer

:: ============================================================================
:: PRODIGY (Brand) x SOLVEX v4.0 (Product)
:: Official Repository Installer, Cinema Engine & Browser Launcher
:: ============================================================================

:: Initialize ANSI Escape Sequences for 24-bit Neon Colors
for /F "tokens=1,2 delims=#" %%a in ('"prompt #$H#$E# & echo on & for %%b in (1) do rem"') do (
  set "ESC=%%b"
)

set "RST=%ESC%[0m"
set "BOLD=%ESC%[1m"
set "RED=%ESC%[38;2;255;45;85m"
set "ORANGE=%ESC%[38;2;255;107;53m"
set "GOLD=%ESC%[38;2;255;235;59m"
set "GREEN=%ESC%[38;2;0;255;157m"
set "CYAN=%ESC%[38;2;56;189;248m"
set "PINK=%ESC%[38;2;255;111;165m"
set "VIOLET=%ESC%[38;2;192;132;252m"
set "WHITE=%ESC%[38;2;255;255;255m"
set "MUTED=%ESC%[38;2;168;164;188m"
set "DIM=%ESC%[38;2;106;101;120m"

mode con: cols=132 lines=52 >nul 2>&1

:CINEMA_START
cls
echo.
echo %RED%  ╔══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗%RST%
echo %RED%  ║%RST% %BOLD%%GOLD%⚡ P R O D I G Y   L A B S%RST% %MUTED%// NEXT-GEN AUTONOMOUS AI ECOSYSTEM%RST%                                        %CYAN%[BOOTLOADER v4.0]%RST% %RED%║%RST%
echo %RED%  ╚══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╝%RST%
echo.
echo %RED%      ██████╗ ██████╗  ██████╗ ██████╗ ██╗ ██████╗ ██╗   ██╗%RST%     %DIM%┌──────────────────────────────────────────────────────┐%RST%
echo %RED%      ██╔══██╗██╔══██╗██╔═══██╗██╔══██╗██║██╔════╝ ╚██╗ ██╔╝%RST%     %DIM%│%RST% %WHITE%BRAND   :%RST% %BOLD%%RED%PRODIGY%RST% %MUTED%(Autonomous Intelligence Labs)%RST%     %DIM%│%RST%
echo %ORANGE%      ██████╔╝██████╔╝██║   ██║██║  ██║██║██║  ███╗ ╚████╔╝ %RST%     %DIM%│%RST% %WHITE%PRODUCT :%RST% %BOLD%%GOLD%SOLVEX v4.0%RST% %MUTED%(StepTest AI Solver Engine)%RST%    %DIM%│%RST%
echo %ORANGE%      ██╔═══╝ ██╔══██╗██║   ██║██║  ██║██║██║   ██║  ╚██╔╝  %RST%     %DIM%│%RST% %WHITE%EDITION :%RST% %GREEN%Production Release • 100%% Free Forever%RST%    %DIM%│%RST%
echo %GOLD%      ██║     ██║  ██║╚██████╔╝██████╔╝██║╚██████╔╝   ██║   %RST%     %DIM%│%RST% %WHITE%ENGINE  :%RST% %CYAN%Main-World React Fiber + Custom Wait Timer%RST% %DIM%│%RST%
echo %GOLD%      ╚═╝     ╚═╝  ╚═╝ ╚═════╝ ╚═════╝ ╚═╝ ╚═════╝    ╚═╝   %RST%     %DIM%└──────────────────────────────────────────────────────┘%RST%
echo.
echo %CYAN%                    ─── P R E S E N T S   F L A G S H I P   P R O D U C T ───%RST%
echo.
echo %GREEN%              ███████╗ ██████╗ ██╗    ██╗   ██╗███████╗██╗  ██╗     ██╗   ██╗██╗  ██╗   ██████╗ %RST%
echo %GREEN%              ██╔════╝██╔═══██╗██║    ██║   ██║██╔════╝╚██╗██╔╝     ██║   ██║██║  ██║  ██╔═████╗%RST%
echo %CYAN%              ███████╗██║   ██║██║    ██║   ██║█████╗   ╚███╔╝      ██║   ██║███████║  ██║██╔██║%RST%
echo %CYAN%              ╚════██║██║   ██║██║    ╚██╗ ██╔╝██╔══╝   ██╔██╗      ╚██╗ ██╔╝╚════██║  ████╔╝██║%RST%
echo %VIOLET%              ███████║╚██████╔╝███████╗╚████╔╝ ███████╗██╔╝ ██╗      ╚████╔╝      ██║██╗╚██████╔╝%RST%
echo %VIOLET%              ╚══════╝ ╚═════╝ ╚══════╝ ╚═══╝  ╚══════╝╚═╝  ╚═╝       ╚═══╝       ╚═╝╚═╝ ╚═════╝ %RST%
echo.

:: Multi-Frame Cyber Pulse Animation
for %%p in (
  "  [▰▱▱▱▱▱▱▱▱▱] 10%%  Initializing PRODIGY Brand Kernel..."
  "  [▰▰▰▱▱▱▱▱▱▱] 30%%  Mounting SOLVEX v4.0 Neural DOM Parser..."
  "  [▰▰▰▰▰▱▱▱▱▱] 50%%  Calibrating Main-World React 18 Fiber Bridge..."
  "  [▰▰▰▰▰▰▰▱▱▱] 70%%  Loading Configurable 200s Wait-and-Answer Engine..."
  "  [▰▰▰▰▰▰▰▰▰▱] 90%%  Activating Anti-Tab-Switch & Keep-Alive Shield..."
  "  [▰▰▰▰▰▰▰▰▰▰] 100%% PRODIGY // SOLVEX v4.0 Core Online!"
) do (
  echo %GOLD%%%~p%RST%
  pathping -h 1 -p 120 -q 1 127.0.0.1 >nul 2>&1
)
pathping -h 1 -p 400 -q 1 127.0.0.1 >nul 2>&1

:: ============================================================================
:: ASCII ARTWORK SHOWCASE #1 — PRODIGY AWAKENING
:: ============================================================================
cls
echo %RED%  ╔══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗%RST%
echo %RED%  ║%RST% %BOLD%%RED%PRODIGY%RST% %MUTED%[BRAND]%RST%  %GOLD%×%RST%  %BOLD%%CYAN%SOLVEX v4.0%RST% %MUTED%[PRODUCT]%RST%   %DIM%│%RST%   %PINK%ASCII CINEMA SEQUENCE [01 / 07] : THE AWAKENING%RST%                   %RED%║%RST%
echo %RED%  ╚══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╝%RST%
echo %RED%⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣀⣀⣤⣤⣤⣤⣄⣀⣀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀%RST%
echo %RED%⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣀⣤⠶⣻⠝⠋⠠⠔⠛⠁⡀⠀⠈⢉⡙⠓⠶⣄⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀%RST%
echo %RED%⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣠⠞⢋⣴⡮⠓⠋⠀⠀⢄⠀⠀⠉⠢⣄⠀⠈⠁⠀⡀⠙⢶⣄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀%RST%
echo %RED%⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣠⠞⢁⣔⠟⠁⠀⠀⠀⠀⠀⠈⡆⠀⠀⠀⠈⢦⡀⠀⠀⠘⢯⢢⠙⢦⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀%RST%
echo %RED%⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⡼⠃⠀⣿⠃⠀⠀⠀⠀⠀⠀⠀⠀⠸⠀⠀⠀⠀⠀⢳⣦⡀⠀⠀⢯⠀⠈⣷⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀%RST%
echo %RED%⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣾⠆⡄⢠⢧⠀⣸⠀⠀⠀⠀⠀⠀⠀⢰⠀⣄⠀⠀⠀⠀⢳⡈⢶⡦⣿⣷⣿⢉⣷⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀%RST%
echo %RED%⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢠⣿⣯⣿⣁⡟⠈⠣⡇⠀⠀⢸⠀⠀⠀⠀⢸⡄⠘⡄⠀⠀⠀⠈⢿⢾⣿⣾⢾⠙⠻⣾⣧⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀%RST%
echo %RED%⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣿⡿⣮⠇⢙⠷⢄⣸⡗⡆⠀⢘⠀⠀⠀⠀⢸⠧⠀⢣⠀⠀⠀⡀⡸⣿⣿⠘⡎⢆⠈⢳⣽⣆⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀%RST%
echo %RED%⠀⠀⠀⠀⠀⠀⠀⠀⢠⡟⢻⢷⣄⠀⠀⠀⠀⠀⠀⣾⣳⡿⡸⢀⣿⠀⠀⢸⠙⠁⠀⠼⠀⠀⠀⠀⢸⣇⠠⡼⡤⠴⢋⣽⣱⢿⣧⠀⢳⠈⢧⠀⢻⣿⣧⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀%RST%
echo %RED%⠀⠀⠀⠀⠀⠀⠀⢀⡿⣠⡣⠃⣿⠃⠀⠀⠀⠀⣸⣳⣿⠇⣇⢸⣿⢸⣠⠼⠀⠀⠀⡇⠀⡀⠉⠒⣾⢾⣆⢟⣳⡶⠓⠶⠿⢼⣿⣇⠈⡇⠘⢆⠈⢿⡘⣷⠀⠀⠀⠀⠀⠀⠀⠀⠀%RST%
echo %RED%⠀⠀⠀⠀⠀⠀⠀⠈⢷⣍⣤⡶⣿⡄⠀⠀⠀⢠⣿⠃⣿⠀⡏⢸⣿⣿⠀⢸⠀⠀⢠⡗⢀⠇⠀⢠⡟⠀⠻⣾⣿⠀⠀⠀⠀⡏⣿⣿⡀⢹⡀⠈⢦⠈⢷⣿⡆⠀⠀⠀⠀⠀⠀⠀⠀%RST%
echo %RED%⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⢁⣤⣄⠁⠀⠀⠀⣼⡏⢰⣟⠀⣇⠘⣿⣿⣾⣾⣆⢀⣾⠃⣼⢠⣶⣿⣭⣷⣶⣾⣿⣤⠀⠀⠀⡇⡯⣍⣧⠀⣷⠄⠈⢳⡀⢻⡁⠀⠀⠀⠀⠀⠀⠀⠀%RST%
echo %RED%⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠺⣿⡿⠀⠀⠀⠀⡿⢀⣾⣧⠀⡗⡄⢿⣿⡙⣽⣿⣟⠛⠚⠛⠙⠉⢹⣿⣿⣦⠀⢸⡿⠀⠀⠀⢰⡯⣌⢻⡀⢸⢠⢰⡄⠹⡷⣿⣦⣤⠤⣶⡇⠀⠀⠀%RST%
echo %RED%⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⠀⠀⠀⣇⣾⣿⢸⢠⣧⢧⠘⣿⡇⠸⣿⢿⡆⠀⠀⠀⠀⠘⣯⠇⣿⠂⣸⢰⠀⠀⢀⣸⡧⣊⣼⡇⢸⣼⣸⣷⢣⢻⣄⠉⠙⠛⠉⠀⠀⠀⠀%RST%
echo %RED%⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣿⣳⣤⣴⣿⣏⣿⣾⢸⣿⡘⣧⣘⢿⣀⡙⣞⠁⠀⠀⠀⠀⢀⡬⢀⣉⢠⣧⡏⠀⠀⡎⣿⣿⣿⣿⠃⣸⡏⣿⣿⡎⢿⡘⡆⠀⠀⠀⠀⠀⠀⠀%RST%
echo %RED%⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠉⠉⣠⣼⣿⣿⣿⣼⣿⣧⢿⣿⣿⣯⡻⠟⠀⠀⠀⠀⠀⠐⢯⠣⡽⢟⣽⠀⠀⢘⡇⣿⣿⣿⡟⣴⣿⣷⣿⣿⣧⣿⣷⡽⠀⠀⠀⠀⠀⠀⠀%RST%
echo %RED%⣀⣀⣀⣀⣀⣀⣀⣀⣀⣀⣀⣀⣀⣀⣀⣼⣹⣿⣇⣸⣿⣿⣿⣻⣚⣿⡿⣿⣿⣦⣤⣀⡉⠃⠀⢀⣀⣤⡶⠛⡏⠀⢀⣼⢸⣿⣿⣿⣿⣿⣿⣿⢋⣿⣿⣿⣿⡇⠀⠀⠀⠀⠀⠀⠀%RST%
echo %RED%⣿⠛⠛⠛⠛⠛⠛⠛⠛⠛⠛⠛⠛⠛⠛⠛⠛⠛⠛⠛⠛⠛⠒⠒⠒⢭⢻⣽⣿⣿⣿⣿⣿⣿⢿⠿⣿⡏⠀⡼⠁⣀⣾⣿⣿⣿⣿⡿⣿⣿⣟⡻⣿⣿⡿⠣⠟⠀⠀⠀⠀⠀⠀⠀⠀%RST%
echo %RED%⠸⡆⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⢧⢿⣯⡽⠿⠛⠋⣵⢟⣋⣿⣶⣞⣤⣾⣿⣿⡟⢉⡿⢋⠻⢯⡉⢻⡟⢿⡅⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀%RST%
echo %RED%⠀⢻⡄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠘⡞⣿⣆⡀⠀⡼⡏⠉⠚⠭⢉⣠⠬⠛⠛⢁⡴⣫⠖⠁⠀⠀⣩⠟⠁⣸⣇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀%RST%
echo %RED%⠀⠈⢷⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢹⣽⣿⣿⣾⠳⡙⣦⡤⠜⠊⠁⠀⣀⡴⠯⠾⠗⠒⠒⠛⠛⠛⠛⠛⠓⠿⣦⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀%RST%
echo %RED%⠀⠀⠘⣧⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠰⣄⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢷⣻⣿⣿⠔⢪⠓⠬⢍⠉⣩⣽⢻⣤⣶⣦⠀⠀⠀⢀⣀⣤⣴⣾⣿⣿⣿⣿⠀⠀⠀⠀⠀⠀⠀⠀⠀%RST%
echo %RED%⠀⠀⠀⠹⡆⠀⠀⠀⠀⠀⠀⠀⠀⠀⣰⣾⡏⢦⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠘⣯⣿⣿⠀⠀⣇⠀⣠⠎⠁⢹⡎⡟⡏⣷⣶⠿⠛⡟⠛⠛⣫⠟⠉⢿⣿⡿⠀⠀⠀⠀⠀⠀⠀⠀⠀%RST%
echo %RED%⠀⠀⠀⠀⢻⡄⠀⠀⠀⠀⠀⠀⠀⠀⠹⣿⣷⠈⢷⡤⠀⠀⠀⠀⠀⠀⠀⠀⠀⢹⣾⣷⡀⣀⣀⣷⡅⠀⠀⠈⣷⢳⡇⣿⠀⠀⣸⠁⢠⡾⣟⣛⣻⣟⡿⣇⠀⠀⠀⠀⠀⠀⠀⠀⠀%RST%
echo %RED%⠀⠀⠀⠀⠀⢷⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢯⢻⣏⡵⠿⠿⢤⣄⠀⢀⣿⢸⣹⣿⣀⣴⣿⣴⣿⣛⠋⠉⠉⡉⠛⣿⣧⡀⠀⠀⠀⠀⠀⠀⠀%RST%
echo %RED%⠀⠀⠀⠀⠀⠘⣧⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⡎⣿⣥⣶⠖⢉⣿⡿⣿⣿⡿⣿⣟⠿⠿⣿⣿⣿⡯⠻⣿⣿⣿⣷⡽⣿⡗⠀⠀⠀⠀⠀⠀⠀%RST%
echo %RED%⠀⠀⠀⠀⠀⠀⠸⣇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠸⡘⣿⣩⠶⣛⣋⡽⠿⣷⢬⣙⣻⣿⣿⣿⣯⣛⠳⣤⣬⡻⣿⣿⣿⣿⣧⠀⠀⠀⠀⠀⠀⠀%RST%
echo %RED%⠀⣿⣛⣻⣿⡿⠿⠟⠗⠶⠶⠶⠶⠤⠤⢤⠤⡤⢤⣤⣤⣤⣤⣄⣀⣀⣀⣀⣀⣀⣀⣀⣣⢹⣷⣶⣿⣿⣦⣴⣟⣛⣯⣤⣿⣿⣿⣿⣿⣷⣌⣿⣿⣿⣿⣿⣿⣿⣤⣤⣤⣤⣤⣤⣄%RST%
echo %RED%⠀⠉⠙⠛⠛⠛⠛⠛⠻⠿⠿⠿⠷⠶⠶⢶⣶⣶⣶⣶⣤⣤⣤⣤⣤⣥⣬⣭⣭⣉⣩⣍⣙⣏⣉⣏⣽⣶⣶⣶⣤⣤⣬⣤⣤⣾⣿⠶⠾⠿⠿⠿⠿⠛⠛⠛⠛⠛⠛⠛⠛⠛⠛⠛⠃%RST%
echo %RED%⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠉⠉⠉⠉⠉⠉⠛⠛⠛⠛⠛⠛⠋⠉⠉⠉⠉⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀%RST%
echo.
echo %GOLD%  [PRODIGY TELEMETRY] >> Synchronizing Neural Vision Matrix... [FRAME 01/07]%RST%
pathping -h 1 -p 650 -q 1 127.0.0.1 >nul 2>&1

:: ============================================================================
:: ASCII ARTWORK SHOWCASE #2 — SOLVEX OVERDRIVE
:: ============================================================================
cls
echo %CYAN%  ╔══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗%RST%
echo %CYAN%  ║%RST% %BOLD%%RED%PRODIGY%RST% %MUTED%[BRAND]%RST%  %GOLD%×%RST%  %BOLD%%CYAN%SOLVEX v4.0%RST% %MUTED%[PRODUCT]%RST%   %DIM%│%RST%   %CYAN%ASCII CINEMA SEQUENCE [02 / 07] : SOLVEX OVERDRIVE%RST%                %CYAN%║%RST%
echo %CYAN%  ╚══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╝%RST%
echo %CYAN%⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡿⠁⣰⣾⣿⣿⣿⣿⣿⣿⣿⣿⣿⡿⠿⣿⣿⣿⣿⣁⣭⣝⢿⡋⠽⢯⣝⡻⢿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣮⠻⣿⣿⣿⣷⡝⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿%RST%
echo %CYAN%⣿⣿⣿⣿⣿⣿⣿⣿⣿⠏⢠⣾⣿⣿⣿⣿⣿⣿⣿⣿⡿⣫⢔⣫⣥⣾⣿⣿⣿⣏⠙⣿⣧⢻⣿⣿⣶⣭⣓⢬⡻⣿⣿⣿⣿⣿⣿⣿⣿⣷⡙⣿⣿⣿⣿⣌⢿⣿⣿⣿⣿⣿⣿⣿⣿%RST%
echo %CYAN%⣿⣿⣿⣿⣿⣿⣿⣿⠃⣴⣿⣿⣿⣿⣿⣿⣿⣿⣿⠟⢔⣵⣿⣿⣿⣿⣿⣿⣿⣿⣧⡈⣿⣧⢻⣿⣿⣿⣿⣷⣄⡈⠻⣿⣿⣿⣿⣿⣿⣿⣷⡘⣿⣿⣿⣿⣆⢿⣿⣿⣿⣿⣿⣿⣿%RST%
echo %CYAN%⣿⣿⣿⣿⣿⣿⡿⠃⣼⣿⣿⣿⣿⣿⣿⣿⣿⣿⠏⢢⣿⣿⣿⣿⣿⣿⣿⢛⣿⣿⣿⣿⢹⣿⡘⣿⣿⣿⣿⣿⣿⣿⣦⡙⢿⣿⣿⣿⣿⣿⣿⣷⡸⣿⣿⣿⣿⡎⢿⣿⣿⣿⣿⣿⣿%RST%
echo %CYAN%⣿⣿⣿⣿⣿⣿⢇⣼⣿⣿⣿⣿⣿⣿⣿⣿⣿⡏⣰⣿⣿⣿⣿⣿⡿⢻⠏⣾⣿⣿⣿⣿⡇⣿⡇⡹⣿⣿⣿⣿⣿⣿⣿⣿⣌⢿⡟⢻⣿⢈⢧⠙⣧⢹⡟⢿⣿⣿⡼⣿⣿⣿⣿⣿⣿%RST%
echo %CYAN%⣿⣿⣿⣿⣿⡏⣼⡟⢩⣿⣿⢛⣿⣿⣿⣿⣿⢡⣿⣿⣿⣿⣿⡟⢡⣿⣸⣿⣿⣿⣿⣿⣷⣿⣇⣳⡿⣿⣿⠻⣿⡉⢻⣿⣿⡎⢿⡴⣝⣋⡌⣎⠸⡏⢿⡌⣿⣿⣧⢹⣿⣿⣿⣿⣿%RST%
echo %CYAN%⣿⣿⣿⣿⡟⣈⣎⠆⢃⣿⢇⡾⢻⣿⣿⣿⡏⣾⡟⣿⠿⣿⡿⠁⣼⡇⣿⣿⣿⣿⣿⣿⣿⣿⣿⢰⡸⣌⣿⣦⢊⠧⢱⡹⣿⣿⡌⣷⣹⣿⡟⠘⡦⢹⡸⣿⡘⣿⣿⡞⣿⣿⣿⣿⣿%RST%
echo %CYAN%⣿⣿⣿⡿⡘⣼⠘⡼⣼⡟⡞⣰⣿⣿⣿⣿⠸⣋⢶⡿⢰⣿⢣⣧⣿⢡⣿⢣⢻⢏⣿⣿⣿⣿⡇⣼⡇⡑⣎⠛⣧⡳⠺⣟⠜⣿⣿⡸⣧⢿⣏⣆⢱⡘⡧⣿⣿⣿⣿⡇⢻⣿⣿⣿⣿%RST%
echo %CYAN%⣿⣿⣿⢡⢱⣇⣸⢣⣿⢰⣿⣿⣸⣿⣿⡏⣆⣿⢸⡇⢸⠏⡞⢸⣿⢸⣿⣼⢰⣾⣏⣿⡟⡿⠇⣿⣿⢰⠹⡨⡜⢷⡁⢬⣧⣸⣿⣇⢻⣼⣿⣿⣷⣿⣧⢸⣿⣿⣿⣿⢸⣿⣿⣿⣿%RST%
echo %CYAN%⣿⣿⡟⣾⣿⣿⡟⣸⣿⢋⣿⣿⣿⣿⣿⢡⡏⡼⢸⡷⣿⠘⢸⢸⣿⣬⣿⣿⢘⣥⢻⡟⠇⣧⢳⣿⣿⠈⣷⠳⣿⣎⢿⣿⣿⣿⣿⣿⡜⣿⣿⣿⣿⣿⣷⡜⣿⣿⣿⣿⡎⣿⣿⣿⣿%RST%
echo %CYAN%⣿⣿⢡⣿⣿⣿⡇⣿⣿⣼⣿⣿⣿⣿⣿⢸⣿⡇⣿⣷⠇⠀⡌⢸⣿⢻⣿⣿⢸⣿⡼⢡⢸⡟⣸⣿⣿⡎⣌⢷⡹⣿⣦⠻⣿⣿⣿⣿⣧⢿⣿⣿⣿⣿⣿⡇⣿⣿⣿⣿⡇⣿⣿⣿⣿%RST%
echo %CYAN%⣿⣿⣾⣿⣿⣿⢷⣿⣿⣿⣿⣿⣿⣿⡿⣿⣿⠇⣿⣿⠀⣼⣇⢸⣿⢸⣿⣿⢸⣿⣷⡏⣿⢱⣿⢻⣿⡇⣎⢣⡱⡜⢿⣷⡈⠻⣿⣿⣿⢸⣿⣿⣿⣿⣿⣧⣿⣿⣿⣿⣷⣿⣿⣿⣿%RST%
echo %CYAN%⣿⣟⣿⣿⣿⣏⣼⣿⣿⣿⣿⣿⣿⣿⡇⣿⡏⠀⣿⣿⠀⣿⣿⢸⣿⡆⣿⣿⣸⣿⡟⡼⢃⣿⣿⢸⣿⢱⣿⣷⡕⢌⠢⡻⣿⣮⡪⡙⢿⠀⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿%RST%
echo %CYAN%⣿⣯⣿⣿⡿⢸⣿⣿⣿⣿⣿⣿⣿⣿⡇⣿⠉⣴⢹⣿⣸⣿⣿⡏⣿⣷⢿⣿⡏⡿⠑⠁⢸⣿⡿⢸⣿⢸⣿⣿⣿⣷⣕⠌⠪⣿⣿⡌⠳⡆⣿⣿⢻⣿⣿⣿⡙⣿⣿⣿⣿⣿⣿⣿⣿%RST%
echo %CYAN%⣿⣿⣿⣿⠃⢳⣼⣿⣿⣿⣿⣿⣿⣿⡇⡏⢸⣿⢸⣿⣿⣿⣿⣷⣸⣿⠈⣿⠇⡀⢀⣾⢸⣿⡇⠼⠟⣸⠿⠿⠿⢛⣛⣥⣤⡀⠐⠶⣷⡄⣿⡿⣸⣿⣿⣿⣼⠸⣿⣿⣿⣿⣿⣿⣿%RST%
echo %CYAN%⡏⢸⣿⣿⠀⠰⣾⣿⣿⣿⡇⣿⣿⣿⡇⠃⣾⣿⡆⢍⢛⠻⠿⣿⣧⢻⡌⡁⠞⠁⢿⣿⢸⣿⣧⢸⣆⣐⡤⢞⣛⠻⠿⠍⠉⠙⠁⠈⠀⠀⣚⡃⢿⣿⣿⣿⣿⡇⣿⣿⣿⣿⣿⣿⣿%RST%
echo %CYAN%⣸⢸⣿⡇⠀⡗⣼⣿⣿⣿⣧⢹⣿⣿⣇⠀⣿⣿⣿⡘⠸⡿⢷⣶⣶⣦⠲⢲⡐⢷⡈⡻⣼⡿⣸⠘⣸⣿⣞⠉⢀⡀⡀⠀⠀⠀⢰⣾⣿⠂⢉⢀⣿⣿⣿⣿⣿⢣⣿⣿⣿⣿⣿⣿⣿%RST%
echo %CYAN%⢧⢸⣿⡇⠃⡇⠟⣿⣿⣿⣿⡞⣿⣿⣿⠀⡿⠇⠉⢁⠀⢀⠀⣀⠀⠀⡀⠀⠈⢎⠳⡄⣿⢡⠇⣰⣿⣿⣧⣾⣿⣇⠑⠮⠔⣁⣾⣿⠛⣠⡾⢸⣿⣿⣿⡏⢣⣿⣿⣿⣿⢿⣿⣿⣿%RST%
echo %CYAN%⣾⣾⣿⡇⠀⡇⠀⣯⡻⣿⣿⣷⡸⣿⣿⡆⣶⣄⠐⢿⣷⣿⡄⠱⣄⡠⠆⣼⣌⣿⡷⡰⠃⠋⣴⣿⣿⣿⣿⣿⣿⣿⣯⣭⣭⣤⣴⣿⢣⣿⢡⢸⣿⣿⣿⡇⣿⣿⣿⣿⣿⣸⣿⣿⣿%RST%
echo %CYAN%⣿⡿⣿⡇⡇⡇⢀⢹⣇⣿⣿⣿⣷⡹⣿⣿⡸⣿⣷⣤⠛⣿⠿⠶⠶⢒⣺⣿⣿⡿⢁⣵⣿⣶⣬⣹⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⢇⣾⢃⣸⣼⣿⣿⣿⢠⣿⣿⣿⣿⣿⢿⣿⣿⣿%RST%
echo %CYAN%⣿⠁⣿⡇⠃⡇⢸⠌⡸⡘⣿⣿⣿⣷⡘⣿⣷⡹⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣴⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡟⡼⣣⡟⡇⣿⣿⣿⢁⣸⣿⣿⣿⣿⣿⢸⣿⣿⣿%RST%
echo %CYAN%⡛⢰⢻⣧⠀⡇⡸⢀⢣⣷⢻⣿⣿⣿⣿⡌⠻⣷⡽⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠏⢈⣴⣿⢃⢸⣿⢏⡇⡆⠋⣿⣿⣿⣿⢻⢸⣿⣿⣿%RST%
echo %CYAN%⣬⠘⡌⣿⢀⡇⡇⢸⡆⡜⣧⢻⣿⣿⣿⣧⢢⣜⢻⣌⢿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣡⣶⣿⣿⡟⢄⣿⡟⡼⡙⣼⢸⣿⣿⣿⣿⢸⢸⣿⣿⣿%RST%
echo %CYAN%⣿⡗⡆⠹⡇⢡⡇⢸⡇⡘⣽⣇⢻⣿⣿⣿⡌⢿⡇⢮⡓⠙⠿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣏⡸⠃⣼⣿⣱⠳⢱⣿⢸⣿⣿⣿⣿⢸⡆⣿⣿⣿%RST%
echo %CYAN%⣿⡇⡄⣷⠹⡼⡇⢸⡇⣷⡙⣿⡄⠻⣿⣿⣿⡌⣿⢸⣷⢕⢦⣬⣛⣿⣿⣿⣿⣿⣿⣿⣿⣿⣟⣛⠿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠟⡅⣼⣿⢡⡇⣰⢸⣿⣸⣿⣿⣿⣿⠈⡇⣿⣿⣿%RST%
echo %CYAN%⣿⢸⠇⣿⢰⠀⠁⣾⠃⣿⢱⡜⢷⡱⡹⣿⣿⣷⡸⢸⣿⢸⣷⣍⡻⢿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡿⢛⢡⡆⣸⡿⣡⢏⣾⣿⢸⣿⣿⣿⣿⣿⣿⠀⣧⣿⣿⣿%RST%
echo %CYAN%⣿⢸⢰⣿⢸⢸⡆⡙⠀⣿⢸⣗⣌⢧⠱⣜⢿⣿⣷⡘⠟⣼⣿⣿⣿⣷⣮⣝⠻⢿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠟⣩⣶⣿⠘⣱⠟⢕⣵⣿⣯⢹⣼⣿⢹⢸⣿⣿⣿⠈⢻⢹⣿⣿%RST%
echo %CYAN%⡟⣼⢸⣿⠸⣿⢻⡟⡇⣿⢸⠛⣿⣷⡁⠻⣦⡹⣿⣿⣄⢻⣿⢟⣿⣿⣿⣿⠀⢿⡄⣭⣟⡛⠿⣿⣿⣿⠿⣛⣵⣾⣿⣿⠟⡜⢁⡐⣿⣿⣿⣿⡸⡟⣿⢸⢸⣿⣿⣿⠀⡸⡸⣿⣿%RST%
echo %CYAN%⡇⣿⢸⣿⡇⡏⣼⢡⠇⡿⡾⠀⣿⣿⡿⠆⠈⠵⢎⡻⣿⣦⡁⣾⣿⣿⣿⡏⣼⢸⣧⢻⣿⣿⣿⣶⣶⣶⣾⣿⣿⣿⡿⢋⣨⡆⢿⣇⢻⣿⣿⣿⣇⠃⢻⠘⡈⣿⣿⣿⡇⠃⡇⣿⣿%RST%
echo %CYAN%⡇⣿⢸⣿⡇⢣⡏⣾⢸⡇⢇⡇⡟⡩⢊⠀⣠⣶⢸⣿⣦⠙⠷⣜⢻⣿⠟⣼⣿⢸⠟⢸⣿⣿⣿⣿⣿⣿⣿⣿⣿⣯⣴⣿⢛⣼⢸⣿⡜⣿⣿⣿⣿⠎⠘⡇⡇⣿⣿⣿⡇⡈⢻⢹⣿%RST%
echo %CYAN%⡇⣿⢸⣿⡇⡼⢹⠟⢾⣘⣘⡓⡘⠰⢁⣾⣿⣿⢸⡿⣿⢸⣿⣶⠅⣁⣚⣭⣵⣶⠏⡘⢿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠟⣡⣿⣿⣇⠻⣧⢹⣿⠏⢱⣿⣆⢧⢧⣿⣿⣿⣇⣧⡜⡎⣿%RST%
echo %CYAN%⣷⢸⠸⡿⢘⣥⣶⣿⣿⣿⣿⡇⠇⢶⣾⢿⣿⣿⣸⡇⣿⢺⢏⡔⣹⣿⣿⣿⣿⣿⣿⣿⣮⡙⢿⣿⣿⣿⣿⣿⠟⣡⣾⣿⣿⣿⣿⣧⣌⠃⢿⣧⢃⢻⣿⣎⢸⢹⣿⣿⣿⢻⠰⢷⢹%RST%
echo %CYAN%⣿⡦⢅⣴⣿⣿⣿⣿⣿⣿⣿⣿⡸⡌⢿⣇⣿⣿⡟⡇⢿⠠⡿⢱⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣷⣮⣝⣛⣫⣵⣾⣿⣿⣿⣿⣿⣿⣿⣿⣷⡄⢿⣇⢸⣏⠿⡄⠜⣿⣿⣿⢸⣇⠘⡞%RST%
echo.
echo %GREEN%  [SOLVEX ENGINE] >> Injecting Main-World React Fiber Bridge... [FRAME 02/07]%RST%
pathping -h 1 -p 650 -q 1 127.0.0.1 >nul 2>&1

:: ============================================================================
:: ASCII ARTWORK SHOWCASE #3 — DOMAIN EXPANSION
:: ============================================================================
cls
echo %VIOLET%  ╔══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗%RST%
echo %VIOLET%  ║%RST% %BOLD%%RED%PRODIGY%RST% %MUTED%[BRAND]%RST%  %GOLD%×%RST%  %BOLD%%CYAN%SOLVEX v4.0%RST% %MUTED%[PRODUCT]%RST%   %DIM%│%RST%   %VIOLET%ASCII CINEMA SEQUENCE [03 / 07] : INFINITE COGNITION%RST%              %VIOLET%║%RST%
echo %VIOLET%  ╚══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╝%RST%
echo %VIOLET%⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣯⣫⣡⡿⡵⣫⣾⣿⡿⣋⣥⣶⣷⣾⣿⣿⣵⣦⣌⠻⣿⣿⣿⣿⣷⣻⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⢷⠝⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿%RST%
echo %VIOLET%⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠯⢱⣫⢗⡞⢕⣿⣿⢿⣾⣿⣿⣿⣿⢿⣿⣿⣿⣿⣿⣿⣜⣿⡽⣿⣿⣷⣿⣿⣿⣿⣿⣷⣹⣿⣟⢿⣿⣿⣿⣯⣇⡸⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿%RST%
echo %VIOLET%⣿⣿⣿⣿⣿⣿⣿⣿⣿⡟⢠⣏⡟⢟⡾⣾⣿⢳⣿⡿⣷⣿⡿⡫⣾⣿⢿⣿⣿⣿⣿⣿⢻⣿⢿⣿⣿⣧⢿⣿⣿⣿⣿⣯⣿⣿⢸⣿⣿⣿⣇⡘⡽⣌⢿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿%RST%
echo %VIOLET%⣿⣿⣿⣿⣿⣿⣿⣿⡿⠀⣿⡰⡞⣿⢳⣿⣷⣿⢟⣿⣿⢏⣬⣾⡇⢿⡏⢿⣿⣿⣿⣿⡏⣿⡌⣿⣿⣿⡟⣿⣿⣿⣿⣿⣿⣿⡇⢻⣿⣿⣿⡁⢷⢿⡌⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿%RST%
echo %VIOLET%⣿⣿⣿⣿⣿⣿⣿⣿⢃⠀⢣⣽⣱⡿⣿⡏⣿⣏⣾⡟⣵⣿⣿⣿⣿⡜⣯⢊⢿⣿⣿⣿⣷⣿⡇⣮⢿⣿⣿⣹⣿⣿⣿⣿⣿⣿⣷⢸⣿⣿⣿⣧⣿⡘⣿⢹⣿⣿⣿⣿⣿⣿⣿⣿⣿%RST%
echo %VIOLET%⣿⣿⣿⣿⣿⣿⣿⣿⠼⢠⡽⣿⣿⠇⣿⢸⣟⣾⢯⣾⣿⣿⣿⣿⣿⣷⡜⣯⣎⢻⣿⣿⣿⣿⡇⣿⡎⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡎⣿⢻⣿⣿⣸⡇⢿⢸⣿⣿⣿⣿⣿⣿⣿⣿⣿%RST%
echo %VIOLET%⣿⣿⣿⣿⣿⣧⢞⡻⣕⢸⢧⣿⣿⢸⣿⣿⣿⢄⢶⣯⣽⢿⣿⣿⣿⣿⣿⣌⢮⢒⠛⣛⡿⣿⢁⢿⣿⡼⣿⣿⣿⣷⣿⣿⣿⣿⣿⣧⢿⠘⣿⣿⣧⡇⠞⣸⣿⣿⣿⣿⣿⣿⣿⣿⣿%RST%
echo %VIOLET%⣿⣿⣿⣿⣿⣿⣾⣾⠆⣤⠘⣷⢹⣿⢹⡇⣏⣿⣷⣾⣯⣼⣿⣿⣿⣿⣟⣑⣓⡙⢣⡉⠆⡟⣼⣦⣻⣧⢿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠸⡆⣿⣿⣿⢗⡖⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿%RST%
echo %VIOLET%⣿⣿⣿⣿⣿⣿⣿⣿⢧⢫⣰⣿⢋⡇⣮⠘⠻⢞⢿⣷⣾⣻⣿⣿⣿⣿⣿⣿⣿⡿⢆⣙⡼⢀⠻⣛⡷⣻⣽⢻⣿⣿⣿⣿⣿⣿⣿⡏⢸⣿⣿⣽⣿⡘⡇⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿%RST%
echo %VIOLET%⣿⣿⣿⣿⣿⣿⣿⡟⣮⢿⡿⣿⣏⣧⠸⠀⢰⣀⢉⠒⠝⢣⣿⣿⣿⣿⣿⣿⣿⣡⣿⡑⠡⠤⠈⠊⠻⢷⠉⣾⡟⣽⣿⣿⣿⣿⢿⡇⡚⣩⣭⡭⠽⠷⠤⣭⡭⠭⣭⣭⡭⠭⢭⣝⢻%RST%
echo %VIOLET%⣿⣿⣿⣿⣿⣿⣿⡇⣿⡇⢣⡏⣿⣝⡀⡇⣷⡹⣌⠳⠤⠌⢻⣿⣿⣿⣿⣿⣿⠟⠁⣀⠉⣉⠉⠉⡤⢠⡤⡀⣐⣿⣿⣻⣿⡿⣼⠃⣻⣭⣿⣶⣶⢳⣗⣶⣿⣿⣶⡶⣖⡴⣫⣴⣿%RST%
echo %VIOLET%⣿⣿⣿⣿⣿⣿⣿⣧⢻⡇⢦⢏⢘⡟⣆⢻⢸⣿⣮⣯⣭⣿⣿⣿⣿⣿⣿⠟⡡⣢⣾⡻⣷⣽⣛⣛⡤⣃⣼⣳⣿⡿⣳⡟⣸⣧⣇⢺⣿⣿⣿⡿⣫⣿⠾⡟⣻⣭⡵⣺⣵⣾⣿⣿⣿%RST%
echo %VIOLET%⣿⣿⣿⣿⣿⣿⣿⣿⣄⢷⢸⣣⣣⡻⡿⣆⠃⠛⢿⣿⣿⣟⣽⣛⣿⣯⣴⣿⣿⣿⣿⣿⣿⣶⣶⠞⢈⡿⢡⣿⢿⣿⣟⢰⣟⡌⠀⣺⣿⠛⢉⣪⣥⣶⠿⢛⣭⣾⣿⣿⣿⣿⣿⣿⣿%RST%
echo %VIOLET%⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡍⣷⠈⢤⠻⡙⣧⣳⣄⣭⣿⣸⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣟⣥⢎⡾⣵⣿⣵⣿⠯⣲⡟⠍⢠⣶⣿⡭⠶⢟⣋⣭⣶⣿⣈⣝⣿⣿⣿⣿⣿⣿⣿⣿%RST%
echo %VIOLET%⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣮⣇⠸⣦⠡⠈⠋⢿⣿⣿⣷⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡿⠫⢋⠜⣿⣿⡟⡡⠚⠋⠐⠖⢀⡭⡥⣰⢸⣿⣿⣿⣿⣿⣧⡜⡝⢿⣿⣿⣿⣿⣿⣿%RST%
echo %VIOLET%⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣟⡞⣴⡿⣱⢸⣆⢀⢹⣿⣿⣿⡿⠿⢿⣿⣿⣿⣿⣿⣿⣿⣵⡏⢊⣿⠟⣫⡔⢀⢀⣮⠎⢰⢟⢹⡇⡏⠏⣿⣿⡏⣿⣆⢻⡽⢘⣎⢻⡿⣿⣿⣿⣿%RST%
echo %VIOLET%⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡿⡺⣽⡿⡇⠊⣿⢏⣷⡝⢽⢿⣿⣯⣯⣿⣿⣿⣿⣿⣿⣿⣿⣿⡰⣚⣵⠿⢋⣴⣏⣜⣎⠆⢯⢧⣿⢸⣷⠂⢻⣿⣿⠘⣿⣕⠻⢯⠻⣆⠙⢿⣿⣿⣿%RST%
echo %VIOLET%⣿⣿⣿⣿⣿⣿⣿⣿⣿⣫⡾⢷⣿⣾⣿⣿⢏⣾⣿⢳⣷⡜⢽⢿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠿⢃⢉⣠⣾⣿⠏⢬⢮⠈⢶⡏⣸⣿⣼⣿⣜⡈⣿⣿⣧⢻⣿⣦⠮⡟⣗⡯⣎⠻⣿⣿%RST%
echo %VIOLET%⣿⣿⣿⣿⣿⣿⣿⣻⠷⢋⢴⣿⢿⣿⡿⢣⣾⣿⢧⣹⣟⣽⣷⣅⠙⢿⣿⡿⠿⠛⣛⣭⠴⣺⠵⢿⣻⣭⢄⡠⡳⡃⣬⡎⡇⣿⣿⢿⣿⣿⣻⡘⣿⣿⡌⣿⣿⣧⣓⡝⣿⠎⢳⡜⢿%RST%
echo %VIOLET%⣿⣿⣿⡿⣿⢽⣾⢵⣰⣫⡿⣵⣿⠟⣡⣿⣿⣳⣷⢯⣾⡏⣸⣟⡖⡂⠠⣤⣤⣤⣤⣶⣶⡾⠿⣻⡻⠁⢈⢊⣜⣼⡟⡄⣧⢿⣿⢸⡞⣿⣷⢷⣜⣿⣿⡘⣿⣿⣧⡈⠺⣧⡈⢿⣾%RST%
echo %VIOLET%⣿⢟⠙⣈⣵⢟⣽⣿⣽⣫⣾⡿⡹⣵⣷⡿⣵⡟⣴⣿⠯⢖⣻⣼⡇⠙⣶⠶⠶⠶⡶⠶⣶⣿⡟⣫⢀⣴⣢⡟⣼⣿⣷⡇⢸⡾⣿⡇⡱⠘⣿⣎⣿⣮⢿⣷⡨⡿⣿⣷⣶⡔⢕⠸⣿%RST%
echo %VIOLET%⣾⢦⣾⣿⣷⣽⢟⢞⣷⡿⡫⢔⣾⣿⢋⣞⣿⣿⠋⡅⠤⠾⠿⠶⠒⡇⣿⣿⣿⣿⣿⣿⡿⣫⢞⣵⡿⣷⠟⢴⣿⣿⣰⡾⢺⣇⠹⣇⠘⣅⢮⢿⡘⣿⣷⡻⣷⠑⣝⢿⣿⣿⡧⣳⣟%RST%
echo %VIOLET%⣷⢿⡿⣻⡿⣫⣾⡿⣏⣺⣪⣿⠟⣡⣿⢏⣶⢿⣴⣾⢍⡩⢟⣟⣳⣀⠿⣿⣿⣿⡿⡯⡟⡵⢟⢛⣾⡯⣼⠊⢹⣿⠔⣰⡄⢿⡴⡽⡔⣤⠪⣓⠓⢝⣿⣿⣾⢷⣈⣷⡟⢿⣿⣿⣾%RST%
echo %VIOLET%⣿⣿⣿⣻⡴⣟⣽⣿⡿⣵⢿⢕⣾⣽⣿⣟⣯⣽⣿⣷⣯⣾⡿⢡⣶⣽⣛⣿⡿⢯⣾⢋⣿⣟⣛⣿⣟⣵⣿⢰⢸⣿⣸⣿⣿⡜⣿⡴⣬⡌⠳⠬⡻⢷⡪⣿⣿⣿⣷⡷⣝⣿⣽⣿⣿%RST%
echo.
echo %VIOLET%  [PRODIGY AI] >> Multi-Key Gemini Failover Pool Armed (Up to 10 Keys)... [FRAME 03/07]%RST%
pathping -h 1 -p 650 -q 1 127.0.0.1 >nul 2>&1

:: ============================================================================
:: ASCII ARTWORK SHOWCASE #4 — DUAL-CORE SYNTHESIS
:: ============================================================================
cls
echo %GOLD%  ╔══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗%RST%
echo %GOLD%  ║%RST% %BOLD%%RED%PRODIGY%RST% %MUTED%[BRAND]%RST%  %GOLD%×%RST%  %BOLD%%CYAN%SOLVEX v4.0%RST% %MUTED%[PRODUCT]%RST%   %DIM%│%RST%   %GOLD%ASCII CINEMA SEQUENCE [04 / 07] : DUAL-THEME HARMONY%RST%              %GOLD%║%RST%
echo %GOLD%  ╚══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╝%RST%
echo %GOLD%⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡿⢟⣫⣽⣶⣶⣶⣆⠠⣉⣴⣾⣿⣿⣿⣷⣶⠈⠍⠙⠿⢿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿%RST%
echo %GOLD%⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠃⣾⣿⣿⣿⣿⣿⣿⡌⠘⡿⠟⠻⢿⣿⣿⠿⠟⢸⣿⣿⡇⠁⢾⣿⣿⣿⣿⣿⡞⣿⣿⡿⣼⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿%RST%
echo %GOLD%⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠟⣫⠛⠋⣠⣾⣿⣿⣿⢡⣻⡏⢣⠀⣷⡄⣴⣿⣿⢣⡆⠸⢸⣿⡿⠁⣰⣷⣦⡌⢿⣿⣿⣿⢸⣿⠇⠿⢿⠟⠋⣩⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿%RST%
echo %GOLD%⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡿⢋⣥⣾⣿⣿⣷⣦⡹⣿⣿⣿⠘⡧⡇⠈⠀⡿⠟⠘⢛⣛⣘⡀⣘⣿⣟⣀⡀⠿⢿⢛⢅⡤⣿⣿⣿⡇⡿⠀⠀⠀⠠⢌⣒⣶⣖⡂⢩⣽⣿⣿⣿⣿⣿%RST%
echo %GOLD%⣿⣿⣿⣿⣿⣿⣿⣿⣿⠟⣴⣿⣿⣎⢿⣿⡿⢻⣧⠰⣾⣁⠀⣸⣷⡨⠐⠒⣒⡭⠅⡀⠙⠻⢶⣮⣝⡫⢙⢿⣶⡶⢦⣀⠉⢿⣿⡇⠁⠀⢀⣴⣾⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿%RST%
echo %GOLD%⣿⣿⣿⣿⣿⣿⣿⣿⠡⣾⣿⣿⣿⣿⣆⠹⣀⢘⡛⠃⠉⢀⠔⣩⡿⠁⢻⣶⣤⣵⣄⢦⢡⡠⢄⠙⢿⣿⣶⣅⠙⢷⣦⡙⠳⣄⠙⢁⡀⢀⣡⣤⣤⣤⡈⠙⠻⣿⣿⣿⣿⣿⣿⣿⣿%RST%
echo %GOLD%⣿⣿⣿⣿⣿⣿⣿⣿⣧⢻⣿⠿⣿⣿⣿⣦⠘⢈⠜⠁⠀⣠⣾⣿⠃⢠⣽⣏⢻⣿⣿⣧⡂⢿⣷⣄⠱⣽⣿⣿⣿⣆⠹⡹⣦⣀⠀⠀⠐⢎⣉⠛⢿⣿⣿⣷⡑⢻⣿⣿⣿⣿⣿⣿⣿%RST%
echo %GOLD%⣿⣿⣿⣿⣿⣿⣿⣿⣿⢃⣿⡐⢮⡙⢛⣛⡃⠀⠀⠀⣰⣿⣿⠃⠀⣼⣟⣿⡇⢻⣿⣿⣷⡈⢿⣿⡛⣷⠹⣿⣿⣿⣧⡀⢻⢻⣷⣄⠀⠈⢻⣿⡆⡍⠉⠙⢿⣌⣿⣿⣿⣿⣿⣿⣿%RST%
echo %GOLD%⡙⣿⣿⣿⣿⣿⣿⡟⣡⡏⠀⠀⠀⢨⣂⠙⠑⢀⡄⢀⣿⣿⣿⠀⡄⣿⢸⣿⡟⡄⢹⣿⣿⣷⡘⣿⡇⢸⣇⠹⣿⣿⣿⣿⠀⣧⣹⣿⣷⣄⠀⠀⢤⡀⠀⠀⠈⢿⣿⣿⣿⣿⣿⣿⣿%RST%
echo %GOLD%⣿⣮⠻⣿⣿⣿⣟⠀⣿⣿⣶⣾⣿⡆⠿⠁⢠⡾⠁⣸⣿⣿⡇⢰⢿⣿⢸⣿⣿⢰⣠⣿⣿⣿⣧⣸⣷⠀⣇⠀⢹⣿⣿⢹⠀⢸⣧⠡⡹⣿⣷⠑⠌⢻⣾⣶⣄⠈⠹⣿⣿⣿⣿⣿⣿%RST%
echo %GOLD%⣿⣿⣷⣝⠻⣿⣿⣇⣿⣿⣿⡟⢋⣠⠀⢠⢟⡼⠃⣿⣿⣿⡇⢸⢸⣿⠈⣿⣿⡈⣿⡏⢻⣿⣿⡇⢿⠀⣿⠀⠈⣿⣿⡸⠀⠀⢻⣇⢱⠙⣿⣇⠈⢆⠉⢉⣛⡃⠠⠘⢿⣿⣿⣿⣿%RST%
echo %GOLD%⣄⠉⠙⠻⢦⡈⢻⣿⡘⠿⠋⠔⠛⠋⠀⢏⠞⣱⠀⣿⣿⣿⡇⢸⢸⡟⠀⣿⣿⡇⢹⣇⠀⢻⣿⣿⣸⠀⣿⠀⠀⢸⣿⡇⠀⠀⠘⣿⡎⠀⠛⣿⠀⠘⡆⠀⠙⠻⣿⣶⣤⣙⡻⣿⣿%RST%
echo %GOLD%⣭⣭⣄⡀⠀⠈⠀⠙⣿⣆⠀⠀⠠⠃⢰⠊⣼⠏⢠⣿⣿⣿⣇⠀⢸⡇⠀⣿⣿⡇⣿⣿⠀⢆⢻⣿⡇⠀⣿⠀⠀⢸⡿⠀⠾⠞⠂⠛⣣⣦⣆⢹⠀⠀⠸⣦⠀⢀⠀⠀⠀⣀⠀⣿⣿%RST%
echo %GOLD%⠭⠭⣛⣛⠻⠶⢤⡀⠈⠻⠀⠀⠀⠀⠈⠞⢡⡆⢰⣿⣿⣿⣿⡀⢺⣿⠀⣿⣿⡇⣿⣿⢠⠘⡌⣿⠇⣠⠿⣀⣵⢆⠏⠀⠀⠨⣭⣭⣑⡒⠀⠈⠁⠀⠂⢿⣇⠀⠀⠉⠂⠀⠁⣿⣿%RST%
echo %GOLD%⠿⠗⣒⣂⣤⣤⠄⠀⠀⠀⠀⠀⠀⡀⣀⣴⣿⡇⠈⣿⡿⣿⣿⡇⢸⣿⠀⣿⣿⢧⢹⡿⠼⢀⣁⣙⠺⢶⣿⣿⣿⡸⣤⡀⠠⢰⢸⣿⡿⠇⢶⠠⡀⠀⠀⢸⣿⠀⠀⠀⠀⠀⠀⠸⣿%RST%
echo %GOLD%⡶⢖⣒⣭⡥⠖⠋⠁⠀⠀⠷⠐⠀⠘⣿⣿⣿⣇⢀⢹⣿⠘⣿⣧⠘⣿⠀⣿⡿⠸⠈⠁⠉⣐⣤⣀⢐⣛⣿⣿⣿⣷⣬⣿⣶⣤⣭⡁⣄⣠⣴⡆⠃⠀⠀⢸⣿⠀⢀⠀⠀⠀⠀⠀⢹%RST%
echo %GOLD%⣶⡿⠿⠁⠀⠀⠀⠀⠀⠀⣁⠀⠠⡁⣦⣭⣭⣿⡘⡎⣿⣧⠘⣿⣇⠹⠀⣿⠀⠋⠀⠐⠛⢿⣿⡿⠃⣿⣿⣿⣿⢰⠖⣩⡏⢿⣿⣿⣿⣿⣿⣿⡆⠀⠀⢸⠏⢷⡰⣄⠀⠀⠀⠀⠘%RST%
echo %GOLD%⡇⠀⠀⠀⠀⠀⠀⡀⠀⡀⢻⡷⢰⣧⠘⠿⠟⠋⠁⠻⠘⣿⣧⡘⣿⣄⠡⠀⠀⡀⠆⡭⢨⢸⠟⢁⣾⣿⣿⣿⣿⣶⣾⡟⣿⢘⣿⣿⣿⣿⣿⣿⣧⠀⠀⣸⠀⠈⠃⠘⢿⣦⠀⢀⠀%RST%
echo %GOLD%⠁⠀⠀⠀⠀⠀⣰⣿⣿⡇⠘⢇⣿⣿⠀⡈⠻⣿⣿⡀⢷⠹⣿⣇⠘⠖⡀⠂⠸⠿⠦⠀⡒⢠⣴⣿⣿⣿⣿⣿⣿⣿⣿⣷⣿⣾⡿⠿⣿⣿⣿⣿⡏⠁⠈⠉⠁⠀⢢⣄⣀⡙⠳⢤⣄%RST%
echo %GOLD%⠀⠀⠀⠂⠀⣾⣿⣿⣿⠀⣶⣄⢻⠃⠀⠿⠶⠌⠻⠧⠈⣦⠹⣿⣷⣄⢥⣦⡀⢿⣄⣠⣷⣾⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠟⠩⠒⠀⣼⣿⣿⣿⡇⠀⠀⠀⠀⠀⢸⣿⣿⣿⣶⣶⣶%RST%
echo %GOLD%⠀⠀⠀⢀⣼⣿⣿⣿⣿⡇⠘⣧⡀⢸⡀⢀⠉⠛⣛⡛⡀⣌⢧⠘⣿⣿⣷⣝⠻⣄⠈⢛⠻⠿⣿⣿⣿⣿⣿⣿⣿⣿⡟⠁⠀⠀⠀⠀⣿⣿⣿⣿⢣⡆⠀⠀⠀⠀⢸⣿⣿⣿⣿⣿⣿%RST%
echo %GOLD%⠠⠀⡇⡄⣿⣿⣿⣿⣿⢣⣷⡜⠃⣼⡧⢈⡳⣦⠀⠴⠶⠸⣎⢣⡈⢿⣿⣿⣷⣍⠳⠆⠍⠓⠶⠾⢿⣿⣿⣿⣿⡟⠀⠀⠀⠀⠀⠀⣿⣿⣿⡏⣼⠁⠀⣠⠀⠀⣸⣿⣿⣿⣿⣿⣿%RST%
echo %GOLD%⡸⠃⠐⠀⣿⣿⣿⣿⣿⢸⣿⣷⠠⣿⡇⠀⠻⣦⡌⡁⣠⠄⢹⡆⠑⢄⠻⣿⣿⣿⣷⣤⡀⠒⢶⣶⣶⣿⣿⣿⣿⡇⢀⣤⣄⠑⢦⡀⣿⣿⠟⣸⣧⣾⣾⣿⠀⣰⣿⣿⣿⣿⣿⣿⣿%RST%
echo %GOLD%⢀⣤⠀⢀⣿⣿⣿⡿⠋⡐⣿⣿⡇⠛⣠⣷⣄⠐⢥⡀⠹⣈⣀⢻⣆⢮⡢⡙⢿⣏⡛⠿⠿⠷⠴⣭⡙⠛⠿⣿⣿⣿⡌⠙⣿⣷⣮⣇⢻⠟⡰⣿⣿⣿⣿⣿⣼⣿⣿⣿⣿⣿⣿⣿⣿%RST%
echo %GOLD%⣴⣿⡆⠶⣬⢻⣿⣄⢰⣿⣮⠻⣧⣤⠉⠻⠿⠿⠦⠍⠀⠙⠃⠀⢿⡷⠙⢮⡀⠙⢿⣄⠐⢶⣶⣶⣶⣿⣿⣿⣿⣿⣿⣦⣈⣙⡛⢿⠘⠀⠀⢬⡙⢿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿%RST%
echo %GOLD%⡄⢴⣿⣿⠶⠘⠏⣴⢸⣿⡿⠱⠞⠃⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣇⡆⠀⠉⠂⠀⠙⢦⡈⠹⣆⠀⠈⠉⠛⠛⠻⠿⠿⢿⣿⣿⡗⠀⠀⠀⠡⡄⢳⢸⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿%RST%
echo %GOLD%⣿⣶⡄⣰⣿⣿⣷⣿⡆⠟⣠⢀⣴⣶⣆⢻⣶⣦⣄⡀⠀⠀⠀⠀⠀⠈⠀⠀⠀⠀⠐⠥⣈⠳⢄⠙⢷⣄⠀⠀⣀⣤⡶⠀⠀⠀⠀⣀⡀⠀⠀⠀⠈⢀⢸⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿%RST%
echo %GOLD%⣿⣿⣷⣮⣍⣉⠈⢋⣚⣛⠁⢸⣿⣿⢿⣦⠹⣿⣿⣿⣿⣶⣤⣴⣤⡄⢀⠀⠀⢀⡀⢻⣦⣤⡀⠀⢀⣈⣛⠿⣿⡟⣁⠀⠀⠈⣎⢿⢇⡄⢿⡐⢀⠈⠀⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿%RST%
echo %GOLD%⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣦⡈⢹⣷⣄⡙⠧⢹⣿⣿⣿⣿⣿⣿⣿⡇⠟⣡⣶⣿⡇⠘⣻⢿⣷⣌⠲⣦⣽⣿⣾⡇⠻⣷⣦⡀⢸⡎⣼⡇⢸⣿⡏⠄⠀⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿%RST%
echo %GOLD%⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⢰⣿⣿⣿⣦⡘⢿⣿⣿⣿⣿⣿⠟⣡⣾⣿⣿⣿⣿⣄⠻⡀⠙⠻⣷⣌⡛⠿⣿⣿⣦⣽⣿⣿⢸⣷⠸⡇⢸⣿⣿⡄⠂⢸⣿⣿⣿⣿⣿⣿⣿⣿⣿%RST%
echo %GOLD%⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡏⠘⣩⣵⡶⣶⡆⠀⠹⣿⣿⣿⠇⣼⣿⣿⣿⣋⣉⣩⣿⣧⡈⠀⢐⢮⡛⢿⣶⣤⣉⣛⣿⠿⠏⠼⠿⡇⢃⣸⣿⣿⣷⡄⢸⣿⣿⣿⣿⣿⣿⣿⣿⣿%RST%
echo %GOLD%⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣧⡜⢛⣅⣴⣿⣧⡉⠠⡀⠻⢃⡾⠟⣛⠻⠯⠩⠭⠭⣽⣿⣿⣦⡀⠁⠙⢷⣬⡛⢿⣿⣿⢋⣄⠀⠀⠈⠄⢿⣿⣿⣿⣷⠈⣿⣿⣿⣿⣿⣿⣿⣿⣿%RST%
echo %GOLD%⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠻⢠⣾⣿⡿⠟⡩⠶⠛⠓⠈⢠⡀⠈⠛⠿⢿⣿⣿⣿⣷⣬⣲⣾⣿⣿⣆⠀⠙⢿⣿⣿⣿⡏⠀⠀⠉⠀⠀⢠⡀⠻⣿⣿⣿⠀⢿⣿⣿⣿⣿⣿⣿⣿⣿%RST%
echo.
echo %GOLD%  [SOLVEX UI] >> Pixel Gamer 🎮 + Kawaii Teddy 🧸 Themes Loaded... [FRAME 04/07]%RST%
pathping -h 1 -p 650 -q 1 127.0.0.1 >nul 2>&1

:: ============================================================================
:: ASCII ARTWORK SHOWCASE #5 & #6 — PRECISION STRIKE
:: ============================================================================
cls
echo %PINK%  ╔══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗%RST%
echo %PINK%  ║%RST% %BOLD%%RED%PRODIGY%RST% %MUTED%[BRAND]%RST%  %GOLD%×%RST%  %BOLD%%CYAN%SOLVEX v4.0%RST% %MUTED%[PRODUCT]%RST%   %DIM%│%RST%   %PINK%ASCII CINEMA SEQUENCE [05 / 07] : PRECISION FOCUS%RST%                 %PINK%║%RST%
echo %PINK%  ╚══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╝%RST%
echo %RED%⣿⡿⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠹⣿⣿⣿⣿%RST%
echo %RED%⣿⠃⠀⠀⠀⠀⢀⠀⠀⠀⠀⣄⠀⠀⠀⠀⠀⠀⠀⠀⠀⢻⣿⣿⣿%RST%
echo %RED%⡏⠀⠀⠀⠀⠀⠸⡀⠀⠀⠀⣟⣣⡀⠀⠀⠀⠀⠀⠀⠀⡎⣿⣿⣿%RST%
echo %RED%⡇⠀⠀⠀⠀⠀⠿⣷⠀⠀⠀⢟⠯⠉⠀⠀⠀⠀⠀⠀⠀⡇⣿⣿⣿%RST%
echo %RED%⡇⠀⠀⠀⠀⢠⠀⠁⢀⠀⠀⣯⣞⣄⣐⣳⠀⠀⠀⠀⠀⢇⣿⣿⣿%RST%
echo %RED%⣇⠇⠀⠀⠀⡴⢶⣾⣿⣆⠀⢹⣿⣿⣿⣿⠀⠀⠀⠀⣨⣾⣿⣿⣿%RST%
echo %RED%⣿⡄⡀⠀⠀⣿⣿⣿⣿⣮⣷⣄⢽⣿⣿⡟⠀⠀⠀⣰⣿⣿⣿⣿⣿%RST%
echo %RED%⣿⡇⣦⠀⡆⣮⣻⡿⣟⣽⣞⣿⣷⣿⣿⠝⠀⠀⠀⠘⣿⣿⣿⣿⣿%RST%
echo %RED%⣿⣷⡽⣰⡧⢛⣯⡾⠆⠿⣿⣿⡿⢟⣵⠀⠀⠀⠠⣼⣿⣿⣿⣿⣿%RST%
echo %RED%⣿⣿⣾⣟⣿⣿⣯⣤⠷⠙⠓⠒⠈⠁⠀⠀⠀⠰⣿⣿⣿⣿⣿⣿⣿%RST%
echo %RED%⣿⣿⢻⣿⣷⣿⣿⣤⡶⠆⣰⣶⣶⣶⣿⡄⠠⣑⣲⣿⣿⣿⣿⣿⣿%RST%
echo %RED%⣿⢣⣿⣿⣿⣿⣿⣵⡶⠶⢎⣿⣿⣿⣿⣷⠄⣔⣿⣭⣭⣭⢉⡟⣻%RST%
echo %RED%⢳⣿⣿⣿⣿⣿⣿⣏⣾⣾⣿⣿⣿⣿⣿⣿⠇⣿⣿⣿⣿⢫⢎⡾⣿%RST%
echo.
echo %PINK%⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀%RST%
echo %PINK%⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢿⡷⡀⣀⣀⣀⣀⣀⣀⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀%RST%
echo %PINK%⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣀⠤⠺⣟⡽⠀⠀⠀⠀⠀⠀⠀⠈⠑⠂⢤⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀%RST%
echo %PINK%⠀⠀⠀⠀⠀⠀⠀⠀⠀⡴⠊⠁⠀⠀⠙⠁⠀⠀⠀⠀⠀⠀⡄⠀⠀⠀⠀⠈⠳⢄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀%RST%
echo %PINK%⠀⠀⠀⠀⠀⠀⠀⢠⠎⠀⠀⠆⠀⢰⡃⠀⠐⡄⠀⢲⠀⠃⢻⠀⠀⠀⡄⠀⠀⠈⠱⡄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀%RST%
echo %PINK%⠀⠀⠀⠸⣶⣄⣺⢇⡄⠀⡇⠀⢰⢺⠱⣄⠀⠘⢆⠈⡆⠀⠸⠀⠀⠀⡇⠀⠀⠀⠰⠘⡄⠀⠀⠀⠀⠀⠀⠀⠀⠀%RST%
echo %PINK%⠀⠀⠀⠀⠙⢿⡏⢸⠀⠀⡇⠀⢸⣾⢀⣨⣷⡄⠈⢣⣇⠀⠀⡆⠀⠀⡇⠀⠀⠀⠀⠀⠸⡄⠀⠀⠀⠀⠀⠀⠀⠀%RST%
echo %PINK%⠀⠀⠀⠀⠀⢸⠃⢸⡄⢸⡇⡀⢸⢿⡏⠀⣀⣹⣦⡀⢿⠀⠀⡇⠀⠀⡇⠀⠀⠀⠀⠀⠀⢣⠀⠀⠀⠀⠀⠀⠀⠀%RST%
echo %PINK%⠀⠀⠀⠀⠀⣼⡄⠈⡇⠈⣿⣿⣼⣞⣷⠾⣿⣿⡿⠉⢻⠀⠀⡇⠀⠀⡿⠟⢷⡄⠀⠀⠀⡘⡄⠀⠀⠀⠀⠀⠀⠀%RST%
echo %PINK%⠀⠀⠀⠀⠀⡇⣇⢸⢿⡀⠇⠻⠉⠸⠏⣠⠟⠉⠀⠀⠀⡄⠀⠿⠀⠀⣿⡀⠀⡇⠀⠀⠀⠀⡇⠀⠀⠀⠀⠀⠀⠀%RST%
echo %PINK%⠀⠀⠀⠀⠀⣿⣿⣾⣷⣧⡄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡇⠀⠀⠀⢀⡿⢃⣼⠁⠀⠀⠃⠀⢸⠀⠀⠀⠀⠀⠀⠀%RST%
echo %PINK%⠀⠀⠀⠀⠀⢻⡻⢯⣻⠟⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢷⠀⠀⠀⢸⡧⡎⢸⠃⠀⠀⢠⢀⣸⠀⠀⠀⠀⠀⠀⠀%RST%
echo %PINK%⠀⠀⠀⠀⠀⢸⡇⢸⠉⠧⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢸⠀⠀⠀⢸⡇⡇⢸⠀⠀⠀⢸⡈⣿⠀⠀⠀⠀⠀⠀⠀%RST%
echo %PINK%⠀⠀⠀⠀⠀⢸⠃⢸⡀⠀⠀⠀⢀⡠⠴⠚⠀⠀⠀⠀⠀⢸⠀⠀⠀⢸⡇⢸⢸⡀⠀⠀⠈⡇⢻⠀⠀⠀⠀⠀⠀⠀%RST%
echo %PINK%⠀⠀⠀⠀⠀⠘⡆⠀⢇⠀⠀⠰⠋⠀⠀⠀⠀⠀⠀⠀⠀⢨⠀⠀⠀⢸⠃⠈⡇⡇⠀⠀⠀⢱⢸⠀⠀⠀⠀⠀⠀⠀%RST%
echo %PINK%⠀⠀⠀⠀⠀⠀⣿⠀⠈⢢⡀⠀⠀⠀⠀⠀⠀⠀⠀⢀⡀⠍⠀⠀⠀⣿⠀⠀⢡⠱⠀⠀⠀⠸⡜⡇⠀⠀⠀⠀⠀⠀%RST%
echo %PINK%⠀⠀⠀⠀⠀⠀⣿⠀⠀⠀⣽⢆⠀⠀⠀⠀⠀⣠⠒⠁⠉⢀⡆⠀⠀⣿⡄⠀⠸⡄⠀⠀⠀⠀⢇⠇⠀⠀⠀⠀⠀⠀%RST%
echo %PINK%⠀⠀⠀⠀⠀⠀⢸⡄⠀⠀⣿⠀⠓⠤⠔⠒⠻⡇⢀⡴⠚⠉⡇⠀⠀⡧⢇⠀⠀⢱⡀⠀⠀⠀⠘⣾⡀⠀⠀⠀⠀⠀%RST%
echo %PINK%⠀⠀⠀⠀⠀⠀⢸⡆⠀⢰⣿⡄⡆⠀⠀⠀⠀⢷⠋⠀⠀⠀⡇⠀⢀⠁⢈⠷⢶⣤⡷⣤⣤⢤⡤⠞⠓⠒⠦⢄⡀⠀%RST%
echo %PINK%⠀⠀⠀⠀⠀⠀⢸⠀⠀⢸⡇⡇⢁⠀⠀⠀⢀⢻⠀⠀⠀⠀⡇⠀⢸⠀⠣⢤⣀⣞⡏⠉⡱⠋⠀⠀⠀⠀⠀⠀⠙⡆%RST%
echo %PINK%⠀⠀⠀⠀⠀⠀⢸⠀⠀⡞⠀⢡⢸⡀⠀⣀⡼⠀⢳⠀⠀⠀⡇⠀⡏⠀⢀⣾⣿⣾⣟⡜⠀⠀⠀⠀⠀⠀⠀⠀⠀⢻%RST%
echo %PINK%⠀⠀⠀⠀⠀⠀⢸⠀⢠⠇⠀⠈⢇⡷⣺⢿⠏⡞⠑⠚⠉⢀⠀⢠⠁⣠⣿⣿⣻⣟⡟⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢿%RST%
echo %PINK%⠀⠀⠀⠀⠀⠀⣿⠀⡘⢀⣠⠞⣉⠵⣡⠏⠀⢧⠀⠀⠀⣸⠀⣾⣼⣉⣉⣍⡿⡝⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢸%RST%
echo %PINK%⠀⠀⠀⠀⢀⣴⡿⢠⠏⣉⣵⠞⠁⡰⡃⠀⠀⢘⡤⠴⢒⠇⢠⣿⡀⣉⣴⣿⣿⡁⠀⢰⠀⠀⠀⠀⠀⠀⠀⠀⠀⢹%RST%
echo %PINK%⠀⠀⠀⢀⠎⢸⡇⣸⣾⣿⣿⣀⣴⢱⣇⡤⠚⠁⢀⠀⣼⠄⡿⠋⠉⠁⢸⡛⢿⠑⢤⡌⠀⠀⠀⠀⠀⠀⠀⠀⠀⢸%RST%
echo %PINK%⠀⠀⠀⡞⢀⣎⢧⣟⣿⡿⠋⠀⠀⠉⠁⠀⣠⣾⠟⣸⡟⢸⠁⠀⠀⠀⠸⡇⢸⡄⢸⠃⠀⢀⣠⠤⠤⠤⠔⠢⡀⣸%RST%
echo %PINK%⠀⠀⣸⠀⡸⢸⡟⣶⡿⠁⠀⠀⠀⠀⠀⠀⠉⠀⢠⣿⠀⡞⠀⠀⠀⠀⡇⣿⠸⣿⣾⠀⠀⠀⠙⠒⠒⠲⣌⣠⢌⣻%RST%
echo %PINK%⠀⠀⡏⠀⣇⠞⠁⠉⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⢿⢻⠀⡇⠀⠀⠀⠀⣷⡇⠀⢻⢹⡄⠀⠀⠀⠀⠀⠀⠈⠁⠀⣼%RST%
echo %PINK%⠀⢰⢀⡜⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢸⢸⣞⡄⡇⠀⠀⠀⠀⡿⡇⠀⠸⡆⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀⡟%RST%
echo %PINK%⠀⡞⡞⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣤⣄⠀⢸⢸⠛⠙⠻⠀⠀⠀⠀⢣⡇⠀⠀⡇⢡⠀⠀⠀⠀⠀⡀⠀⠀⠀⡇%RST%
echo %PINK%⠀⢳⠿⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠸⣿⡿⠀⠀⡞⡀⠀⠀⠀⠀⠀⠀⠘⡾⡄⠀⡇⢸⠀⠀⠀⠀⡼⠁⠀⠀⢠⠃%RST%
echo %PINK%⢸⢸⠀⣾⣿⡆⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢻⣇⠀⠀⠀⠀⠀⠀⠀⠘⣿⣆⡇⡆⠀⠀⣀⡜⠁⠀⠀⠀⢸⡆%RST%
echo.
echo %PINK%  [SOLVEX SHIELD] >> Anti-Tab-Switching & Audio Keep-Alive Active... [FRAME 05/07]%RST%
pathping -h 1 -p 650 -q 1 127.0.0.1 >nul 2>&1

:: ============================================================================
:: ASCII ARTWORK SHOWCASE #7 — APEX SOVEREIGN
:: ============================================================================
cls
echo %GREEN%  ╔══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗%RST%
echo %GREEN%  ║%RST% %BOLD%%RED%PRODIGY%RST% %MUTED%[BRAND]%RST%  %GOLD%×%RST%  %BOLD%%CYAN%SOLVEX v4.0%RST% %MUTED%[PRODUCT]%RST%   %DIM%│%RST%   %GREEN%ASCII CINEMA SEQUENCE [06 / 07] : APEX AUTONOMY%RST%                   %GREEN%║%RST%
echo %GREEN%  ╚══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╝%RST%
echo %GREEN%⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠀⠀⠈⠟⠛⠉⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠉⠛⠿⠿⠿⠿⠛⠋⠁⡀⢸%RST%
echo %GREEN%⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡀⠠⢀⠐⡠⡀⢈⡄⡂⠥⢌⠤⡐⡔⡐⢢⠒⡰⡀⢿%RST%
echo %GREEN%⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣀⢂⡐⢠⡁⠆⡄⠊⢖⡡⠙⣤⢓⡐⠴⣉⢎⡒⠥⢱⠈⡴⢡⡙⢤⢂⣿%RST%
echo %GREEN%⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⠀⠀⠈⡄⡑⢤⠈⢢⠐⡕⠌⠦⣘⠡⢎⡱⢄⣊⠦⠐⢕⣢⠨⡕⡴⣩⠪⢖⣑⢨⠊⡼⡑⣸⣿%RST%
echo %GREEN%⡷⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⠀⠠⢂⡐⢅⠎⡪⠂⣧⠘⡪⣢⢕⠄⠢⠈⠙⢖⣡⠫⡜⠬⡒⢵⡙⡮⣢⢱⠄⢮⡺⣔⣝⠦⣪⠒⣕⢱⢁⣿⣿%RST%
echo %GREEN%⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠄⣀⠢⢢⡘⣑⠴⠨⠪⢆⢑⠁⠘⢁⡀⠀⣀⣀⣄⡀⠠⣤⡀⠴⢒⡇⡽⢪⡱⣗⢭⡫⣆⢹⣕⣮⡪⣗⢕⡇⣺⡊⢼⣿⣿%RST%
echo %GREEN%⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠠⢀⡔⢨⠑⠥⢢⡉⢖⠔⡨⠨⣓⢌⡬⡪⣃⠸⣿⣿⣦⡑⢼⡢⡻⣄⡘⣿⣷⣦⣉⠛⠵⢿⣬⣳⢟⣵⠸⣣⣟⢝⣮⡫⣇⢹⠤⣿⣿⣿%RST%
echo %GREEN%⠀⠀⠀⠀⠀⠀⠀⠀⠠⠀⢀⠀⢂⡡⢘⠔⣣⠘⡠⠋⡲⢅⡴⡩⣎⢝⢅⡣⡸⢆⢝⡼⡂⢿⣿⣿⣿⣦⡙⠗⣋⣁⡌⢹⣿⣿⣿⣷⣶⣬⣉⣋⠛⢘⢏⣯⡻⣝⣝⢯⠼⢱⢿⣿⣿%RST%
echo %GREEN%⠀⠀⠀⠀⠀⠀⡀⠂⢌⠐⡤⢈⣓⢜⡠⢏⡤⠋⠀⣜⢡⢣⢞⣜⢬⡣⡳⣌⢗⠮⡳⣝⢞⠘⣿⣿⣟⣽⣿⣦⣝⠫⡿⣢⠙⠿⣛⣭⣿⣿⠟⠁⠞⠨⠙⢉⢜⡿⡫⣿⠁⣾⣿⣿⣿%RST%
echo %GREEN%⠀⠀⠀⠀⠀⠀⢌⡰⠢⣍⢚⠠⢎⡳⢆⠈⠀⡤⢦⢱⣋⢞⡺⡴⣯⣙⢾⡱⣎⢳⠘⣯⡳⣧⠸⣿⣿⣿⣿⣿⠿⢗⣨⣄⡒⠌⠛⠛⠉⠀⢀⣤⣤⢀⣠⡿⣻⣿⢞⡿⢠⢿⣿⣿⣷%RST%
echo %GREEN%⠀⠀⠀⠀⠀⢐⡦⠙⣜⠬⡹⢰⠨⠏⡠⡄⢹⣕⣫⠖⣭⡶⣹⢽⣺⡽⣟⣿⢞⣶⠱⡈⢿⣿⣧⡹⣿⣟⣫⡶⠟⠛⠋⠁⢀⣀⣠⡤⠀⢀⣾⣿⣷⠐⣿⣿⢾⡷⣷⢣⢏⣾⣿⣿⣿%RST%
echo %GREEN%⠀⠀⠀⠀⠀⢨⢒⠩⡔⣪⢹⡀⠀⣾⣱⢯⠀⠣⠗⣻⡈⢚⣱⢳⣽⣻⢾⣳⣿⣾⣧⡐⠘⢿⣿⣦⡙⣷⡖⢀⣠⣤⣀⠢⠙⠛⠭⠕⣡⣾⣿⣿⣿⢨⣿⠼⣷⣿⢊⠎⣼⣿⣿⣿⣿%RST%
echo %GREEN%⣤⣴⣶⣶⣶⠈⡖⡥⣚⢖⡻⡄⠸⣮⡽⣺⡆⢦⠹⣷⣳⡈⠻⣯⢾⣷⣿⣿⣾⣿⣽⣿⣦⠀⠻⣿⣷⣄⢶⣿⣿⣿⣿⣿⣶⣒⣦⣽⣿⣿⢿⣿⡟⢀⢻⣇⠺⠃⣠⢄⣿⣿⣿⣿⣿%RST%
echo %GREEN%⣿⣿⣿⣿⣿⠈⣧⢣⢸⠾⣭⢧⢸⡗⣿⡼⡇⢸⣷⠈⢛⣣⡀⡌⠩⠬⣻⣷⣿⣿⣿⣿⣿⣷⣄⢢⣙⠿⣦⡻⢿⣿⣿⣿⣿⣿⡿⣿⣇⣿⡎⣿⡇⣾⡘⣿⠄⡸⣯⣌⡓⡿⢿⠻⡗%RST%
echo %GREEN%⣿⣿⣿⣿⣿⠀⣟⢮⡜⣖⡻⣼⡘⣷⣫⢷⠇⠺⠿⠶⠘⠋⠁⠁⠀⠀⠉⠛⢻⣿⣿⣿⣿⣿⣿⣮⠻⣶⡏⣥⣬⣽⣏⣿⣿⢹⣧⢿⣿⢹⣷⢿⢁⣽⣷⠛⠀⣇⣻⣽⣷⣷⡾⣲⣷%RST%
echo %GREEN%⣿⣿⡿⣻⣿⡇⣻⣯⡖⠸⣷⣻⣇⢹⣿⠻⠃⠉⠀⢠⣤⣀⠀⠄⠘⢛⣂⢀⡙⠿⣿⣿⣿⣿⣿⣿⣷⣬⠃⣿⣧⢿⣿⢸⣿⢸⣿⡘⣿⡎⣿⢂⣾⡿⢋⣾⢸⣿⢏⣿⣿⣻⣽⢿⡽%RST%
echo %GREEN%⣛⣛⠱⢿⣿⣇⢸⣿⡧⢩⣟⣽⡿⡄⢶⣦⠠⣶⣀⠨⣟⣿⣿⣦⡀⢄⠓⣯⣿⣷⣮⣭⠛⠿⢿⣿⣿⣿⡗⣬⣛⠸⣿⡜⣿⣇⣿⣧⢻⣷⠉⢞⣡⠼⣿⡇⣾⣿⣾⣿⣿⣿⣿⠏⣴%RST%
echo %GREEN%⣿⣿⠿⢢⣿⣿⡀⣿⣿⠄⡌⣷⣿⣷⠘⡇⣈⢻⡿⣦⡘⢿⣿⣿⣿⣶⣄⣙⡻⣿⣿⢱⡇⣿⣶⣶⣭⣭⣭⣭⣭⣥⣤⣅⣿⣿⣿⣿⣎⣥⣶⣿⣿⡟⣿⢱⣿⣿⣿⣿⣿⠟⣥⢞⣻%RST%
echo %GREEN%⣋⣥⣾⣿⣿⣿⣇⠸⣷⣷⠸⣞⣷⣿⣧⠀⣿⡆⠹⣷⣟⣆⠹⡿⣿⢹⣿⢻⣿⣿⣿⣀⣾⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠄⢂⣿⣿⣿⡿⢋⡁⢸⣟⢾⣻%RST%
echo %GREEN%⣿⣿⣿⣿⣿⣿⣿⡌⢿⣾⣧⠹⣾⣾⣿⣧⠸⡏⣤⠹⣻⡾⣇⠁⣿⡞⣿⣸⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡿⢣⣾⠿⣋⡅⣰⡟⠀⣸⢧⣿⣿%RST%
echo %GREEN%⣭⡿⠍⣿⣿⣿⣿⣷⡘⣿⣯⣦⡙⣿⣏⢻⣧⡁⣿⣧⠹⣿⣽⣧⠹⣷⢹⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡿⣿⠿⠋⣐⣫⣵⡾⣫⣾⡟⢀⠁⡿⢮⣮⣵%RST%
echo %GREEN%⣧⣶⣶⣶⡖⣿⠻⣿⣷⡘⣷⣿⣧⣘⠿⣷⡙⢷⡘⢿⡆⢻⡷⣯⣦⠘⢿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣟⠿⠿⠿⠟⣋⣤⣆⠦⠍⣻⣿⣷⣶⣿⣿⣿⡿⢋⣾⣿⠋⠐⠄⣨⡿⣕⣵⣮%RST%
echo %GREEN%⠉⣿⣿⣿⣿⢹⠀⢻⣿⣷⡸⣻⣿⣿⣷⡈⠿⢶⡽⣦⡛⠘⣿⣷⣟⣇⢢⡙⢿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣶⣦⣴⣶⣶⣶⣾⣿⣿⣿⣿⣿⠟⢉⣴⣿⠟⠁⢠⠪⢀⣵⢽⡮⣮⣵%RST%
echo %GREEN%⠀⣿⣿⣿⣿⠀⣇⠘⣿⣿⣷⡌⢻⢿⣿⣿⣌⠲⢠⣤⣭⡀⢈⣛⣨⣼⣺⣿⣦⡌⠙⠻⠿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡿⠋⢁⣴⣿⡿⠋⢠⠊⣄⠁⡞⡩⡾⣝⢷⡮%RST%
echo %GREEN%⠀⢸⡿⠋⣠⣤⠘⣶⣿⣿⣿⣿⣦⡘⢻⣿⣿⣷⣄⢿⣿⣷⠘⣿⢽⣳⡇⣟⣽⣿⠀⡐⢄⠀⠀⠉⠉⠛⠛⠿⢿⣿⣿⣿⣿⣿⠟⠉⠀⠀⠀⠉⠛⠁⡈⠆⠡⠀⡸⢁⡟⣵⢫⣏⣼%RST%
echo %GREEN%⡆⠀⣠⣾⣿⠟⢋⣿⣿⣿⣿⣿⣿⣿⣦⣝⠿⣿⣿⣷⣍⠻⠄⣿⢫⡷⡇⣿⣾⠼⠆⠐⢢⢀⠀⠀⠀⠀⠀⠀⠀⠀⠉⠉⠉⠀⠀⠀⠀⠀⠀⠀⠀⠀⠄⠀⠀⢠⢃⡟⢜⠦⡫⠲⡜%RST%
echo %GREEN%⣷⠀⢹⠟⠁⣠⡟⢉⡀⠐⣿⣿⣿⣿⣿⣿⣷⣮⣭⣛⣛⠿⠦⠬⠍⢋⡡⡷⡯⣿⠂⠀⠡⡂⢄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠒⣈⠔⡐⠠⢃⠎⡰⡩⣚⢍⢗⡩%RST%
echo %GREEN%⣿⣧⢀⣤⣾⣿⣷⠟⠁⢀⣴⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠇⣞⣻⠇⡗⣿⢿⣽⠀⢉⠄⠐⡡⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠄⡡⢀⢎⠔⡡⣑⢎⢌⡱⡃⠜%RST%
echo.
echo %GREEN%  [PRODIGY // SOLVEX] >> All Autonomous Modules Verified & Ready for Deployment! [FRAME 07/07]%RST%
pathping -h 1 -p 650 -q 1 127.0.0.1 >nul 2>&1

:: ============================================================================
:: EXTENSION REPOSITORY RESOLUTION & FILE INTEGRITY CHECK
:: ============================================================================
set "REPO_DIR=%~dp0"
if "%REPO_DIR:~-1%"=="\" set "REPO_DIR=%REPO_DIR:~0,-1%"
set "EXT_DIR=%REPO_DIR%"

if not exist "%EXT_DIR%\manifest.json" (
  if exist "%REPO_DIR%\prodigy-solvex-v4.0.zip" (
    set "EXT_DIR=%REPO_DIR%\prodigy-solvex-v4.0"
    if not exist "!EXT_DIR!\manifest.json" (
      echo %CYAN%  [INSTALLER] Extracting prodigy-solvex-v4.0.zip into !EXT_DIR!...%RST%
      powershell -NoProfile -Command "Expand-Archive -Path '%REPO_DIR%\prodigy-solvex-v4.0.zip' -DestinationPath '!EXT_DIR!' -Force" >nul 2>&1
    )
  )
)

:: Copy extension directory path to Windows Clipboard automatically
echo|set /p="%EXT_DIR%"|clip >nul 2>&1

:COMMAND_CENTER
cls
echo.
echo %RED%  ╔══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗%RST%
echo %RED%  ║%RST% %BOLD%%GOLD%⚡ PRODIGY%RST% %MUTED%[BRAND]%RST%  %RED%//%RST%  %BOLD%%CYAN%SOLVEX v4.0%RST% %MUTED%[PRODUCT]%RST%  —  %GREEN%OFFICIAL REPOSITORY INSTALLER ^& LAUNCHPAD%RST%                        %RED%║%RST%
echo %RED%  ╚══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╝%RST%
echo.
echo %WHITE%  Repository Extension Path (Auto-Copied to Clipboard):%RST%
echo %CYAN%  ^> %EXT_DIR%%RST%
echo.
echo %MUTED%  ┌─── VERIFIED SOLVEX v4.0 MODULES ──────────────────────────────────────────────────────────────────────────────────────┐%RST%
for %%f in (manifest.json background.js content.js content.css page_protection.js popup.html popup.js dashboard.html) do (
  if exist "%EXT_DIR%\%%f" (
    echo %MUTED%  │%RST%  %GREEN%[✓] %%f%RST%
  ) else (
    echo %MUTED%  │%RST%  %RED%[!] %%f (Missing - run this script inside the extracted repo folder)%RST%
  )
)
echo %MUTED%  └───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘%RST%
echo.
echo %GOLD%  ╔═══ SELECT INSTALLATION / LAUNCH ACTION ═══════════════════════════════════════════════════════════════════════════════╗%RST%
echo %GOLD%  ║%RST%                                                                                                                       %GOLD%║%RST%
echo %GOLD%  ║%RST%   %GREEN%[1]%RST% %BOLD%%WHITE%Auto-Launch Chrome / Edge / Brave with SOLVEX Pre-Loaded%RST% %MUTED%(--load-extension + opens StepTest)%RST%            %GOLD%║%RST%
echo %GOLD%  ║%RST%   %CYAN%[2]%RST% %BOLD%%WHITE%Open chrome://extensions ^& Copy Path for 'Load unpacked'%RST% %MUTED%(Path is already in your clipboard!)%RST%         %GOLD%║%RST%
echo %GOLD%  ║%RST%   %PINK%[3]%RST% %BOLD%%WHITE%Create Desktop Shortcut ('PRODIGY SOLVEX Launcher')%RST%                                                        %GOLD%║%RST%
echo %GOLD%  ║%RST%   %VIOLET%[4]%RST% %BOLD%%WHITE%Replay PRODIGY x SOLVEX ASCII Art Cinema Showcase%RST%                                                          %GOLD%║%RST%
echo %GOLD%  ║%RST%   %RED%[5]%RST% %BOLD%%WHITE%Exit Installer%RST%                                                                                             %GOLD%║%RST%
echo %GOLD%  ║%RST%                                                                                                                       %GOLD%║%RST%
echo %GOLD%  ╚═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╝%RST%
echo.
set /p "USER_CHOICE=%BOLD%%GOLD%  PRODIGY // SOLVEX > Select Option [1-5] (Default=1): %RST%"
if "%USER_CHOICE%"=="" set "USER_CHOICE=1"

if "%USER_CHOICE%"=="1" goto :ACTION_AUTO_LAUNCH
if "%USER_CHOICE%"=="2" goto :ACTION_OPEN_EXTENSIONS
if "%USER_CHOICE%"=="3" goto :ACTION_CREATE_SHORTCUT
if "%USER_CHOICE%"=="4" goto :CINEMA_START
if "%USER_CHOICE%"=="5" goto :EOF
goto :ACTION_AUTO_LAUNCH

:ACTION_AUTO_LAUNCH
echo.
echo %GREEN%  [PRODIGY LAUNCHER] Detecting Chromium Browser...%RST%
echo|set /p="%EXT_DIR%"|clip >nul 2>&1

set "BROWSER_EXE="
if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" set "BROWSER_EXE=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
if "%BROWSER_EXE%"=="" if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" set "BROWSER_EXE=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
if "%BROWSER_EXE%"=="" if exist "%LocalAppData%\Google\Chrome\Application\chrome.exe" set "BROWSER_EXE=%LocalAppData%\Google\Chrome\Application\chrome.exe"
if "%BROWSER_EXE%"=="" if exist "%ProgramFiles%\BraveSoftware\Brave-Browser\Application\brave.exe" set "BROWSER_EXE=%ProgramFiles%\BraveSoftware\Brave-Browser\Application\brave.exe"
if "%BROWSER_EXE%"=="" if exist "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" set "BROWSER_EXE=%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"

if not "%BROWSER_EXE%"=="" (
  echo %CYAN%  [✓] Found Browser: %BROWSER_EXE%%RST%
  echo %GREEN%  [✓] Launching with SOLVEX v4.0 loaded (--load-extension)...%RST%
  start "" "%BROWSER_EXE%" --load-extension="%EXT_DIR%" "chrome://extensions" "https://english.steptest.in"
) else (
  echo %GOLD%  [!] Standard Chrome path not detected. Opening default browser...%RST%
  start "" "https://english.steptest.in"
)
echo.
echo %GOLD%  ╔═══ QUICK MANUAL STEP (IF CHROME WAS ALREADY OPEN) ════════════════════════════════════════════════════════════════════╗%RST%
echo %GOLD%  ║%RST%  1. In %CYAN%chrome://extensions%RST%, turn ON %GREEN%Developer mode%RST% (top-right toggle).                                              %GOLD%║%RST%
echo %GOLD%  ║%RST%  2. Click %GREEN%Load unpacked%RST% (top-left button).                                                                          %GOLD%║%RST%
echo %GOLD%  ║%RST%  3. Press %BOLD%%GOLD%Ctrl+V%RST% in the folder bar and hit %GREEN%Enter%RST% — the repo path is already copied to your clipboard!              %GOLD%║%RST%
echo %GOLD%  ╚═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╝%RST%
echo.
pause
goto :COMMAND_CENTER

:ACTION_OPEN_EXTENSIONS
echo.
echo|set /p="%EXT_DIR%"|clip >nul 2>&1
echo %GREEN%  [✓] Copied Extension Path to Clipboard:%RST% %CYAN%%EXT_DIR%%RST%
echo %GREEN%  [✓] Opening Extension Folder in Explorer ^& Launching Browser...%RST%
explorer "%EXT_DIR%"
start "" "https://english.steptest.in"
echo.
echo %GOLD%  ^> In your browser, open %CYAN%chrome://extensions%RST%, enable %GREEN%Developer mode%RST%, click %GREEN%Load unpacked%RST%, and press %BOLD%Ctrl+V%RST%!
echo.
pause
goto :COMMAND_CENTER

:ACTION_CREATE_SHORTCUT
echo.
echo %CYAN%  [PRODIGY INSTALLER] Creating Desktop Shortcut 'PRODIGY SOLVEX.lnk'...%RST%
powershell -NoProfile -Command "$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut([Environment]::GetFolderPath('Desktop') + '\PRODIGY SOLVEX.lnk'); $s.TargetPath = '%~f0'; $s.WorkingDirectory = '%REPO_DIR%'; $s.Description = 'PRODIGY // SOLVEX v4.0 Launcher'; $s.Save()" >nul 2>&1
echo %GREEN%  [✓] Desktop Shortcut 'PRODIGY SOLVEX.lnk' created on your Desktop!%RST%
echo.
pause
goto :COMMAND_CENTER
