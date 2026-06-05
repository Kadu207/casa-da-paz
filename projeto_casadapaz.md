# Documentação de Arquitetura e Requisitos: Casa da Paz - Management System Cloud

## 1. Visão Geral do Projeto
O **Casa da Paz Management System Cloud** é um sistema ERP e CRM desenvolvido especificamente para atender às necessidades de um terreiro de Umbanda Afroindígena. O sistema centraliza a gestão financeira (mensalidades, doações, livraria e despesas operacionais), o controle de consulentes e a presença da equipe mediúnica, utilizando automação avançada e Inteligência Artificial (Sistema Multi-Agentes) para garantir a integridade dos dados e otimizar o tempo da diretoria e dos voluntários.

## 2. Stack Tecnológica (Tech Stack)
A arquitetura foi desenhada para alta disponibilidade, segurança e responsividade.

*   **Frontend (Interface do Usuário):** React.js + Vite + TypeScript. Estilização baseada em Tailwind CSS para responsividade total (Mobile-First, compatível com Lovable). Gráficos via Recharts.
*   **Backend (API Rest/Core):** Node.js com TypeScript e Express.js.
*   **ORM (Object-Relational Mapping):** Prisma ORM para comunicação segura com o banco de dados.
*   **Banco de Dados:** PostgreSQL 16 (Relacional, transacional e seguro).
*   **Microsserviço de IA (Agentes):** Python utilizando LangChain ou CrewAI.
*   **Infraestrutura e Deployment:** VPS Hetzner (Debian), conteinerização via Docker e Docker Compose, proxy reverso com Nginx e certificados SSL Let's Encrypt.

## 3. Matriz de Segurança e Acessos (RBAC - Role-Based Access Control)
O sistema opera sob o princípio do menor privilégio. O bloqueio é implementado via Middleware (JWT) no Backend e ocultação de rotas no Frontend.

*   **DIRETORIA (Admin):** Acesso total. Visualiza e edita todos os módulos, relatórios gerenciais e configurações do sistema.
*   **FINANCEIRO:** Acesso aos painéis de fluxo de caixa, despesas, mensalidades e módulo de importação de planilhas. Sem acesso a histórico ou prontuários.
*   **RECEPCAO:** Acesso ao CRM (Cadastro de Consulentes) e ao painel de Giras/Eventos para check-in.
*   **LIVRARIA:** Acesso estrito ao módulo de PDV (Ponto de Venda) e controle de estoque.
*   **MEDIUM:** Acesso individual ao próprio painel (visualização de escala, histórico de presença e status de sua própria mensalidade).
*   **SUPORTE:** Conta técnica para manutenção de logs e banco de dados.

## 4. O Sistema de Agentes (Inteligência Artificial)
O microsserviço em Python atuará em três frentes autônomas:

*   **Agente Executor (Data Parser):** Responsável por ler planilhas do Excel (.xlsx) de forma massiva, extrair dados, limpar strings e preparar os lotes para inserção. Também pode formatar textos e ler retornos de webhooks de pagamento (PIX).
*   **Agente Validador (Business Rules):** Inspeciona o trabalho do Executor. Valida a estrutura (ex: se valores são positivos, se as datas são lógicas) e aplica regras de negócio (ex: confere o status ativo do médium antes de registrar o pagamento). Caso encontre erro, bloqueia a transação SQL (Rollback) e sinaliza a anomalia.
*   **Agente de Qualidade de Dados (Fuzzy Logic Data Cleanser):** Roda em background e no momento do cadastro (Recepção). Compara nomes aproximados e números de telefone para impedir a duplicação na tabela de `Pessoas`.

## 5. Esquema de Banco de Dados (Single Source of Truth)
O PostgreSQL será modelado utilizando uma arquitetura centralizada na entidade `Pessoas`.

