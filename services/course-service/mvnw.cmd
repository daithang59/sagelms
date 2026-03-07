@REM Maven Wrapper script for Windows — downloads Maven automatically
@REM Based on Apache Maven Wrapper 3.x

@echo off
setlocal enabledelayedexpansion

set "WRAPPER_DIR=%~dp0"
set "PROPERTIES_FILE=%WRAPPER_DIR%.mvn\wrapper\maven-wrapper.properties"

@REM Read distributionUrl from properties
for /f "tokens=1,* delims==" %%a in ('findstr "^distributionUrl" "%PROPERTIES_FILE%"') do set "DIST_URL=%%b"

@REM Derive Maven home directory
for %%i in ("%DIST_URL%") do set "DIST_FILENAME=%%~ni"
set "MAVEN_HOME=%USERPROFILE%\.m2\wrapper\dists\%DIST_FILENAME%"

@REM Download Maven if not present
if not exist "%MAVEN_HOME%\bin\mvn.cmd" (
    @REM Check if already extracted
    dir /b /s "%MAVEN_HOME%\bin\mvn.cmd" >nul 2>&1
    if errorlevel 1 (
        echo Downloading Maven: %DIST_URL%
        if not exist "%MAVEN_HOME%" mkdir "%MAVEN_HOME%"
        set "TMP_ZIP=%MAVEN_HOME%\maven.zip"
        powershell -Command "Invoke-WebRequest -Uri '%DIST_URL%' -OutFile '!TMP_ZIP!'"
        powershell -Command "Expand-Archive -Path '!TMP_ZIP!' -DestinationPath '%MAVEN_HOME%' -Force"
        if exist "!TMP_ZIP!" del "!TMP_ZIP!"
    )
)

@REM Find mvn.cmd recursively
set "MVN_CMD="
for /r "%MAVEN_HOME%" %%f in (mvn.cmd) do (
    if exist "%%f" (
        set "MVN_CMD=%%f"
        goto :found
    )
)

:found
if not defined MVN_CMD (
    echo ERROR: Could not find mvn.cmd in %MAVEN_HOME%
    exit /b 1
)

"%MVN_CMD%" %*
