$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Speech
$taskRepo = Split-Path -Parent $PSScriptRoot
$taskOutput = Join-Path $taskRepo 'audio/help'
New-Item -ItemType Directory -Force -Path $taskOutput | Out-Null
$taskPrompts = @{
  home = '先選你的座號。想自己玩，點一個小人。想輪流玩，點兩隻小動物。想搶答，點閃電。再選下面的一座島。想看收集的角色，點上面的蛋。'
  listen = '先聽聲音，再點你聽到的注音。想再聽一次，就點喇叭。'
  spelling = '先聽聲音。選兩塊注音積木，放到上面，再點打勾。想再聽一次，就點喇叭。'
  race = '站在自己的小動物這一邊。兩人都點小動物，準備好。一起聽完，看到閃電，就可以搶答。'
}
$taskSynth = New-Object System.Speech.Synthesis.SpeechSynthesizer
try {
  $taskSynth.SelectVoice('Microsoft Hanhan Desktop')
  $taskSynth.Rate = -1
  foreach ($taskPrompt in $taskPrompts.GetEnumerator()) {
    $taskSynth.SetOutputToWaveFile((Join-Path $taskOutput ($taskPrompt.Key + '.wav')))
    $taskSynth.Speak($taskPrompt.Value)
    $taskSynth.SetOutputToNull()
  }
  Write-Output 'Created 4 zh-TW spoken instructions.'
} finally { $taskSynth.Dispose() }
