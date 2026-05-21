# ============================================================
# SageLMS - Demo seed data for deployed GKE environment
# ============================================================
# Usage from repo root:
#   .\scripts\demo\02-seed-gke-demo-data.ps1 -BaseUrl http://8.233.61.249
#
# The script uses the auth-service seeded demo accounts:
#   admin@sagelms.dev      / Admin123!
#   instructor@sagelms.dev / Instructor123!
#   student@sagelms.dev    / Student123!
# ============================================================

param(
    [string]$BaseUrl = "http://8.233.61.249"
)

$ErrorActionPreference = "Stop"
$BaseUrl = $BaseUrl.TrimEnd("/")

$CourseTitle = "SageLMS Demo - Cloud Native Java"
$AssessmentTitle = "Kiem tra nhanh DevSecOps tren GKE"
$QuestionSetTitle = "Bai kiem tra nhap mon"
$ChallengeTitle = "SageLMS Demo - DevSecOps Challenge"
$ChallengeQuestionSetTitle = "Thu thach trien khai microservices"

function Write-Step {
    param([string]$Message)
    Write-Host ""
    Write-Host "==> $Message" -ForegroundColor Cyan
}

function ConvertTo-BodyJson {
    param($Body)
    return ($Body | ConvertTo-Json -Depth 30)
}

function Invoke-SageApi {
    param(
        [ValidateSet("GET", "POST", "PUT", "PATCH", "DELETE")]
        [string]$Method,
        [string]$Path,
        [string]$Token,
        $Body = $null
    )

    $headers = @{}
    if ($Token) {
        $headers["Authorization"] = "Bearer $Token"
    }

    $uri = if ($Path -match "^https?://") { $Path } else { "$BaseUrl$Path" }
    $params = @{
        Uri     = $uri
        Method  = $Method
        Headers = $headers
    }

    if ($null -ne $Body) {
        $params["ContentType"] = "application/json"
        $params["Body"] = ConvertTo-BodyJson $Body
    }

    try {
        return Invoke-RestMethod @params
    } catch {
        $status = $null
        if ($_.Exception.Response -and $_.Exception.Response.StatusCode) {
            $status = $_.Exception.Response.StatusCode.value__
        }
        $detail = $_.ErrorDetails.Message
        if (-not $detail) {
            $detail = $_.Exception.Message
        }
        throw "API $Method $uri failed status=$status detail=$detail"
    }
}

function Login-SageUser {
    param(
        [string]$Email,
        [string]$Password
    )

    $response = Invoke-SageApi -Method POST -Path "/api/v1/auth/login" -Body @{
        email = $Email
        password = $Password
    }
    Write-Host "Login OK: $($response.user.email) [$($response.user.role)]" -ForegroundColor Green
    return $response
}

function Find-CourseByTitle {
    param(
        [string]$Title,
        [string]$Token
    )

    $encoded = [uri]::EscapeDataString($Title)
    $result = Invoke-SageApi -Method GET -Path "/api/v1/courses?search=$encoded&size=50" -Token $Token
    return @($result.content) | Where-Object { $_.title -eq $Title } | Select-Object -First 1
}

function Find-ChallengeByTitle {
    param(
        [string]$Title,
        [string]$Token
    )

    $encoded = [uri]::EscapeDataString($Title)
    $result = Invoke-SageApi -Method GET -Path "/api/v1/challenges?search=$encoded&size=50" -Token $Token
    return @($result.content) | Where-Object { $_.title -eq $Title } | Select-Object -First 1
}

function Find-ByTitle {
    param(
        $Items,
        [string]$Title
    )
    return @($Items) | Where-Object { $_.title -eq $Title } | Select-Object -First 1
}

Write-Host "SageLMS GKE demo seed target: $BaseUrl" -ForegroundColor Cyan

Write-Step "Login demo accounts"
$admin = Login-SageUser -Email "admin@sagelms.dev" -Password "Admin123!"
$instructor = Login-SageUser -Email "instructor@sagelms.dev" -Password "Instructor123!"
$student = Login-SageUser -Email "student@sagelms.dev" -Password "Student123!"

