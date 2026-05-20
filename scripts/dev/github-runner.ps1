# ============================================================
# SageLMS - GitHub Actions Self-hosted Runner Bootstrap
# ============================================================
# Usage:
#   .\scripts\dev\github-runner.ps1 setup
#   .\scripts\dev\github-runner.ps1 run
#   .\scripts\dev\github-runner.ps1 remove
#   .\scripts\dev\github-runner.ps1 status
#   .\scripts\dev\github-runner.ps1 help
#
# Environment variables:
#   RUNNER_URL         Repo or org URL, e.g. https://github.com/owner/repo
#   RUNNER_TOKEN       Registration token from GitHub Actions > Runners
#   RUNNER_REMOVE_TOKEN Removal token (optional, for unregister)
#   RUNNER_HOME        Runner install dir (default: $HOME/.sagelms/gha-runner)
#   RUNNER_NAME        Runner name (default: <computer>-runner)
#   RUNNER_LABELS      Comma-separated labels (default: self-hosted,devsecops)
#   RUNNER_WORKDIR     Work directory (default: _work)
#   RUNNER_GROUP       Optional runner group
# ============================================================

[CmdletBinding()]
param(
    [ValidateSet('setup', 'run', 'remove', 'status', 'help')]
    [string]$Command = 'setup'
)

$ErrorActionPreference = 'Stop'

$RunnerHome = if ($env:RUNNER_HOME) { $env:RUNNER_HOME } else { Join-Path $HOME '.sagelms\gha-runner' }
$RunnerUrl = $env:RUNNER_URL
$RunnerToken = $env:RUNNER_TOKEN
$RunnerRemoveToken = if ($env:RUNNER_REMOVE_TOKEN) { $env:RUNNER_REMOVE_TOKEN } else { $env:RUNNER_TOKEN }
$RunnerName = if ($env:RUNNER_NAME) { $env:RUNNER_NAME } else { "$env:COMPUTERNAME-runner" }
$RunnerLabels = if ($env:RUNNER_LABELS) { $env:RUNNER_LABELS } else { 'self-hosted,devsecops' }
$RunnerWorkdir = if ($env:RUNNER_WORKDIR) { $env:RUNNER_WORKDIR } else { '_work' }
$RunnerGroup = $env:RUNNER_GROUP
$RunnerApi = 'https://api.github.com/repos/actions/runner/releases/latest'

function Write-Info {
    param([string]$Message)
    Write-Host $Message -ForegroundColor Cyan
}

function Write-Warn {
    param([string]$Message)
    Write-Host $Message -ForegroundColor Yellow
}

function Write-Err {
    param([string]$Message)
    Write-Host $Message -ForegroundColor Red
}

function Get-LatestRunnerAsset {
    $headers = @{ 'User-Agent' = 'SageLMS-Runner-Bootstrap' }
    $release = Invoke-RestMethod -Headers $headers -Uri $RunnerApi
    $asset = $release.assets | Where-Object { $_.name -match 'win-x64' -and $_.name -match '\.zip$' } | Select-Object -First 1

    if (-not $asset) {
        throw 'Could not find the latest Windows runner asset from GitHub releases.'
    }

    [pscustomobject]@{
        Version = $release.tag_name.TrimStart('v')
        Url     = $asset.browser_download_url
        Name    = $asset.name
    }
}

function Ensure-RunnerBinary {
    if (Test-Path (Join-Path $RunnerHome 'run.cmd')) {
        return
    }

    New-Item -ItemType Directory -Path $RunnerHome -Force | Out-Null

    $asset = Get-LatestRunnerAsset
    $archive = Join-Path $env:TEMP $asset.Name

    Write-Info "Downloading runner $($asset.Version)..."
    Invoke-WebRequest -Uri $asset.Url -OutFile $archive
    Expand-Archive -Path $archive -DestinationPath $RunnerHome -Force
    Remove-Item $archive -Force
}

function Assert-Configured {
    if (-not (Test-Path (Join-Path $RunnerHome '.runner'))) {
        throw 'Runner is not configured yet. Run the setup command first.'
    }
}

function Show-Status {
    Write-Host "Runner home: $RunnerHome"
    Write-Host "Runner URL:  $RunnerUrl"
    Write-Host "Configured:   $(Test-Path (Join-Path $RunnerHome '.runner'))"
    if (Test-Path (Join-Path $RunnerHome '.runner')) {
        Write-Host "Runner file:  present"
    }
}

function Invoke-Setup {
    if (-not $RunnerUrl) { throw 'RUNNER_URL is required for setup.' }
    if (-not $RunnerToken) { throw 'RUNNER_TOKEN is required for setup.' }

    Ensure-RunnerBinary
    Push-Location $RunnerHome
    try {
        $args = @(
            '--unattended',
            '--url', $RunnerUrl,
            '--token', $RunnerToken,
            '--name', $RunnerName,
            '--labels', $RunnerLabels,
            '--work', $RunnerWorkdir,
            '--replace'
        )

        if ($RunnerGroup) {
            $args += @('--runnergroup', $RunnerGroup)
        }

        & .\config.cmd @args
    }
    finally {
        Pop-Location
    }
}

function Invoke-Run {
    Assert-Configured
    Push-Location $RunnerHome
    try {
        & .\run.cmd
    }
    finally {
        Pop-Location
    }
}

function Invoke-Remove {
    if (-not $RunnerRemoveToken) { throw 'RUNNER_REMOVE_TOKEN or RUNNER_TOKEN is required to remove the runner.' }
    Push-Location $RunnerHome
    try {
        & .\config.cmd remove --unattended --token $RunnerRemoveToken
    }
    finally {
        Pop-Location
    }
}

function Show-Usage {
    @"
Usage: .\scripts\dev\github-runner.ps1 <setup|run|remove|status|help>

Example:
  `$env:RUNNER_URL = 'https://github.com/daithang59/sagelms'
  `$env:RUNNER_TOKEN = '<registration-token-from-GitHub>'
  .\scripts\dev\github-runner.ps1 setup
  .\scripts\dev\github-runner.ps1 run

Recommended labels:
  self-hosted, devsecops, build, infra, security
"@ | Write-Host
}

try {
    switch ($Command) {
        'help' { Show-Usage }
        'setup' { Invoke-Setup; Write-Info 'Runner configured successfully.' }
        'run' { Invoke-Run }
        'remove' { Invoke-Remove; Write-Warn 'Runner unregistered.' }
        'status' { Show-Status }
    }
}
catch {
    Write-Err "ERROR: $($_.Exception.Message)"
    exit 1
}