import Imap from 'node-imap';
import { simpleParser } from 'mailparser';
import prisma from '../lib/prisma';
import { IntegrationRepository } from '../repositories/integration.repository';
import { WorkflowService } from './workflow.service';
import nodemailer from 'nodemailer';

export class MailService {
  private integrationRepo = new IntegrationRepository();
  private workflowService = new WorkflowService();

  static async sendEmail(integration: any, to: string, subject: string, body: string, inReplyTo?: string) {
    const { user, pass, smtpHost } = integration.config;
    
    const transporter = nodemailer.createTransport({
      host: smtpHost || 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: { user, pass }
    });

    await transporter.sendMail({
      from: user,
      to,
      subject,
      text: body,
      html: body.replace(/\n/g, '<br>'),
      inReplyTo,
      references: inReplyTo
    });
  }

  startPolling() {
    console.log('MailService: Starting email polling loop...');
    setInterval(() => this.pollAllIntegrations(), 60000); // Every 1 min
    this.pollAllIntegrations();
  }

  async pollAllIntegrations() {
    try {
      const integrations = await this.integrationRepo.findAll();
      const workflows = await prisma.workflow.findMany({ where: { active: true } });
      
      console.log(`MailService: Checking ${integrations.length} integrations and ${workflows.length} workflows...`);
      
      const emailIntegrations = integrations.filter(i => 
        (i.provider === 'email' || i.provider === 'gmail' || (i.provider as any) === 'Generic') && 
        i.status === 'connected'
      );

      if (emailIntegrations.length === 0) {
        console.log('MailService: No email integrations found to poll.');
        return;
      }

      for (const integration of emailIntegrations) {
        await this.pollIntegration(integration);
      }
    } catch (error: any) {
      console.error('MailService: Error polling integrations:', error.message);
    }
  }

  private async pollIntegration(integration: any) {
    const { user, pass, imapHost } = integration.config;
    if (!user || !pass) return;

    return new Promise<void>((resolve) => {
      const imap = new Imap({
        user,
        pass,
        host: imapHost || 'imap.gmail.com',
        port: 993,
        tls: true,
        tlsOptions: { rejectUnauthorized: false }
      });

      imap.once('ready', () => {
        imap.openBox('INBOX', false, (err, box) => {
          if (err) {
            console.error(`MailService: Error opening box for ${user}:`, err.message);
            imap.end();
            return resolve();
          }

          // Search for unread messages
          imap.search(['UNSEEN'], (err, results) => {
            if (err || !results || results.length === 0) {
              if (err) console.error('MailService: Search error:', err.message);
              imap.end();
              return resolve();
            }

            const limitedResults = results.slice(0, 5); // Process 5 at a time
            console.log(`MailService: Found ${results.length} unread units for ${user}, processing ${limitedResults.length}...`);

            const f = imap.fetch(limitedResults, { bodies: '', struct: true });
            
            f.on('message', (msg, seqno) => {
              let currentUid: number;
              msg.on('attributes', (attrs) => { currentUid = attrs.uid; });
              
              msg.on('body', (stream) => {
                simpleParser(stream, async (err, parsed) => {
                  if (parsed) {
                    try {
                      const emailData = {
                        messageId: parsed.messageId,
                        subject: parsed.subject,
                        sender: parsed.from?.text,
                        senderEmail: parsed.from?.value[0]?.address,
                        senderName: parsed.from?.value[0]?.name,
                        body: parsed.text,
                        receivedAt: parsed.date,
                        tenantId: integration.tenantId
                      };

                      // 1. Mark as Read (flag as Seen)
                      imap.addFlags(currentUid, ['\\Seen'], (err) => {
                        if (err) console.error('MailService: Error marking UNSEEN:', err);
                      });

                      // 2. Save and Trigger
                      await this.saveToInbox(emailData, integration.tenantId);
                      await this.workflowService.processEvent('email_received', emailData);
                      
                    } catch (e: any) {
                      console.error(`MailService: ❌ Error during email processing UID ${currentUid}:`, (e as any).message);
                    }
                  }
                });
              });
            });

            f.once('error', (err) => {
               console.error('Fetch error:', err.message);
            });

            f.once('end', () => { 
                imap.end(); 
                resolve(); 
            });
          });
        });
      });

      imap.once('error', (err) => {
        console.error('MailService: IMAP Connection Error:', err.message);
        resolve();
      });

      imap.connect();
    });
  }

  private async saveToInbox(email: any, tenantId: string) {
    try {
      console.log(`MailService: 💾 Saving email from ${email.sender} to database...`);
      const contactEmail = email.senderEmail || email.sender || 'unknown@email.com';
      const contactName = email.senderName || email.sender || 'Unknown';
      
      // 1. Find or create conversation
      let conversation = await prisma.conversation.findFirst({
        where: { tenantId, contactId: contactEmail, channel: 'email' }
      });

      if (!conversation) {
        conversation = await prisma.conversation.create({
          data: {
            id: `conv_${Date.now()}`,
            tenantId,
            contactId: contactEmail,
            contactName: contactName,
            contactAvatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(contactName)}&background=random`,
            lastMessage: email.subject || '(No Subject)',
            channel: 'email',
            status: 'open'
          }
        });
      }

      // 2. Save Message
      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          tenantId,
          content: email.body || email.subject || '(Empty Content)',
          channel: 'email',
          senderId: 'external',
          contactId: contactEmail,
          timestamp: new Date()
        }
      });

      // 3. Update Conversation metadata
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: {
          lastMessage: email.subject || '(No Subject)',
          lastMessageTime: new Date(),
          unreadCount: { increment: 1 }
        }
      });

      console.log(`MailService: ✅ Saved to conversation ${conversation.id}`);
    } catch (error: any) {
      console.error(`MailService: ❌ Error saving to inbox:`, error.message);
    }
  }
}
