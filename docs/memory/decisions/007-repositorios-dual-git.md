# ADR-007: Repositórios Dual Git

**Status:** Aceito | **Data:** 2026-06-05

## Contexto
Projeto deve ter mirror GitHub + GitLab para redundância e CI em ambas plataformas.

## Decisão
- **GitHub:** `https://github.com/kadu207/casa-da-paz`
- **GitLab:** `https://gitlab.com/kadu207/casa-da-paz`
- Remotes: `origin` (GitHub), `gitlab` (GitLab)
- Push: `git push origin main && git push gitlab main`

## Consequências
- GitHub Actions: lint, test, build
- GitLab CI: mirror pipeline
- Secrets em ambas plataformas (nunca no repo)
