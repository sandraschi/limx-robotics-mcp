# Per-repo fleet start config for limx-robotics-mcp
# Edit ports/backend target here - start.ps1 is fleet-standard.
@{
    Name         = 'limx-robotics-mcp'
    BackendPort  = 11044
    FrontendPort = 11045
    HealthPath   = '/api/health'
    WebRoot      = 'web_sota'
    Backend = @{
        Kind          = 'uvicorn'
        UvicornTarget = 'web_sota.backend.server:app'
        SyncExtras    = @('dev')
        SyncOnStart   = $true
        Env           = @{ WEB_PORT = '11044' }
    }
    Frontend = @{
        Kind           = 'vite-npm'
        PackageManager = 'npm'
    }
}