$adminToken = $admin.accessToken
$instructorToken = $instructor.accessToken
$studentToken = $student.accessToken

Write-Step "Update instructor profile for course cards"
$profileBody = @{
    email = "instructor@sagelms.dev"
    fullName = "Demo Instructor"
    avatarUrl = $null
    instructorHeadline = "Senior Backend Engineer, Java Instructor"
    instructorBio = "Giang vien demo cho SageLMS, tap trung vao Java, Spring Boot, microservices, Kubernetes va DevSecOps. Ho so nay dung de kiem thu giao dien khoa hoc, dashboard va trang quan ly giang vien."
    instructorExpertise = "Java, Spring Boot, Microservices, Kubernetes, DevSecOps"
    instructorWebsite = "https://sagelms.dev"
    instructorYearsExperience = 6
}
$null = Invoke-SageApi -Method PUT -Path "/api/v1/auth/me" -Token $instructorToken -Body $profileBody
Write-Host "Instructor profile updated" -ForegroundColor Green

Write-Step "Create or reuse published demo course"
$course = Find-CourseByTitle -Title $CourseTitle -Token $instructorToken
if (-not $course) {
    $course = Invoke-SageApi -Method POST -Path "/api/v1/courses" -Token $instructorToken -Body @{
        title = $CourseTitle
        description = "Khoa hoc demo co du lieu mau de kiem thu SageLMS tren GKE: danh sach khoa hoc, chi tiet khoa hoc, bai hoc, ghi danh va bai kiem tra."
        thumbnailUrl = "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80"
        status = "PUBLISHED"
        category = "Cloud Native"
        enrollmentPolicy = "OPEN"
    }
    Write-Host "Created course: $($course.id)" -ForegroundColor Green
} else {
    Write-Host "Reusing course: $($course.id)" -ForegroundColor DarkYellow
}

Write-Step "Create or reuse published lessons"
$lessons = Invoke-SageApi -Method GET -Path "/api/v1/courses/$($course.id)/lessons/manage" -Token $instructorToken

$lessonDefinitions = @(
    @{
        title = "Tong quan kien truc SageLMS tren GKE"
        type = "TEXT"
        sortOrder = 1
        durationMinutes = 12
        textContent = "Bai hoc gioi thieu cach web, gateway va cac microservice SageLMS chay tren GKE, su dung Ingress lam public entrypoint va Artifact Registry lam registry tam thoi."
    },
    @{
        title = "Thiet ke microservices va API Gateway"
        type = "TEXT"
        sortOrder = 2
        durationMinutes = 18
        textContent = "Bai hoc mo ta luong request tu frontend den gateway, JWT, RBAC, user context headers va cach cac service auth/course/content/assessment phoi hop."
    },
    @{
        title = "DevSecOps pipeline va kiem thu trien khai"
        type = "TEXT"
        sortOrder = 3
        durationMinutes = 20
        textContent = "Bai hoc demo cac checkpoint: build image, push registry, apply manifest, rollout status, health check, smoke test va nhung viec can lam tiep nhu HTTPS, DNS va Harbor."
    }
)

foreach ($definition in $lessonDefinitions) {
    $existingLesson = Find-ByTitle -Items $lessons -Title $definition.title
    if ($existingLesson) {
        Write-Host "Reusing lesson: $($existingLesson.title)" -ForegroundColor DarkYellow
        continue
    }

    $createdLesson = Invoke-SageApi -Method POST -Path "/api/v1/courses/$($course.id)/lessons" -Token $instructorToken -Body @{
        title = $definition.title
        type = $definition.type
        contentUrl = $null
        textContent = $definition.textContent
        sortOrder = $definition.sortOrder
        durationMinutes = $definition.durationMinutes
        isPublished = $true
        instructorId = $instructor.user.id
    }
    Write-Host "Created lesson: $($createdLesson.title)" -ForegroundColor Green
}

