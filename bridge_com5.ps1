<#
    bridge_com5.ps1 - Pont COM5 -> WSL2 TCP
    Relaie les donnees du STM32 vers le serveur SmartVend

    Usage: powershell -ExecutionPolicy Bypass -File bridge_com5.ps1
#>

$WSL_IP = "172.30.62.238"
$WSL_PORT = 9090

Write-Host "Bridge COM5 -> $WSL_IP`:$WSL_PORT" -ForegroundColor Cyan
Write-Host "Ouverture de COM5 a 115200 bauds..." -ForegroundColor Yellow

try {
    $port = new-Object System.IO.Ports.SerialPort "COM5",115200,None,8,one
    $port.ReadTimeout = 5000
    $port.Open()
    Write-Host "[OK] COM5 ouvert" -ForegroundColor Green
} catch {
    Write-Host "[ERREUR] Impossible d'ouvrir COM5 : $_" -ForegroundColor Red
    Write-Host "Verifie que la NUCLEO est branchee et que le port est bien COM5" -ForegroundColor Yellow
    pause
    exit 1
}

try {
    $tcp = New-Object System.Net.Sockets.TcpClient
    $tcp.Connect($WSL_IP, $WSL_PORT)
    $stream = $tcp.GetStream()
    Write-Host "[OK] Connecte a $WSL_IP`:$WSL_PORT" -ForegroundColor Green
} catch {
    Write-Host "[ERREUR] Connexion a $WSL_IP`:$WSL_PORT echouee : $_" -ForegroundColor Red
    $port.Close()
    pause
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Relayage des donnees STM32 en cours"    -ForegroundColor Cyan
Write-Host "  Appuie sur Ctrl+C pour arreter"         -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

try {
    while ($true) {
        try {
            $line = $port.ReadLine()
            $bytes = [System.Text.Encoding]::UTF8.GetBytes($line + "`n")
            $stream.Write($bytes, 0, $bytes.Length)
            Write-Host "STM32: $($line.Trim())" -ForegroundColor Magenta
        } catch {
            if ($_.Exception.InnerException -match "timeout") {
                # Timeout normal, on continue
            } else {
                Write-Host "[ERREUR] $($_.Exception.Message)" -ForegroundColor Red
                break
            }
        }
    }
} catch {
    Write-Host "Arrete" -ForegroundColor Yellow
} finally {
    $stream.Close()
    $tcp.Close()
    $port.Close()
    Write-Host "[OK] Ports fermes" -ForegroundColor Green
    pause
}
