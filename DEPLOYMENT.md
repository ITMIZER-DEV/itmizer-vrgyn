# Guia de Deploy - Itmizer VR

Este documento descreve como realizar o deploy da aplicação (Backend e Frontend) na Vercel.

---

## 1. Backend (NestJS + Prisma)

O backend está localizado na pasta `/backend`.

### Variáveis de Ambiente (Vercel)

No painel da Vercel, acesse **Settings > Environment Variables** e adicione:

| Nome | Valor Exemplo | Descrição |
| :--- | :--- | :--- |
| `DATABASE_URL` | `postgresql://...` | URL de conexão com o Supabase (com pooler se necessário). |
| `DIRECT_URL` | `postgresql://...` | URL direta para o banco (necessária para migrations Prisma). |
| `JWT_SECRET` | `sua_chave_secreta_aqui` | Uma chave aleatória e forte para assinar tokens JWT. |
| `JWT_EXPIRES_IN` | `1d` | Tempo de expiração do token (Ex: 1d, 7d). |

### Como Fazer o Deploy

Navegue até a pasta do backend e use o Vercel CLI:

```bash
cd backend
vercel deploy --prod
```

---

## 2. Frontend (Vite + React)

O frontend está localizado na pasta `/frontend`.

### Variáveis de Ambiente (Vercel)

No painel da Vercel do projeto Frontend, adicione:

| Nome | Valor Exemplo | Descrição |
| :--- | :--- | :--- |
| `VITE_API_URL` | `https://backendvr.itmizer.com.br` | URL da API do seu backend deployado. |

### Como Fazer o Deploy

Navegue até a pasta do frontend e use o Vercel CLI:

```bash
cd frontend
vercel deploy --prod
```

---

## 3. Passo a Passo no Dashboard da Vercel

1. **Novo Projeto**: Clique em "Add New" > "Project".
2. **Importar**: Escolha o repositório ou faça o upload manual.
3. **Framework Preset**:
   - Para o Backend: Escolha "Other" (o `vercel.json` cuida do resto).
   - Para o Frontend: Escolha "Vite".
4. **Environment Variables**: Clique na aba "Environment Variables" e adicione as chaves listadas acima.
5. **Deploy**: Clique em "Deploy".

---

## 4. Swagger UI (Documentação da API)

Após o deploy do backend, a documentação estará disponível em:
`https://seu-dominio-backend.vercel.app/apiDocs`

---

## 5. Solução de Problemas: Erro de Permissão Git (Git Author)

Se você encontrar o erro:
`Error: Git author ... must have access to the team ...`

Isso acontece porque a Vercel tenta validar o seu usuário Git. Como o deploy está sendo feito manualmente (sem integração direta com o GitHub/Git), a solução é remover a pasta `.git` local antes do deploy:

1. Acesse a pasta do projeto (backend ou frontend).
2. Remova a pasta `.git`:
   ```powershell
   # No Windows (PowerShell):
   Remove-Item -Recurse -Force .git
   ```
3. Execute o deploy novamente:
   ```bash
   vercel deploy --prod --yes
   ```
