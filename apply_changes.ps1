# Backup files first
Copy-Item "pages\Welcome.tsx" "pages\Welcome.tsx.backup"
Copy-Item "pages\Auth.tsx" "pages\Auth.tsx.backup"
Copy-Item "pages\Onboarding.tsx" "pages\Onboarding.tsx.backup"
Copy-Item "services\supabase.ts" "services\supabase.ts.backup"

Write-Host "Backups created successfully" -ForegroundColor Green
