---
name: sistema-versionamento
description: Gestão e automação do versionamento semântico (SemVer) e fluxo de releases do ITmizer-VR (VRGYN). Sincroniza version.json, frontend, backend, tags Git e procedimentos de rollback.
---

# ITmizer-VR — Sistema de Versionamento Semântico e Releases (SemVer)

Esta skill documenta o padrão e o fluxo automatizado de **Versionamento Semântico (SemVer)** e **Gestão de Releases** do **ITMIZER VR (VRGYN)**.

---

## 🎯 Visão Geral do Versionamento

O sistema adota o formato SemVer **`MAJOR.MINOR.PATCH`** sincronizado automaticamente entre todos os ecossistemas:
1. **Raiz**: `version.json` (Histórico completo de releases, build number e data de corte).
2. **Frontend (Vite/React)**: `frontend/src/config/version.ts` e `frontend/package.json` (Exibido no rodapé do sidebar e dashboard).
3. **Backend (NestJS)**: `backend/package.json` e `backend/src/app.service.ts` (Retornado no endpoint `GET /api/version` ou `GET /`).
4. **Git**: Tags anotadas no repositório (ex: `v1.0.1`).

---

## 🚀 Como Lançar Novas Versões (`scripts/bump-version.js`)

O projeto dispõe do script utilitário `scripts/bump-version.js` para realizar toda a sincronização e tageamento com um único comando.

### 1. Patch (Correções e Pequenos Ajustes)
Use para correções de bugs, pequenas melhorias de layout ou ajustes sem novas regras de negócio.
```powershell
node scripts/bump-version.js patch "Correção na máscara de CPF e visualização de credenciais"
```
*Exemplo: `1.0.0` $\rightarrow$ `1.0.1`*

### 2. Minor (Novas Funcionalidades Retrocompatíveis)
Use ao adicionar novas telas, novos módulos (ex: Dossiê de Cliente, Novo Relatório de Migração, Acompanhamento de Casos Críticos) ou novos endpoints.
```powershell
node scripts/bump-version.js minor "Módulo de Auditoria de Acessos a Credenciais"
```
*Exemplo: `1.0.1` $\rightarrow$ `1.1.0`*

### 3. Major (Grandes Marcos ou Mudanças de Arquitetura)
Use para refatorações profundas de banco de dados, migração de arquitetura ou grandes marcos de produto.
```powershell
node scripts/bump-version.js major "Lançamento do Portal de Implantação 2.0"
```
*Exemplo: `1.1.0` $\rightarrow$ `2.0.0`*

---

## 🔄 Procedimento de Rollback de Release

Caso uma release recém-publicada apresente instabilidades em produção, execute o rollback controlado:

```powershell
node scripts/bump-version.js rollback v1.0.0
```

O comando de rollback:
1. Valida a existência da tag anterior no Git.
2. Restaura o arquivo `version.json` e os arquivos de configuração para a versão solicitada.
3. Permite reverter o deploy com rastreabilidade completa.

---

## 📋 Checklist Obrigatório de Release

Antes de rodar o `bump-version.js` e publicar uma release:

1. **Compilação do Backend**:
   ```powershell
   cd backend ; npm run build
   ```
2. **Compilação do Frontend**:
   ```powershell
   cd frontend ; npm run build
   ```
3. **Incremento da Versão e Registro**:
   ```powershell
   node scripts/bump-version.js <patch|minor|major> "<Descrição concisa do que foi entregue>"
   ```
4. **Envio ao Repositório Remoto (Git Push + Tags)**:
   ```powershell
   git push origin main --tags
   ```
5. **Atualização da Memória de Alterações**:
   - Registrar o resumo da release em `docs/AGENT_MEMORY.md`.
