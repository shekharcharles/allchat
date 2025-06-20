# PowerShell script to kill any process on port 3000 and start Next.js dev server
Write-Host "Starting Next.js Development Server on Port 3000..." -ForegroundColor Green

# Function to kill process on specific port
function Kill-ProcessOnPort {
    param([int]$Port)

    Write-Host "Checking for processes on port $Port..." -ForegroundColor Yellow

    try {
        $processes = netstat -ano | Select-String ":$Port " | ForEach-Object {
            $fields = $_ -split '\s+' | Where-Object { $_ -ne '' }
            if ($fields.Count -ge 5) {
                $fields[4]
            }
        } | Sort-Object -Unique

        if ($processes) {
            foreach ($pid in $processes) {
                if ($pid -and $pid -match '^\d+$') {
                    Write-Host "Killing process $pid on port $Port..." -ForegroundColor Red
                    try {
                        Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
                        Write-Host "Process $pid killed successfully" -ForegroundColor Green
                    }
                    catch {
                        Write-Host "Could not kill process $pid" -ForegroundColor Yellow
                    }
                }
            }
            # Wait a moment for processes to fully terminate
            Start-Sleep -Seconds 2
        } else {
            Write-Host "No processes found on port $Port" -ForegroundColor Green
        }
    }
    catch {
        Write-Host "Error checking port $Port" -ForegroundColor Yellow
    }
}

# Function to clean Next.js cache
function Clean-NextCache {
    Write-Host "Cleaning Next.js cache..." -ForegroundColor Yellow

    try {
        if (Test-Path ".next") {
            Remove-Item -Recurse -Force ".next" -ErrorAction SilentlyContinue
            Write-Host ".next directory cleaned" -ForegroundColor Green
        }

        if (Test-Path "node_modules\.cache") {
            Remove-Item -Recurse -Force "node_modules\.cache" -ErrorAction SilentlyContinue
            Write-Host "Node modules cache cleaned" -ForegroundColor Green
        }
    }
    catch {
        Write-Host "Error cleaning cache: $_" -ForegroundColor Yellow
    }
}

# Main execution
try {
    # Kill any process on port 3000
    Kill-ProcessOnPort -Port 3000

    # Clean cache if requested
    if ($args -contains "--clean" -or $args -contains "-c") {
        Clean-NextCache
    }

    # Start Next.js development server
    Write-Host "Starting Next.js on http://localhost:3000..." -ForegroundColor Green
    Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Cyan
    Write-Host "----------------------------------------" -ForegroundColor Gray

    # Set environment variables for better Windows performance
    $env:NODE_OPTIONS = "--max-old-space-size=4096"

    # Start the development server
    npm run dev
}
catch {
    Write-Host "Error starting development server: $_" -ForegroundColor Red
    exit 1
}
