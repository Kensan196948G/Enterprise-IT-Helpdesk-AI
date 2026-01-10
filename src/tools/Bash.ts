import { Logger } from '../utils/Logger';
import { BashResult } from '../types';
import { spawn } from 'child_process';

export class Bash {
  private logger: Logger;

  constructor() {
    this.logger = new Logger('Bash');
  }

  async execute(
    command: string,
    options: { cwd?: string; timeout?: number } = {},
  ): Promise<BashResult> {
    return new Promise((resolve, reject) => {
      this.logger.info(`Executing command: ${command}`);

      const [cmd, ...args] = command.split(' ');
      const child = spawn(cmd, args, {
        cwd: options.cwd,
        shell: true,
        stdio: ['inherit', 'pipe', 'pipe'],
      });

      let stdout = '';
      let stderr = '';

      child.stdout?.on('data', data => {
        stdout += data.toString();
      });

      child.stderr?.on('data', data => {
        stderr += data.toString();
      });

      const timeout = setTimeout(() => {
        child.kill();
        reject(new Error(`Command timeout: ${command}`));
      }, options.timeout || 30000);

      child.on('close', code => {
        clearTimeout(timeout);
        const result: BashResult = {
          stdout: stdout.trim(),
          stderr: stderr.trim(),
          exitCode: code || 0,
        };

        if (code === 0) {
          this.logger.info(`Command completed: ${command}`);
          resolve(result);
        } else {
          this.logger.error(`Command failed: ${command}, exit code: ${code}`);
          reject(new Error(`Command failed: ${stderr || stdout}`));
        }
      });

      child.on('error', error => {
        clearTimeout(timeout);
        this.logger.error(`Command error: ${command}`, { error: error.message });
        reject(error);
      });
    });
  }
}
