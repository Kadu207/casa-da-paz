# Projetos Cursor — Windows + Debian 13 sincronizados

## Objetivo

Mesma pasta de projetos nos dois SOs, com deploy VPS via **chave SSH no Linux** e **senha no Windows** (sem chave local).

## Caminhos espelhados (recomendado)

| SO | Caminho raiz dos projetos | Casa da Paz |
|----|---------------------------|-------------|
| **Windows** | `C:\Users\Carlos\OneDrive\Área de Trabalho\Projetos DEV` | `...\Projetos DEV\Casa da Paz` |
| **Debian 13** | `~/Projetos DEV` | `~/Projetos DEV/Casa da Paz` |

Abra no Cursor **sempre** a pasta do repo (`Casa da Paz`), não só `Projetos DEV`.

## Opção A — OneDrive (já usa no Windows)

1. Instale cliente OneDrive no Debian (`rclone` + mount, ou [abraunegg/onedrive](https://github.com/abraunegg/onedrive)).
2. Sincronize a pasta remota equivalente a **Área de Trabalho** para `~/OneDrive` ou direto para `~/Projetos DEV`.
3. No Cursor (Linux): **File → Open Folder** → `~/Projetos DEV/Casa da Paz`.

**Cuidado:** não edite o mesmo arquivo nos dois PCs ao mesmo tempo; feche Cursor em um antes de abrir no outro, ou use Git como árbitro.

## Opção B — Syncthing (sync P2P, muito estável para dev)

1. Instale Syncthing no Windows e no Debian.
2. Compartilhe `Projetos DEV` ↔ pasta idêntica no outro host.
3. Caminho Linux sugerido: `~/Projetos DEV`.

## Opção C — Git only (sem sync de pasta)

Cada máquina clona `kadu207/casa-da-paz`. Não há mirror automático de arquivos não commitados; bom se você sempre commita antes de trocar de máquina.

## SSH para VPS

| Máquina | Auth | Script deploy frontend |
|---------|------|------------------------|
| Windows | Senha (sem chave) | `.\scripts\sync-frontend-vps.ps1 -PasswordOnly -RestartFrontend` |
| Debian 13 | Chave em `~/.ssh` | `./scripts/sync-frontend-vps.sh --restart` |

Chave no Linux (uma vez):

```bash
ssh-copy-id gestaoti@128.140.77.31
ssh gestaoti@128.140.77.31   # deve entrar sem senha
chmod +x scripts/sync-frontend-vps.sh
```

## Checklist pós-sync

1. `cd frontend && npm run build`
2. Sync (PS1 ou SH conforme SO)
3. Smoke: https://casadapaz.inovatitech.com.br/app/financeiro/lancamentos
4. Cloudflare purge se HTML em cache