Write-Step "Create or reuse assessment and question set"
$encodedAssessment = [uri]::EscapeDataString($AssessmentTitle)
$assessmentsPage = Invoke-SageApi -Method GET -Path "/api/v1/courses/$($course.id)/assessments?search=$encodedAssessment&size=20" -Token $instructorToken
$assessment = @($assessmentsPage.content) | Where-Object { $_.title -eq $AssessmentTitle } | Select-Object -First 1

if (-not $assessment) {
    $assessment = Invoke-SageApi -Method POST -Path "/api/v1/courses/$($course.id)/assessments" -Token $instructorToken -Body @{
        title = $AssessmentTitle
        description = "Bai kiem tra demo giup xac nhan flow assessment, question set, nop bai va cham diem."
        thumbnailUrl = $null
        category = "DevSecOps"
        status = "PUBLISHED"
        timeLimitMinutes = 20
        maxAttempts = 5
    }
    Write-Host "Created assessment: $($assessment.id)" -ForegroundColor Green
} else {
    Write-Host "Reusing assessment: $($assessment.id)" -ForegroundColor DarkYellow
}

$questionSets = Invoke-SageApi -Method GET -Path "/api/v1/assessments/$($assessment.id)/question-sets" -Token $instructorToken
$questionSet = Find-ByTitle -Items $questionSets -Title $QuestionSetTitle
if (-not $questionSet) {
    $questionSet = Invoke-SageApi -Method POST -Path "/api/v1/assessments/$($assessment.id)/question-sets" -Token $instructorToken -Body @{
        title = $QuestionSetTitle
        timeLimitMinutes = 15
        sortOrder = 1
        maxAttempts = 5
    }
    Write-Host "Created question set: $($questionSet.id)" -ForegroundColor Green
} else {
    Write-Host "Reusing question set: $($questionSet.id)" -ForegroundColor DarkYellow
}

$questionSetDetail = Invoke-SageApi -Method GET -Path "/api/v1/assessment-question-sets/$($questionSet.id)" -Token $instructorToken
$existingQuestions = @($questionSetDetail.questions)

if (-not (Find-ByTitle -Items $existingQuestions -Title "Ingress cua GKE")) {
    $null = Invoke-SageApi -Method POST -Path "/api/v1/assessment-question-sets/$($questionSet.id)/questions" -Token $instructorToken -Body @{
        title = "Ingress cua GKE"
        prompt = "Thanh phan nao dang nhan public traffic tu Internet truoc khi request vao service web/gateway?"
        type = "MULTIPLE_CHOICE"
        mediaType = "NONE"
        mediaUrl = $null
        points = 5
        sortOrder = 1
        choices = @(
            @{ text = "GKE Ingress / HTTP(S) Load Balancer"; isCorrect = $true; sortOrder = 1 },
            @{ text = "Cloud SQL private endpoint"; isCorrect = $false; sortOrder = 2 },
            @{ text = "Pod auth-service"; isCorrect = $false; sortOrder = 3 },
            @{ text = "ExternalSecret controller"; isCorrect = $false; sortOrder = 4 }
        )
    }
    Write-Host "Created question: Ingress cua GKE" -ForegroundColor Green
}

if (-not (Find-ByTitle -Items $existingQuestions -Title "Registry tam thoi")) {
    $null = Invoke-SageApi -Method POST -Path "/api/v1/assessment-question-sets/$($questionSet.id)/questions" -Token $instructorToken -Body @{
        title = "Registry tam thoi"
        prompt = "Neu Harbor va DNS chua san sang, hay neu 2 ly do Artifact Registry phu hop de lam registry tam thoi cho GKE."
        type = "ESSAY"
        mediaType = "NONE"
        mediaUrl = $null
        points = 5
        sortOrder = 2
        choices = @()
    }
    Write-Host "Created question: Registry tam thoi" -ForegroundColor Green
}

