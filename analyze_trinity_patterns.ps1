# PowerShell script to analyze Trinity Showcase comments patterns
$comments = Get-Content "trinity_comments.json" | ConvertFrom-Json

Write-Host "Total comments: $($comments.Count)"

# Define patterns
$patterns = @(
    @{
        type = "myth"
        label = "Startup Myths"
        keywords = @("lie", "myth", "believe", "wrong", "mistake", "think", "thought", "assumed", "false", "delusion", "trap", "illusion")
    },
    @{
        type = "failure"
        label = "Failure Patterns"
        keywords = @("fail", "failed", "failure", "waste", "wasted", "lose", "lost", "burn", "burned", "zero", "struggling", "disaster", "quit", "gave up", "shut down", "no customers", "no users", "pivot")
    },
    @{
        type = "advice"
        label = "Advice & Lessons"
        keywords = @("should", "advice", "lesson", "learn", "tip", "recommend", "suggest", "important", "crucial", "must", "key", "focus on")
    },
    @{
        type = "validation"
        label = "Validation Signals"
        keywords = @("validate", "validation", "test", "hypothesis", "customer", "problem", "pain", "research", "interview", "survey", "feedback", "market")
    }
)

# Function to check if text contains any keyword
function ContainsAny($text, $keywords) {
    $lowerText = $text.ToLower()
    foreach ($keyword in $keywords) {
        if ($lowerText.Contains($keyword)) {
            return $true
        }
    }
    return $false
}

# Analyze each pattern
$results = @()
$totalComments = $comments.Count

foreach ($pattern in $patterns) {
    $matchedComments = @()
    foreach ($comment in $comments) {
        if (ContainsAny $comment.content $pattern.keywords) {
            $matchedComments += $comment
        }
    }

    $count = $matchedComments.Count
    $percentage = [math]::Round(($count / $totalComments) * 100, 1)

    $results += @{
        type = $pattern.type
        label = $pattern.label
        count = $count
        percentage = $percentage
        keywords = $pattern.keywords
    }

    Write-Host "$($pattern.label): $count comments ($percentage%)"
}

# Calculate validation score
$weights = @(
    @{ type = "failure"; maxScore = 40; multiplier = 1.0; volumeBonus50 = 10; volumeBonus100 = 10 }
    @{ type = "validation"; maxScore = 30; multiplier = 0.8; volumeBonus50 = 0; volumeBonus100 = 0 }
    @{ type = "myth"; maxScore = 20; multiplier = 0.5; volumeBonus50 = 0; volumeBonus100 = 0 }
    @{ type = "advice"; maxScore = 10; multiplier = 0.2; volumeBonus50 = 0; volumeBonus100 = 0 }
)

$score = 0
foreach ($weight in $weights) {
    $patternResult = $results | Where-Object { $_.type -eq $weight.type }
    if ($patternResult) {
        $contribution = [math]::Min($weight.maxScore, [math]::Round(($patternResult.count / $totalComments) * 100 * $weight.multiplier))
        $score += $contribution
    }
}

# Volume bonuses
if ($totalComments -ge 50) { $score += 10 }
if ($totalComments -ge 100) { $score += 10 }
$score = [math]::Min(100, $score)

Write-Host "`nValidation Score: $score/100"

# Output detailed results
Write-Host "`nDetailed Analysis:"
foreach ($result in ($results | Sort-Object count -Descending)) {
    Write-Host "$($result.label): $($result.count) ($($result.percentage)%)"
}