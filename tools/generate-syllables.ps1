param([int]$StartIndex=1,[switch]$SkipExisting,[int[]]$OnlyIndices=@())
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Speech
$taskRepo = Split-Path -Parent $PSScriptRoot
$taskEntries = Get-Content -Raw -Encoding utf8 (Join-Path $taskRepo 'data/syllables.json') | ConvertFrom-Json
$taskOutput = Join-Path $taskRepo 'audio/syllable-clear'
New-Item -ItemType Directory -Force -Path $taskOutput | Out-Null
$taskSynth = New-Object System.Speech.Synthesis.SpeechSynthesizer
try {
  $taskSynth.SelectVoice('Microsoft Hanhan Desktop')
  $taskSynth.Rate = -4
  $taskCreated = 0
  for ($taskIndex = [Math]::Max(0,$StartIndex-1); $taskIndex -lt $taskEntries.Count; $taskIndex++) {
    if($OnlyIndices.Count -gt 0 -and ($taskIndex+1) -notin $OnlyIndices){continue}
    $taskFile = Join-Path $taskOutput ('s{0:d2}.wav' -f ($taskIndex + 1))
    if($SkipExisting -and (Test-Path -LiteralPath $taskFile)){continue}
    $taskSynth.SetOutputToWaveFile($taskFile)
    $taskWord = [System.Security.SecurityElement]::Escape([string]$taskEntries[$taskIndex][2])
    $taskSynth.SpeakSsml('<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="zh-TW"><break time="200ms"/>' + $taskWord + '<break time="600ms"/></speak>')
    $taskSynth.SetOutputToNull()
    $taskCreated++
  }
  Write-Output ('Created {0} slower zh-TW samples with 200 ms lead-in and 600 ms tail.' -f $taskCreated)
} finally { $taskSynth.Dispose() }
