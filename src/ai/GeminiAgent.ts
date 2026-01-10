import { GoogleGenerativeAI } from '@google/generative-ai';
import { Logger } from '../utils/Logger';
import { AgentResponse, Inquiry, AgentHealth } from '../types';

export class GeminiAgent {
  private client: GoogleGenerativeAI;
  private logger: Logger;
  private modelName: string = 'gemini-pro';

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }

    this.client = new GoogleGenerativeAI(apiKey);
    this.logger = new Logger('GeminiAgent');
  }

  async process(inquiry: Inquiry): Promise<AgentResponse> {
    try {
      this.logger.info('Processing inquiry with Gemini', { inquiryId: inquiry.id });

      const model = this.client.getGenerativeModel({ model: this.modelName });

      const prompt = this.buildPrompt(inquiry);

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      if (!text) {
        throw new Error('No response content from Gemini');
      }

      return {
        agent: 'gemini',
        content: text,
        confidence: this.calculateConfidence(text),
        metadata: {
          model: this.modelName,
          tokens_used: this.estimateTokens(text),
          processing_time: Date.now() - inquiry.timestamp,
        },
      };
    } catch (error) {
      this.logger.error('Error processing inquiry with Gemini', {
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async healthCheck(): Promise<AgentHealth> {
    try {
      // Simple health check
      const model = this.client.getGenerativeModel({ model: this.modelName });
      await model.generateContent('Hello');

      return {
        agent: 'gemini',
        status: 'healthy',
        lastCheck: new Date(),
        responseTime: 0,
      };
    } catch (error) {
      return {
        agent: 'gemini',
        status: 'unhealthy',
        lastCheck: new Date(),
        error: (error as Error).message,
      };
    }
  }

  async learn(data: any): Promise<void> {
    // Gemini learning mechanism
    this.logger.info('Gemini learning from data', { dataSize: JSON.stringify(data).length });
    // Implementation for fine-tuning or knowledge updates
  }

  private buildPrompt(inquiry: Inquiry): string {
    return `You are Gemini, an investigative AI agent for an enterprise IT helpdesk system. Your role is to research and gather evidence-based information for IT support inquiries.

IT Support Inquiry:
Category: ${inquiry.category}
Priority: ${inquiry.priority}
Title: ${inquiry.title}
Description: ${inquiry.content}

Additional Context:
${inquiry.context || 'None provided'}

Please provide a comprehensive investigation report including:
1. Root Cause Analysis
2. Evidence and Documentation References
3. Best Practices and Standards
4. Risk Assessment
5. Recommended Investigation Steps

Focus on gathering factual information and citing sources where possible.`;
  }

  private calculateConfidence(response: string): number {
    // Calculate confidence based on evidence and references
    const evidenceIndicators = ['according to', 'as per', 'reference', 'documentation', 'standard'];
    const hasEvidence = evidenceIndicators.some(indicator =>
      response.toLowerCase().includes(indicator),
    );

    const baseConfidence = Math.min(response.length / 1000, 1);
    return hasEvidence ? Math.min(baseConfidence + 0.2, 1) : baseConfidence;
  }

  private estimateTokens(text: string): number {
    // Rough estimation: 1 token ≈ 4 characters for English text
    return Math.ceil(text.length / 4);
  }
}