```sql
-- 1. TABELA MESTRE: Todos os seres humanos registrados
CREATE TABLE Pessoas (
    id SERIAL PRIMARY KEY,
    nome_completo VARCHAR(150) NOT NULL,
    telefone VARCHAR(20),
    maior_de_idade BOOLEAN NOT NULL DEFAULT TRUE,
    tipo_perfil VARCHAR(50) NOT NULL CHECK (tipo_perfil IN ('CONSULENTE', 'MEDIUM', 'DIRETORIA', 'FUNCIONARIO')),
    data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. TABELA DE ACESSO: Apenas usuários autenticados
CREATE TABLE Usuarios (
    id SERIAL PRIMARY KEY,
    pessoa_id INTEGER UNIQUE REFERENCES Pessoas(id) ON DELETE CASCADE,
    email VARCHAR(100) UNIQUE NOT NULL,
    senha_hash VARCHAR(255) NOT NULL,
    setor_acesso VARCHAR(50) NOT NULL
);

-- 3. TABELA FINANCEIRA: O Coração do Dashboard
CREATE TABLE Financeiro_Transacoes (
    id SERIAL PRIMARY KEY,
    pessoa_id INTEGER REFERENCES Pessoas(id),
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('RECEITA', 'DESPESA')),
    categoria VARCHAR(50) NOT NULL CHECK (categoria IN ('MENSALIDADE', 'LIVRARIA', 'DOACAO', 'MANUTENCAO', 'EVENTOS')),
    valor DECIMAL(10, 2) NOT NULL,
    data_transacao DATE NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('PENDENTE', 'CONCLUIDO')),
    observacoes TEXT
);

-- 4. TABELA DE EVENTOS (Giras, Oficinas)
CREATE TABLE Eventos (
    id SERIAL PRIMARY KEY,
    nome_evento VARCHAR(100) NOT NULL,
    data_evento DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'ABERTO' CHECK (status IN ('ABERTO', 'ENCERRADO'))
);

-- 5. TABELA DE PRESENÇAS (Controle de Porta)
CREATE TABLE Presencas (
    id SERIAL PRIMARY KEY,
    evento_id INTEGER REFERENCES Eventos(id) ON DELETE CASCADE,
    pessoa_id INTEGER REFERENCES Pessoas(id),
    tipo_presenca VARCHAR(20) NOT NULL CHECK (tipo_presenca IN ('MEDIUM', 'CONSULENTE')),
    nome_responsavel VARCHAR(150),
    horario_chegada TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 6. Fluxos de Negócio Principais

### A. Gestão Financeira e Baixa Automática
*   O sistema processa entradas e saídas. As doações, mensalidades e compras são atreladas ao `pessoa_id`.
*   A conciliação pode ocorrer por entrada manual ou via webhook (baixa automática) que muda o status de `PENDENTE` para `CONCLUIDO`.

### B. Recepção e Gestão de Porta (Check-in)
*   **Consulentes:** Formulário rápido buscando por telefone. Se a flag `maior_de_idade` for `false`, o sistema exige a digitação do campo `nome_responsavel`.
*   **Médiuns:** Lista de conferência (checklist) com botão de check-in em um clique.
*   **Fechamento:** Ao encerrar o evento, contagens são consolidadas no Dashboard.

### C. Importação de Planilhas Excel
*   Permite o upload de arquivos `.xlsx` legados.
*   O backend (Node.js) utilizando transações (BEGIN/COMMIT/ROLLBACK) processa milhares de linhas. Se a linha 499 possuir uma data em formato incorreto, toda a importação é desfeita para garantir a saúde do banco de dados, e o front-end exibe um log detalhado do erro.

### D. CRM e Disparos
*   A base de contatos limpa permite filtrar usuários por tipo ou frequência.
*   Integração futura para disparo de mensagens ou e-mails em massa para aviso de eventos, sem duplicidade.

## 7. Infraestrutura (Pipeline de Deployment)
Arquivo base `docker-compose.yml` para orquestração no servidor Debian (Hetzner).

```yaml
version: '3.8'

services:
  db:
    image: postgres:16-alpine
    container_name: casadapaz_db
    restart: unless-stopped
    environment:
      POSTGRES_USER: admin_casadapaz
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: casadapaz_db
    volumes:
      - pgdata:/var/lib/postgresql/data
    networks:
      - rede_casadapaz

  backend:
    build: ./backend
    container_name: casadapaz_backend
    restart: unless-stopped
    environment:
      DATABASE_URL: postgres://admin_casadapaz:${DB_PASSWORD}@db:5432/casadapaz_db
      JWT_SECRET: ${JWT_SECRET}
      PORT: 3000
    ports:
      - "3000:3000"
    depends_on:
      - db
    networks:
      - rede_casadapaz

  frontend:
    image: nginx:alpine
    container_name: casadapaz_frontend
    restart: unless-stopped
    volumes:
      - ./frontend/dist:/usr/share/nginx/html
      - ./nginx/nginx.conf:/etc/nginx/conf.d/default.conf
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - backend
    networks:
      - rede_casadapaz

volumes:
  pgdata:

networks:
  rede_casadapaz:
    driver: bridge
```
