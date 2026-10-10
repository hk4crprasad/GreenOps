# Run from any directory. Defaults to the initialized Supabase/Azure setup.
# For local PostgreSQL/MinIO (with matching .env), pass -ComposeFiles compose.yaml.
param(
    [string[]]$ComposeFiles = @('compose.yaml', 'compose.supabase.yaml', 'compose.azure.yaml'),
    [ValidateRange(10, 1800)]
    [int]$StartupTimeoutSeconds = 180,
    [string]$DockerDesktopPath,
    [switch]$FastDemo
)

$ErrorActionPreference = 'Stop'
$projectDirectory = Split-Path -Parent $PSScriptRoot
if ($FastDemo) {
    $ComposeFiles = @('compose.yaml', 'compose.demo-fast.yaml')
    Write-Host 'Fast demo: using local PostgreSQL URLs/passwords and object storage from .env. AI still uses your configured provider.'
}

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    throw 'Docker was not found. Install and start Docker Desktop with Linux containers, then try again.'
}

# Probes can fail normally while Desktop starts. Windows PowerShell 5.1 turns
# native stderr into error records, so collect it with Continue in this scope.
function Invoke-DockerProbe {
    param([string[]]$Arguments)
    $ErrorActionPreference = 'Continue'
    $PSNativeCommandUseErrorActionPreference = $false
    $output = @(& docker @Arguments 2>&1)
    return [pscustomobject]@{ ExitCode = $LASTEXITCODE; Output = $output }
}

function Get-DesktopEngine {
    $contexts = Invoke-DockerProbe -Arguments @('context', 'ls', '--format', '{{.Name}}')
    $context = 'desktop-linux'
    if ($contexts.ExitCode -eq 0 -and $contexts.Output -notcontains 'desktop-linux') {
        # Older Desktop versions use the default Windows named-pipe context.
        $context = 'default'
        $endpoint = Invoke-DockerProbe -Arguments @('context', 'inspect', 'default', '--format', '{{.Endpoints.docker.Host}}')
        if ($endpoint.ExitCode -ne 0 -or "$($endpoint.Output)" -notmatch '^npipe:') {
            return [pscustomobject]@{ Context = $context; Ready = $false }
        }
    }
    $engine = Invoke-DockerProbe -Arguments @('--context', $context, 'info', '--format', '{{.OSType}}')
    return [pscustomobject]@{
        Context = $context
        Ready = ($engine.ExitCode -eq 0 -and $engine.Output -contains 'linux')
    }
}

