# OmniFlow SaaS Prototype Blueprint

## 1. UX / UI STRUCTURE
- **Unified Inbox**: Centralized communication hub for WhatsApp, Email, and Telegram. Features real-time updates, customer profiles, and quick-action buttons for CRM integration.
- **Visual Workflow Builder**: A node-based canvas where users can drag and drop triggers (e.g., "New Message"), conditions (e.g., "Keyword matches 'Pricing'"), and actions (e.g., "Send AI Response", "Move to Pipeline").
- **Kanban Pipelines**: Dynamic sales/support boards with customizable stages and automated transitions.
- **Integration Hub**: One-click connection for external tools like Jira, GitHub, and Slack.

## 2. SYSTEM ARCHITECTURE
- **Modular Monolith**: Built with Node.js and TypeScript for reliability and speed.
- **Layers**:
    - **Controllers**: Handle HTTP requests and input validation.
    - **Services**: Contain core business logic (e.g., `WorkflowExecutionService`, `ChatbotService`).
    - **Repositories**: Abstract database operations using Prisma.
    - **Event Bus**: Internal async communication for triggering workflows from system events.

## 3. DATABASE SCHEMA
- **Tenants**: Multi-tenant isolation.
- **Integrations**: Stores credentials (AES-256 encrypted) and provider settings.
- **Workflows**: JSON-based node configurations.
- **Pipelines/Stages/Deals**: Core CRM entities.
- **Conversations/Messages**: Omnichannel message history.

## 4. WORKFLOW ENGINE
- **Execution Logic**: A recursive engine that traverses the JSON node tree.
- **Node Types**:
    - `Trigger`: Webhook, Time-based, or Event-based.
    - `Condition`: Logic gates (If/Else).
    - `Action`: External API calls, internal state changes.
    - `AI`: LLM-based classification or generation.

## 5. CHATBOT SYSTEM
- **Hybrid Approach**: 
    1. **Menu Mode**: Deterministic flows for common tasks (e.g., "Press 1 for Support").
    2. **AI Mode**: Gemini-powered natural language understanding for complex queries.
    3. **Fallback**: If AI confidence is low, the bot automatically hands off to a human agent.

## 6. MVP SCOPE
- **Phase 1**: Core Inbox, WhatsApp/Email integration, Basic Kanban Pipeline.
- **Phase 2**: Visual Workflow Builder, AI Auto-responder.
- **Phase 3**: Advanced Integrations (Jira/GitHub), Analytics Dashboard.
