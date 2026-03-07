# 🚪 services/gateway — API Gateway

## Mục đích

Điểm vào duy nhất cho tất cả API requests từ Frontend.

## Chức năng

| Feature | Mô tả |
|---------|--------|
| **JWT Validation** | Verify HS256 Bearer token trước khi forward (OAuth2 Resource Server) |
| **RBAC Headers** | Inject `X-User-Id`, `X-User-Email`, `X-User-Roles` cho downstream |
| **Correlation ID** | Tạo/preserve `X-Correlation-Id` xuyên suốt request chain |
| **Routing** | Định tuyến đến đúng microservice |
| **Public Routes** | `/auth/**`, `/actuator/health` — không cần JWT |

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
| `/auth/**` | auth-service | 8081 |
| `/courses/**` | course-service | 8082 |
| `/content/**` | content-service | 8083 |
| `/progress/**` | progress-service | 8084 |
| `/assessments/**` | assessment-service | 8085 |
| `/ai/**` | ai-tutor-service | 8086 |

## Security

- **Public**: `/auth/**`, `/actuator/health`, `/actuator/info`
- **Protected**: tất cả routes khác → cần `Authorization: Bearer <JWT>`
- JWT algo: **HS256** (shared secret qua `JWT_SECRET` env var)

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
# Set JWT_SECRET
export JWT_SECRET=your-secret-key  # Linux/macOS
$env:JWT_SECRET="your-secret-key"  # Windows PowerShell

cd services/gateway
./mvnw spring-boot:run          # Linux/macOS
mvnw.cmd spring-boot:run        # Windows
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
