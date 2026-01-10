import {
  HelpdeskBot as IHelpdeskBot,
  Inquiry,
  AIResponse,
  AIAgent,
  APIResponse,
  HelpdeskError,
  AgentHealth,
} from '../types';
import { Config } from './Config';
import { Logger } from '../utils/Logger';
import { Database } from '../database/Database';
import { ClaudeAgent } from '../ai/ClaudeAgent';
import { GPTAgent } from '../ai/GPTAgent';
import { GeminiAgent } from '../ai/GeminiAgent';
import { PerplexityAgent } from '../ai/PerplexityAgent';
import { ResponseCoordinator } from './ResponseCoordinator';

/**
 * Enterprise IT Helpdesk AI のメインクラス
 * 複数のAIエージェントを統合し、インテリジェントな問い合わせ対応を実現
 */
export class HelpdeskBot implements IHelpdeskBot {
  private config: Config;
  private logger: Logger;
  private database: Database;
  private responseCoordinator: ResponseCoordinator;
  private startTime: number;
  private agents: Map<AIAgent, any>;
  private coordinator: ResponseCoordinator;

  constructor(config: Config, logger: Logger) {
    this.config = config;
    this.logger = logger;
    this.database = new Database();
    this.responseCoordinator = new ResponseCoordinator();
    this.startTime = Date.now();
    this.agents = new Map();
    this.coordinator = this.responseCoordinator;
    this.initializeAgents();
  }

  async initialize(): Promise<void> {
    try {
      await this.database.connect();
      this.logger.info('HelpdeskBot initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize HelpdeskBot', { error });
      throw error;
    }
  }

  async getInquiry(id: string): Promise<Inquiry | null> {
    try {
      return await this.database.getInquiry(id);
    } catch (error: any) {
      this.logger.error('Failed to get inquiry', { error: error.message });
      return null;
    }
  }

  async listInquiries(filters: {
    status?: string;
    category?: string;
    limit?: number;
    offset?: number;
  }): Promise<Inquiry[]> {
    try {
      return await this.database.listInquiries(filters);
    } catch (error: any) {
      this.logger.error('Failed to list inquiries', { error: error.message });
      return [];
    }
  }

  async getSystemStatus(): Promise<{
    agents: { total: number; healthy: number };
    database: boolean;
    uptime: number;
  }> {
    try {
      const agentHealth = await this.responseCoordinator.checkAgentHealth();
      const healthyAgents = Array.from(agentHealth.values()).filter(
        h => h.status === 'healthy',
      ).length;

      return {
        agents: {
          total: agentHealth.size,
          healthy: healthyAgents,
        },
        database: true, // Assume connected if we reach here
        uptime: Date.now() - this.startTime,
      };
    } catch (error: any) {
      this.logger.error('Failed to get system status', { error: error.message });
      return {
        agents: { total: 0, healthy: 0 },
        database: false,
        uptime: Date.now() - this.startTime,
      };
    }
  }

  async getAgentHealth(): Promise<Map<string, AgentHealth>> {
    try {
      return await this.responseCoordinator.checkAgentHealth();
    } catch (error: any) {
      this.logger.error('Failed to get agent health', { error: error.message });
      return new Map();
    }
  }

  /**
   * AIエージェントの初期化
   */
  private initializeAgents(): void {
    const agentConfigs = this.config.getAgentConfigs();

    // Claudeエージェント
    if (agentConfigs.claude?.enabled) {
      this.agents.set('claude', new ClaudeAgent());
      this.logger.info('🤖 Claudeエージェントを初期化しました');
    }

    // GPTエージェント
    if (agentConfigs.gpt?.enabled) {
      this.agents.set('gpt', new GPTAgent());
      this.logger.info('⚙️ GPTエージェントを初期化しました');
    }

    // Geminiエージェント
    if (agentConfigs.gemini?.enabled) {
      this.agents.set('gemini', new GeminiAgent());
      this.logger.info('🔍 Geminiエージェントを初期化しました');
    }

    // Perplexityエージェント
    if (agentConfigs.perplexity?.enabled) {
      this.agents.set('perplexity', new PerplexityAgent());
      this.logger.info('🧠 Perplexityエージェントを初期化しました');
    }
  }

