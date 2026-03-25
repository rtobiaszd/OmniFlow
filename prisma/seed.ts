import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool as any);
const prisma = new PrismaClient({ adapter });

async function main() {
  const tenantId = 't1';

  // 1. WhatsApp AI Chatbot Workflow
  await prisma.workflow.upsert({
    where: { id: 'whatsapp-chatbot-default' },
    update: {},
    create: {
      id: 'whatsapp-chatbot-default',
      name: 'Chatbot WhatsApp IA',
      description: 'Respostas inteligentes para WhatsApp.',
      active: true,
      trigger: 'message_received',
      tenantId: tenantId,
      nodes: [
        { id: '1', type: 'trigger', data: { label: 'Mensagem Recebida', event: 'message_received', channel: 'whatsapp' }, position: { x: 0, y: 0 } },
        { id: '2', type: 'ai', data: { label: 'IA Responder', prompt: 'Você é um assistente virtual...' }, position: { x: 250, y: 0 } },
        { id: '3', type: 'action', data: { label: 'Enviar Resposta', action: 'send_whatsapp' }, position: { x: 500, y: 0 } }
      ],
      edges: [
        { id: 'e1-2', source: '1', target: '2' },
        { id: 'e2-3', source: '2', target: '3' }
      ]
    }
  });

  // 2. Email Support Auto-reply
  await prisma.workflow.upsert({
    where: { id: 'email-support-reply' },
    update: {},
    create: {
      id: 'email-support-reply',
      name: 'Auto-Resposta de Suporte (Email)',
      description: 'Responde e-mails de suporte e cria um Deal automaticamente.',
      active: true,
      trigger: 'email_received',
      tenantId: tenantId,
      nodes: [
        { id: 'e1', type: 'email_trigger', data: { subjectKeyword: 'ajuda' }, position: { x: 0, y: 150 } },
        { id: 'e2', type: 'action', data: { action: 'create_deal', pipelineId: 'p1', stageId: 's1' }, position: { x: 250, y: 150 } },
        { id: 'e3', type: 'email_action', data: { to: '{{sender}}', subject: 'Recebemos seu pedido', body: 'Olá, um atendente entrará em contato em breve.' }, position: { x: 500, y: 150 } }
      ],
      edges: [
        { id: 'e1-2', source: 'e1', target: 'e2' },
        { id: 'e2-3', source: 'e2', target: 'e3' }
      ]
    }
  });

  console.log('Seed: Workflows preconfigurados criados com sucesso.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
