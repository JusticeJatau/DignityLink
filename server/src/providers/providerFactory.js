import { MockSmsProvider } from './MockSmsProvider.js';
import { MockWhatsAppProvider } from './MockWhatsAppProvider.js';

const mockSms = new MockSmsProvider();
const mockWhatsApp = new MockWhatsAppProvider();

/**
 * Resolves the active provider for a channel based on environment configuration.
 * Real providers (Africa's Talking, Twilio, WhatsApp Cloud API) can be plugged in
 * here by adding concrete MessagingProvider subclasses and setting env keys.
 */
export const getProviderForChannel = (channel) => {
  if (channel === 'whatsapp') {
    const configured = process.env.WHATSAPP_PROVIDER || 'mock-whatsapp';
    switch (configured) {
      case 'mock-whatsapp':
      default:
        return mockWhatsApp;
    }
  }

  const configuredSms = process.env.SMS_PROVIDER || 'mock-sms';
  switch (configuredSms) {
    case 'mock-sms':
    default:
      return mockSms;
  }
};

export const getProviderConfigurationStatus = () => ({
  mode: 'mock',
  smsProvider: process.env.SMS_PROVIDER || 'mock-sms',
  whatsappProvider: process.env.WHATSAPP_PROVIDER || 'mock-whatsapp',
  supportedFutureProviders: [
    { channel: 'sms', name: "Africa's Talking", envKey: 'SMS_PROVIDER=africastalking' },
    { channel: 'sms', name: 'Twilio SMS', envKey: 'SMS_PROVIDER=twilio' },
    { channel: 'whatsapp', name: 'WhatsApp Cloud API', envKey: 'WHATSAPP_PROVIDER=whatsapp_cloud' },
  ],
});
