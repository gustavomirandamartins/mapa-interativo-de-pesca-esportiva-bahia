@echo off
REM Duplo-clique aqui para rodar o mapa localmente no Windows, sem instalar nada.
REM Abre o servidor (scripts\serve-windows.ps1) e o navegador sozinho em seguida.
REM Deixe a janela preta aberta enquanto estiver usando o mapa; feche-a para encerrar.

title Mapa Pesca Esportiva na Bahia - servidor local
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0serve-windows.ps1"
pause