Push-Location -LiteralPath $projectDirectory
try {
    if (-not (Test-Path -LiteralPath '.env' -PathType Leaf)) {
        throw 'Missing .env. Complete the README setup with your database and storage settings first.'
    }
    if ($ComposeFiles.Count -eq 0) {
        throw 'Provide at least one Compose file.'
    }
    $composeFileArguments = @()
    foreach ($composeFile in $ComposeFiles) {
        if (-not (Test-Path -LiteralPath $composeFile -PathType Leaf)) {
            throw "Compose file not found: $composeFile"
        }
        $composeFileArguments += @('-f', $composeFile)
    }

    $state = Get-DesktopEngine
    if (-not $state.Ready) {
        Write-Host 'Starting Docker Desktop and waiting for its Linux engine...'
        $desktopCandidates = @()
        if ($DockerDesktopPath) { $desktopCandidates += $DockerDesktopPath }
        if ($env:ProgramFiles) {
            $desktopCandidates += (Join-Path $env:ProgramFiles 'Docker\Docker\Docker Desktop.exe')
        }
        if ($env:LOCALAPPDATA) {
            $desktopCandidates += (Join-Path $env:LOCALAPPDATA 'Programs\DockerDesktop\Docker Desktop.exe')
        }
        $desktopExecutable = $desktopCandidates | Where-Object {
            Test-Path -LiteralPath $_ -PathType Leaf
        } | Select-Object -First 1

        if ($desktopExecutable) {
            Start-Process -FilePath $desktopExecutable
        }
        else {
            # Recent Desktop versions support this even with a custom install path.
            $start = Invoke-DockerProbe -Arguments @('desktop', 'start', '--detach')
            if ($start.ExitCode -ne 0) {
                throw 'Could not start Docker Desktop. Open it from the Start menu, or pass -DockerDesktopPath "C:\path\Docker Desktop.exe", then rerun this script.'
            }
        }

        $deadline = (Get-Date).AddSeconds($StartupTimeoutSeconds)
        $switchAttempted = $false
        $nextNotice = (Get-Date).AddSeconds(15)
        do {
            $state = Get-DesktopEngine
            if ($state.Ready) { break }

            # GreenOps images require Linux containers. Switch only when a
            # running Windows engine is detected, not during normal startup.
            if (-not $switchAttempted) {
                $defaultEngine = Invoke-DockerProbe -Arguments @('--context', 'default', 'info', '--format', '{{.OSType}}')
                if ($defaultEngine.ExitCode -eq 0 -and $defaultEngine.Output -contains 'windows') {
                    $switchAttempted = $true
                    Write-Host 'Switching Docker Desktop to Linux containers...'
                    $switch = Invoke-DockerProbe -Arguments @('desktop', 'engine', 'use', 'linux')
                    if ($switch.ExitCode -ne 0) {
                        throw 'Select "Switch to Linux containers" from the Docker Desktop tray menu, then rerun this script.'
                    }
                }
            }
            if ((Get-Date) -ge $nextNotice) {
                Write-Host 'Still waiting for Docker Desktop. Its dashboard should show the engine running.'
                $nextNotice = (Get-Date).AddSeconds(15)
            }
            Start-Sleep -Seconds 2
        } while ((Get-Date) -lt $deadline)

        if (-not $state.Ready) {
            throw "Docker Desktop's Linux engine was not ready within $StartupTimeoutSeconds seconds. Open Docker Desktop and resolve any WSL/virtualization startup error; select Linux containers, then rerun. For a slow startup, pass -StartupTimeoutSeconds 300."
        }
    }

    Write-Host "Docker Desktop is ready (context: $($state.Context)). Starting GreenOps..."
    # The explicit context overrides inherited DOCKER_HOST/DOCKER_CONTEXT.
    # Desktop owns the connection; no custom socket or daemon is configured.
    $composeArguments = @('--context', $state.Context, 'compose') + $composeFileArguments
    if ($FastDemo) {
        # Compose resolves .env interpolation and process-environment precedence.
        # Capture configuration privately: it contains credentials; never print it.
        $configuration = Invoke-DockerProbe -Arguments ($composeArguments + @('config', '--format', 'json'))
        if ($configuration.ExitCode -ne 0) {
            throw 'FastDemo configuration is invalid. Set LOCAL_DATABASE_URL, LOCAL_MIGRATION_DATABASE_URL and POSTGRES_* passwords in .env, then retry.'
        }
        try {
            $configurationText = $configuration.Output -join "`n"
            $jsonStart = $configurationText.IndexOf('{')
            if ($jsonStart -lt 0) { throw 'Missing configuration' }
            $resolved = ConvertFrom-Json $configurationText.Substring($jsonStart)
            $storageProvider = $resolved.services.api.environment.OBJECT_STORAGE_PROVIDER
        }
        catch {
            throw 'Could not read FastDemo storage configuration. Update Docker Desktop/Compose and retry.'
        }
        if ($storageProvider -eq 'azure') {
            if (-not (Test-Path -LiteralPath 'compose.azure.yaml' -PathType Leaf)) {
                throw 'Missing compose.azure.yaml. Copy the updated Compose files and retry.'
            }
            $composeArguments += @('-f', 'compose.azure.yaml')
            Write-Host 'Fast demo storage: Azure from .env; MinIO is excluded, so no quay.io pull is needed.'
        }
        elseif ($storageProvider -eq 's3') {
            Write-Host 'Fast demo storage: S3/MinIO from .env (quay.io/minio/minio without a tag).'
        }
        else {
            throw 'Set OBJECT_STORAGE_PROVIDER=azure or s3 in .env.'
        }
        $configuration = $null
        $configurationText = $null
        $resolved = $null
    }
    # Explicit -f flags override COMPOSE_FILE, avoiding OS-specific separators.
    $ErrorActionPreference = 'Continue'
    $PSNativeCommandUseErrorActionPreference = $false
    & docker @composeArguments up -d --build
    $composeExitCode = $LASTEXITCODE
    $ErrorActionPreference = 'Stop'
    if ($composeExitCode -ne 0) {
        Write-Host 'Migration diagnostics (the traceback below contains the actual cause):'
        $ErrorActionPreference = 'Continue'
        & docker @composeArguments logs --no-color --tail 80 migrate
        $ErrorActionPreference = 'Stop'
        throw "Docker Compose startup failed (exit $composeExitCode). See the migration traceback above."
    }
    Write-Host 'GreenOps startup requested. Open http://localhost:3000 once the services are ready.'
    Write-Host '3D hospital campus: http://localhost:3000/campus'
}
finally {
    Pop-Location
}
