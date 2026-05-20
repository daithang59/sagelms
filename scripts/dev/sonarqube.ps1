# ============================================================
# SageLMS - Self-hosted SonarQube (Docker Compose)
# ============================================================
# Usage:
#   .\scripts\dev\sonarqube.ps1 start
#   .\scripts\dev\sonarqube.ps1 stop
#   .\scripts\dev\sonarqube.ps1 logs
#   .\scripts\dev\sonarqube.ps1 status
#   .\scripts\dev\sonarqube.ps1 reset
#   .\scripts\dev\sonarqube.ps1 url
#
# Notes:
# - Requires Docker Desktop / Docker Engine with Compose v2.
# - Default URL: http://localhost:9000
# - Default login: admin / admin
# ============================================================

[CmdletBinding()]
param(
    [ValidateSet('start', 'stop', 'restart', 'logs', 'status', 'reset', 'url', 'help')]
    [string]$Command = 'start'
)

$ErrorActionPreference = 'Stop'

$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot '..\..')
$ComposeFile = Join-Path $RepoRoot 'infra\docker\docker-compose.sonarqube.yml'
$ProjectName = 'sagelms-sonarqube'

function Test-DockerCompose {
    if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
        throw 'Docker is not installed or not available in PATH.'
    }

    & docker compose version | Out-Null
}

function Invoke-Compose {
    param(
        [Parameter(Mandatory = $true)]
        [string[]]$Args
    )

    & docker compose -p $ProjectName -f $ComposeFile @Args
}

function Show-Usage {
    @"
Usage: .\scripts\dev\sonarqube.ps1 <start|stop|restart|logs|status|reset|url>

Environment overrides:
  SONARQUBE_PORT=9000
  SONARQUBE_DB_NAME=sonarqube
  SONARQUBE_DB_USER=sonar
  SONARQUBE_DB_PASSWORD=sonar

Open in browser:
  http://localhost:9000
"@ | Write-Host
}

try {
    switch ($Command) {
        'help' {
            Show-Usage
            break
        }
        'start' {
            Test-DockerCompose
            Invoke-Compose @('up', '-d')
            Write-Host ''
            Write-Host 'SonarQube is starting.' -ForegroundColor Green
            Write-Host 'URL: http://localhost:9000' -ForegroundColor Cyan
            Write-Host 'Login: admin / admin (change password on first login)' -ForegroundColor Yellow
        }
        'stop' {
            Test-DockerCompose
            Invoke-Compose @('down')
        }
        'restart' {
            Test-DockerCompose
            Invoke-Compose @('down')
            Invoke-Compose @('up', '-d')
        }
        'logs' {
            Test-DockerCompose
            Invoke-Compose @('logs', '-f', '--tail=200')
        }
        'status' {
            Test-DockerCompose
            Invoke-Compose @('ps')
        }
        'reset' {
            Test-DockerCompose
            Invoke-Compose @('down', '-v')
            Write-Host 'SonarQube containers and volumes removed.' -ForegroundColor Yellow
        }
        'url' {
            Write-Host 'http://localhost:9000'
        }
    }
}
catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}