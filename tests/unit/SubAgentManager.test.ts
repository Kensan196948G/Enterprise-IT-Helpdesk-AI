import { SubAgentManager } from '../../src/core/SubAgentManager';
import { Task } from '../../src/types';

describe('SubAgentManager', () => {
  let manager: SubAgentManager;

  beforeEach(() => {
    manager = new SubAgentManager();
  });

  describe('executeSubAgent', () => {
    it('should execute code-implementer subagent', async () => {
      const task: Task = {
        id: 'test-task-1',
        type: 'implement-feature',
        description: 'Implement user authentication',
        priority: 'high',
        data: { feature: 'auth' },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await manager.executeSubAgent('code-implementer', task);

      expect(result).toBeDefined();
      expect(result.status).toBe('completed');
    });
  });

  describe('getAvailableSubAgents', () => {
    it('should return list of available subagents', () => {
      const subagents = manager.getAvailableSubAgents();

      expect(subagents).toBeDefined();
      expect(Array.isArray(subagents)).toBe(true);
      expect(subagents.length).toBeGreaterThan(0);
    });
  });
});
