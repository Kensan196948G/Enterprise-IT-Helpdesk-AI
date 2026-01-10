import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { BotConfig, DatabaseConfig, HelpdeskError } from '../types';
import { Logger } from '../utils/Logger';

/**
 * アプリケーション設定管理クラス
 */
export class Config {
  private config: BotConfig;
  private agentConfigs: Record<string, any>;
  private databaseConfig: DatabaseConfig;
  private logger: Logger;

  constructor(logger?: Logger) {
    this.logger = logger || new Logger(this);
    this.config = this.getDefaultConfig();
    this.agentConfigs = {};
    this.databaseConfig = this.getDefaultDatabaseConfig();
  }

  /**
   * デフォルト設定を取得
   */
  private getDefaultConfig(): BotConfig {
    return {
      enabledAgents: ['claude', 'gpt', 'gemini', 'perplexity'],
      maxConcurrentRequests: 3,
      responseTimeout: 30000, // 30秒
      confidenceThreshold: 0.7,
      language: 'ja',
      features: {
        parallelExecution: true,
        gitWorktree: true,
        mcpIntegration: true,
      },
    };
  }

  /**
   * デフォルトデータベース設定を取得
   */
  private getDefaultDatabaseConfig(): DatabaseConfig {
    return {
      type: 'sqlite',
      database: './data/helpdesk.db',
      logging: process.env.NODE_ENV === 'development',
    };
  }

  /**
   * 設定ファイルの読み込み
   */
  public async load(): Promise<void> {
    try {
      // .envファイルの読み込み
      dotenv.config();

      // opencode-config.jsonの読み込み
      const configPath = path.join(process.cwd(), 'opencode-config.json');
      if (fs.existsSync(configPath)) {
        const configData = fs.readFileSync(configPath, 'utf-8');
        const opencodeConfig = JSON.parse(configData);

        // BotConfigの更新
        this.config = {
          ...this.config,
          ...opencodeConfig,
        };

        // エージェント設定の読み込み
        if (opencodeConfig.agents?.subagents) {
          this.agentConfigs = opencodeConfig.agents.subagents;
        }

        // データベース設定の読み込み
        if (opencodeConfig.database) {
          this.databaseConfig = {
            ...this.databaseConfig,
            ...opencodeConfig.database,
          };
        }

        this.logger?.info('設定ファイルを読み込みました');
      } else {
        this.logger?.warn('opencode-config.jsonが見つからないため、デフォルト設定を使用します');
      }

      // 環境変数からの設定上書き
      this.loadFromEnvironment();

      // 設定の検証
      this.validate();

      this.logger?.info('設定の読み込みが完了しました');
    } catch (error) {
      this.logger?.error('設定ファイルの読み込みに失敗しました', { error });
      throw new HelpdeskError('設定ファイルの読み込みに失敗しました', 'CONFIG_LOAD_ERROR', 500, {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * 環境変数からの設定読み込み
   */
  private loadFromEnvironment(): void {
    // AIエージェント設定
    this.agentConfigs = {
      claude: {
        enabled: process.env.ENABLE_CLAUDE === 'true',
        apiKey: process.env.ANTHROPIC_API_KEY || '',
        model: 'claude-3-opus',
        maxTokens: 4000,
        temperature: 0.7,
      },
      gpt: {
        enabled: process.env.ENABLE_GPT === 'true',
        apiKey: process.env.OPENAI_API_KEY || '',
        model: 'gpt-4',
        maxTokens: 4000,
        temperature: 0.7,
      },
      gemini: {
        enabled: process.env.ENABLE_GEMINI === 'true',
        apiKey: process.env.GEMINI_API_KEY || '',
        model: 'gemini-pro',
        maxTokens: 4000,
        temperature: 0.7,
      },
      perplexity: {
        enabled: process.env.ENABLE_PERPLEXITY === 'true',
        apiKey: process.env.PERPLEXITY_API_KEY || '',
        model: 'pplx-7b-chat',
        maxTokens: 4000,
        temperature: 0.7,
      },
    };

    // データベース設定
    if (process.env.DATABASE_URL) {
      this.databaseConfig = {
        ...this.databaseConfig,
        database: process.env.DATABASE_URL,
      };
    }

    // アプリケーション設定
    if (process.env.NODE_ENV) {
      this.config = {
        ...this.config,
        // NODE_ENVに基づく設定調整
      };
    }

    // 機能フラグ
    this.config.features = {
      parallelExecution: process.env.ENABLE_PARALLEL_EXECUTION !== 'false',
      gitWorktree: process.env.ENABLE_GIT_WORKTREE !== 'false',
      mcpIntegration: process.env.ENABLE_MCP_INTEGRATION !== 'false',
    };
  }

  /**
   * 設定の検証
   */
  public validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // APIキーの検証
    if (this.agentConfigs.claude?.enabled && !this.agentConfigs.claude.apiKey) {
      errors.push('Claude APIキーが設定されていません');
    }
    if (this.agentConfigs.gpt?.enabled && !this.agentConfigs.gpt.apiKey) {
      errors.push('GPT APIキーが設定されていません');
    }
    if (this.agentConfigs.gemini?.enabled && !this.agentConfigs.gemini.apiKey) {
      errors.push('Gemini APIキーが設定されていません');
    }

    // 設定値の検証
    if (this.config.maxConcurrentRequests < 1) {
      errors.push('maxConcurrentRequestsは1以上である必要があります');
    }
    if (this.config.responseTimeout < 1000) {
      errors.push('responseTimeoutは1000ms以上である必要があります');
    }
    if (this.config.confidenceThreshold < 0 || this.config.confidenceThreshold > 1) {
      errors.push('confidenceThresholdは0-1の範囲である必要があります');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * エージェント設定を取得
   */
  public getAgentConfigs(): Record<string, any> {
    return this.agentConfigs;
  }

  /**
   * 特定のエージェント設定を取得
   */
  public getAgentConfig(agentName: string): any {
    return this.agentConfigs[agentName];
  }

  /**
   * 有効なエージェントを取得
   */
  public getEnabledAgents(): string[] {
    return Object.keys(this.agentConfigs).filter(name => this.agentConfigs[name]?.enabled);
  }

  /**
   * SubAgent設定を取得
   */
  public getSubAgentConfig(subAgentName: string): any {
    return this.agentConfigs[subAgentName];
  }

  /**
   * すべてのSubAgent設定を取得
   */
  public getAllSubAgentConfigs(): Record<string, any> {
    return this.agentConfigs;
  }

  /**
   * データベース設定を取得
   */
  public getDatabaseConfig(): DatabaseConfig {
    return this.databaseConfig;
  }

  /**
   * ボット設定を取得
   */
  public getBotConfig(): BotConfig {
    return this.config;
  }

  /**
   * 設定を保存
   */
  public async save(): Promise<void> {
    try {
      const configPath = path.join(process.cwd(), 'opencode-config.json');
      const configData = {
        ...this.config,
        agents: {
          enabled: true,
          subagents: this.agentConfigs,
        },
        database: this.databaseConfig,
        timestamp: new Date().toISOString(),
      };

      fs.writeFileSync(configPath, JSON.stringify(configData, null, 2), 'utf-8');
      this.logger?.info('設定ファイルを保存しました');
    } catch (error) {
      this.logger?.error('設定ファイルの保存に失敗しました', { error });
      throw new HelpdeskError('設定ファイルの保存に失敗しました', 'CONFIG_SAVE_ERROR', 500);
    }
  }
}
