# Brings the browser tab whose title contains -Title to the front (set document.title to a marker first).
#   powershell -File browser_focus_tab.ps1 -Title CLAUDE-UPLOAD-TAB [-Process brave]
param([string]$Title, [string]$Process = 'brave')
Add-Type -AssemblyName UIAutomationClient, UIAutomationTypes
$p = Get-Process $Process -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowHandle -ne 0 } | Select-Object -First 1
if (-not $p) { Write-Output "NO_WINDOW $Process"; exit 1 }
$win = [System.Windows.Automation.AutomationElement]::FromHandle($p.MainWindowHandle)
$cond = New-Object System.Windows.Automation.PropertyCondition([System.Windows.Automation.AutomationElement]::ControlTypeProperty, [System.Windows.Automation.ControlType]::TabItem)
$hit = $null
foreach ($t in $win.FindAll([System.Windows.Automation.TreeScope]::Descendants, $cond)) { if ($t.Current.Name -like "*$Title*") { $hit = $t } }
if (-not $hit) { Write-Output "NO_TAB $Title"; exit 1 }
$hit.GetCurrentPattern([System.Windows.Automation.SelectionItemPattern]::Pattern).Select()
Start-Sleep -Milliseconds 700
Write-Output ("ACTIVE " + (Get-Process -Id $p.Id).MainWindowTitle)
