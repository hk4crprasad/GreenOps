# Run from any directory. Defaults to the initialized Supabase/Azure setup.
# For local PostgreSQL/MinIO (with matching .env), pass -ComposeFiles compose.yaml.
param(
    [string[]]$ComposeFiles = @('compose.yaml', 'compose.supabase.yaml', 'compose.azure.yaml')
)

$ErrorActionPreference = 'Stop'
$projectDirectory = Split-Path -Parent $PSScriptRoot

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    throw 'Docker was not found. Install and start Docker Desktop with Linux containers, then try again.'
}

Push-Location -LiteralPath $projectDirectory
try {
    if (-not (Test-Path -LiteralPath '.env' -PathType Leaf)) {
        throw 'Missing .env. Complete the README setup with your database and storage settings first.'
    }
    if ($ComposeFiles.Count -eq 0) {
        throw 'Provide at least one Compose file.'
    }
    $composeArguments = @('compose')
    foreach ($composeFile in $ComposeFiles) {
        if (-not (Test-Path -LiteralPath $composeFile -PathType Leaf)) {
            throw "Compose file not found: $composeFile"
        }
        $composeArguments += @('-f', $composeFile)
    }

    # Explicit -f flags override COMPOSE_FILE, avoiding OS-specific separators.
    & docker @composeArguments up -d --build
    if ($LASTEXITCODE -ne 0) {
        throw "Docker Compose startup failed (exit $LASTEXITCODE). See the Docker output above."
    }
    Write-Host 'GreenOps startup requested. Open http://localhost:3000 once the services are ready.'
    Write-Host '3D hospital campus: http://localhost:3000/campus'
}
finally {
    Pop-Location
}
