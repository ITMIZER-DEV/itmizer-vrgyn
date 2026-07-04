# Script de automação para atualizar variáveis Vercel do Backend
echo "Iniciando atualização de variáveis de ambiente..."

# DATABASE_URL (Accelerate)
"prisma+postgres://accelerate.prisma-data.net/?api_key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqd3RfaWQiOjEsInNlY3VyZV9rZXkiOiJza19PWV9vYWNIZDVnTC1WZi1vcVg5TWUiLCJhcGlfa2V5IjoiMDFLSzJRUUo4MU1CRzM3NjQyUFI2TlhTNTkiLCJ0ZW5hbnRfaWQiOiI4NmU3MzMyZmZmZWIzNzNmZWIyMjA4M2IyNmEzNjFjMzUwNDdhNzE5MTEyYWNkOTA4N2FiZTJmZmMxODNhNTI1IiwiaW50ZXJuYWxfc2VjcmV0IjoiY2Q0YzgxNGMtMDlkYy00YTNjLWI2MzctNGIxYjAwZTQ2OGMyIn0.TPiPEZ4naD10fhj2uBtAzmwmsF2g30dg6-MdpYMNL78" | vercel env add DATABASE_URL production

# DIRECT_URL
"postgres://86e7332fffeb373feb22083b26a361c35047a719112acd9087abe2ffc183a525:sk_OY_oacHd5gL-Vf-oqX9Me@db.prisma.io:5432/postgres?sslmode=require&pool=true" | vercel env add DIRECT_URL production

# GOOGLE_CLIENT_ID
"861662437462-aiqf9g5nhiqi0f13tv1bki24s9h70amm.apps.googleusercontent.com" | vercel env add GOOGLE_CLIENT_ID production

# JWT_SECRET
"super-secret-key-change-in-production" | vercel env add JWT_SECRET production

# ALLOWED_DOMAINS
"itmizer.com.br,vrgoiania.com,vrsoft.com.br" | vercel env add ALLOWED_DOMAINS production

# JWT_EXPIRES_IN
"1d" | vercel env add JWT_EXPIRES_IN production

echo "✅ Sucesso! Todas as variáveis foram enviadas para o projeto Backend na Vercel."