Write-Step "Enroll student into demo course"
$enrollmentCheck = Invoke-SageApi -Method GET -Path "/api/v1/courses/$($course.id)/enroll/check" -Token $studentToken
if ($enrollmentCheck.status -eq "ACTIVE") {
    Write-Host "Student already has ACTIVE enrollment" -ForegroundColor DarkYellow
} else {
    try {
        $enrollment = Invoke-SageApi -Method POST -Path "/api/v1/courses/$($course.id)/enroll" -Token $studentToken
        Write-Host "Student enrolled: $($enrollment.status)" -ForegroundColor Green
    } catch {
        Write-Host "Enrollment not changed: $_" -ForegroundColor DarkYellow
    }
}

Write-Step "Create one graded student attempt if missing"
$gradebook = Invoke-SageApi -Method GET -Path "/api/v1/courses/$($course.id)/assessment-gradebook" -Token $instructorToken
if (@($gradebook).Count -gt 0) {
    Write-Host "Gradebook already has submitted data; skipping attempt creation" -ForegroundColor DarkYellow
} else {
    $attempt = Invoke-SageApi -Method POST -Path "/api/v1/assessment-question-sets/$($questionSet.id)/attempts" -Token $studentToken
    $mcQuestion = @($attempt.questions) | Where-Object { $_.type -eq "MULTIPLE_CHOICE" } | Select-Object -First 1
    $essayQuestion = @($attempt.questions) | Where-Object { $_.type -eq "ESSAY" } | Select-Object -First 1
    $correctChoice = @($mcQuestion.choices) | Where-Object { $_.text -eq "GKE Ingress / HTTP(S) Load Balancer" } | Select-Object -First 1

    $answers = @()
    if ($mcQuestion -and $correctChoice) {
        $answers += @{ questionId = $mcQuestion.id; choiceId = $correctChoice.id; textAnswer = $null; fileName = $null; fileType = $null; fileSize = $null; fileUrl = $null }
    }
    if ($essayQuestion) {
        $answers += @{ questionId = $essayQuestion.id; choiceId = $null; textAnswer = "Artifact Registry phu hop vi GKE pull image noi bo tren Google Cloud de cau hinh IAM nhanh, va co the dung tag tam thoi trong khi Harbor/DNS chua san sang."; fileName = $null; fileType = $null; fileSize = $null; fileUrl = $null }
    }

    $submitted = Invoke-SageApi -Method PUT -Path "/api/v1/assessment-attempts/$($attempt.id)/submit" -Token $studentToken -Body @{ answers = $answers }
    $gradeAnswers = @($submitted.answers) | ForEach-Object { @{ questionId = $_.questionId; isCorrect = $true } }
    $graded = Invoke-SageApi -Method PUT -Path "/api/v1/assessment-attempts/$($attempt.id)/grade" -Token $instructorToken -Body @{ answers = $gradeAnswers }
    Write-Host "Created graded attempt: $($graded.id), score=$($graded.score)/$($graded.maxScore)" -ForegroundColor Green
}

Write-Step "Create or reuse challenge and question set"
$challenge = Find-ChallengeByTitle -Title $ChallengeTitle -Token $instructorToken
if (-not $challenge) {
    $challenge = Invoke-SageApi -Method POST -Path "/api/v1/challenges" -Token $instructorToken -Body @{
        title = $ChallengeTitle
        description = "Thu thach demo giup kiem thu flow challenge, leaderboard, submit va grade tren GKE."
        thumbnailUrl = "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=80"
        category = "DevSecOps"
        status = "PUBLISHED"
        timeLimitMinutes = 30
        maxAttempts = 5
    }
    Write-Host "Created challenge: $($challenge.id)" -ForegroundColor Green
} else {
    Write-Host "Reusing challenge: $($challenge.id)" -ForegroundColor DarkYellow
}

