import { Sequelize, DataTypes, Model } from 'sequelize';
import { Logger } from '../utils/Logger';
import { Config } from '../core/Config';
import { User, Inquiry, AIResponse, LogEntry } from '../types';

export class Database {
  private sequelize!: Sequelize;
  private logger: Logger;
  private config: Config;
  private models: {
    User?: any;
    Inquiry?: any;
    AIResponse?: any;
    LogEntry?: any;
  };

  constructor() {
    this.logger = new Logger('Database');
    this.config = new Config();
    this.models = {};

    this.initializeSequelize();
    this.defineModels();
  }

  async connect(): Promise<void> {
    try {
      await this.sequelize.authenticate();
      this.logger.info('Database connection established successfully');

      await this.sequelize.sync();
      this.logger.info('Database models synchronized');
    } catch (error) {
      this.logger.error('Database connection failed', { error });
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.sequelize.close();
      this.logger.info('Database connection closed');
    } catch (error) {
      this.logger.error('Error closing database connection', { error });
    }
  }

  // User operations
  async createUser(userData: Partial<User>): Promise<User> {
    const UserModel = this.models.User;
    const user = await UserModel.create(userData);
    return user.toJSON();
  }

  async getUser(id: string): Promise<User | null> {
    const UserModel = this.models.User;
    const user = await UserModel.findByPk(id);
    return user ? user.toJSON() : null;
  }

  async updateUser(id: string, userData: Partial<User>): Promise<User | null> {
    const UserModel = this.models.User;
    const [affectedRows] = await UserModel.update(userData, { where: { id } });
    if (affectedRows > 0) {
      return this.getUser(id);
    }
    return null;
  }

  // Inquiry operations
  async createInquiry(inquiryData: Partial<Inquiry>): Promise<Inquiry> {
    const InquiryModel = this.models.Inquiry;
    const inquiry = await InquiryModel.create({
      ...inquiryData,
      timestamp: Date.now(),
    });
    return (inquiry as any).toJSON();
  }

  async getInquiry(id: string): Promise<Inquiry | null> {
    const InquiryModel = this.models.Inquiry;
    const inquiry = await InquiryModel.findByPk(id, {
      include: [{ model: this.models.AIResponse, as: 'responses' }],
    });
    return inquiry ? inquiry.toJSON() : null;
  }

  async listInquiries(filters: {
    status?: string;
    category?: string;
    limit?: number;
    offset?: number;
  }): Promise<Inquiry[]> {
    const InquiryModel = this.models.Inquiry;
    const whereClause: any = {};

    if (filters.status) whereClause.status = filters.status;
    if (filters.category) whereClause.category = filters.category;

    const inquiries = await InquiryModel.findAll({
      where: whereClause,
      limit: filters.limit || 10,
      offset: filters.offset || 0,
      order: [['createdAt', 'DESC']],
      include: [{ model: this.models.AIResponse, as: 'responses' }],
    });

    return inquiries.map((inquiry: any) => inquiry.toJSON());
  }

  async updateInquiry(id: string, inquiryData: Partial<Inquiry>): Promise<Inquiry | null> {
    const InquiryModel = this.models.Inquiry;
    const [affectedRows] = await InquiryModel.update(inquiryData, { where: { id } });
    if (affectedRows > 0) {
      return this.getInquiry(id);
    }
    return null;
  }

  // AI Response operations
  async createAIResponse(responseData: Partial<AIResponse>): Promise<AIResponse> {
    const AIResponseModel = this.models.AIResponse;
    const response: any = await AIResponseModel.create(responseData);
    return response.toJSON();
  }

  async getInquiryResponses(inquiryId: string): Promise<AIResponse[]> {
    const AIResponseModel = this.models.AIResponse;
    const responses = await AIResponseModel.findAll({
      where: { inquiryId },
      order: [['createdAt', 'DESC']],
    });
    return responses.map((response: any) => response.toJSON());
  }

  // Log operations
  async createLogEntry(logData: Partial<LogEntry>): Promise<LogEntry> {
    const LogEntryModel = this.models.LogEntry;
    const logEntry = await LogEntryModel.create(logData);
    return logEntry.toJSON();
  }

  private initializeSequelize(): void {
    const dbConfig = this.config.getDatabaseConfig();

    const options: any = {
      dialect: dbConfig.type,
      storage: dbConfig.database,
      database: dbConfig.database,
      logging: dbConfig.logging ? (sql: string) => this.logger.info(sql) : false,
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000,
      },
    };

