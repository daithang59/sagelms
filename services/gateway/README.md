# 🚪 services/gateway — API Gateway

## Mục đích

Điểm vào duy nhất cho tất cả API requests từ Frontend.

## Chức năng

| Feature | Mô tả |
|---------|--------|
| **JWT Validation** | Verify HS256 Bearer token trước khi forward (OAuth2 Resource Server) |
| **RBAC Filter** | Chặn truy cập theo role (vd: `/api/v1/users` chỉ ADMIN) |
| **RBAC Headers** | Inject `X-User-Id`, `X-User-Email`, `X-User-Roles` cho downstream |
| **Correlation ID** | Tạo/preserve `X-Correlation-Id` xuyên suốt request chain |
| **Routing** | Định tuyến đến đúng microservice |
| **CORS** | Allow `http://localhost:5173` (Vite FE) |
| **Error Mapping** | Chuẩn hoá lỗi từ gateway thành JSON format thống nhất |
| **Public Routes** | `/api/v1/auth/**`, `/actuator/health` — không cần JWT |

## Tech Stack

| Công nghệ | Vai trò |
|-----------|---------|
| Spring Cloud Gateway | API Gateway (WebFlux) |
| Spring Security | OAuth2 Resource Server |
| Spring Boot Actuator | Health / info |
| JDK 17 | Runtime |

## Port: `8080`

## Routes

| Path | Downstream | Port |
|------|-----------|------|
| `/api/v1/auth/**` | auth-service | 8081 |
| `/api/v1/users/**` | auth-service | 8081 |
| `/api/v1/courses/**` | course-service | 8082 |
| `/api/v1/content/**` | content-service | 8083 |
| `/api/v1/progress/**` | progress-service | 8084 |
| `/api/v1/assessments/**` | assessment-service | 8085 |
| `/api/v1/ai/**` | ai-tutor-service | 8086 |
| `/api/v1/jobs/**` | worker | 8087 |

## Security

- **Public**: `/api/v1/auth/**`, `/actuator/health`, `/actuator/info`
- **RBAC**: `/api/v1/users/**` → chỉ role `ADMIN`
- **Protected**: tất cả routes khác → cần `Authorization: Bearer <JWT>`
- JWT algo: **HS256** (shared secret qua `JWT_SECRET` env var)

## JWT Claim Spec (chuẩn cho tất cả services)

| Claim | Type | Ví dụ | Mô tả |
|-------|------|-------|-------|
| `sub` | string (UUID) | `550e8400-...` | User ID |
| `email` | string | `student@sagelms.dev` | Email |
| `roles` | string[] | `["STUDENT"]` | Danh sách roles |
| `iss` | string | `sagelms-auth` | Issuer |
| `iat` | number | epoch seconds | Issued at |
| `exp` | number | epoch seconds | Expiration |

## Headers injected cho downstream

```
X-User-Id: <JWT sub claim>
X-User-Email: <JWT email claim>
X-User-Roles: STUDENT,INSTRUCTOR,...
X-Correlation-Id: <UUID>
X-From-Gateway: true
```

## Chạy local

```bash
# Set JWT_SECRET (phải giống auth-service)
export JWT_SECRET=your-secret-key  # Linux/macOS
$env:JWT_SECRET="your-secret-key"  # Windows PowerShell

cd services/gateway
./mvnw spring-boot:run          # Linux/macOS
mvnw.cmd spring-boot:run        # Windows
```

## End-to-End qua Gateway (curl)

```bash
# 1. Register
curl -s -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234!","fullName":"Test User","role":"STUDENT"}'

# 2. Login → lấy accessToken
TOKEN=$(curl -s -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"student@sagelms.dev","password":"Student123!"}' | jq -r '.accessToken')

# 3. Gọi protected route
curl -s http://localhost:8080/api/v1/courses -H "Authorization: Bearer $TOKEN"

# 4. Gọi admin route (sẽ 403 nếu không phải ADMIN)
curl -s http://localhost:8080/api/v1/users -H "Authorization: Bearer $TOKEN"
```

## Health Check

```
GET http://localhost:8080/actuator/health  → {"status":"UP"}
```

## Chạy tests

```bash
./mvnw test     # mvnw.cmd test trên Windows
```

## Owner

@daithang59
