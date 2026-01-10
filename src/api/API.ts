import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { Logger } from '../utils/Logger';
import { Config } from '../core/Config';
import { HelpdeskBot } from '../core/HelpdeskBot';
import { Inquiry, APIResponse } from '../types';

export class API {
  private app: express.Application;
  private logger: Logger;
  private config: Config;
  private bot: HelpdeskBot;
  private port: number;

  constructor() {
    this.app = express();
    this.logger = new Logger('API');
    this.config = new Config();
    this.bot = new HelpdeskBot(this.config, this.logger);
    this.port = process.env.PORT ? parseInt(process.env.PORT) : 3000;

    this.setupMiddleware();
    this.setupRoutes();
  }

  get host(): string {
    return process.env.HOST || '0.0.0.0';
  }

  async start(): Promise<void> {
    try {
      await this.config.load();

      this.app.listen(this.port, this.host, () => {
        this.logger.info(`API server started on ${this.host}:${this.port}`);
      });
    } catch (error) {
      this.logger.error('Failed to start API server', { error });
      throw error;
    }
  }

  private setupMiddleware(): void {
    // Security middleware
    this.app.use(helmet());

    // CORS
    this.app.use(
      cors({
        origin: process.env.NODE_ENV === 'production' ? false : true,
        credentials: true,
      }),
    );

    // Compression
    this.app.use(compression());

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));

    // Request logging
    this.app.use((_req, _res, next) => {
      this.logger.info(`${_req.method} ${_req.path}`, {
        ip: _req.ip,
        userAgent: _req.get('User-Agent'),
      });
      next();
    });
  }

  private setupRoutes(): void {
    // Health check
    this.app.get('/health', this.handleHealthCheck.bind(this));

    // API v1 routes
    const v1Router = express.Router();

    // Inquiry routes
    v1Router.post('/inquiries', this.handleCreateInquiry.bind(this));
    v1Router.get('/inquiries/:id', this.handleGetInquiry.bind(this));
    v1Router.get('/inquiries', this.handleListInquiries.bind(this));

    // Agent routes
    v1Router.get('/agents', this.handleListAgents.bind(this));
    v1Router.get('/agents/health', this.handleAgentHealth.bind(this));

    // System routes
    v1Router.get('/status', this.handleSystemStatus.bind(this));

    this.app.use('/api/v1', v1Router);

    // 404 handler
    this.app.use('*', (_req, res) => {
      res.status(404).json({
        success: false,
        error: 'Endpoint not found',
        timestamp: new Date(),
      });
    });

    // Error handler
    this.app.use(this.handleError.bind(this));
  }

  private async handleHealthCheck(_req: express.Request, res: express.Response): Promise<void> {
    const response: APIResponse<{ status: string; timestamp: Date }> = {
      success: true,
      data: {
        status: 'healthy',
        timestamp: new Date(),
      },
      timestamp: new Date(),
    };
    res.json(response);
  }

  private async handleCreateInquiry(req: express.Request, res: express.Response): Promise<void> {
    try {
      const inquiryData: Partial<Inquiry> = req.body;

      // Validate required fields
      if (!inquiryData.title || !inquiryData.category || !inquiryData.content) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields: title, category, content',
          timestamp: new Date(),
        });
        return;
      }

      const result = await this.bot.processInquiry(inquiryData as Inquiry);

      const response: APIResponse<any> = {
        success: true,
        data: result,
        timestamp: new Date(),
      };

      res.status(201).json(response);
    } catch (error: any) {
      this.logger.error('Create inquiry failed', { error: error.message });
      res.status(500).json({
        success: false,
        error: 'Failed to process inquiry',
        timestamp: new Date(),
      });
    }
  }

  private async handleGetInquiry(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { id } = req.params;
      const inquiry = await this.bot.getInquiry(id);

      if (!inquiry) {
        res.status(404).json({
          success: false,
          error: 'Inquiry not found',
          timestamp: new Date(),
        });
        return;
      }

      const response: APIResponse<any> = {
        success: true,
        data: inquiry,
        timestamp: new Date(),
      };

      res.json(response);
    } catch (error: any) {
      this.logger.error('Get inquiry failed', { error: error.message });
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve inquiry',
        timestamp: new Date(),
      });
    }
  }

  private async handleListInquiries(req: express.Request, res: express.Response): Promise<void> {
    try {
      const { limit = 10, offset = 0, status, category } = req.query;
      const filters = {
        status: status as string,
        category: category as string,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      };

      const inquiries = await this.bot.listInquiries(filters);

      const response: APIResponse<any> = {
        success: true,
        data: inquiries,
        timestamp: new Date(),
      };

      res.json(response);
    } catch (error: any) {
      this.logger.error('List inquiries failed', { error: error.message });
      res.status(500).json({
        success: false,
        error: 'Failed to list inquiries',
        timestamp: new Date(),
      });
    }
  }

  private async handleListAgents(_req: express.Request, res: express.Response): Promise<void> {
    try {
      const agents = this.config.getEnabledAgents();

      const response: APIResponse<string[]> = {
        success: true,
        data: agents,
        timestamp: new Date(),
      };

      res.json(response);
    } catch (error: any) {
      this.logger.error('List agents failed', { error: error.message });
      res.status(500).json({
        success: false,
        error: 'Failed to list agents',
        timestamp: new Date(),
      });
    }
  }

  private async handleAgentHealth(_req: express.Request, res: express.Response): Promise<void> {
    try {
      const health = await this.bot.getAgentHealth();

      const response: APIResponse<any> = {
        success: true,
        data: health,
        timestamp: new Date(),
      };

      res.json(response);
    } catch (error: any) {
      this.logger.error('Agent health check failed', { error: error.message });
      res.status(500).json({
        success: false,
        error: 'Failed to check agent health',
        timestamp: new Date(),
      });
    }
  }

  private async handleSystemStatus(_req: express.Request, res: express.Response): Promise<void> {
    try {
      const status = await this.bot.getSystemStatus();

      const response: APIResponse<any> = {
        success: true,
        data: status,
        timestamp: new Date(),
      };

      res.json(response);
    } catch (error: any) {
      this.logger.error('System status check failed', { error: error.message });
      res.status(500).json({
        success: false,
        error: 'Failed to get system status',
        timestamp: new Date(),
      });
    }
  }

  private handleError(
    err: any,
    req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ): void {
    this.logger.error('API Error', {
      error: err.message,
      stack: err.stack,
      method: req.method,
      path: req.path,
    });

    const statusCode = err.statusCode || 500;
    const response: APIResponse<null> = {
      success: false,
      error: err.message || 'Internal server error',
      timestamp: new Date(),
    };

    res.status(statusCode).json(response);
  }
}
