# ============================================================
# SageLMS — Demo: Gateway → Auth Service
# ============================================================
# Prereq: PostgreSQL + Redis running (make up)
#
# Usage:
#   .\scripts\demo\01_gateway_auth.ps1
# ============================================================

Write-Host "===== SageLMS Gateway → Auth Demo =====" -ForegroundColor Cyan
Write-Host ""

# 1. Health checks
Write-Host "[1] Auth Service health:" -ForegroundColor Yellow
try {
    $resp = Invoke-RestMethod -Uri "http://localhost:8081/actuator/health" -Method GET
    Write-Host "    $($resp | ConvertTo-Json -Compress)" -ForegroundColor Green
} catch {
    Write-Host "    FAIL — auth-service not running on :8081" -ForegroundColor Red
    Write-Host "    Run: cd services\auth-service && .\mvnw.cmd spring-boot:run" -ForegroundColor Gray
}

Write-Host ""
Write-Host "[2] Gateway health:" -ForegroundColor Yellow
try {
    $resp = Invoke-RestMethod -Uri "http://localhost:8080/actuator/health" -Method GET
    Write-Host "    $($resp | ConvertTo-Json -Compress)" -ForegroundColor Green
} catch {
    Write-Host "    FAIL — gateway not running on :8080" -ForegroundColor Red
    Write-Host "    Run: cd services\gateway && .\mvnw.cmd spring-boot:run" -ForegroundColor Gray
}

Write-Host ""

# 2. End-to-end: Gateway → Auth
Write-Host "[3] Gateway -> Auth /ping:" -ForegroundColor Yellow
try {
    $resp = Invoke-WebRequest -Uri "http://localhost:8080/auth/ping" -Method GET
    Write-Host "    Status: $($resp.StatusCode)  Body: $($resp.Content)" -ForegroundColor Green
} catch {
    Write-Host "    FAIL — check both gateway (:8080) and auth-service (:8081) are running" -ForegroundColor Red
}

Write-Host ""
Write-Host "===== Demo Complete =====" -ForegroundColor Cyan
