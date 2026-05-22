param(
  [string]$RegistryPrefix = "sagelms",
  [string]$Tag = "",
  [string]$SbomDir = "reports/sbom",
  [string]$Key = "",
  [switch]$AttestSbom
)

$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
Set-Location $repoRoot

if ([string]::IsNullOrWhiteSpace($env:DOCKER_CONFIG)) {
  $dockerConfig = Join-Path $env:TEMP "sagelms-docker-config"
  New-Item -ItemType Directory -Force $dockerConfig | Out-Null
  $env:DOCKER_CONFIG = $dockerConfig
}

if (-not (Get-Command cosign -ErrorAction SilentlyContinue)) {
  throw "Cosign is required. Install it from https://docs.sigstore.dev/cosign/system_config/installation/ before running this script."
}

if ([string]::IsNullOrWhiteSpace($Tag)) {
  try {
    $Tag = (git rev-parse --short HEAD).Trim()
  } catch {
    $Tag = "dev"
  }
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

$cosignKeyArgs = @()
if (-not [string]::IsNullOrWhiteSpace($Key)) {
  $cosignKeyArgs += @("--key", $Key)
}

foreach ($name in $images) {
  $tagRef = "$RegistryPrefix/${name}:$Tag"
  Write-Host "Resolving digest for $tagRef" -ForegroundColor Cyan
  $repoDigests = & docker inspect --format "{{range .RepoDigests}}{{println .}}{{end}}" $tagRef 2>$null
  if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($repoDigests)) {
    throw "Digest is not available for $tagRef. Push or pull the image first, then run this script."
  }

  $digestRef = ($repoDigests -split "`n" | Where-Object { -not [string]::IsNullOrWhiteSpace($_) } | Select-Object -First 1).Trim()
  Write-Host "Signing $digestRef" -ForegroundColor Cyan
  cosign sign --yes @cosignKeyArgs $digestRef
  if ($LASTEXITCODE -ne 0) {
    throw "Cosign signing failed for $digestRef"
  }

  if ($AttestSbom) {
    $sbomPath = Join-Path $SbomDir "$name.cdx.json"
    if (-not (Test-Path $sbomPath)) {
      throw "SBOM file not found for $name`: $sbomPath. Generate SBOMs first or pass -SbomDir."
    }

    Write-Host "Attesting SBOM for $digestRef" -ForegroundColor Cyan
    cosign attest --yes @cosignKeyArgs --predicate $sbomPath --type cyclonedx $digestRef
    if ($LASTEXITCODE -ne 0) {
      throw "Cosign SBOM attestation failed for $digestRef"
    }
  }
}

Write-Host "Cosign signing completed for $($images.Count) images." -ForegroundColor Green