$challengeQuestionSets = Invoke-SageApi -Method GET -Path "/api/v1/challenges/$($challenge.id)/question-sets" -Token $instructorToken
$challengeQuestionSet = Find-ByTitle -Items $challengeQuestionSets -Title $ChallengeQuestionSetTitle
if (-not $challengeQuestionSet) {
    $challengeQuestionSet = Invoke-SageApi -Method POST -Path "/api/v1/challenges/$($challenge.id)/question-sets" -Token $instructorToken -Body @{
        title = $ChallengeQuestionSetTitle
        timeLimitMinutes = 20
        sortOrder = 1
        maxAttempts = 5
    }
    Write-Host "Created challenge question set: $($challengeQuestionSet.id)" -ForegroundColor Green
} else {
    Write-Host "Reusing challenge question set: $($challengeQuestionSet.id)" -ForegroundColor DarkYellow
}

$challengeQuestionSetDetail = Invoke-SageApi -Method GET -Path "/api/v1/challenges/$($challenge.id)/question-sets/$($challengeQuestionSet.id)" -Token $instructorToken
$existingChallengeQuestions = @($challengeQuestionSetDetail.questions)

if (-not (Find-ByTitle -Items $existingChallengeQuestions -Title "Image registry tam thoi")) {
    $null = Invoke-SageApi -Method POST -Path "/api/v1/question-sets/$($challengeQuestionSet.id)/questions" -Token $instructorToken -Body @{
        title = "Image registry tam thoi"
        prompt = "Trong luc Harbor/DNS chua san sang, registry nao dang duoc dung de GKE pull image tam thoi?"
        type = "MULTIPLE_CHOICE"
        mediaType = "NONE"
        mediaUrl = $null
        points = 5
        sortOrder = 1
        choices = @(
            @{ text = "Google Artifact Registry"; isCorrect = $true; sortOrder = 1 },
            @{ text = "Docker Hub public image mac dinh"; isCorrect = $false; sortOrder = 2 },
            @{ text = "Cloud Storage static bucket"; isCorrect = $false; sortOrder = 3 },
            @{ text = "Cloud DNS managed zone"; isCorrect = $false; sortOrder = 4 }
        )
    }
    Write-Host "Created challenge question: Image registry tam thoi" -ForegroundColor Green
}

if (-not (Find-ByTitle -Items $existingChallengeQuestions -Title "Rollout checklist")) {
    $null = Invoke-SageApi -Method POST -Path "/api/v1/question-sets/$($challengeQuestionSet.id)/questions" -Token $instructorToken -Body @{
        title = "Rollout checklist"
        prompt = "Neu ban ban giao app tren GKE cho thanh vien khac, hay neu cac bang chung can co de noi rollout da on dinh."
        type = "ESSAY"
        mediaType = "NONE"
        mediaUrl = $null
        points = 5
        sortOrder = 2
        choices = @()
    }
    Write-Host "Created challenge question: Rollout checklist" -ForegroundColor Green
}

