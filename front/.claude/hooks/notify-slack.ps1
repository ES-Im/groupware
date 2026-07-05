# Claude Code Hook -> Slack Incoming Webhook 알림 스크립트
# 사용처: settings.json의 hooks.Notification / hooks.Stop 에서 호출된다.
# 알림 전송 실패가 Claude Code 동작을 막으면 안 되므로 항상 exit 0으로 종료한다.

param(
  [Parameter(Mandatory = $true)]
  [ValidateSet("Notification", "Stop")]
  [string]$EventType
)

$ErrorActionPreference = "Stop"

try {
  # Webhook URL은 시스템 환경변수가 아니라 .claude/.env 파일에서 읽는다.
  # 훅은 별도 프로세스로 실행되어 .env가 자동 로드되지 않으므로 직접 파싱한다.
  # ($PSScriptRoot = .claude/hooks 이므로 상위 폴더의 .env를 가리킨다.)
  $webhookUrl = $env:SLACK_WEBHOOK_URL
  $envFile = Join-Path (Split-Path -Parent $PSScriptRoot) ".env"
  if ([string]::IsNullOrWhiteSpace($webhookUrl) -and (Test-Path $envFile)) {
    foreach ($line in Get-Content -LiteralPath $envFile -Encoding UTF8) {
      $trimmed = $line.Trim()
      if ($trimmed.StartsWith("#") -or -not $trimmed.Contains("=")) { continue }
      $key, $value = $trimmed -split "=", 2
      if ($key.Trim() -eq "SLACK_WEBHOOK_URL") {
        $webhookUrl = $value.Trim().Trim('"').Trim("'")
        break
      }
    }
  }

  if ([string]::IsNullOrWhiteSpace($webhookUrl)) {
    Write-Error "SLACK_WEBHOOK_URL을 환경변수 또는 .claude/.env에서 찾을 수 없습니다."
    exit 0
  }

  # Claude Code가 stdin으로 넘기는 JSON은 UTF-8이지만, PowerShell 5.1의 [Console]::In은
  # 시스템 기본 코드페이지(CP949 등)로 디코딩해 한글이 깨진다. 표준입력 스트림을
  # UTF-8 StreamReader로 직접 감싸서 읽어야 원문 그대로 보존된다.
  $utf8Reader = New-Object System.IO.StreamReader([Console]::OpenStandardInput(), [System.Text.Encoding]::UTF8)
  $stdinRaw = $utf8Reader.ReadToEnd()
  $payload = $null
  if (-not [string]::IsNullOrWhiteSpace($stdinRaw)) {
    try { $payload = $stdinRaw | ConvertFrom-Json } catch { $payload = $null }
  }

  $cwd = if ($payload -and $payload.cwd) { $payload.cwd } else { (Get-Location).Path }
  $projectName = Split-Path -Leaf $cwd

  switch ($EventType) {
    "Notification" {
      $detail = if ($payload -and $payload.message) { $payload.message } else { "권한 확인이 필요합니다." }
      $emoji = ":lock:"
      $title = "Claude Code 권한 요청"
    }
    "Stop" {
      $detail = "작업이 완료되어 응답을 마쳤습니다."
      $emoji = ":white_check_mark:"
      $title = "Claude Code 작업 완료"
    }
  }

  $text = "$emoji *$title* (" + $projectName + ")`n" + $detail

  $body = @{ text = $text } | ConvertTo-Json -Compress -Depth 5

  Invoke-RestMethod -Uri $webhookUrl -Method Post -ContentType "application/json; charset=utf-8" -Body ([System.Text.Encoding]::UTF8.GetBytes($body)) | Out-Null
}
catch {
  Write-Error "Slack 알림 전송 실패: $($_.Exception.Message)"
}
finally {
  exit 0
}
