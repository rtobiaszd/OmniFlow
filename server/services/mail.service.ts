import Imap from 'node-imap';
import { simpleParser } from 'mailparser';
import nodemailer from 'nodemailer';
import { IntegrationRepository } from '../repositories/integration.repository';
import { WorkflowService } from './workflow.service';
import { adminDb } from '../lib/firebase-admin';

export class MailService {
  private integrationRepo = new IntegrationRepository();
  private workflowService = new WorkflowService();
  private isPolling = false;

  static async sendEmail(integration: any, to: string, subject: string, body: string) {
    const { smtpHost, user, pass } = integration.config;
    if (!smtpHost || !user || !pass) throw new Error('Mail integration not configured');

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: { user, pass }
    });

    await transporter.sendMail({
      from: `"${integration.name}" <${user}>`,
      to,
      subject,
      text: body,
      html: body.replace(/\n/g, '<br>')
    });
  }

  async startPolling() {
    if (this.isPolling) return;
    this.isPolling = true;
    console.log('MailService: Starting email polling loop...');
    
    // Poll every 60 seconds
    setInterval(() => this.pollAllIntegrations(), 60000);
    this.pollAllIntegrations();
  }

  private async pollAllIntegrations() {
    try {
      const integrations = await this.integrationRepo.findAll();
      const emailIntegrations = integrations.filter(i => i.provider === 'email' && i.status === 'connected');

      for (const integration of emailIntegrations) {
        await this.pollIntegration(integration);
      }
    } catch (error) {
      console.error('MailService: Error polling integrations:', error);
    }
  }

  private async pollIntegration(integration: any) {
    const { imapHost, user, pass } = integration.config;
    if (!imapHost || !user || !pass) return;

    const imap = new Imap({
      user,
      password: pass,
      host: imapHost,
      port: 993,
      tls: true,
      tlsOptions: { rejectUnauthorized: false }
    });

    imap.once('ready', () => {
      imap.openBox('INBOX', false, (err, box) => {
        if (err) {
          console.error(`MailService: Error opening INBOX for ${user}:`, err);
          imap.end();
          return;
        }

        // Search for unread messages
        imap.search(['UNSEEN'], (err, results) => {
          if (err || !results.length) {
            imap.end();
            return;
          }

          const f = imap.fetch(results, { bodies: '' });
          f.on('message', (msg, seqno) => {
            msg.on('body', (stream, info) => {
              simpleParser(stream as any, async (err, parsed) => {
                if (err) return;

                console.log(`MailService: New email from ${parsed.from?.text} - Subject: ${parsed.subject}`);

                // 1. Save to Inbox (messages collection)
                await this.saveToInbox(integration.tenantId, parsed);

                // 2. Trigger Workflow
                await this.workflowService.processEvent('email_received', {
                  tenantId: integration.tenantId,
                  sender: parsed.from?.text,
                  senderEmail: parsed.from?.value[0].address,
                  subject: parsed.subject,
                  body: parsed.text,
                  receivedAt: new Date().toISOString()
                });

                // Mark as read
                imap.addFlags(results, ['\\Seen'], (err) => {
                  if (err) console.error('Error marking as read:', err);
                });
              });
            });
          });

          f.once('end', () => {
            imap.end();
          });
        });
      });
    });

    imap.once('error', (err: any) => {
      console.error(`MailService: IMAP Error for ${user}:`, err);
    });

    imap.connect();
  }

  private async saveToInbox(tenantId: string, parsed: any) {
    try {
      const senderEmail = parsed.from?.value[0]?.address;
      if (!senderEmail) return;

      const conversationsColl = adminDb.collection('conversations');
      const messagesColl = adminDb.collection('messages');

      // 1. Find or create conversation
      const convQuery = await conversationsColl
        .where('tenantId', '==', tenantId)
        .where('contactEmail', '==', senderEmail)
        .limit(1)
        .get();

      let conversationId: string;
      
      if (convQuery.empty) {
        const convRef = conversationsColl.doc();
        conversationId = convRef.id;
        await convRef.set({
          id: conversationId,
          tenantId,
          contactEmail: senderEmail,
          contactName: parsed.from?.text || senderEmail.split('@')[0],
          contactAvatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(parsed.from?.text || senderEmail)}&background=random`,
          lastMessage: parsed.text?.substring(0, 100) || '',
          lastMessageTime: new Date().toISOString(),
          unreadCount: 1,
          channel: 'email',
          status: 'open'
        });
      } else {
        const convDoc = convQuery.docs[0];
        conversationId = convDoc.id;
        await convDoc.ref.update({
          lastMessage: parsed.text?.substring(0, 100) || '',
          lastMessageTime: new Date().toISOString(),
          unreadCount: admin.firestore.FieldValue.increment(1) as any
        });
      }

      // 2. Save the message
      const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await messagesColl.doc(messageId).set({
        id: messageId,
        conversationId,
        content: parsed.text || parsed.html || '',
        subject: parsed.subject,
        channel: 'email',
        timestamp: new Date().toISOString(),
        senderId: senderEmail // Mark as coming from the contact
      });

    } catch (error) {
      console.error('MailService: Error saving to inbox:', error);
    }
  }
}

import { admin } from '../lib/firebase-admin';
