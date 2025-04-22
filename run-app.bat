@echo off
REM Installiere die Python-Bibliotheken aus libs.txt
echo Installing Python libraries...
pip install -r libs.txt

REM Starte den Backend-Server
echo Starting the backend server...
start cmd /k "python server.py"

REM Öffne die URL im Standardbrowser
echo Opening the browser...
start "" "http://localhost:63342/AIMusicVisualizer/index.html?_ijt=lc4e81q9qlsetl6q2ga51nll86"

REM Fertig
echo Done.