import { Logger } from '../utils/Logger';
import { GitResult } from '../types';
import { Bash } from './Bash';

export class GitOperations {
  private logger: Logger;
  private bash: Bash;

  constructor() {
    this.logger = new Logger('GitOperations');
    this.bash = new Bash();
  }

  async commit(
    message: string,
    options: { amend?: boolean; noVerify?: boolean } = {},
  ): Promise<GitResult> {
    try {
      let command = 'git add . && git commit';
      if (options.amend) command += ' --amend';
      if (options.noVerify) command += ' --no-verify';
      command += ` -m "${message}"`;

      const result = await this.bash.execute(command);
      return { success: true, output: result.stdout };
    } catch (error: any) {
      return { success: false, output: '', error: error.message };
    }
  }

  async checkout(branch: string): Promise<GitResult> {
    try {
      const result = await this.bash.execute(`git checkout ${branch}`);
      return { success: true, output: result.stdout };
    } catch (error: any) {
      return { success: false, output: '', error: error.message };
    }
  }

  async merge(branch: string, options: { noFastForward?: boolean } = {}): Promise<GitResult> {
    try {
      let command = `git merge ${branch}`;
      if (options.noFastForward) command += ' --no-ff';
      const result = await this.bash.execute(command);
      return { success: true, output: result.stdout };
    } catch (error: any) {
      return { success: false, output: '', error: error.message };
    }
  }

  async getChangedFiles(branch?: string): Promise<string[]> {
    try {
      const base = branch || 'HEAD~1';
      const result = await this.bash.execute(`git diff --name-only ${base}`);
      return result.stdout.split('\n').filter(f => f.trim());
    } catch (error) {
      this.logger.error('Failed to get changed files', {
        error: error instanceof Error ? error.message : String(error),
      });
      return [];
    }
  }

  async getCurrentBranch(): Promise<string> {
    try {
      const result = await this.bash.execute('git branch --show-current');
      return result.stdout.trim();
    } catch (error) {
      return 'unknown';
    }
  }

  async isClean(): Promise<boolean> {
    try {
      const result = await this.bash.execute('git status --porcelain');
      return result.stdout.trim() === '';
    } catch (error) {
      return false;
    }
  }
}
