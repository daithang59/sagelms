param(
  [string]$RegistryPrefix = "sagelms",
  [string]$Tag = "",
  [string]$OutputFile = "reports/image-digests.md"
)

$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
Set-Location $repoRoot

if ([string]::IsNullOrWhiteSpace($env:DOCKER_CONFIG)) {
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

$outputDir = Split-Path -Parent $OutputFile
if (-not [string]::IsNullOrWhiteSpace($outputDir)) {
  New-Item -ItemType Directory -Force $outputDir | Out-Null
}

$images = @(
  "web",
  "gateway",
  "auth-service",
  "course-service",
  "content-service",
  "assessment-service",
  "challenge-service"
)

$lines = @(
  "# SageLMS Image Digests",
  "",
  "| Image | Tag | Digest |",
  "| --- | --- | --- |"
)

foreach ($name in $images) {
  $image = "$RegistryPrefix/${name}:$Tag"
  try {
    $repoDigests = & docker inspect --format "{{range .RepoDigests}}{{println .}}{{end}}" $image 2>$null
  } catch {
    $repoDigests = @()
  }
  if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($repoDigests)) {
    $digest = "not available; push or pull the image first"
  } else {
    $digest = ($repoDigests -split "`n" | Select-Object -First 1).Trim()
  }
  $lines += "| ``$RegistryPrefix/$name`` | ``$Tag`` | ``$digest`` |"
}

$lines | Set-Content -Path $OutputFile -Encoding utf8
Write-Host "Digest report written to $OutputFile" -ForegroundColor Green