    if (dbConfig.host) options.host = dbConfig.host;
    if (dbConfig.port) options.port = dbConfig.port;
    if (dbConfig.username) options.username = dbConfig.username;
    if (dbConfig.password) options.password = dbConfig.password;

    this.sequelize = new Sequelize(options);
  }

  private defineModels(): void {
    // User model
    class UserModel extends Model<User> {}
    UserModel.init(
      {
        id: {
          type: DataTypes.STRING,
          primaryKey: true,
          defaultValue: () => `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        },
        name: { type: DataTypes.STRING, allowNull: false },
        email: { type: DataTypes.STRING, allowNull: false, unique: true },
        department: { type: DataTypes.STRING },
        role: { type: DataTypes.ENUM('admin', 'manager', 'user', 'guest'), defaultValue: 'user' },
        createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
        updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
      },
      { sequelize: this.sequelize, modelName: 'User' },
    );

    // Inquiry model
    class InquiryModel extends Model<Inquiry> {}
    InquiryModel.init(
      {
        id: {
          type: DataTypes.STRING,
          primaryKey: true,
          defaultValue: () => `inq_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        },
        userId: { type: DataTypes.STRING, allowNull: false },
        title: { type: DataTypes.STRING, allowNull: false },
        description: { type: DataTypes.TEXT },
        content: { type: DataTypes.TEXT, allowNull: false },
        category: {
          type: DataTypes.ENUM('network', 'hardware', 'software', 'account', 'security', 'other'),
          allowNull: false,
        },
        priority: {
          type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
          defaultValue: 'medium',
        },
        status: {
          type: DataTypes.ENUM('open', 'in_progress', 'waiting_for_user', 'resolved', 'closed'),
          defaultValue: 'open',
        },
        tags: { type: DataTypes.JSON, defaultValue: [] },
        context: { type: DataTypes.TEXT },
        agentResponses: { type: DataTypes.JSON, defaultValue: [] },
        timestamp: { type: DataTypes.BIGINT, allowNull: false },
        createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
        updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
        resolvedAt: { type: DataTypes.DATE },
      },
      { sequelize: this.sequelize, modelName: 'Inquiry' },
    );

    // AI Response model
    class AIResponseModel extends Model<AIResponse> {}
    AIResponseModel.init(
      {
        id: {
          type: DataTypes.STRING,
          primaryKey: true,
          defaultValue: () => `resp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        },
        inquiryId: { type: DataTypes.STRING, allowNull: false },
        aiAgent: {
          type: DataTypes.ENUM('claude', 'gpt', 'gemini', 'perplexity'),
          allowNull: false,
        },
        content: { type: DataTypes.TEXT, allowNull: false },
        confidence: { type: DataTypes.FLOAT, allowNull: false },
        reasoning: { type: DataTypes.TEXT },
        sources: { type: DataTypes.JSON, defaultValue: [] },
        createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
      },
      { sequelize: this.sequelize, modelName: 'AIResponse' },
    );

    // Log Entry model
    class LogEntryModel extends Model<LogEntry> {}
    LogEntryModel.init(
      {
        id: {
          type: DataTypes.STRING,
          primaryKey: true,
          defaultValue: () => `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        },
        level: {
          type: DataTypes.ENUM('error', 'warn', 'info', 'debug'),
          allowNull: false,
        },
        message: { type: DataTypes.TEXT, allowNull: false },
        timestamp: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
        context: { type: DataTypes.JSON },
        userId: { type: DataTypes.STRING },
        inquiryId: { type: DataTypes.STRING },
      },
      { sequelize: this.sequelize, modelName: 'LogEntry' },
    );

    // Define associations
    UserModel.hasMany(InquiryModel, { foreignKey: 'userId' });
    InquiryModel.belongsTo(UserModel, { foreignKey: 'userId' });

    InquiryModel.hasMany(AIResponseModel, { foreignKey: 'inquiryId', as: 'responses' });
    AIResponseModel.belongsTo(InquiryModel, { foreignKey: 'inquiryId' });

    this.models.User = UserModel;
    this.models.Inquiry = InquiryModel;
    this.models.AIResponse = AIResponseModel;
    this.models.LogEntry = LogEntryModel;
  }
}
