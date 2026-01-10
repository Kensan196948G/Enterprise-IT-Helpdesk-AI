import OpenAI from 'openai';
import { Logger } from '../utils/Logger';
import { AgentResponse, Inquiry, AgentHealth } from '../types';

export class GPTAgent {
  private client: OpenAI;
  private logger: Logger;
  private model: string = 'gpt-4-turbo-preview';

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }

    this.client = new OpenAI({
      apiKey: apiKey,
    });

    this.logger = new Logger('GPTAgent');
  }

  async process(inquiry: Inquiry): Promise<AgentResponse> {
    try {
      this.logger.info('Processing inquiry with GPT', { inquiryId: inquiry.id });

      const messages = this.buildMessages(inquiry);

      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: messages,
        max_tokens: 4000,
        temperature: 0.7,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
      });

      const choice = response.choices[0];
      if (!choice || !choice.message.content) {
        throw new Error('No response content from GPT');
      }

      return {
        agent: 'gpt',
        content: choice.message.content,
        confidence: this.calculateConfidence(choice.message.content),
        metadata: {
          model: this.model,
          tokens_used: response.usage?.total_tokens || 0,
          processing_time: Date.now() - inquiry.timestamp,
          finish_reason: choice.finish_reason,
        },
      };
    } catch (error) {
      this.logger.error('Error processing inquiry with GPT', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  async healthCheck(): Promise<AgentHealth> {
    try {
      // Simple health check
      await this.client.chat.completions.create({
        model: this.model,
        messages: [{ role: 'user', content: 'Hello' }],
        max_tokens: 10,
      });

      return {
        agent: 'gpt',
        status: 'healthy',
        lastCheck: new Date(),
        responseTime: 0,
      };
    } catch (error) {
      return {
        agent: 'gpt',
        status: 'unhealthy',
        lastCheck: new Date(),
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async learn(data: any): Promise<void> {
    // GPT learning mechanism
    this.logger.info('GPT learning from data', { dataSize: JSON.stringify(data).length });
    // Implementation for fine-tuning or knowledge updates
  }

  private buildMessages(inquiry: Inquiry): OpenAI.Chat.Completions.ChatCompletionMessageParam[] {
    const systemMessage: OpenAI.Chat.Completions.ChatCompletionSystemMessageParam = {
      role: 'system',
      content:
        'You are GPT, a structured content generator for an enterprise IT helpdesk AI system. Your role is to create well-organized, templated responses for IT support inquiries. Focus on clarity, structure, and actionable information.',
    };

    const userMessage: OpenAI.Chat.Completions.ChatCompletionUserMessageParam = {
      role: 'user',
      content: `
IT Support Inquiry:
Category: ${inquiry.category}
Priority: ${inquiry.priority}
Title: ${inquiry.title}
Description: ${inquiry.content}

Please provide a structured response with:
1. Problem Analysis
2. Recommended Solutions
3. Next Steps
4. Prevention Tips (if applicable)
`,
    };

    return [systemMessage, userMessage];
  }

  private calculateConfidence(response: string): number {
    // Calculate confidence based on response structure and completeness
    const sections = ['Problem Analysis', 'Recommended Solutions', 'Next Steps'];
    const hasSections = sections.filter(section =>
      response.toLowerCase().includes(section.toLowerCase()),
    ).length;

    const baseConfidence = Math.min(response.length / 1000, 1);
    return Math.min(baseConfidence + (hasSections / sections.length) * 0.3, 1);
  }
}
