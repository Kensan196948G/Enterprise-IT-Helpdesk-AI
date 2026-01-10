import { HelpdeskBot } from '../../src/core/HelpdeskBot';
import { Config } from '../../src/core/Config';
import { Logger } from '../../src/core/Logger';
import { Inquiry } from '../../src/types';

describe('Agent Integration', () => {
  let bot: HelpdeskBot;
  let config: Config;
  let logger: Logger;

  beforeEach(async () => {
    config = new Config();
    logger = new Logger('Test');
    bot = new HelpdeskBot(config, logger);
  });

  describe('Multi-agent coordination', () => {
    it('should process inquiry with multiple agents', async () => {
      const inquiry: Inquiry = {
        id: 'integration-test-1',
        userId: 'test-user-1',
        title: 'Integration Test Inquiry',
        description: 'Testing multi-agent coordination',
        content: 'Testing multi-agent coordination',
        category: 'software',
        priority: 'high',
        status: 'open',
        tags: ['integration-test'],
        timestamp: Date.now(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const response = await bot.processInquiry(inquiry);

      expect(response).toBeDefined();
      expect(response.agent).toBe('claude'); // Claude is the coordinator
      expect(response.confidence).toBeGreaterThan(0);
      expect(response.content).toBeDefined();
      expect(response.content.length).toBeGreaterThan(0);
    });

    it('should handle agent health checks', async () => {
      const health = await bot.healthCheck();

      expect(health.success).toBe(true);
      expect(health.data.agents).toBeDefined();
      expect(typeof health.data.agents.claude).toBe('boolean');
      expect(typeof health.data.agents.gpt).toBe('boolean');
      expect(typeof health.data.agents.gemini).toBe('boolean');
      expect(typeof health.data.agents.perplexity).toBe('boolean');
    });
  });
});
