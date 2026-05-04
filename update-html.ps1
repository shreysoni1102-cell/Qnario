$frontendPath = "E:\PROJECTs\1_Final\Qnario-C01\frontend"
$files = @(
    "admin-login.html",
    "forgot-password.html",
    "reset-password.html",
    "signup.html",
    "student-create-exam.html",
    "student-dashboard.html",
    "student-login.html",
    "student-practice-taker.html",
    "student-practice.html",
    "student-quiz-result.html",
    "student-quiz-taker.html",
    "student-syllabus-exam.html",
    "student-syllabus-result.html",
    "teacher-AI-Question`'s.html",
    "teacher-ai-question-generator.html",
    "teacher-create-exam.html",
    "teacher-create-quiz.html",
    "teacher-login.html",
    "teacher-quiz-analytics.html",
    "teacher-syllabus-monitor.html",
    "teacher-syllabus-papers.html",
    "teacher-syllabus-upload.html"
)

Write-Host "`n=== UPDATING HTML FILES WITH API CONFIG ===" -ForegroundColor Green
$updatesSummary = @()

foreach ($file in $files) {
    $filePath = Join-Path -Path $frontendPath -ChildPath $file
    
    if (-not (Test-Path -Path $filePath)) {
        Write-Host "? File not found: $file" -ForegroundColor Red
        $updatesSummary += @{ File = $file; Status = "NOT FOUND"; Changes = 0 }
        continue
    }
    
    $content = Get-Content -Path $filePath -Raw
    $originalContent = $content
    $changeCount = 0
    
    if ($content -match "</head>") {
        $content = $content -replace "</head>", "`t<script src=`"config.js`"></script>`n</head>"
        $changeCount++
    }
    
    $pattern1 = "fetch\('\/api\/"
    if ($content -match $pattern1) {
        $count1 = ($content | Select-String $pattern1 -AllMatches).Matches.Count
        $content = $content -replace $pattern1, "fetch(\`\${window.API_CONFIG.API_BASE_URL}/api/"
        $changeCount += $count1
    }
    
    $pattern2 = "fetch\(\`\/api\/"
    if ($content -match $pattern2) {
        $count2 = ($content | Select-String $pattern2 -AllMatches).Matches.Count
        $content = $content -replace $pattern2, "fetch(\`\${window.API_CONFIG.API_BASE_URL}/api/"
        $changeCount += $count2
    }
    
    if ($content -ne $originalContent) {
        Set-Content -Path $filePath -Value $content -NoNewline -Encoding UTF8
        Write-Host "? Updated: $file ($changeCount changes)" -ForegroundColor Green
        $updatesSummary += @{ File = $file; Status = "UPDATED"; Changes = $changeCount }
    } else {
        Write-Host "- No changes: $file" -ForegroundColor Yellow
        $updatesSummary += @{ File = $file; Status = "NOCHANGE"; Changes = 0 }
    }
}

Write-Host "`n=== DETAILED SUMMARY ===" -ForegroundColor Cyan
foreach ($item in $updatesSummary) {
    Write-Host "$($item.File): $($item.Status) ($($item.Changes) changes)"
}

$updated = @($updatesSummary | Where-Object { $_.Status -eq "UPDATED" }).Count
Write-Host "`nTotal files processed: $($files.Count)" -ForegroundColor Cyan
Write-Host "Files updated: $updated" -ForegroundColor Green
