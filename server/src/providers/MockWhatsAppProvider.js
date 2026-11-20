import crypto from 'crypto';
import { MessagingProvider } from './MessagingProvider.js';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export class MockWhatsAppProvider extends MessagingProvider {
  constructor() {
    super('mock-whatsapp', 'whatsapp');
  }

  async sendMessage({ to, body, metadata = {} }) {
    const startedAt = Date.now();
    const requestId = crypto.randomUUID();

    // Structured request matching WhatsApp Cloud API payload contract
    const rawRequest = {
      endpoint: 'mock://graph.whatsapp.simulated/v19.0/phone-number-id/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Mock-Provider': 'DignityLink-MockWhatsAppProvider',
      },
      payload: {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to,
        type: 'text',
        text: {
          preview_url: false,
          body,
        },
        metadata,
      },
    };

    await delay(40 + Math.floor(Math.random() * 50));

    if (!to || !body) {
      const latencyMs = Date.now() - startedAt;
      const errorMessage = 'Recipient phone and WhatsApp body are required.';
      return {
        success: false,
        provider: this.providerName,
        channel: this.channel,
        externalMessageId: '',
        status: 'failed',
        rawRequest,
        rawResponse: { error: { message: errorMessage }, timestamp: new Date().toISOString() },
        errorMessage,
        latencyMs,
      };
    }

    const externalMessageId = `wamid.mock.${requestId.replace(/-/g, '').slice(0, 16)}`;
    const latencyMs = Date.now() - startedAt;

    const rawResponse = {
      messaging_product: 'whatsapp',
      contacts: [{ input: to, wa_id: to.replace('+', '') }],
      messages: [{ id: externalMessageId, message_status: 'accepted' }],
      deliveryStatus: 'Delivered (Simulated)',
      timestamp: new Date().toISOString(),
    };

    console.log(
      `[MockWhatsAppProvider] Simulated WhatsApp -> ${to} | id=${externalMessageId} | ${latencyMs}ms`
    );

    return {
      success: true,
      provider: this.providerName,
      channel: this.channel,
      externalMessageId,
      status: 'delivered',
      rawRequest,
      rawResponse,
      errorMessage: null,
      latencyMs,
    };
  }

  parseInboundPayload(payload = {}) {
    return {
      from: payload.from || '',
      text: String(payload.text?.body || payload.text || '').trim(),
      externalMessageId: payload.id || `wamid.in.${crypto.randomUUID().slice(0, 10)}`,
    };
  }
}
