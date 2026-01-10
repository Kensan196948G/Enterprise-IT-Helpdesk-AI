import * as winston from 'winston';
import * as path from 'path';

/**
 * ロギング管理クラス
 * Winstonを使用した構造化ログ出力
 */
export class Logger {
  private logger: winston.Logger;
  private logLevel: string;

  constructor(_config?: any, logLevel: string = 'info') {
    this.logLevel = process.env.LOG_LEVEL || logLevel;

    this.logger = winston.createLogger({
      level: this.logLevel,
      format: winston.format.combine(
        winston.format.timestamp({
          format: 'YYYY-MM-DD HH:mm:ss',
        }),
        winston.format.errors({ stack: true }),
        winston.format.json(),
      ),
      defaultMeta: { service: 'enterprise-it-helpdesk-ai' },
      transports: [
        // コンソール出力
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.printf(({ timestamp, level, message, ...meta }) => {
              const metaStr = Object.keys(meta).length > 0 ? JSON.stringify(meta, null, 2) : '';
              return `${timestamp} [${level}]: ${message} ${metaStr}`;
            }),
          ),
        }),

        // ファイル出力
        new winston.transports.File({
          filename: path.join(process.cwd(), 'logs', 'error.log'),
          level: 'error',
          format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
        }),

        // 全ログファイル出力
        new winston.transports.File({
          filename: path.join(process.cwd(), 'logs', 'combined.log'),
          format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
        }),
      ],
    });

    // ログディレクトリの作成
    this.ensureLogDirectory();
  }

  /**
   * ログディレクトリの作成
   */
  private ensureLogDirectory(): void {
    const fs = require('fs');
    const logDir = path.join(process.cwd(), 'logs');

    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  }

  /**
   * エラーログ
   */
  public error(message: string, context?: Record<string, any>): void {
    this.logger.error(message, context);
  }

  /**
   * 警告ログ
   */
  public warn(message: string, context?: Record<string, any>): void {
    this.logger.warn(message, context);
  }

  public info(message: string, context?: Record<string, any>): void {
    this.logger.info(message, context);
  }

  public debug(message: string, context?: Record<string, any>): void {
    this.logger.debug(message, context);
  }

  /**
   * 問い合わせ関連ログ
   */
  public logInquiry(inquiryId: string, action: string, details?: Record<string, any>): void {
    this.info(`問い合わせ ${action}`, {
      inquiryId,
      ...details,
    });
  }

  /**
   * AIエージェント関連ログ
   */
  public logAIAgent(agentName: string, action: string, details?: Record<string, any>): void {
    this.info(`AIエージェント ${agentName}: ${action}`, details);
  }

  /**
   * パフォーマンスログ
   */
  public logPerformance(operation: string, duration: number, details?: Record<string, any>): void {
    this.info(`パフォーマンス: ${operation}`, {
      duration: `${duration}ms`,
      ...details,
    });
  }

  /**
   * セキュリティログ
   */
  public logSecurity(event: string, userId?: string, details?: Record<string, any>): void {
    this.warn(`セキュリティイベント: ${event}`, {
      userId,
      ...details,
    });
  }

  /**
   * ログレベルの変更
   */
  public setLogLevel(level: string): void {
    this.logLevel = level;
    this.logger.level = level;
    this.info(`ログレベルを ${level} に変更しました`);
  }

  /**
   * ログのフラッシュ（強制書き込み）
   */
  public flush(): Promise<void> {
    return new Promise(resolve => {
      this.logger.on('finish', resolve);
      this.logger.end();
    });
  }

  /**
   * ログファイルのローテーション
   */
  public rotateLogs(): void {
    // 古いログファイルのバックアップ
    const fs = require('fs');
    const logDir = path.join(process.cwd(), 'logs');

    const combinedLog = path.join(logDir, 'combined.log');
    const errorLog = path.join(logDir, 'error.log');

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    if (fs.existsSync(combinedLog)) {
      fs.renameSync(combinedLog, path.join(logDir, `combined-${timestamp}.log`));
    }

    if (fs.existsSync(errorLog)) {
      fs.renameSync(errorLog, path.join(logDir, `error-${timestamp}.log`));
    }

    this.info('ログファイルをローテーションしました');
  }
}
