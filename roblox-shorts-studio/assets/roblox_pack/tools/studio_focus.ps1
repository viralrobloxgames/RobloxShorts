# Studio only renders (meshes, clothing composites, screenshots) while it is the active window.
#   studio_focus.ps1 -Mode Front     -> remember the current foreground window, bring Studio to the front
#   studio_focus.ps1 -Mode Restore   -> give focus back to the remembered window
param([ValidateSet('Front', 'Restore')][string]$Mode = 'Front')
if (-not ([System.Management.Automation.PSTypeName]'FocusW32').Type) {
Add-Type @"
using System;
using System.Runtime.InteropServices;
public static class FocusW32 {
  [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
  [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr h);
  [DllImport("user32.dll")] public static extern bool BringWindowToTop(IntPtr h);
  [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr h, int cmd);
  [DllImport("user32.dll")] public static extern bool IsIconic(IntPtr h);
  [DllImport("user32.dll")] public static extern bool IsWindow(IntPtr h);
  [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr h, out uint pid);
  [DllImport("user32.dll")] public static extern bool AttachThreadInput(uint a, uint b, bool attach);
  [DllImport("kernel32.dll")] public static extern uint GetCurrentThreadId();
  public static bool Focus(IntPtr h) {
    IntPtr fg = GetForegroundWindow();
    uint pid;
    uint fgThread = GetWindowThreadProcessId(fg, out pid);
    uint me = GetCurrentThreadId();
    bool attached = fgThread != me && AttachThreadInput(me, fgThread, true);
    if (IsIconic(h)) ShowWindow(h, 9);
    BringWindowToTop(h);
    bool ok = SetForegroundWindow(h);
    if (attached) AttachThreadInput(me, fgThread, false);
    return ok && GetForegroundWindow() == h;
  }
}
"@
}
$state = Join-Path $env:TEMP 'roblox_pack_prev_foreground.txt'
if ($Mode -eq 'Front') {
  $studio = (Get-Process RobloxStudioBeta | Select-Object -First 1).MainWindowHandle
  $prev = [FocusW32]::GetForegroundWindow()
  if ($prev -ne $studio) { Set-Content -Path $state -Value ([int64]$prev) }
  $ok = [FocusW32]::Focus($studio)
  Write-Output "Studio foreground: $ok (previous window $prev)"
} else {
  if (Test-Path $state) {
    $prev = [IntPtr][int64](Get-Content $state)
    if ([FocusW32]::IsWindow($prev)) { $ok = [FocusW32]::Focus($prev); Write-Output "Restored previous window: $ok" }
    Remove-Item $state -Force
  } else { Write-Output "Nothing to restore" }
}
