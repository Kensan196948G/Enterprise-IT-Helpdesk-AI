import { HelpdeskBot } from '../../src/core/HelpdeskBot';
import { Config } from '../../src/core/Config';
import { Logger } from '../../src/utils/Logger';
import { Inquiry, AIResponse } from '../../src/types';

describe('HelpdeskBot', () => {
  let bot: HelpdeskBot;
  let config: Config;
  let logger: Logger;

  beforeEach(async () => {
    config = new Config();
    logger = new Logger('Test');
    bot = new HelpdeskBot(config, logger);
  });

  describe('healthCheck', () => {
    it('should return healthy status', async () => {
      const result = await bot.healthCheck();
      expect(result.success).toBe(true);
      expect(result.data.status).toBe('healthy');
    });
  });

  describe('processInquiry', () => {
    it('should process an inquiry successfully', async () => {
      const inquiry: Inquiry = {
        id: 'test-inquiry-1',
        userId: 'test-user-1',
        title: 'Test Network Issue',
        description: 'Cannot connect to internet',
        content: 'Cannot connect to internet',
        category: 'network',
        priority: 'medium',
        status: 'open',
        tags: [],
        timestamp: Date.now(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await bot.processInquiry(inquiry);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.inquiryId).toBe(inquiry.id);
      expect(typeof result.confidence).toBe('number');
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });
  });
});
