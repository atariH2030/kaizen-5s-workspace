param(
  [switch]$Linked
)

$ErrorActionPreference = "Stop"

$migrationsPath = Join-Path $PSScriptRoot "migrations"
if (-not (Test-Path $migrationsPath)) {
  Write-Error "Pasta de migrações não encontrada: $migrationsPath"
}

$files = Get-ChildItem -Path $migrationsPath -Filter "*.sql" | Sort-Object Name
if (-not $files -or $files.Count -eq 0) {
  Write-Host "Nenhuma migração encontrada em $migrationsPath"
  exit 0
}

Write-Host "Aplicando migrações em ordem..."

foreach ($file in $files) {
  Write-Host "-> $($file.Name)"

  if ($Linked) {
    supabase db execute --linked --file $file.FullName
  }
  else {
    supabase db execute --file $file.FullName
  }
}

Write-Host "Migrações aplicadas com sucesso."