Write-Step "Create one graded challenge submission if missing"
$challengeSubmissions = Invoke-SageApi -Method GET -Path "/api/v1/challenges/$($challenge.id)/my-submissions" -Token $studentToken
if (@($challengeSubmissions).Count -gt 0) {
    Write-Host "Student already has challenge submission; skipping challenge attempt creation" -ForegroundColor DarkYellow
} else {
    $challengeAttempt = Invoke-SageApi -Method POST -Path "/api/v1/question-sets/$($challengeQuestionSet.id)/attempts" -Token $studentToken
    $challengeMcQuestion = @($challengeAttempt.questions) | Where-Object { $_.type -eq "MULTIPLE_CHOICE" } | Select-Object -First 1
    $challengeEssayQuestion = @($challengeAttempt.questions) | Where-Object { $_.type -eq "ESSAY" } | Select-Object -First 1
    $challengeCorrectChoice = @($challengeMcQuestion.choices) | Where-Object { $_.text -eq "Google Artifact Registry" } | Select-Object -First 1

    $challengeAnswers = @()
    if ($challengeMcQuestion -and $challengeCorrectChoice) {
        $challengeAnswers += @{ questionId = $challengeMcQuestion.id; choiceId = $challengeCorrectChoice.id; textAnswer = $null; fileName = $null; fileType = $null; fileSize = $null; fileUrl = $null }
    }
    if ($challengeEssayQuestion) {
        $challengeAnswers += @{ questionId = $challengeEssayQuestion.id; choiceId = $null; textAnswer = "Bang chung can co gom image tag da build/push, deployment rollout 1/1, pod Running restart 0, smoke test API qua gateway va du lieu demo co the hien tren web."; fileName = $null; fileType = $null; fileSize = $null; fileUrl = $null }
    }

    $challengeSubmitted = Invoke-SageApi -Method PUT -Path "/api/v1/challenge-attempts/$($challengeAttempt.id)/submit" -Token $studentToken -Body @{ answers = $challengeAnswers }
    $challengeGrades = @($challengeSubmitted.answers) | ForEach-Object { @{ questionId = $_.questionId; isCorrect = $true } }
    $challengeGraded = Invoke-SageApi -Method PUT -Path "/api/v1/challenge-attempts/$($challengeAttempt.id)/grade" -Token $instructorToken -Body @{ answers = $challengeGrades }
    Write-Host "Created graded challenge attempt: $($challengeGraded.id), score=$($challengeGraded.score)/$($challengeGraded.maxScore)" -ForegroundColor Green
}

Write-Step "Verification"
$publicCourses = Invoke-SageApi -Method GET -Path "/api/v1/courses/published?size=50" -Token $studentToken
$studentCourses = Invoke-SageApi -Method GET -Path "/api/v1/courses/enrolled" -Token $studentToken
$courseLessons = Invoke-SageApi -Method GET -Path "/api/v1/courses/$($course.id)/lessons" -Token $studentToken
$courseAssessments = Invoke-SageApi -Method GET -Path "/api/v1/courses/$($course.id)/assessments?size=20" -Token $studentToken
$verifiedGradebook = Invoke-SageApi -Method GET -Path "/api/v1/courses/$($course.id)/assessment-gradebook" -Token $instructorToken
$publicChallenges = Invoke-SageApi -Method GET -Path "/api/v1/challenges?size=50" -Token $studentToken
$challengeLeaderboard = Invoke-SageApi -Method GET -Path "/api/v1/challenges/$($challenge.id)/leaderboard" -Token $studentToken
$verifiedChallengeSubmissions = Invoke-SageApi -Method GET -Path "/api/v1/challenges/$($challenge.id)/my-submissions" -Token $studentToken

Write-Host "Public courses: $($publicCourses.totalElements)" -ForegroundColor Green
Write-Host "Student enrollments: $(@($studentCourses).Count)" -ForegroundColor Green
Write-Host "Demo lessons visible to student: $(@($courseLessons).Count)" -ForegroundColor Green
Write-Host "Demo assessments visible to student: $($courseAssessments.totalElements)" -ForegroundColor Green
Write-Host "Gradebook entries: $(@($verifiedGradebook).Count)" -ForegroundColor Green
Write-Host "Public challenges: $($publicChallenges.totalElements)" -ForegroundColor Green
Write-Host "Challenge submissions: $(@($verifiedChallengeSubmissions).Count)" -ForegroundColor Green
Write-Host "Challenge leaderboard entries: $(@($challengeLeaderboard).Count)" -ForegroundColor Green

Write-Host ""
Write-Host "Demo accounts:" -ForegroundColor Cyan
Write-Host "  admin@sagelms.dev      / Admin123!"
Write-Host "  instructor@sagelms.dev / Instructor123!"
Write-Host "  student@sagelms.dev    / Student123!"
Write-Host ""
Write-Host "Demo course: $CourseTitle"
Write-Host "Demo course ID: $($course.id)"
Write-Host "Demo challenge: $ChallengeTitle"
Write-Host "Demo challenge ID: $($challenge.id)"
