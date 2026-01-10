import { ResponseCoordinator } from '../../src/core/ResponseCoordinator';
import { Config } from '../../src/core/Config';
import { Logger } from '../../src/utils/Logger';
import { Inquiry, AgentResponse } from '../../src/types';

describe('ResponseCoordinator', () => {
  let coordinator: ResponseCoordinator;
  let config: Config;
  let logger: Logger;

  beforeEach(() => {
    config = new Config();
    logger = new Logger('Test');
    coordinator = new ResponseCoordinator();
  });

  describe('processInquiry', () => {
    it('should coordinate responses from multiple agents', async () => {
      const inquiry: Inquiry = {
        id: 'test-inquiry-1',
        userId: 'test-user-1',
        title: 'Test Hardware Issue',
        description: 'Computer not starting',
        content: 'Computer not starting',
        category: 'hardware',
        priority: 'high',
        status: 'open',
        tags: [],
        timestamp: Date.now(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock agents map
      const agents = new Map();

      const result = await coordinator.processInquiry(inquiry);

      expect(result).toBeDefined();
      expect(result.agent).toBe('claude');
      expect(result.content).toBeDefined();
      expect(typeof result.confidence).toBe('number');
    });
  });
});
