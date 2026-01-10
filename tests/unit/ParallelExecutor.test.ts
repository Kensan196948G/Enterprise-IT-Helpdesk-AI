import { ParallelExecutor } from '../../src/core/ParallelExecutor';
import { Task } from '../../src/types';

describe('ParallelExecutor', () => {
  let executor: ParallelExecutor;

  beforeEach(() => {
    executor = new ParallelExecutor(3);
  });

  describe('executeTasks', () => {
    it('should execute tasks in parallel', async () => {
      const tasks: Task[] = [
        {
          id: 'task-1',
          type: 'test',
          description: 'Test task 1',
          priority: 'medium',
          data: {},
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'task-2',
          type: 'test',
          description: 'Test task 2',
          priority: 'medium',
          data: {},
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const results = await executor.executeTasks(tasks);

      expect(results).toHaveLength(2);
      results.forEach(result => {
        expect(result.status).toBe('success');
      });
    });
  });

  describe('getActiveTaskCount', () => {
    it('should return active task count', () => {
      const count = executor.getActiveTaskCount();
      expect(typeof count).toBe('number');
      expect(count).toBeGreaterThanOrEqual(0);
    });
  });
});
