# RooFlow Universal 1-Click PowerShell Installer

Write-Host "--- RooFlow Universal 1-Click Installer ---"
Write-Host ""
Write-Host "This script will download and configure RooFlow for the current project."
Write-Host "It will create a '.roo' directory and a '.roomodes' file."
Write-Host ""

# --- 1. Dependency Checks ---
Write-Host "[1/5] Checking for required dependencies..."

# Check for Git
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Error "[ERROR] Git is not found in your PATH."
    Write-Error "Please install Git and ensure it's in your system's PATH."
    Write-Error "You can download it from: https://git-scm.com/"
    exit 1
}
Write-Host "  - Git... OK"

# Check for Python
if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
    Write-Error "[ERROR] Python is not found in your PATH."
    Write-Error "Please install Python 3 and ensure it's in your system's PATH."
    Write-Error "You can download it from: https://www.python.org/"
    exit 1
}
Write-Host "  - Python... OK"

# Check for PyYAML using pip
pip show pyyaml 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Error "[ERROR] PyYAML is not installed for Python."
    Write-Error "Please install it by running: pip install pyyaml"
    exit 1
}
Write-Host "  - PyYAML... OK"
Write-Host ""

# --- 2. Installation ---
$tempDir = ".\RooFlow_Temp_Install"

# Clean up old temp directory if it exists
if (Test-Path $tempDir) {
    Write-Host "  - Removing leftover temporary directory..."
    Remove-Item -Recurse -Force -Path $tempDir -ErrorAction SilentlyContinue
}

Write-Host "[2/5] Cloning RooFlow repository into $tempDir..."
git clone --depth 1 https://github.com/GreatScottyMac/RooFlow $tempDir
if ($LASTEXITCODE -ne 0) {
    Write-Error "[ERROR] Failed to clone the RooFlow repository."
    Write-Error "Please check your internet connection and that Git is working correctly."
    exit 1
}
Write-Host ""

# --- 3. Copy Files ---
Write-Host "[3/5] Copying configuration files..."

# Copy the .roo directory
if (Test-Path ".\.roo") { Remove-Item -Recurse -Force -Path ".\.roo" }
Copy-Item -Path "$tempDir\config\.roo" -Destination ".\" -Recurse
if ($LASTEXITCODE -ne 0) {
    Write-Error "[ERROR] Failed to copy the .roo directory."
    Remove-Item -Recurse -Force -Path $tempDir -ErrorAction SilentlyContinue
    exit 1
}
Write-Host "  - Copied .roo directory."

# Copy the .roomodes file
Copy-Item -Path "$tempDir\config\.roomodes" -Destination ".\" -Force
if ($LASTEXITCODE -ne 0) {
    Write-Error "[ERROR] Failed to copy the .roomodes file."
    Remove-Item -Recurse -Force -Path $tempDir -ErrorAction SilentlyContinue
    exit 1
}
Write-Host "  - Copied .roomodes file."

# Copy the Python script
Copy-Item -Path "$tempDir\config\generate_mcp_yaml.py" -Destination ".\" -Force
if ($LASTEXITCODE -ne 0) {
    Write-Error "[ERROR] Failed to copy the generate_mcp_yaml.py script."
    Remove-Item -Recurse -Force -Path $tempDir -ErrorAction SilentlyContinue
    exit 1
}
Write-Host "  - Copied generate_mcp_yaml.py."
Write-Host ""

# --- 4. Run Python Script ---
Write-Host "[4/5] Generating RooFlow configuration..."
$os = (Get-CimInstance Win32_OperatingSystem).Caption
$shell = "powershell"
$homePath = $env:USERPROFILE
$workspace = (Get-Location).Path

python generate_mcp_yaml.py --os "$os" --shell "$shell" --home "$homePath" --workspace "$workspace"
if ($LASTEXITCODE -ne 0) {
    Write-Error "[ERROR] The Python script failed to generate the configuration."
    # Attempt cleanup even on failure
    Remove-Item -Recurse -Force -Path $tempDir -ErrorAction SilentlyContinue
    exit 1
}
Write-Host ""

# --- 5. Resilient Cleanup ---
Write-Host "[5/5] Cleaning up temporary files..."
$maxRetries = 5
$retryCount = 0
while ($retryCount -lt $maxRetries) {
    Remove-Item -Recurse -Force -Path $tempDir -ErrorAction SilentlyContinue
    if (-not (Test-Path $tempDir)) {
        Write-Host "  - Cleanup successful."
        break
    }
    $retryCount++
    Start-Sleep -Seconds 1
}

if (Test-Path $tempDir) {
    Write-Warning "Could not remove temporary directory '$tempDir'. You may need to remove it manually."
}
Write-Host ""

Write-Host "------------------------------------------"
Write-Host " RooFlow has been successfully installed! "
Write-Host "------------------------------------------"

exit 0