import 'dotenv/config';
import { CLI } from './cli/CLI';
import { Logger } from './utils/Logger';
import { Config } from './core/Config';

async function main() {
  try {
    // 設定の読み込み
    const config = new Config();
    await config.load();

    // ロガーの初期化
    const logger = new Logger(config);
    logger.info('🚀 Enterprise IT Helpdesk AI を起動します...');

    // CLIの初期化と実行
    const cli = new CLI();
    await cli.start();

    // コマンドライン引数の処理
    const args = process.argv.slice(2);
    if (args.length === 0) {
      // インタラクティブモード
      await cli.startInteractive();
    } else {
      // コマンド実行モード
      await cli.runCommand(args);
    }
  } catch (error) {
    console.error('❌ 起動エラー:', error);
    process.exit(1);
  }
}

// グレースフルシャットダウン
process.on('SIGINT', () => {
  console.log('\n👋 Enterprise IT Helpdesk AI を終了します...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n👋 Enterprise IT Helpdesk AI を終了します...');
  process.exit(0);
});

process.on('unhandledRejection', reason => {
  console.error('❌ 未処理のPromise拒否:', reason);
  process.exit(1);
});

process.on('uncaughtException', error => {
  console.error('❌ 未捕捉の例外:', error);
  process.exit(1);
});

// メイン実行
if (require.main === module) {
  main().catch(error => {
    console.error('❌ 致命的エラー:', error);
    process.exit(1);
  });
}

export { main };
