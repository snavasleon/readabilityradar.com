$ErrorActionPreference = 'Stop'
$data = Get-Content -LiteralPath (Join-Path $PSScriptRoot 'radar-results.json') -Raw -Encoding utf8 | ConvertFrom-Json
$results = [Collections.Generic.List[object]]::new()
$wordApp = $null
$document = $null
try {
 $wordApp = New-Object -ComObject Word.Application
 $wordApp.Visible = $false
 $wordApp.DisplayAlerts = 0
 $metadata = [ordered]@{software='Microsoft Word';version=[string]$wordApp.Version;build=[string]$wordApp.Build;proofing_language='English (United States)';language_id=1033;metric='Flesch Reading Ease';generated_at=[DateTime]::UtcNow.ToString('o');radar_server_sha256=$data.server_sha256;statistics_indices=@{}}
 foreach ($record in $data.records) {
  $document = $wordApp.Documents.Add()
  $document.Content.Text = [string]$record.text
  $document.Content.LanguageID = 1033
  $document.Content.NoProofing = 0
  $statistics = $document.Content.ReadabilityStatistics
  if ($results.Count -eq 0) {
   for ($i=1; $i -le $statistics.Count; $i++) { $metadata.statistics_indices[[string]$statistics.Item($i).Name] = $i }
   foreach ($name in @('Words','Sentences','Flesch Reading Ease','Flesch-Kincaid Grade Level')) { if (-not $metadata.statistics_indices.ContainsKey($name)) { throw "Missing Word statistic: $name" } }
  }
  $result = [ordered]@{text_id=$record.text_id;word_words=[int]$statistics.Item($metadata.statistics_indices['Words']).Value;word_sentences=[int]$statistics.Item($metadata.statistics_indices['Sentences']).Value;word_flesch_reading_ease=[double]$statistics.Item($metadata.statistics_indices['Flesch Reading Ease']).Value;word_flesch_kincaid_grade=[double]$statistics.Item($metadata.statistics_indices['Flesch-Kincaid Grade Level']).Value}
  $results.Add([PSCustomObject]$result)
  $document.Close(0)
  [void][Runtime.InteropServices.Marshal]::FinalReleaseComObject($document)
  $document = $null
  $checkpoint = [ordered]@{metadata=$metadata;records=$results.ToArray()}
  ConvertTo-Json -InputObject $checkpoint -Depth 7 | Set-Content -LiteralPath (Join-Path $PSScriptRoot 'word-results.json') -Encoding utf8
  if ($results.Count % 10 -eq 0) { Write-Output "Compared $($results.Count)/100 texts with Microsoft Word." }
 }
 if ($results.Count -ne 100) { throw 'Incomplete comparison' }
 Write-Output 'All 100 Word readability measurements recorded.'
} finally {
 if ($null -ne $document) { $document.Close(0) }
 if ($null -ne $wordApp) { $wordApp.Quit(0); [void][Runtime.InteropServices.Marshal]::FinalReleaseComObject($wordApp) }
}
