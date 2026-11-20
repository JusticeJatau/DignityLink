import crypto from 'crypto';
import { MessagingProvider } from './MessagingProvider.js';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export class MockSmsProvider extends MessagingProvider {
  constructor() {
    super('mock-sms', 'sms');
  }

  async sendMessage({ to, body, metadata = {} }) {
    const startedAt = Date.now();
    const requestId = crypto.randomUUID();

    // Structured request matching real SMS gateway contracts (e.g., Africa's Talking / Twilio)
    const rawRequest = {
      endpoint: 'mock://sms-gateway/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Mock-Provider': 'DignityLink-MockSmsProvider',
      },
      payload: {
        to,
        from: 'DignityLink',
        message: body,
        characterCount: body ? body.length : 0,
        encoding: 'GSM-7',
        clientRequestId: requestId,
        metadata,
      },
    };

    await delay(35 + Math.floor(Math.random() * 45));

    if (!to || !body) {
      const latencyMs = Date.now() - startedAt;
      const errorMessage = 'Recipient phone and message body are required.';
      return {
        success: false,
        provider: this.providerName,
        channel: this.channel,
        externalMessageId: '',
        status: 'failed',
        rawRequest,
        rawResponse: { error: errorMessage, timestamp: new Date().toISOString() },
        errorMessage,
        latencyMs,
      };
    }

    const externalMessageId = `mock-sms-${requestId.slice(0, 12)}`;
    const latencyMs = Date.now() - startedAt;

    const rawResponse = {
      status: 'Success',
      provider: this.providerName,
      messageId: externalMessageId,
      recipient: to,
      segments: Math.ceil(body.length / 160),
      deliveryStatus: 'Delivered (Simulated)',
      timestamp: new Date().toISOString(),
    };

    console.log(
      `[MockSmsProvider] Simulated SMS -> ${to} | id=${externalMessageId} | len=${body.length} | ${latencyMs}ms`
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
      from: payload.from || payload.From || '',
      text: String(payload.text || payload.Body || '').trim(),
      externalMessageId: payload.id || `inbound-sms-${crypto.randomUUID().slice(0, 8)}`,
    };
  }
}
