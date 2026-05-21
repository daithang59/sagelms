param(
  [string]$RegistryPrefix = "sagelms",
  [string]$Tag = "",
  [string]$Severity = "HIGH,CRITICAL",
  [string]$OutputDir = "reports/trivy",
  [switch]$IgnoreUnfixed,
  [switch]$FailOnFindings
)

$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
Set-Location $repoRoot

if ([string]::IsNullOrWhiteSpace($env:DOCKER_CONFIG)) {
  $dockerConfig = Join-Path $env:TEMP "sagelms-docker-config"
  New-Item -ItemType Directory -Force $dockerConfig | Out-Null
  $env:DOCKER_CONFIG = $dockerConfig
}

if (-not (Get-Command trivy -ErrorAction SilentlyContinue)) {
  throw "Trivy is required. Install it from https://aquasecurity.github.io/trivy/ before running this script."
}

if ([string]::IsNullOrWhiteSpace($Tag)) {
  try {
    $Tag = (git rev-parse --short HEAD).Trim()
  } catch {
    $Tag = "dev"
  }
}

New-Item -ItemType Directory -Force $OutputDir | Out-Null

$images = @(
  "web",
  "gateway",
  "auth-service",
  "course-service",
  "content-service",
  "assessment-service",
  "challenge-service"
)

$trivyArgs = @("image", "--severity", $Severity, "--format", "table")
if ($IgnoreUnfixed) {
  $trivyArgs += "--ignore-unfixed"
}

$exitCode = 0
if ($FailOnFindings) {
  $exitCode = 1
}

$failedImages = @()
foreach ($name in $images) {
  $image = "$RegistryPrefix/${name}:$Tag"
  $report = Join-Path $OutputDir "$name.txt"
  Write-Host "Scanning $image" -ForegroundColor Cyan
  trivy @trivyArgs --exit-code $exitCode --output $report $image
  if ($LASTEXITCODE -ne 0) {
    $failedImages += $image
  }
}

if ($FailOnFindings -and $failedImages.Count -gt 0) {
  throw "Trivy found $Severity vulnerabilities in: $($failedImages -join ', ')"
}

if (-not $FailOnFindings) {
  Write-Warning "Reports were generated successfully in report-only mode. Re-run with -FailOnFindings to enforce a failing gate."
}

Write-Host "Trivy scan completed for $($images.Count) images. Reports: $OutputDir" -ForegroundColor Green
