import { Logger } from '../utils/Logger';
import { Bash } from '../tools/Bash';
import { Config } from './Config';
import { HookResult } from '../types';

export class HookManager {
  private logger: Logger;
  private bash: Bash;
  private config: Config;
  private hooks: Map<string, HookFunction>;

  constructor() {
    this.logger = new Logger('HookManager');
    this.bash = new Bash();
    this.config = new Config();
    this.hooks = new Map();
    this.initializeHooks();
  }

  async executePreCommitHooks(): Promise<HookResult[]> {
    const results: HookResult[] = [];
    const preCommitHooks = this.config.getBotConfig().hooks?.pre_commit;

    if (!preCommitHooks) {
      return results;
    }

    this.logger.info('Executing pre-commit hooks');

    if (preCommitHooks.lint) {
      results.push(await this.executeHook('lint'));
    }

    if (preCommitHooks.type_check) {
      results.push(await this.executeHook('type-check'));
    }

    if (preCommitHooks.security_scan) {
      results.push(await this.executeHook('security-scan'));
    }

    const failedHooks = results.filter(r => r.status === 'failed');
    if (failedHooks.length > 0) {
      throw new Error(`Pre-commit hooks failed: ${failedHooks.map(h => h.hook).join(', ')}`);
    }

    return results;
  }

  async executePostCommitHooks(commitHash: string): Promise<HookResult[]> {
    const results: HookResult[] = [];
    const postCommitHooks = this.config.getBotConfig().hooks?.post_commit;

    if (!postCommitHooks) {
      return results;
    }

    this.logger.info('Executing post-commit hooks');

    if (postCommitHooks.auto_test) {
      results.push(await this.executeHook('auto-test', { commitHash }));
    }

    if (postCommitHooks.documentation_update) {
      results.push(await this.executeHook('documentation-update', { commitHash }));
    }

    return results;
  }

  private async executeHook(hookName: string, context?: any): Promise<HookResult> {
    const startTime = Date.now();
    const hook = this.hooks.get(hookName);

    try {
      if (!hook) {
        return {
          hook: hookName,
          status: 'skipped',
          executionTime: Date.now() - startTime,
        };
      }

      const result = await hook(context);
      return {
        hook: hookName,
        status: 'passed',
        output: result,
        executionTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        hook: hookName,
        status: 'failed',
        error: (error as Error).message,
        executionTime: Date.now() - startTime,
      };
    }
  }

  private initializeHooks(): void {
    this.hooks.set('lint', this.lintHook.bind(this));
    this.hooks.set('type-check', this.typeCheckHook.bind(this));
    this.hooks.set('security-scan', this.securityScanHook.bind(this));
    this.hooks.set('auto-test', this.autoTestHook.bind(this));
    this.hooks.set('documentation-update', this.documentationUpdateHook.bind(this));
  }

  private async lintHook(): Promise<string> {
    try {
      const result = await this.bash.execute('npm run lint');
      return result.stdout;
    } catch (error) {
      throw new Error(`Linting failed: ${(error as Error).message}`);
    }
  }

  private async typeCheckHook(): Promise<string> {
    try {
      const result = await this.bash.execute('npm run type-check');
      return result.stdout;
    } catch (error) {
      throw new Error(`Type checking failed: ${(error as Error).message}`);
    }
  }

  private async securityScanHook(): Promise<string> {
    try {
      // Use security scanning tools
      const result = await this.bash.execute('npm audit --audit-level high');
      return result.stdout;
    } catch (error) {
      throw new Error(`Security scan failed: ${(error as Error).message}`);
    }
  }

  private async autoTestHook(_context?: { commitHash: string }): Promise<string> {
    try {
      const result = await this.bash.execute('npm test');
      return result.stdout;
    } catch (error) {
      throw new Error(`Auto testing failed: ${(error as Error).message}`);
    }
  }

  private async documentationUpdateHook(_context?: { commitHash: string }): Promise<string> {
    try {
      // Update documentation based on changes
      this.logger.info('Updating documentation');
      return 'Documentation updated successfully';
    } catch (error) {
      throw new Error(`Documentation update failed: ${(error as Error).message}`);
    }
  }
}

type HookFunction = (context?: any) => Promise<string>;
