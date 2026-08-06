# 12 — Segurança aplicada e ferramentas

## Objetivo

Baseline prático para vulnerabilidades em código, dependências e runtime (stack Node/React).

## Camadas

### SCA (dependências)
- `npm audit` em `backend/` e `frontend/`
- Dependabot / Renovate (GitHub)
- Sonatype / Snyk (opcional)

### SAST
- TypeScript (`tsc --noEmit`)
- ESLint
- Semgrep / Sonar (opcional)

### DAST
- OWASP ZAP em homologação (opcional)
- Smoke auth/RBAC pós-deploy

## RBAC / secrets (Casa da Paz)

- Autorização no Express (`authorize`) — ver `docs/05-auth-seguranca.md`
- Policies no cadastro de usuário
- Sem secrets no Git; `.env.production` só na VPS
- Asaas / webhooks com token validado
- MEDIUM isolado por `pessoa_id`

## Priorização

- Crítico/Alto: antes de merge em `main`
- Médio: sprint atual
- Baixo: backlog com dono

## Não negociável

- Nunca commitar segredo real  
- Trocar senha seed em produção  
- Deploy VPS só com confirmação  
- Não ativar Asaas produção sem chave + confirmação  
