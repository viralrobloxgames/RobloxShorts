# Bring a Roblox Studio window to the front (for screen-recording the viewport).
#   powershell -File studio_front.ps1 -TitleLike 'Copy of Steal a Beast Egg!*'
param([string]$TitleLike = '*Roblox Studio')
Add-Type @"
using System; using System.Runtime.InteropServices;
public class Front {
  [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr h);
  [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr h, int n);
  [DllImport("user32.dll")] public static extern bool BringWindowToTop(IntPtr h);
  [DllImport("user32.dll")] public static extern void keybd_event(byte k, byte s, uint f, UIntPtr e);
}
"@
$p = Get-Process RobloxStudioBeta | Where-Object { $_.MainWindowTitle -like $TitleLike } | Select-Object -First 1
if (-not $p) { Write-Output "ERROR: no Studio window like '$TitleLike'"; exit 2 }
$h = $p.MainWindowHandle
[Front]::keybd_event(0x12, 0, 0, [UIntPtr]::Zero); [Front]::keybd_event(0x12, 0, 2, [UIntPtr]::Zero)  # Alt tap lets SetForegroundWindow succeed
[Front]::ShowWindow($h, 3) | Out-Null   # SW_MAXIMIZE
[Front]::BringWindowToTop($h) | Out-Null
[Front]::SetForegroundWindow($h) | Out-Null
(New-Object -ComObject WScript.Shell).AppActivate($p.Id) | Out-Null
Write-Output "front: $($p.MainWindowTitle)"
