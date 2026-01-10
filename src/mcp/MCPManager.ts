import { Logger } from '../utils/Logger';
import { Config } from '../core/Config';
import { BraveSearchTool } from './tools/BraveSearchTool';
import { ClaudeInChromeTool } from './tools/ClaudeInChromeTool';
import { Context7Tool } from './tools/Context7Tool';
import { GitHubTool } from './tools/GitHubTool';
import { MemoryTool } from './tools/MemoryTool';
import { PlaywrightTool } from './tools/PlaywrightTool';
import { ClaudeMemSearchTool } from './tools/ClaudeMemSearchTool';
import { SequentialThinkingTool } from './tools/SequentialThinkingTool';

export interface MCPTool {
  name: string;
  description: string;
  version: string;
  capabilities: string[];
  execute(params: any): Promise<any>;
  isAvailable(): Promise<boolean>;
}

export interface MCPToolResult {
  tool: string;
  success: boolean;
  result?: any;
  error?: string;
  executionTime: number;
}

export abstract class BaseMCPTool implements MCPTool {
  public name: string;
  public description: string;
  public version: string;
  public capabilities: string[];
  protected logger: Logger;
  protected config: Config;

  constructor(name: string, description: string, version: string = '1.0.0') {
    this.name = name;
    this.description = description;
    this.version = version;
    this.capabilities = [];
    this.logger = new Logger(`${name}Tool`);
    this.config = new Config();
  }

  abstract execute(params: any): Promise<any>;

  async isAvailable(): Promise<boolean> {
    return true;
  }

  protected async handleError(operation: string, error: any): Promise<never> {
    this.logger.error(`${operation} failed`, { error: error.message });
    throw new Error(`${this.name}: ${operation} failed - ${error.message}`);
  }
}

export class MCPManager {
  private logger: Logger;
  private tools: Map<string, MCPTool>;
  private config: Config;

  constructor() {
    this.logger = new Logger('MCPManager');
    this.tools = new Map();
    this.config = new Config();
    this.initializeTools();
  }

  async executeTool(toolName: string, params: any): Promise<MCPToolResult> {
    const startTime = Date.now();
    const tool = this.tools.get(toolName);

    try {
      if (!tool) {
        throw new Error(`MCP tool ${toolName} not found`);
      }

      if (!(await tool.isAvailable())) {
        throw new Error(`MCP tool ${toolName} is not available`);
      }

      this.logger.info(`Executing MCP tool: ${toolName}`);
      const result = await tool.execute(params);

      return {
        tool: toolName,
        success: true,
        result,
        executionTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        tool: toolName,
        success: false,
        error: (error as Error).message,
        executionTime: Date.now() - startTime,
      };
    }
  }

  getAvailableTools(): string[] {
    return Array.from(this.tools.keys());
  }

  getToolInfo(toolName: string): MCPTool | undefined {
    return this.tools.get(toolName);
  }

  private initializeTools(): void {
    const mcpConfig = this.config.getBotConfig().mcp;

    if (!mcpConfig?.enabled) {
      this.logger.info('MCP integration is disabled');
      return;
    }

    // Initialize enabled tools
    if (mcpConfig.configurations['brave-search']?.enabled) {
      this.tools.set('brave-search', new BraveSearchTool());
    }

    if (mcpConfig.configurations['claude-in-chrome']?.enabled) {
      this.tools.set('claude-in-chrome', new ClaudeInChromeTool());
    }

    if (mcpConfig.configurations['context7']?.enabled) {
      this.tools.set('context7', new Context7Tool());
    }

    if (mcpConfig.configurations['github']?.enabled) {
      this.tools.set('github', new GitHubTool());
    }

    if (mcpConfig.configurations['memory']?.enabled) {
      this.tools.set('memory', new MemoryTool());
    }

    if (mcpConfig.configurations['playwright']?.enabled) {
      this.tools.set('playwright', new PlaywrightTool());
    }

    if (mcpConfig.configurations['plugin:claude-mem:mem-search']?.enabled) {
      this.tools.set('plugin:claude-mem:mem-search', new ClaudeMemSearchTool());
    }

    if (mcpConfig.configurations['sequential-thinking']?.enabled) {
      this.tools.set('sequential-thinking', new SequentialThinkingTool());
    }

    this.logger.info(`Initialized ${this.tools.size} MCP tools`);
  }
}
