# ============================================================
# SageLMS - Demo: Gateway + Auth End-to-End
# ============================================================
# Prereq: PostgreSQL running (docker compose up -d)
#         Auth-service + Gateway running
#
# Usage:
#   .\scripts\demo\01_gateway_auth.ps1
# ============================================================

$GW = "http://localhost:8080"

Write-Host "===== SageLMS Gateway + Auth End-to-End Demo =====" -ForegroundColor Cyan
Write-Host ""

# --- 1. Health checks ---
Write-Host "[1] Auth Service health:" -ForegroundColor Yellow
try {
    $resp = Invoke-RestMethod -Uri "http://localhost:8081/actuator/health" -Method GET
    Write-Host "    $($resp | ConvertTo-Json -Compress)" -ForegroundColor Green
} catch {
    Write-Host "    FAIL - auth-service not running on :8081" -ForegroundColor Red
    Write-Host "    Run: cd services\auth-service; .\mvnw.cmd spring-boot:run" -ForegroundColor Gray
    exit 1
}

Write-Host ""
Write-Host "[2] Gateway health:" -ForegroundColor Yellow
try {
    $resp = Invoke-RestMethod -Uri "$GW/actuator/health" -Method GET
    Write-Host "    $($resp | ConvertTo-Json -Compress)" -ForegroundColor Green
} catch {
    Write-Host "    FAIL - gateway not running on :8080" -ForegroundColor Red
    Write-Host "    Run: cd services\gateway; .\mvnw.cmd spring-boot:run" -ForegroundColor Gray
    exit 1
}

# --- 2. Register a new student ---
Write-Host ""
Write-Host "[3] Register student via gateway:" -ForegroundColor Yellow
$registerBody = @{
    email    = "demo-student@sagelms.dev"
    password = "DemoPass123!"
    fullName = "Demo Student"
    role     = "STUDENT"
} | ConvertTo-Json

try {
    $resp = Invoke-RestMethod -Uri "$GW/api/v1/auth/register" -Method POST `
        -ContentType "application/json" -Body $registerBody
    Write-Host "    User: $($resp.user.email)  Role: $($resp.user.role)" -ForegroundColor Green
    Write-Host "    AccessToken: $($resp.accessToken.Substring(0,40))..." -ForegroundColor DarkGray
} catch {
    $code = $_.Exception.Response.StatusCode.value__
    if ($code -eq 409) {
        Write-Host "    Email already exists (OK for re-run)" -ForegroundColor DarkYellow
    } else {
        Write-Host "    FAIL ($code): $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
}

# --- 3. Login with seeded student ---
Write-Host ""
Write-Host "[4] Login as seeded student (student@sagelms.dev):" -ForegroundColor Yellow
$loginBody = @{
    email    = "student@sagelms.dev"
    password = "Student123!"
} | ConvertTo-Json

try {
    $loginResp = Invoke-RestMethod -Uri "$GW/api/v1/auth/login" -Method POST `
        -ContentType "application/json" -Body $loginBody
    $TOKEN = $loginResp.accessToken
    Write-Host "    OK - user: $($loginResp.user.email)  role: $($loginResp.user.role)" -ForegroundColor Green
    Write-Host "    AccessToken: $($TOKEN.Substring(0,40))..." -ForegroundColor DarkGray
} catch {
    Write-Host "    FAIL: $($_.ErrorDetails.Message)" -ForegroundColor Red
    exit 1
}

# --- 4. Call protected endpoint WITHOUT token => 401 ---
Write-Host ""
Write-Host "[5] GET /api/v1/courses WITHOUT token (expect 401):" -ForegroundColor Yellow
try {
    Invoke-RestMethod -Uri "$GW/api/v1/courses" -Method GET
    Write-Host "    UNEXPECTED - got 200 without token" -ForegroundColor Red
} catch {
    $code = $_.Exception.Response.StatusCode.value__
    if ($code -eq 401) {
        Write-Host "    OK - 401 Unauthorized (correct)" -ForegroundColor Green
    } else {
        Write-Host "    Status: $code" -ForegroundColor Yellow
    }
}

# --- 5. Call protected endpoint WITH token => 200 (or 503) ---
Write-Host ""
Write-Host "[6] GET /api/v1/courses WITH token:" -ForegroundColor Yellow
try {
    $headers = @{ Authorization = "Bearer $TOKEN" }
    $resp = Invoke-WebRequest -Uri "$GW/api/v1/courses" -Method GET -Headers $headers
    Write-Host "    Status: $($resp.StatusCode) - gateway routed successfully" -ForegroundColor Green
} catch {
    $code = $_.Exception.Response.StatusCode.value__
    if ($code -eq 503) {
        Write-Host "    503 - course-service not running (expected, auth passed!)" -ForegroundColor DarkYellow
    } else {
        Write-Host "    Status: $code" -ForegroundColor Yellow
    }
}

# --- 6. RBAC: student => /api/v1/users => 403 ---
Write-Host ""
Write-Host "[7] GET /api/v1/users as STUDENT (expect 403):" -ForegroundColor Yellow
try {
    $headers = @{ Authorization = "Bearer $TOKEN" }
    Invoke-RestMethod -Uri "$GW/api/v1/users" -Method GET -Headers $headers
    Write-Host "    UNEXPECTED - got 200" -ForegroundColor Red
} catch {
    $code = $_.Exception.Response.StatusCode.value__
    if ($code -eq 403) {
        Write-Host "    OK - 403 Forbidden (correct, RBAC works)" -ForegroundColor Green
    } else {
        Write-Host "    Status: $code" -ForegroundColor Yellow
    }
}

# --- 7. RBAC: admin => /api/v1/users => 200 ---
Write-Host ""
Write-Host "[8] Login as admin, then GET /api/v1/users:" -ForegroundColor Yellow
$adminLogin = @{
    email    = "admin@sagelms.dev"
    password = "Admin123!"
} | ConvertTo-Json

try {
    $adminResp = Invoke-RestMethod -Uri "$GW/api/v1/auth/login" -Method POST `
        -ContentType "application/json" -Body $adminLogin
    $ADMIN_TOKEN = $adminResp.accessToken
    Write-Host "    Admin login OK" -ForegroundColor Green

    $headers = @{ Authorization = "Bearer $ADMIN_TOKEN" }
    $usersResp = Invoke-RestMethod -Uri "$GW/api/v1/users" -Method GET -Headers $headers
    Write-Host "    Users: $($usersResp.meta.totalElements) total" -ForegroundColor Green
    foreach ($u in $usersResp.data) {
        Write-Host "      - $($u.email) [$($u.role)]" -ForegroundColor DarkGray
    }
} catch {
    Write-Host "    FAIL: $($_.ErrorDetails.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "===== Demo Complete =====" -ForegroundColor Cyan
