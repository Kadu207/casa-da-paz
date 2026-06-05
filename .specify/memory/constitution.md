# Constituição — Casa da Paz Management System Cloud

**Versão:** 1.0.0 | **Ratificado:** 2026-06-05

## Princípios imutáveis

### I. Pessoas como fonte única
Toda pessoa humana registrada passa por `Pessoas`. Usuários autenticados referenciam `pessoa_id`.

### II. RBAC — menor privilégio
- Bloqueio no backend (JWT middleware + policies)
- Ocultação de rotas no frontend (defesa em profundidade)
- MEDIUM vê apenas próprios dados

### III. Transações atômicas
Importações Excel e operações em lote usam `BEGIN/COMMIT/ROLLBACK`. Erro em uma linha = rollback total.

### IV. Responsividade total
Mobile-first Tailwind. Diretoria desktop, equipe mobile, público web.

### V. API separada do Lovable
Backend sempre em `backend/`. Lovable apenas protótipo exportável.

### VI. Deploy com gate humano
Nenhum deploy VPS automático. Agente A5 prepara; usuário confirma execução.

### VII. Memória em arquivos
Decisões em ADRs. Estado em `project-memory.md`. Nunca depender só do chat.

### VIII. Spec Before Code
Features não-triviais passam por `specs/<feature>/` (spec → plan → tasks → implement).

## Governança
Alterações nesta constituição exigem ADR + aprovação do usuário.
