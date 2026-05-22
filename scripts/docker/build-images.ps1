param(
  [string]$RegistryPrefix = "sagelms",
  [string]$Tag = "",
  [switch]$Push,
  [switch]$NoCache
)

$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
Set-Location $repoRoot

if (-not $Push -and [string]::IsNullOrWhiteSpace($env:DOCKER_CONFIG)) {
  $dockerConfig = Join-Path $env:TEMP "sagelms-docker-config"
  New-Item -ItemType Directory -Force $dockerConfig | Out-Null
  $env:DOCKER_CONFIG = $dockerConfig
}

if ([string]::IsNullOrWhiteSpace($Tag)) {
  try {
    $Tag = (git rev-parse --short HEAD).Trim()
  } catch {
    $Tag = "dev"
  }
}

$images = @(
  @{ Name = "web"; Context = "apps/web" },
  @{ Name = "gateway"; Context = "services/gateway" },
  @{ Name = "auth-service"; Context = "services/auth-service" },
  @{ Name = "course-service"; Context = "services/course-service" },
  @{ Name = "content-service"; Context = "services/content-service" },
  @{ Name = "assessment-service"; Context = "services/assessment-service" },
  @{ Name = "challenge-service"; Context = "services/challenge-service" }
)

$buildArgs = @()
if ($NoCache) {
  $buildArgs += "--no-cache"
}

foreach ($image in $images) {
  $fullName = "$RegistryPrefix/$($image.Name):$Tag"
  Write-Host "Building $fullName from $($image.Context)" -ForegroundColor Cyan
  docker build @buildArgs -t $fullName $image.Context
  if ($LASTEXITCODE -ne 0) {
    throw "docker build failed for $fullName"
  }

  if ($Push) {
    Write-Host "Pushing $fullName" -ForegroundColor Cyan
    docker push $fullName
    if ($LASTEXITCODE -ne 0) {
      throw "docker push failed for $fullName"
    }
  }
}

Write-Host "Built $($images.Count) images with tag '$Tag'." -ForegroundColor Green
