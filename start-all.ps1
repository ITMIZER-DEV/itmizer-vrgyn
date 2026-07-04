Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; npm run start:dev" -NoNewWindow:$false
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev" -NoNewWindow:$false

Write-Host "Todas as aplicações foram iniciadas em novas janelas do terminal." -ForegroundColor Green
