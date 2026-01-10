import Anthropic from '@anthropic-ai/sdk';
import { Logger } from '../utils/Logger';
import { AgentResponse, Inquiry, AgentHealth } from '../types';

export class ClaudeAgent {
  private client: Anthropic;
  private logger: Logger;
  private model: string = 'claude-3-sonnet-20240229';

  constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY environment variable is required');
    }

    this.client = new Anthropic({
      apiKey: apiKey,
    });

    this.logger = new Logger('ClaudeAgent');
  }

  async process(inquiry: Inquiry): Promise<AgentResponse> {
    try {
      this.logger.info('Processing inquiry with Claude', { inquiryId: inquiry.id });

      const prompt = this.buildPrompt(inquiry);

      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: 4000,
        temperature: 0.7,
        system:
          'You are Claude, the commanding officer for an enterprise IT helpdesk AI system. Your role is to coordinate responses from other AI agents (GPT, Gemini, Perplexity) and provide final, authoritative answers to IT support inquiries. Always ensure responses are accurate, professional, and comprehensive.',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Claude');
      }

      return {
        agent: 'claude',
        content: content.text,
        confidence: this.calculateConfidence(content.text),
        metadata: {
          model: this.model,
          tokens_used: response.usage?.input_tokens || 0 + (response.usage?.output_tokens || 0),
          processing_time: Date.now() - inquiry.timestamp,
        },
      };
    } catch (error) {
      this.logger.error('Error processing inquiry with Claude', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async healthCheck(): Promise<AgentHealth> {
    try {
      // Simple health check by making a minimal request
      await this.client.messages.create({
        model: this.model,
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Hello' }],
      });

      return {
        agent: 'claude',
        status: 'healthy',
        lastCheck: new Date(),
        responseTime: 0,
      };
    } catch (error) {
      return {
        agent: 'claude',
        status: 'unhealthy',
        lastCheck: new Date(),
        error: (error as Error).message,
      };
    }
  }

  async learn(data: any): Promise<void> {
    // Claude's learning mechanism - could implement fine-tuning or knowledge base updates
    this.logger.info('Claude learning from data', { dataSize: JSON.stringify(data).length });
    // Implementation for learning from successful interactions
  }

  private buildPrompt(inquiry: Inquiry): string {
    return `
IT Support Inquiry:
Category: ${inquiry.category}
Priority: ${inquiry.priority}
Description: ${inquiry.description}

Additional Context:
${inquiry.context || 'None provided'}

Please provide a comprehensive, professional response to this IT support inquiry.
Consider the following agents' responses if available:
${inquiry.agentResponses ? inquiry.agentResponses.map(r => `${r.agent}: ${r.content}`).join('\n') : 'No previous agent responses'}

As the commanding officer, provide the final authoritative answer.
`;
  }

  private calculateConfidence(response: string): number {
    // Simple confidence calculation based on response length and certainty indicators
    const certaintyIndicators = ['certainly', 'definitely', 'absolutely', 'clearly'];
    const hasCertainty = certaintyIndicators.some(indicator =>
      response.toLowerCase().includes(indicator),
    );

    const baseConfidence = Math.min(response.length / 1000, 1); // 0-1 based on length
    return hasCertainty ? Math.min(baseConfidence + 0.2, 1) : baseConfidence;
  }
}
