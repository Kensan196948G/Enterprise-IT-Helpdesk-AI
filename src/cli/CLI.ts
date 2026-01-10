import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { Logger } from '../utils/Logger';
import { HelpdeskBot } from '../core/HelpdeskBot';
import { Config } from '../core/Config';
import { Inquiry, InquiryCategory } from '../types';

export class CLI {
  private program: Command;
  private logger: Logger;
  private config: Config;
  private bot: HelpdeskBot;

  constructor() {
    this.program = new Command();
    this.logger = new Logger('CLI');
    this.config = new Config();
    this.bot = new HelpdeskBot(this.config, this.logger);

    this.setupCommands();
  }

  async start(): Promise<void> {
    try {
      await this.config.load();
      this.logger.info('CLI initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize CLI', { error });
      process.exit(1);
    }
  }

  async startInteractive(): Promise<void> {
    console.log(chalk.bold.blue('🤖 Enterprise IT Helpdesk AI'));
    console.log(chalk.gray('Type "help" for commands or "exit" to quit\n'));

    while (true) {
      try {
        const { command } = await inquirer.prompt([
          {
            type: 'input',
            name: 'command',
            message: chalk.cyan('helpdesk>'),
            validate: (input: string) => input.trim() !== '' || 'Please enter a command',
          },
        ]);

        const trimmedCommand = command.trim();

        if (trimmedCommand === 'exit' || trimmedCommand === 'quit') {
          console.log(chalk.yellow('Goodbye! 👋'));
          break;
        }

        if (trimmedCommand === 'help') {
          this.showHelp();
          continue;
        }

        await this.processCommand(trimmedCommand);
      } catch (error) {
        this.logger.error('Interactive mode error', { error });
        console.log(chalk.red('An error occurred. Please try again.'));
      }
    }
  }

  async runCommand(args: string[]): Promise<void> {
    this.program.parse(args);
  }

  private setupCommands(): void {
    this.program.name('helpdesk-ai').description('Enterprise IT Helpdesk AI Bot').version('1.0.0');

    this.program
      .command('inquiry')
      .description('Submit a new IT support inquiry')
      .option('-t, --title <title>', 'Inquiry title')
      .option(
        '-c, --category <category>',
        'Inquiry category (network|hardware|software|account|security|other)',
      )
      .option('-p, --priority <priority>', 'Priority (low|medium|high|urgent)')
      .option('-d, --description <description>', 'Detailed description')
      .option('--interactive', 'Use interactive mode for inquiry submission')
      .action(async options => {
        await this.handleInquiryCommand(options);
      });

    this.program
      .command('status')
      .description('Check system status')
      .action(async () => {
        await this.handleStatusCommand();
      });

    this.program
      .command('agents')
      .description('List available AI agents')
      .action(async () => {
        await this.handleAgentsCommand();
      });

    this.program
      .command('interactive')
      .description('Start interactive mode')
      .action(async () => {
        await this.startInteractive();
      });
  }

  private async handleInquiryCommand(options: any): Promise<void> {
    try {
      let inquiryData: Partial<Inquiry>;

      if (options.interactive || !options.title) {
        inquiryData = await this.promptInquiryDetails(options);
      } else {
        inquiryData = {
          title: options.title,
          category: options.category as InquiryCategory,
          priority: options.priority || 'medium',
          description: options.description || '',
          content: options.description || '',
        };
      }

      const spinner = ora('Processing inquiry...').start();

      const result = await this.bot.processInquiry(inquiryData as Inquiry);

      spinner.stop();
      console.log(chalk.green('\n✅ Inquiry processed successfully!'));
      console.log(chalk.bold('Response:'));
      console.log(result.content);
      console.log(chalk.gray(`\nConfidence: ${(result.confidence * 100).toFixed(1)}%`));
      console.log(chalk.gray(`Response ID: ${result.id}`));
    } catch (error) {
      console.log(chalk.red('❌ Failed to process inquiry:'), (error as Error).message);
      this.logger.error('Inquiry command failed', { error });
    }
  }

  private async handleStatusCommand(): Promise<void> {
    try {
      const status = await this.bot.getSystemStatus();
      console.log(chalk.bold('\n📊 System Status'));
      console.log(`AI Agents: ${status.agents.healthy}/${status.agents.total} healthy`);
      console.log(`Database: ${status.database ? '✅ Connected' : '❌ Disconnected'}`);
      console.log(`Uptime: ${status.uptime}ms`);
    } catch (error) {
      console.log(chalk.red('❌ Failed to get status:'), (error as Error).message);
    }
  }

  private async handleAgentsCommand(): Promise<void> {
    try {
      const agents = this.config.getEnabledAgents();
      console.log(chalk.bold('\n🤖 Available AI Agents'));
      agents.forEach(agent => {
        console.log(`• ${agent}`);
      });
    } catch (error) {
      console.log(chalk.red('❌ Failed to list agents:'), (error as Error).message);
    }
  }

  private async promptInquiryDetails(existingOptions: any): Promise<Partial<Inquiry>> {
    const questions = [
      {
        type: 'input',
        name: 'title',
        message: 'Inquiry title:',
        default: existingOptions.title,
        validate: (input: string) => input.trim() !== '' || 'Title is required',
      },
      {
        type: 'list',
        name: 'category',
        message: 'Category:',
        choices: [
          { name: 'Network Issues', value: 'network' },
          { name: 'Hardware Problems', value: 'hardware' },
          { name: 'Software Issues', value: 'software' },
          { name: 'Account/Login Problems', value: 'account' },
          { name: 'Security Concerns', value: 'security' },
          { name: 'Other', value: 'other' },
        ],
        default: existingOptions.category,
      },
      {
        type: 'list',
        name: 'priority',
        message: 'Priority:',
        choices: [
          { name: 'Low', value: 'low' },
          { name: 'Medium', value: 'medium' },
          { name: 'High', value: 'high' },
          { name: 'Urgent', value: 'urgent' },
        ],
        default: existingOptions.priority || 'medium',
      },
      {
        type: 'input',
        name: 'description',
        message: 'Detailed description:',
        default: existingOptions.description,
      },
    ];

    const answers = await inquirer.prompt(questions);

    return {
      title: answers.title,
      category: answers.category,
      priority: answers.priority,
      description: answers.description,
      content: answers.description,
    };
  }

  private showHelp(): void {
    console.log(chalk.bold('\n📖 Available Commands:'));
    console.log('• inquiry          - Submit a new IT support inquiry');
    console.log('• status           - Check system status');
    console.log('• agents           - List available AI agents');
    console.log('• interactive      - Start interactive mode');
    console.log('• help             - Show this help');
    console.log('• exit/quit        - Exit the application');
    console.log('');
  }

  private async processCommand(command: string): Promise<void> {
    const args = command.split(' ');
    const cmd = args[0];

    switch (cmd) {
      case 'inquiry':
        await this.handleInquiryCommand({});
        break;
      case 'status':
        await this.handleStatusCommand();
        break;
      case 'agents':
        await this.handleAgentsCommand();
        break;
      default:
        console.log(chalk.red(`Unknown command: ${cmd}`));
        console.log(chalk.gray('Type "help" for available commands'));
    }
  }
}
