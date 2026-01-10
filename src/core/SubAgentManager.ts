import { Logger } from '../utils/Logger';
import { Config } from '../core/Config';
import { Task } from '../types';

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

export class SubAgentManager {
  private logger: Logger;
  private config: Config;
  private subAgents: Map<string, SubAgentInstance>;

  constructor() {
    this.logger = new Logger('SubAgentManager');
    this.config = new Config();
    this.subAgents = new Map();

    this.initializeSubAgents();
  }

  async executeSubAgent(subAgentName: string, task: Task): Promise<any> {
    try {
      this.logger.info('Executing SubAgent', { subAgentName, taskId: task.id });

      const subAgent = this.subAgents.get(subAgentName);
      if (!subAgent) {
        throw new Error(`SubAgent ${subAgentName} not found`);
      }

      // Validate permissions
      const requiredPermissions = this.getSubAgentConfig(subAgentName)?.permissions || [];
      if (!subAgent.validatePermissions(requiredPermissions)) {
        throw new Error(`Insufficient permissions for SubAgent ${subAgentName}`);
      }

      // Execute the task
      const result = await subAgent.execute(task);

      this.logger.info('SubAgent execution completed', { subAgentName, taskId: task.id });
      return result;
    } catch (error) {
      this.logger.error('SubAgent execution failed', {
        subAgentName,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  getAvailableSubAgents(): string[] {
    return Array.from(this.subAgents.keys());
  }

  getSubAgentConfig(subAgentName: string): SubAgentConfig | undefined {
    const config = this.config.getSubAgentConfig(subAgentName);
    return config;
  }

  private initializeSubAgents(): void {
    const subAgentConfigs = this.config.getAllSubAgentConfigs();

    for (const [name, config] of Object.entries(subAgentConfigs)) {
      if (config.enabled) {
        try {
          const subAgent = this.createSubAgentInstance(name, config);
          this.subAgents.set(name, subAgent);
          this.logger.info(`SubAgent ${name} initialized`);
        } catch (error) {
          this.logger.error(`Failed to initialize SubAgent ${name}`, {
            error: (error as Error).message,
          });
        }
      }
    }

    this.logger.info('SubAgent initialization completed', { count: this.subAgents.size });
  }

  private createSubAgentInstance(name: string, config: SubAgentConfig): SubAgentInstance {
    // Dynamic import based on subagent name
    switch (name) {
      case 'code-implementer':
        return new CodeImplementerSubAgent(config);
      case 'test-designer':
        return new TestDesignerSubAgent(config);
      case 'sec-auditor':
        return new SecAuditorSubAgent(config);
      case 'arch-reviewer':
        return new ArchReviewerSubAgent(config);
      case 'ci-specialist':
        return new CISpecialistSubAgent(config);
      case 'spec-planner':
        return new SpecPlannerSubAgent(config);
      case 'ops-runbook':
        return new OpsRunbookSubAgent(config);
      default:
        throw new Error(`Unknown SubAgent type: ${name}`);
    }
  }
}

// Base class for SubAgents
export abstract class BaseSubAgent implements SubAgentInstance {
  protected config: SubAgentConfig;
  protected logger: Logger;

  constructor(config: SubAgentConfig) {
    this.config = config;
    this.logger = new Logger(`${config.name}SubAgent`);
  }

  abstract execute(task: Task): Promise<any>;

  validatePermissions(_requiredPermissions: string[]): boolean {
    // Implementation would check actual user/session permissions
    // For now, assume all permissions are granted
    return true;
  }

  get name(): string {
    return this.config.name;
  }
}

// Import individual SubAgent implementations
import { CodeImplementerSubAgent } from '../subagents/CodeImplementerSubAgent';
import { TestDesignerSubAgent } from '../subagents/TestDesignerSubAgent';
import { SecAuditorSubAgent } from '../subagents/SecAuditorSubAgent';
import { ArchReviewerSubAgent } from '../subagents/ArchReviewerSubAgent';
import { CISpecialistSubAgent } from '../subagents/CISpecialistSubAgent';
import { SpecPlannerSubAgent } from '../subagents/SpecPlannerSubAgent';
import { OpsRunbookSubAgent } from '../subagents/OpsRunbookSubAgent';
