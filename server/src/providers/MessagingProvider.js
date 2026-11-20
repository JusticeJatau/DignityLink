/**
 * Shared MessagingProvider interface.
 * Both mock providers (prototype) and future real providers
 * (Africa's Talking, Twilio, WhatsApp Cloud API) implement this contract
 * so the scheduler and core application never need to be rewritten.
 */
export class MessagingProvider {
  constructor(providerName, channel) {
    if (new.target === MessagingProvider) {
      throw new Error(
        'MessagingProvider is an abstract interface and cannot be instantiated directly.'
      );
    }
    this.providerName = providerName;
    this.channel = channel;
  }

  /**
   * @param {Object} params
   * @param {string} params.to
   * @param {string} params.body
   * @param {Object} [params.metadata]
   */
  // eslint-disable-next-line no-unused-vars
  async sendMessage(params) {
    throw new Error('sendMessage() must be implemented by concrete provider.');
  }

  /**
   * Standardizes inbound webhook payloads into DignityLink format.
   */
  // eslint-disable-next-line no-unused-vars
  parseInboundPayload(payload) {
    throw new Error('parseInboundPayload() must be implemented by concrete provider.');
  }
}
