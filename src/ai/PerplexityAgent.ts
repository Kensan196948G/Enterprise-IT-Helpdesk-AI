import axios, { AxiosInstance } from 'axios';
import { Logger } from '../utils/Logger';
import { AgentResponse, Inquiry, AgentHealth } from '../types';

export class PerplexityAgent {
  private client: AxiosInstance;
  private logger: Logger;
  private model: string = 'pplx-7b-chat';

  constructor() {
    this.logger = new Logger('PerplexityAgent');

    const apiKey = process.env.PERPLEXITY_API_KEY;
    if (!apiKey) {
      this.logger.warn('PERPLEXITY_API_KEY not provided, some features may be limited');
    }

    this.client = axios.create({
      baseURL: 'https://api.perplexity.ai',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    this.logger = new Logger('PerplexityAgent');
  }

  async process(inquiry: Inquiry): Promise<AgentResponse> {
    try {
      this.logger.info('Processing inquiry with Perplexity', { inquiryId: inquiry.id });

      const payload = {
        model: this.model,
        messages: [
          {
            role: 'system',
            content:
              'You are Perplexity, a research-focused AI agent for enterprise IT helpdesk. Provide evidence-based answers with citations and sources.',
          },
          {
            role: 'user',
            content: this.buildPrompt(inquiry),
          },
        ],
        max_tokens: 4000,
        temperature: 0.2,
      };

      const response = await this.client.post('/chat/completions', payload);
      const choice = response.data.choices?.[0];

      if (!choice || !choice.message?.content) {
        throw new Error('No response content from Perplexity');
      }

      return {
        agent: 'perplexity',
        content: choice.message.content,
        confidence: this.calculateConfidence(choice.message.content),
        metadata: {
          model: this.model,
          tokens_used: response.data.usage?.total_tokens || 0,
          processing_time: Date.now() - inquiry.timestamp,
        },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('Error processing inquiry with Perplexity', { error: errorMessage });
      // Fallback response if API fails
      return {
        agent: 'perplexity',
        content: 'Unable to process request with Perplexity AI. Please check API configuration.',
        confidence: 0,
        metadata: {
          model: this.model,
          error: errorMessage,
          processing_time: Date.now() - inquiry.timestamp,
        },
      };
    }
  }

  async healthCheck(): Promise<AgentHealth> {
    try {
      // Simple health check
      await this.client.post('/chat/completions', {
        model: this.model,
        messages: [{ role: 'user', content: 'Hello' }],
        max_tokens: 10,
      });

      return {
        agent: 'perplexity',
        status: 'healthy',
        lastCheck: new Date(),
        responseTime: 0,
      };
    } catch (error) {
      return {
        agent: 'perplexity',
        status: 'unhealthy',
        lastCheck: new Date(),
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async learn(data: any): Promise<void> {
    // Perplexity learning mechanism
    this.logger.info('Perplexity learning from data', { dataSize: JSON.stringify(data).length });
    // Implementation for knowledge updates
  }

  private buildPrompt(inquiry: Inquiry): string {
    return `Research the following IT support inquiry and provide evidence-based analysis:

Inquiry Details:
Category: ${inquiry.category}
Priority: ${inquiry.priority}
Title: ${inquiry.title}
Description: ${inquiry.content}

Please provide:
1. Current best practices and industry standards
2. Relevant documentation and knowledge base references
3. Potential solutions based on similar cases
4. Risk assessment and mitigation strategies
5. Sources and citations for your analysis

Focus on factual, research-backed information.`;
  }

  private calculateConfidence(response: string): number {
    // Calculate confidence based on citations and sources
    const citationPatterns = [/\[.*?\]/, /\(.*?\d{4}.*?\)/, /according to/i, /source:/i];
    const citationCount = citationPatterns.reduce(
      (count, pattern) => count + (response.match(pattern) || []).length,
      0,
    );

    const baseConfidence = Math.min(response.length / 1000, 1);
    return Math.min(baseConfidence + Math.min(citationCount * 0.1, 0.3), 1);
  }
}
