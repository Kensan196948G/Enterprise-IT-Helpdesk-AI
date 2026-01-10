// Core Types for Enterprise IT Helpdesk AI

export interface User {
  id: string;
  name: string;
  email: string;
  department: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export type UserRole = 'admin' | 'manager' | 'user' | 'guest';

export interface Inquiry {
  id: string;
  userId: string;
  title: string;
  description: string;
  content: string;
  category: InquiryCategory;
  priority: Priority;
  status: InquiryStatus;
  tags: string[];
  context?: string;
  agentResponses?: AgentResponse[];
  timestamp: number;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
}

export type InquiryCategory =
  | 'network'
  | 'hardware'
  | 'software'
  | 'account'
  | 'security'
  | 'other';

export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export type InquiryStatus = 'open' | 'in_progress' | 'waiting_for_user' | 'resolved' | 'closed';

export interface AgentResponse {
  agent: AIAgent;
  content: string;
  confidence: number;
  metadata?: {
    model?: string;
    tokens_used?: number;
    processing_time?: number;
    finish_reason?: string;
    error?: string;
  };
}

export interface AgentHealth {
  agent: AIAgent;
  status: 'healthy' | 'unhealthy';
  lastCheck: Date;
  responseTime?: number;
  error?: string;
}

export interface AIResponse {
  id: string;
  inquiryId: string;
  aiAgent: AIAgent;
  content: string;
  confidence: number;
  reasoning: string;
  sources?: Source[];
  createdAt: Date;
}

export type AIAgent = 'claude' | 'gpt' | 'gemini' | 'perplexity';

export interface Source {
  type: 'documentation' | 'faq' | 'knowledge_base' | 'external';
  title: string;
  url?: string;
  content: string;
  relevance: number;
}

export interface BotConfig {
  enabledAgents: AIAgent[];
  maxConcurrentRequests: number;
  responseTimeout: number;
  confidenceThreshold: number;
  language: 'ja' | 'en';
  features: {
    parallelExecution: boolean;
    gitWorktree: boolean;
    mcpIntegration: boolean;
  };
  hooks?: {
    pre_commit?: {
      lint?: boolean;
      type_check?: boolean;
      security_scan?: boolean;
    };
    post_commit?: {
      auto_test?: boolean;
      documentation_update?: boolean;
    };
  };
  mcp?: {
    enabled: boolean;
    tools: string[];
    configurations: Record<string, any>;
  };
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: Date;
}

export interface LogEntry {
  id: string;
  level: 'error' | 'warn' | 'info' | 'debug';
  message: string;
  timestamp: Date;
  context?: Record<string, any>;
  userId?: string;
  inquiryId?: string;
}

// AI Agent Interfaces
export interface BaseAIAgent {
  name: AIAgent;
  enabled: boolean;
  apiKey: string;
  model: string;
  maxTokens: number;
  temperature: number;
}

export interface AIAgentInstance {
  process(inquiry: Inquiry): Promise<AgentResponse>;
  healthCheck(): Promise<AgentHealth>;
  learn(data: any): Promise<void>;
}

export interface Task {
  id: string;
  type: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  data: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface SubAgentConfig {
  name: string;
  path: string;
  permissions: string[];
  tools: string[];
  enabled: boolean;
  description?: string;
  capabilities?: string[];
}

export interface SubAgentInstance {
  name: string;
  execute(task: Task): Promise<any>;
  validatePermissions(permissions: string[]): boolean;
}

export interface ClaudeAgent extends BaseAIAgent {
  name: 'claude';
  model: 'claude-3-opus' | 'claude-3-sonnet' | 'claude-3-haiku';
}

export interface GPTAgent extends BaseAIAgent {
  name: 'gpt';
  model: 'gpt-4' | 'gpt-3.5-turbo';
}

export interface GeminiAgent extends BaseAIAgent {
  name: 'gemini';
  model: 'gemini-pro' | 'gemini-pro-vision';
}

export interface PerplexityAgent extends BaseAIAgent {
  name: 'perplexity';
  model: 'pplx-7b-chat' | 'pplx-70b-chat';
}

export type AIAgentConfig = ClaudeAgent | GPTAgent | GeminiAgent | PerplexityAgent;

// CLI Command Types
export interface CLICommand {
  name: string;
  description: string;
  action: (...args: any[]) => Promise<void>;
  options?: CLICommandOption[];
}

export interface CLICommandOption {
  flags: string;
  description: string;
  required?: boolean;
  defaultValue?: any;
}

// Tool Types
export interface BashResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

export interface GitResult {
  success: boolean;
  output: string;
  error?: string;
}

// Database Types
export interface DatabaseConfig {
  type: 'sqlite' | 'postgres' | 'mysql';
  host?: string;
  port?: number;
  database: string;
  username?: string;
  password?: string;
  logging?: boolean;
}

// Error Types
export class HelpdeskError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly context?: Record<string, any>;

  constructor(
    message: string,
    code: string,
    statusCode: number = 500,
    context?: Record<string, any>,
  ) {
    super(message);
    this.name = 'HelpdeskError';
    this.code = code;
    this.statusCode = statusCode;
    if (context !== undefined) {
      this.context = context;
    }
  }
}

export class ValidationError extends HelpdeskError {
  constructor(field: string, message: string) {
    super(`Validation error for ${field}: ${message}`, 'VALIDATION_ERROR', 400, { field });
    this.name = 'ValidationError';
  }
}

export class AIError extends HelpdeskError {
  constructor(agent: AIAgent, message: string) {
    super(`AI Agent ${agent} error: ${message}`, 'AI_ERROR', 500, { agent });
    this.name = 'AIError';
  }
}

// Utility Types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type RequireAtLeastOne<T, Keys extends keyof T = keyof T> = Pick<T, Exclude<keyof T, Keys>> &
  { [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Keys>> }[Keys];

export interface HookResult {
  hook: string;
  status: 'passed' | 'failed' | 'skipped';
  output?: string;
  error?: string;
  executionTime: number;
}

export { HelpdeskBot } from '../core/HelpdeskBot';
