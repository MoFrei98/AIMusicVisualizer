@echo off
REM Installiere die Python-Bibliotheken aus libs.txt
echo Installing Python libraries...
pip install -r libs.txt

REM Starte den Backend-Server
start http://localhost:5000
python server.py