# GitLab — Configuração do repositório

## Criar projeto (uma vez)

1. Acesse https://gitlab.com/kadu207
2. **New project** → **Create blank project**
3. Nome: `casa-da-paz` (Project slug: `casa-da-paz`)
4. Visibility: Public
5. Desmarque "Initialize repository with a README"

## Push mirror

```bash
git remote add gitlab https://gitlab.com/kadu207/casa-da-paz.git
git push -u gitlab main
```

Use Personal Access Token (scope `write_repository`) como senha se solicitado.

## CI

O arquivo `.gitlab-ci.yml` na raiz ativa pipeline mirror ao push.
