@REM Maven Wrapper script for Windows
@REM Downloads Maven if not present
@echo off
setlocal

set "WRAPPER_PROPERTIES=%~dp0.mvn\wrapper\maven-wrapper.properties"

if not exist "%WRAPPER_PROPERTIES%" (
    echo Error: Could not find .mvn\wrapper\maven-wrapper.properties >&2
    exit /b 1
)

for /f "tokens=1,* delims==" %%a in ('findstr "distributionUrl" "%WRAPPER_PROPERTIES%"') do set "DIST_URL=%%b"

set "MAVEN_HOME=%USERPROFILE%\.m2\wrapper\dists"

where mvn >nul 2>nul
if %ERRORLEVEL% equ 0 (
    mvn %*
) else (
    echo Maven not found. Please install Maven or run: mvn -N wrapper:wrapper
    echo Download Maven from: %DIST_URL%
    exit /b 1
)
