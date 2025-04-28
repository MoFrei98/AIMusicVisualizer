@echo off
REM Standardwerte für die Parameter setzen
set "install_libs=false"
set "no_browser=false"

REM Parameter prüfen und setzen
for %%A in (%*) do (
    if "%%A"=="--install_libs" set "install_libs=true"
    if "%%A"=="--no_browser" set "no_browser=true"
)

REM Paketmanager updaten, wenn install_libs=true
if "%install_libs%"=="true" (
    echo Updating pip...
    python.exe -m pip install --upgrade pip

    echo Installing Python libraries...
    pip install -r libs.txt
)

REM Backend-Server starten
if "%no_browser%"=="false" (
    start http://localhost:5000
)
python server.py