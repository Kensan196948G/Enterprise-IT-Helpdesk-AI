import { Logger } from '../utils/Logger';
import { Config } from '../core/Config';
import { ClaudeAgent } from '../ai/ClaudeAgent';
import { GPTAgent } from '../ai/GPTAgent';
import { GeminiAgent } from '../ai/GeminiAgent';
import { PerplexityAgent } from '../ai/PerplexityAgent';
import {
  Inquiry,
  AgentResponse,
  AIResponse,
  AgentHealth,
  Source,
  AIAgent,
  AIAgentInstance,
} from '../types';

export class ResponseCoordinator {
  private logger: Logger;
  private config: Config;
  private agents: Map<string, AIAgentInstance>;

  constructor() {
    this.logger = new Logger('ResponseCoordinator');
    this.config = new Config();
    this.agents = new Map();

    this.initializeAgents();
  }

  async processInquiry(inquiry: Inquiry): Promise<AIResponse> {
    try {
      this.logger.info('Processing inquiry', { inquiryId: inquiry.id });

      // Get enabled agents from config
      const enabledAgents = this.config.getEnabledAgents();

      // Process inquiry with all enabled agents in parallel
      const agentPromises = enabledAgents
        .map(agentName => {
          const agent = this.agents.get(agentName);
          if (!agent) {
            this.logger.warn(`Agent ${agentName} not found`);
            return null;
          }
          return agent.process(inquiry);
        })
        .filter(p => p !== null) as Promise<AgentResponse>[];

      const agentResponses = await Promise.allSettled(agentPromises);

      // Collect successful responses
      const successfulResponses: AgentResponse[] = [];
      for (const result of agentResponses) {
        if (result.status === 'fulfilled') {
          successfulResponses.push(result.value);
        } else {
          this.logger.error('Agent processing failed', { error: result.reason });
        }
      }

      // Use Claude as commanding officer for final response coordination
      const claudeAgent = this.agents.get('claude');
      if (!claudeAgent) {
        throw new Error('Claude agent not available for coordination');
      }

      // Create enhanced inquiry with agent responses for Claude
      const enhancedInquiry: Inquiry = {
        ...inquiry,
        agentResponses: successfulResponses,
      };

      const finalResponse = await claudeAgent.process(enhancedInquiry);

      // Create final AI response
      const aiResponse: AIResponse = {
        id: `resp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        inquiryId: inquiry.id,
        aiAgent: 'claude',
        content: finalResponse.content,
        confidence: finalResponse.confidence,
        reasoning: this.generateReasoning(successfulResponses, finalResponse),
        sources: this.extractSources(successfulResponses),
        createdAt: new Date(),
      };

      this.logger.info('Inquiry processed successfully', {
        inquiryId: inquiry.id,
        responseId: aiResponse.id,
        confidence: aiResponse.confidence,
      });

      return aiResponse;
    } catch (error) {
      this.logger.error('Error processing inquiry', { error: (error as Error).message });
      throw error;
    }
  }

  async checkAgentHealth(): Promise<Map<string, AgentHealth>> {
    const healthChecks = new Map<string, AgentHealth>();

    for (const [agentName, agent] of this.agents) {
      try {
        const health = await agent.healthCheck();
        healthChecks.set(agentName, health);
      } catch (error) {
        healthChecks.set(agentName, {
          agent: agentName as AIAgent,
          status: 'unhealthy',
          lastCheck: new Date(),
          error: (error as Error).message,
        });
      }
    }

    return healthChecks;
  }

  private initializeAgents(): void {
    const enabledAgents = this.config.getEnabledAgents();

    if (enabledAgents.includes('claude')) {
      this.agents.set('claude', new ClaudeAgent());
    }

    if (enabledAgents.includes('gpt')) {
      this.agents.set('gpt', new GPTAgent());
    }

    if (enabledAgents.includes('gemini')) {
      this.agents.set('gemini', new GeminiAgent());
    }

    if (enabledAgents.includes('perplexity')) {
      this.agents.set('perplexity', new PerplexityAgent());
    }

    this.logger.info('Agents initialized', { count: this.agents.size });
  }

  private generateReasoning(agentResponses: AgentResponse[], finalResponse: AgentResponse): string {
    const agentConfidences = agentResponses
      .map(r => `${r.agent}: ${r.confidence.toFixed(2)}`)
      .join(', ');
    return `Coordinated response from multiple AI agents. Agent confidences: ${agentConfidences}. Final coordination by Claude agent with confidence ${finalResponse.confidence.toFixed(2)}.`;
  }

  private extractSources(agentResponses: AgentResponse[]): Source[] {
    // Extract sources from agent responses (implementation depends on how agents provide sources)
    const sources: Source[] = [];

    for (const _response of agentResponses) {
      // This would need to be implemented based on how each agent provides sources
      // For now, return empty array
    }

    return sources;
  }
}
