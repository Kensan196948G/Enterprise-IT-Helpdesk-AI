import { CLI } from '../../src/cli/CLI';

describe('CLI', () => {
  let cli: CLI;

  beforeEach(async () => {
    cli = new CLI();

    await cli.start();
  });

  describe('start', () => {
    it('should initialize CLI successfully', async () => {
      // CLI start is tested in beforeEach
      expect(cli).toBeDefined();
    });
  });

  describe('runCommand', () => {
    it('should handle status command', async () => {
      // Mock console.log to capture output
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await cli.runCommand(['status']);

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });
});
