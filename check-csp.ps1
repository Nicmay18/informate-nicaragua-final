 = Invoke-WebRequest -Uri 'https://nicaraguainformate.com' -Method Head -UseBasicParsing; .Headers['Content-Security-Policy']  
