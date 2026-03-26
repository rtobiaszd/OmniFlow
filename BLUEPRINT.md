# OmniFlow - Autonomous Evolution Blueprint

> Este documento é a FONTE DE VERDADE absoluta para o agente autônomo.
> Toda decisão deve respeitar este blueprint.

---

# 🎯 MISSÃO DO SISTEMA

OmniFlow é um SaaS de automação de atendimento + CRM omnichannel com foco em:

- geração e gestão de leads
- automação de atendimento
- workflows inteligentes
- integração com APIs externas

---

# 🧠 OBJETIVO DO AGENTE

O agente deve:

1. Evoluir o sistema continuamente
2. Melhorar código existente (prioridade máxima)
3. Corrigir bugs
4. Aumentar performance
5. Aumentar segurança
6. Melhorar DX (developer experience)
7. Criar features APENAS quando alinhadas ao MVP

---

# 🚫 REGRAS ABSOLUTAS (NÃO VIOLAR)

- ❌ NÃO criar novos frameworks
- ❌ NÃO introduzir tecnologias não presentes
- ❌ NÃO usar:
  - Firebase
  - MongoDB
  - Express puro
  - GraphQL
- ❌ NÃO alterar arquitetura base
- ❌ NÃO modificar arquivos do agente
- ❌ NÃO gerar código genérico sem contexto real
- ❌ NÃO quebrar build/test/lint

---

# 🧱 STACK REAL (OBRIGATÓRIO)

- Node.js
- TypeScript
- NestJS
- PostgreSQL
- TypeORM

---

# 🏗️ ARQUITETURA OBRIGATÓRIA

- Controllers → Services → Repositories

REGRAS:

- Controller:
  - apenas entrada/validação
- Service:
  - regra de negócio
- Repository:
  - acesso ao banco

❌ PROIBIDO:
- lógica no controller
- query direta fora do repository

---

# 📦 PADRÕES DE CÓDIGO

- DTO obrigatório
- validação com class-validator
- tipagem forte (NUNCA usar any)
- funções pequenas
- nomes descritivos
- evitar duplicação

---

# 🔐 SEGURANÇA (PRIORIDADE ALTA)

Sempre priorizar:

- validação de entrada
- sanitização
- tratamento de erro
- não expor dados sensíveis
- criptografia para credenciais

---

# ⚡ PERFORMANCE

Focar em:

- reduzir queries desnecessárias
- evitar loops pesados
- usar paginação
- evitar N+1 queries

---

# 🧪 TESTES

- criar testes quando relevante
- não quebrar testes existentes
- preferir testes unitários

---

# 📊 DOMÍNIOS DO SISTEMA

## CRM
- pipelines
- deals
- leads

## Comunicação
- mensagens
- conversas
- inbox

## Workflows
- execução de fluxos
- triggers
- ações

## Integrações
- WhatsApp
- Email
- APIs externas

---

# 🧩 WORKFLOW ENGINE

- baseado em JSON
- execução recursiva
- nodes:
  - trigger
  - condition
  - action
  - ai

---

# 🤖 CHATBOT

- modo menu (determinístico)
- modo AI (LLM)
- fallback humano

---

# 🚀 MVP PRIORIDADES (ORDEM)

1. Inbox (core)
2. Integrações (WhatsApp / Email)
3. Pipeline (CRM)
4. Workflows
5. AI responder

---

# 🧨 PROBLEMAS ATUAIS (ATUALIZAR SEMPRE)

- bugs de integração
- performance em queries
- falta de validação
- ausência de testes

---

# 🎯 ÁREAS PRIORITÁRIAS

- auth
- integrations
- reports
- segurança

---

# 🧠 REGRAS DE DECISÃO DO AGENTE

Antes de qualquer mudança, o agente deve perguntar:

1. Isso melhora algo existente?
2. Isso respeita a stack?
3. Isso está no MVP?
4. Isso é seguro?
5. Isso é pequeno e incremental?

Se qualquer resposta for NÃO → REJEITAR

---

# 🔄 ESTRATÉGIA DE EVOLUÇÃO

O agente deve SEMPRE:

1. Preferir refatorar ao invés de criar
2. Trabalhar em pequenas melhorias
3. Evitar mudanças grandes
4. Garantir que o sistema continua funcionando

---

# 🧠 APRENDIZADO CONTÍNUO

O agente deve:

- evitar repetir erros
- evitar tarefas já feitas
- aprender com falhas de lint/test
- melhorar commits ao longo do tempo

---

# 📌 DEFINIÇÃO DE TAREFA VÁLIDA

Uma tarefa deve:

- afetar poucos arquivos
- ter impacto claro
- ser testável
- não quebrar o sistema

---

# 🛑 QUANDO PARAR UMA TAREFA

- se falhar 2x → abandonar
- se quebrar build → rollback
- se não fizer sentido → descartar

---

# 🧾 COMMIT PADRÃO

- feat:
- fix:
- refactor:
- chore:
- test:

---

# 🔚 REGRA FINAL

Se houver dúvida:

👉 NÃO INVENTAR  
👉 NÃO EXPANDIR  
👉 MELHORAR O QUE JÁ EXISTE