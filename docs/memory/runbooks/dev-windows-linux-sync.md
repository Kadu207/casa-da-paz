# Projetos Cursor â€” Windows + Debian 13 sincronizados

## Objetivo

Mesma pasta de projetos nos dois SOs, com deploy VPS via **chave SSH no Linux** e **senha no Windows** (sem chave local).

## Caminhos espelhados (recomendado)

| SO | Caminho raiz dos projetos | Casa da Paz |
|----|---------------------------|-------------|
| **Windows** | `C:\Projetos DEV` | `C:\Projetos DEV\Casa da Paz` |
| **Debian 13** | `~/Projetos DEV` | `~/Projetos DEV/Casa da Paz` |

Abra no Cursor **sempre** a pasta do repo (`Casa da Paz`), nÃ£o sÃ³ `Projetos DEV`.

## OpÃ§Ã£o A â€” OneDrive (opcional)

1. Instale cliente OneDrive no Debian (`rclone` + mount, ou [abraunegg/onedrive](https://github.com/abraunegg/onedrive)).
2. Sincronize `C:\Projetos DEV` (Windows) para `~/Projetos DEV` (Linux), ou use OneDrive como espelho da mesma Ã¡rvore.
3. No Cursor (Linux): **File â†’ Open Folder** â†’ `~/Projetos DEV/Casa da Paz`.

**Cuidado:** nÃ£o edite o mesmo arquivo nos dois PCs ao mesmo tempo; feche Cursor em um antes de abrir no outro, ou use Git como Ã¡rbitro.

## OpÃ§Ã£o B â€” Syncthing (sync P2P, muito estÃ¡vel para dev)

1. Instale Syncthing no Windows e no Debian.
2. Compartilhe `Projetos DEV` â†” pasta idÃªntica no outro host.
3. Caminho Linux sugerido: `~/Projetos DEV`.

## OpÃ§Ã£o C â€” Git only (sem sync de pasta)

Cada mÃ¡quina clona `kadu207/casa-da-paz`. NÃ£o hÃ¡ mirror automÃ¡tico de arquivos nÃ£o commitados; bom se vocÃª sempre commita antes de trocar de mÃ¡quina.

## SSH para VPS

| MÃ¡quina | Auth | Script deploy frontend |
|---------|------|------------------------|
| Windows | Senha (sem chave) | `.\scripts\sync-frontend-vps.ps1 -PasswordOnly -RestartFrontend` |
| Debian 13 | Chave em `~/.ssh` | `./scripts/sync-frontend-vps.sh --restart` |

Chave no Linux (uma vez):

```bash
ssh-copy-id -p 65025 gestaoti@128.140.77.31
ssh -p 65025 gestaoti@128.140.77.31   # deve entrar sem senha
chmod +x scripts/sync-frontend-vps.sh
```

## Checklist pÃ³s-sync

1. `cd frontend && npm run build`
2. Sync (PS1 ou SH conforme SO)
3. Smoke: https://casadapaz.inovatitech.com.br/app/financeiro/lancamentos
4. Cloudflare purge se HTML em cache
