#!/usr/bin/env node

/**
 * Script de Versionamento Semântico e Gestão de Releases (SemVer)
 * ITMIZER VR (VRGYN)
 *
 * Uso:
 *   node scripts/bump-version.js patch "descrição da correção"
 *   node scripts/bump-version.js minor "descrição da nova funcionalidade"
 *   node scripts/bump-version.js major "descrição da grande atualização"
 *   node scripts/bump-version.js rollback v1.0.0
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT_DIR = path.resolve(__dirname, '..');
const VERSION_JSON_PATH = path.join(ROOT_DIR, 'version.json');
const FRONTEND_CONFIG_PATH = path.join(ROOT_DIR, 'frontend', 'src', 'config', 'version.ts');
const FRONTEND_PKG_PATH = path.join(ROOT_DIR, 'frontend', 'package.json');
const BACKEND_PKG_PATH = path.join(ROOT_DIR, 'backend', 'package.json');
const BACKEND_SERVICE_PATH = path.join(ROOT_DIR, 'backend', 'src', 'app.service.ts');

function runCommand(command) {
  try {
    return execSync(command, { cwd: ROOT_DIR, stdio: 'inherit' });
  } catch (error) {
    console.error(`Erro ao executar comando: ${command}`);
    process.exit(1);
  }
}

function parseSemVer(versionStr) {
  const match = versionStr.match(/^(\d+)\.(\d+)\.(\d+)$/);
  if (!match) {
    throw new Error(`Formato de versão inválido: ${versionStr}. Esperado: X.Y.Z`);
  }
  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10),
  };
}

function bump(currentVersion, type) {
  const semver = parseSemVer(currentVersion);
  if (type === 'major') {
    semver.major += 1;
    semver.minor = 0;
    semver.patch = 0;
  } else if (type === 'minor') {
    semver.minor += 1;
    semver.patch = 0;
  } else if (type === 'patch') {
    semver.patch += 1;
  } else {
    throw new Error(`Tipo de incremento inválido: ${type}. Use 'patch', 'minor' ou 'major'.`);
  }
  return `${semver.major}.${semver.minor}.${semver.patch}`;
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0]?.toLowerCase();
  const description = args[1] || 'Incremento de versão';

  if (!command || !['patch', 'minor', 'major', 'rollback'].includes(command)) {
    console.log(`
======================================================
  ITMIZER VR - Controle de Versão e Releases (SemVer)
======================================================

Uso:
  node scripts/bump-version.js <tipo> "<descrição>"

Opções de <tipo>:
  patch     - Correções de bugs e pequenos ajustes (ex: v1.0.0 -> v1.0.1)
  minor     - Novas funcionalidades retrocompatíveis (ex: v1.0.1 -> v1.1.0)
  major     - Alterações que quebram compatibilidade / grandes marcos (ex: v1.1.0 -> v2.0.0)
  rollback  - Reverter código e tags para uma versão anterior (ex: rollback v1.0.0)

Exemplos:
  node scripts/bump-version.js patch "Ajuste na formatação de CPF"
  node scripts/bump-version.js minor "Novo módulo de Dossiê em PDF"
  node scripts/bump-version.js rollback v1.0.0
======================================================
`);
    process.exit(0);
  }

  // Carrega version.json
  if (!fs.existsSync(VERSION_JSON_PATH)) {
    console.error('Arquivo version.json não encontrado!');
    process.exit(1);
  }

  const versionData = JSON.parse(fs.readFileSync(VERSION_JSON_PATH, 'utf-8'));

  if (command === 'rollback') {
    const targetTag = args[1];
    if (!targetTag) {
      console.error('Especifique a tag para rollback. Ex: node scripts/bump-version.js rollback v1.0.0');
      process.exit(1);
    }
    console.log(`\n⏪ Iniciando procedimento de Rollback para a tag: ${targetTag}...`);
    runCommand(`git checkout ${targetTag}`);
    console.log(`\n✅ Rollback realizado com sucesso para ${targetTag}!`);
    return;
  }

  const currentVersion = versionData.version || '1.0.0';
  const newVersion = bump(currentVersion, command);
  const newBuild = (versionData.build || 0) + 1;
  const releaseDate = new Date().toISOString();

  console.log(`\n🚀 Atualizando versão de ${currentVersion} -> ${newVersion} (Build #${newBuild})...`);

  // 1. Atualiza version.json
  versionData.version = newVersion;
  versionData.build = newBuild;
  versionData.releaseDate = releaseDate;
  if (!versionData.history) versionData.history = [];
  versionData.history.unshift({
    version: newVersion,
    build: newBuild,
    date: releaseDate.slice(0, 10),
    type: command,
    description: description,
  });
  fs.writeFileSync(VERSION_JSON_PATH, JSON.stringify(versionData, null, 2) + '\n', 'utf-8');
  console.log(`✔ version.json atualizado.`);

  // 2. Atualiza frontend/src/config/version.ts
  const frontendConfigContent = `export interface SystemVersion {
  version: string;
  build: number;
  releaseDate: string;
  systemName: string;
}

export const APP_VERSION = '${newVersion}';
export const APP_BUILD = ${newBuild};
export const RELEASE_DATE = '${releaseDate}';
export const SYSTEM_NAME = '${versionData.systemName || 'ITMIZER VR (VRGYN)'}';

export const VERSION_INFO: SystemVersion = {
  version: APP_VERSION,
  build: APP_BUILD,
  releaseDate: RELEASE_DATE,
  systemName: SYSTEM_NAME,
};
`;
  fs.writeFileSync(FRONTEND_CONFIG_PATH, frontendConfigContent, 'utf-8');
  console.log(`✔ frontend/src/config/version.ts atualizado.`);

  // 3. Atualiza frontend/package.json
  if (fs.existsSync(FRONTEND_PKG_PATH)) {
    const pkg = JSON.parse(fs.readFileSync(FRONTEND_PKG_PATH, 'utf-8'));
    pkg.version = newVersion;
    fs.writeFileSync(FRONTEND_PKG_PATH, JSON.stringify(pkg, null, 2) + '\n', 'utf-8');
    console.log(`✔ frontend/package.json atualizado.`);
  }

  // 4. Atualiza backend/package.json
  if (fs.existsSync(BACKEND_PKG_PATH)) {
    const pkg = JSON.parse(fs.readFileSync(BACKEND_PKG_PATH, 'utf-8'));
    pkg.version = newVersion;
    fs.writeFileSync(BACKEND_PKG_PATH, JSON.stringify(pkg, null, 2) + '\n', 'utf-8');
    console.log(`✔ backend/package.json atualizado.`);
  }

  // 5. Atualiza backend/src/app.service.ts
  if (fs.existsSync(BACKEND_SERVICE_PATH)) {
    let serviceContent = fs.readFileSync(BACKEND_SERVICE_PATH, 'utf-8');
    serviceContent = serviceContent.replace(/export const APP_VERSION = '[^']+';/, `export const APP_VERSION = '${newVersion}';`);
    serviceContent = serviceContent.replace(/export const APP_BUILD = \d+;/, `export const APP_BUILD = ${newBuild};`);
    serviceContent = serviceContent.replace(/export const RELEASE_DATE = '[^']+';/, `export const RELEASE_DATE = '${releaseDate}';`);
    fs.writeFileSync(BACKEND_SERVICE_PATH, serviceContent, 'utf-8');
    console.log(`✔ backend/src/app.service.ts atualizado.`);
  }

  // 6. Git commit e tag
  const tagName = `v${newVersion}`;
  const commitMsg = `chore(release): ${tagName} - ${description}`;

  console.log(`\n📦 Criando commit e tag no Git...`);
  runCommand('git add .');
  runCommand(`git commit -m "${commitMsg}"`);
  runCommand(`git tag -a ${tagName} -m "Release ${tagName}: ${description}"`);

  console.log(`\n📤 Enviando commit e tag para o GitHub...`);
  try {
    runCommand('git push origin main');
    runCommand('git push origin --tags');
    console.log(`\n✨ Release ${tagName} publicada com sucesso no GitHub!`);
  } catch (err) {
    console.warn('\n⚠️ Aviso: Não foi possível realizar o push automático para o remote origin.');
  }
}

main().catch(console.error);
