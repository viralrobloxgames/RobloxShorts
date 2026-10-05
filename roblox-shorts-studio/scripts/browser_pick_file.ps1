# Opens a web page's native file picker with a real mouse click and fills in the path, so nobody has to click.
# X/Y are screen coordinates of the page's upload button (see references/scheduling-workflow.md for the formula).
#   powershell -File browser_pick_file.ps1 -X 640 -Y 400 -Path C:\full\path\video.mp4 [-Process brave]
param([int]$X, [int]$Y, [string]$Path, [string]$Process = 'brave')
if (-not (Test-Path $Path)) { Write-Output "NO_FILE $Path"; exit 1 }
Add-Type @"
using System; using System.Runtime.InteropServices; using System.Text;
public class M {
  [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr h);
  [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr h, int c);
  [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
  [DllImport("user32.dll", CharSet=CharSet.Unicode)] public static extern int GetWindowText(IntPtr h, StringBuilder s, int n);
  [DllImport("user32.dll")] public static extern bool SetCursorPos(int x, int y);
  [DllImport("user32.dll")] public static extern void mouse_event(uint f, uint x, uint y, uint d, UIntPtr e);
  [DllImport("user32.dll")] public static extern void keybd_event(byte k, byte s, uint f, UIntPtr e);
}
"@
$p = Get-Process $Process -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowHandle -ne 0 } | Select-Object -First 1
if (-not $p) { Write-Output "NO_WINDOW $Process"; exit 1 }
# An Alt tap lets a background process take the foreground.
[M]::keybd_event(0x12, 0, 0, [UIntPtr]::Zero); [M]::keybd_event(0x12, 0, 2, [UIntPtr]::Zero)
[M]::SetForegroundWindow($p.MainWindowHandle) | Out-Null
Start-Sleep -Milliseconds 500
$sb = New-Object System.Text.StringBuilder 256
[M]::GetWindowText([M]::GetForegroundWindow(), $sb, 256) | Out-Null
if ([M]::GetForegroundWindow() -ne $p.MainWindowHandle) { Write-Output ("WRONG_FOREGROUND " + $sb.ToString()); exit 1 }
[M]::SetCursorPos($X, $Y) | Out-Null
Start-Sleep -Milliseconds 150
[M]::mouse_event(2, 0, 0, 0, [UIntPtr]::Zero); [M]::mouse_event(4, 0, 0, 0, [UIntPtr]::Zero)
& "$env:USERPROFILE\.claude\fill_open_dialog.ps1" -Path $Path
