# Bring Roblox Studio to the front and save a screenshot of its window (fallback when the MCP screen_capture times out).
#   powershell -File studio_grab.ps1 -Out C:\path\shot.png [-TitleLike '*Roblox Studio'] [-DelayMs 600]
param([Parameter(Mandatory = $true)][string]$Out, [string]$TitleLike = '*Roblox Studio', [int]$DelayMs = 600)
Add-Type -AssemblyName System.Drawing
if (-not ([System.Management.Automation.PSTypeName]'Grab').Type) {
Add-Type @"
using System; using System.Runtime.InteropServices;
public class Grab {
  [StructLayout(LayoutKind.Sequential)] public struct RECT { public int L, T, R, B; }
  [DllImport("user32.dll")] public static extern bool SetProcessDPIAware();
  [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr h, out RECT r);
  [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr h);
  [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr h, int n);
  [DllImport("user32.dll")] public static extern bool BringWindowToTop(IntPtr h);
  [DllImport("user32.dll")] public static extern void keybd_event(byte k, byte s, uint f, UIntPtr e);
}
"@
}
[Grab]::SetProcessDPIAware() | Out-Null
$p = Get-Process RobloxStudioBeta | Where-Object { $_.MainWindowTitle -like $TitleLike } | Select-Object -First 1
if (-not $p) { Write-Output "ERROR: no Studio window like '$TitleLike'"; exit 2 }
$h = $p.MainWindowHandle
[Grab]::keybd_event(0x12, 0, 0, [UIntPtr]::Zero); [Grab]::keybd_event(0x12, 0, 2, [UIntPtr]::Zero)
[Grab]::ShowWindow($h, 3) | Out-Null
[Grab]::BringWindowToTop($h) | Out-Null
[Grab]::SetForegroundWindow($h) | Out-Null
Start-Sleep -Milliseconds $DelayMs
$r = New-Object Grab+RECT
[Grab]::GetWindowRect($h, [ref]$r) | Out-Null
$w = $r.R - $r.L; $ht = $r.B - $r.T
$bmp = New-Object System.Drawing.Bitmap $w, $ht
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.CopyFromScreen($r.L, $r.T, 0, 0, (New-Object System.Drawing.Size $w, $ht))
New-Item -ItemType Directory -Force (Split-Path $Out) | Out-Null
$bmp.Save($Out, [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose(); $bmp.Dispose()
Write-Output "saved $Out ($w x $ht)"
