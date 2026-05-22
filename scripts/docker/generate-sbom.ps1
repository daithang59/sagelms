param(
  [string]$RegistryPrefix = "sagelms",
  [string]$Tag = "",
  [string]$OutputDir = "reports/sbom"
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

foreach ($name in $images) {
  $image = "$RegistryPrefix/${name}:$Tag"
  $output = Join-Path $OutputDir "$name.cdx.json"
  Write-Host "Generating SBOM for $image" -ForegroundColor Cyan
  trivy image --format cyclonedx --output $output $image
  if ($LASTEXITCODE -ne 0) {
    throw "SBOM generation failed for $image"
  }
}

Write-Host "SBOM generation completed for $($images.Count) images. Output: $OutputDir" -ForegroundColor Green
