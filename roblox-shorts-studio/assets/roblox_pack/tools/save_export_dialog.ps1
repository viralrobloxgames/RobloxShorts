# Fills Roblox Studio's "Export Selection" save dialog and clicks Save, so OBJ exports need no clicks.
# Run right after PluginManager():ExportSelection("") has opened the dialog. -TitleLike picks other Studio file
# dialogs (e.g. '*' for the .rbxm dialog of Plugin:PromptSaveSelection).
#   powershell -File save_export_dialog.ps1 -Target C:\path\name.obj [-TimeoutSec 60] [-TitleLike 'Export*']
param([Parameter(Mandatory = $true)][string]$Target, [int]$TimeoutSec = 60, [string]$TitleLike = 'Export*')
Add-Type -AssemblyName UIAutomationClient
Add-Type -AssemblyName UIAutomationTypes
if (-not ([System.Management.Automation.PSTypeName]'StudioDlg').Type) {
Add-Type @"
using System;
using System.Runtime.InteropServices;
public static class StudioDlg {
  [DllImport("user32.dll", CharSet=CharSet.Unicode)] public static extern IntPtr SendMessage(IntPtr h, uint m, IntPtr w, string l);
  [DllImport("user32.dll")] public static extern bool PostMessage(IntPtr h, uint m, IntPtr w, IntPtr l);
  [DllImport("user32.dll")] public static extern bool IsWindow(IntPtr h);
}
"@
}
$AE = [System.Windows.Automation.AutomationElement]
$TS = [System.Windows.Automation.TreeScope]
$PC = [System.Windows.Automation.PropertyCondition]
$walker = [System.Windows.Automation.TreeWalker]::RawViewWalker
New-Item -ItemType Directory -Force (Split-Path $Target) | Out-Null
if (Test-Path $Target) { Remove-Item $Target -Force }

function Find-Dialog {
  foreach ($p in Get-Process RobloxStudioBeta -ErrorAction SilentlyContinue) {
    $main = $AE::RootElement.FindFirst($TS::Children, (New-Object $PC($AE::ProcessIdProperty, $p.Id)))
    if ($main) {
      $d = $main.FindFirst($TS::Children, (New-Object $PC($AE::ClassNameProperty, '#32770')))
      if ($d -and $d.Current.Name -like $TitleLike) { return $d }
    }
  }
  return $null
}
function Find-Control($el, $cls, $id, $depth) {
  if ($depth -gt 9) { return $null }
  $c = $el.Current
  if ($c.ClassName -eq $cls -and $c.AutomationId -eq $id) { return $el }
  $ch = $walker.GetFirstChild($el)
  while ($ch) { $r = Find-Control $ch $cls $id ($depth + 1); if ($r) { return $r }; $ch = $walker.GetNextSibling($ch) }
  return $null
}

$deadline = (Get-Date).AddSeconds($TimeoutSec)
$dlg = $null
while (-not $dlg -and (Get-Date) -lt $deadline) { $dlg = Find-Dialog; if (-not $dlg) { Start-Sleep -Milliseconds 250 } }
if (-not $dlg) { Write-Output "ERROR: no Export dialog appeared"; exit 2 }
Write-Output ("dialog: " + $dlg.Current.Name)
$edit = Find-Control $dlg 'Edit' '1001' 0
$save = Find-Control $dlg 'Button' '1' 0
if (-not $edit -or -not $save) { Write-Output "ERROR: dialog controls not found"; exit 3 }
$he = [IntPtr]$edit.Current.NativeWindowHandle
$hs = [IntPtr]$save.Current.NativeWindowHandle
$hd = [IntPtr]$dlg.Current.NativeWindowHandle
[void][StudioDlg]::SendMessage($he, 0x000C, [IntPtr]::Zero, $Target)     # WM_SETTEXT
Start-Sleep -Milliseconds 150
[void][StudioDlg]::PostMessage($hs, 0x00F5, [IntPtr]::Zero, [IntPtr]::Zero)  # BM_CLICK
# wait for the dialog to close and the OBJ to finish writing
$deadline = (Get-Date).AddSeconds($TimeoutSec)
while ((Get-Date) -lt $deadline) {
  if (-not [StudioDlg]::IsWindow($hd) -and (Test-Path $Target)) {
    $s1 = (Get-Item $Target).Length; Start-Sleep -Milliseconds 700; $s2 = (Get-Item $Target).Length
    if ($s1 -eq $s2 -and $s2 -gt 0) { Write-Output "SAVED $Target ($s2 bytes)"; exit 0 }
  }
  Start-Sleep -Milliseconds 300
}
Write-Output "ERROR: timed out waiting for $Target"; exit 4
