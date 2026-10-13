$ErrorActionPreference = "Stop"
Import-Module Posh-SSH -ErrorAction Stop

$configPath = Join-Path $PSScriptRoot "deploy\sites\kwb.json"
$config = Get-Content $configPath -Raw | ConvertFrom-Json
$password = $env:KWB_SFTP_PASSWORD
if (-not $password) { throw "Set KWB_SFTP_PASSWORD before running this script." }

$sec = ConvertTo-SecureString $password -AsPlainText -Force
$cred = New-Object System.Management.Automation.PSCredential($config.username, $sec)

$session = New-SFTPSession -ComputerName $config.host -Port $config.port -Credential $cred -AcceptKey -Force
if (-not $session) { throw "SFTP session failed" }

try {
  $rootItems = Get-SFTPChildItem -SessionId $session.SessionId -Path "."
  Write-Output ("ROOT_OK " + $rootItems.Count)

  $pluginRoot = "wp-content/plugins/neo-pulse-wp"
  $localRoot = Join-Path $PSScriptRoot "neo-pulse-wp"
  if (-not (Test-Path $localRoot)) { throw "Local plugin dir missing" }

  $files = Get-ChildItem -Path $localRoot -Recurse -File | Where-Object {
    $rel = $_.FullName.Substring($localRoot.Length).TrimStart("\")
    $norm = $rel -replace "\\", "/"
    if ($norm -match "^(tests|node_modules|\.git)(/|$)") { return $false }
    if ($norm -match "\.md$" -and ($norm -notmatch "/")) { return $false }
    if ($norm -eq ".env") { return $false }
    return $true
  }

  $remoteRoot = $pluginRoot

  function Ensure-RemoteDir([string]$fullPath) {
    $norm = $fullPath -replace "\\", "/"
    $parts = $norm -split "/"
    $built = ""
    foreach ($part in $parts) {
      if ($part -eq "") { continue }
      $built = if ($built -eq "") { $part } else { "$built/$part" }
      if (-not (Test-SFTPPath -SessionId $session.SessionId -Path $built)) {
        New-SFTPItem -SessionId $session.SessionId -Path $built -ItemType Directory | Out-Null
      }
    }
  }

  Ensure-RemoteDir $remoteRoot
  foreach ($file in $files) {
    $rel = $file.FullName.Substring($localRoot.Length).TrimStart("\") -replace "\\", "/"
    $remotePath = "$remoteRoot/$rel"
    $remoteDir = (Split-Path $remotePath -Parent) -replace "\\", "/"
    if ($remoteDir) { Ensure-RemoteDir $remoteDir }
  }

  $n = 0
  foreach ($file in $files) {
    $rel = $file.FullName.Substring($localRoot.Length).TrimStart("\") -replace "\\", "/"
    $remotePath = "$remoteRoot/$rel"
    Set-SFTPItem -SessionId $session.SessionId -Path $file.FullName -Destination $remotePath -Force
    $n++
    if ($n % 40 -eq 0) { Write-Output ("UPLOADED $n") }
  }
  Write-Output ("DEPLOY_OK $n files")
}
finally {
  Remove-SFTPSession -SessionId $session.SessionId | Out-Null
}