  /**
   * ヘルプデスクボットの状態確認
   */
  public async healthCheck(): Promise<APIResponse> {
    try {
      const agentStatus = await this.checkAgentStatus();
      const configStatus = this.config.validate();

      return {
        success: true,
        data: {
          status: 'healthy',
          agents: agentStatus,
          config: configStatus,
          timestamp: new Date(),
        },
        message: 'ヘルプデスクボットは正常に動作しています',
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error('ヘルスチェック失敗', { error });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
      };
    }
  }

  /**
   * エージェントの状態確認
   */
  private async checkAgentStatus(): Promise<Record<AIAgent, boolean>> {
    const status: Record<AIAgent, boolean> = {
      claude: false,
      gpt: false,
      gemini: false,
      perplexity: false,
    };

    for (const [agentName, agent] of this.agents) {
      try {
        const isHealthy = await agent.healthCheck();
        status[agentName] = isHealthy;
      } catch (error) {
        this.logger.warn(`${agentName}エージェントのヘルスチェック失敗`, { error });
        status[agentName] = false;
      }
    }

    return status;
  }

  /**
   * 問い合わせの処理
   */
  public async processInquiry(inquiry: Inquiry): Promise<AIResponse> {
    try {
      this.logger.info('問い合わせ処理開始', {
        inquiryId: inquiry.id,
        userId: inquiry.userId,
        category: inquiry.category,
        priority: inquiry.priority,
      });

      // 応答コーディネーターによる処理
      const response = await this.coordinator.processInquiry(inquiry);

      this.logger.info('問い合わせ処理完了', {
        inquiryId: inquiry.id,
        responseId: response.id,
        confidence: response.confidence,
      });

      return response;
    } catch (error) {
      this.logger.error('問い合わせ処理エラー', {
        inquiryId: inquiry.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      throw new HelpdeskError(
        '問い合わせの処理中にエラーが発生しました',
        'INQUIRY_PROCESSING_ERROR',
        500,
        { inquiryId: inquiry.id },
      );
    }
  }

  /**
   * ナレッジベースの学習
   */
  public async learnFromInteraction(inquiry: Inquiry, response: AIResponse): Promise<void> {
    try {
      this.logger.info('学習処理開始', {
        inquiryId: inquiry.id,
        responseId: response.id,
      });

      // 各エージェントへの学習データ提供
      for (const [agentName, agent] of this.agents) {
        if (agent.learn) {
          try {
            await agent.learn(inquiry, response);
          } catch (error) {
            this.logger.warn(`${agentName}エージェントの学習失敗`, { error });
          }
        }
      }

      this.logger.info('学習処理完了', {
        inquiryId: inquiry.id,
        responseId: response.id,
      });
    } catch (error) {
      this.logger.error('学習処理エラー', {
        inquiryId: inquiry.id,
        responseId: response.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * 設定の再読み込み
   */
  public async reloadConfig(): Promise<void> {
    try {
      await this.config.load();
      this.initializeAgents();
      this.logger.info('設定を再読み込みしました');
    } catch (error) {
      this.logger.error('設定再読み込みエラー', { error });
      throw new HelpdeskError('設定の再読み込みに失敗しました', 'CONFIG_RELOAD_ERROR', 500);
    }
  }

  /**
   * ボットのシャットダウン
   */
  public async shutdown(): Promise<void> {
    this.logger.info('ヘルプデスクボットのシャットダウンを開始します');

    // エージェントのクリーンアップ
    for (const [agentName, agent] of this.agents) {
      if (agent.cleanup) {
        try {
          await agent.cleanup();
          this.logger.info(`${agentName}エージェントをクリーンアップしました`);
        } catch (error) {
          this.logger.warn(`${agentName}エージェントのクリーンアップ失敗`, { error });
        }
      }
    }

    this.logger.info('ヘルプデスクボットのシャットダウンが完了しました');
  }
}
