@echo off
title Apex Banking - Spring Boot Backend (Port 8989)
color 0B
echo ========================================================
echo  Apex National Bank - Spring Boot Backend
echo  Port: 8989
echo  Swagger UI: http://localhost:8989/swagger-ui/index.html
echo ========================================================
echo.

cd /d "%~dp0backend"

:: Automatically ensure JAVA_HOME is set
if not defined JAVA_HOME (
    if exist "C:\Program Files\Eclipse Adoptium\jdk-17.0.20.101-hotspot" (
        set "JAVA_HOME=C:\Program Files\Eclipse Adoptium\jdk-17.0.20.101-hotspot"
    )
)
if defined JAVA_HOME (
    set "PATH=%JAVA_HOME%\bin;%PATH%"
    echo [OK] Using Java at: %JAVA_HOME%
)

:: Automatically connect to TiDB Cloud if local DB is not specified
if not defined SPRING_DATASOURCE_URL (
    set "SPRING_DATASOURCE_URL=jdbc:mysql://gateway01.ap-northeast-1.prod.aws.tidbcloud.com:4000/enterprise_bank_db?sslMode=VERIFY_IDENTITY&enabledTLSProtocols=TLSv1.2,TLSv1.3"
    set "SPRING_DATASOURCE_USERNAME=HVtbf3tQkyxXK4C.root"
    set "SPRING_DATASOURCE_PASSWORD=LACrrRIQSQxK1tDU"
    echo [OK] Configured TiDB Cloud Serverless database connection.
)

:: Free port 8989 if already occupied by an old process
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8989 ^| findstr LISTENING 2^>nul') do (
    echo [INFO] Releasing port 8989 from previous process %%a...
    taskkill /F /PID %%a >nul 2>&1
)

:: Launch Spring Boot using bundled Maven or system Maven
set "MVN_CMD=C:\Users\Sumanth Puli\.gemini\antigravity\scratch\mvn\apache-maven-3.9.6\bin\mvn.cmd"
if exist "%MVN_CMD%" (
    echo [INFO] Starting Spring Boot with Maven...
    call "%MVN_CMD%" spring-boot:run
) else (
    echo [INFO] Starting Spring Boot with system Maven...
    call mvn spring-boot:run
)

echo.
echo [SERVER STOPPED]
pause
