import { GitWorkTreeManager } from '../../src/core/GitWorkTreeManager';
import { RefactoringOperation } from '../../src/types';

describe('GitWorkTreeManager', () => {
  let manager: GitWorkTreeManager;

  beforeEach(() => {
    manager = new GitWorkTreeManager();
  });

  describe('createWorkTree', () => {
    it('should create a new worktree', async () => {
      const workTree = await manager.createWorkTree('test-feature');

      expect(workTree).toBeDefined();
      expect(workTree.name).toBe('test-feature');
      expect(workTree.status).toBe('active');
    });
  });

  describe('getActiveWorkTrees', () => {
    it('should return active worktrees', () => {
      const worktrees = manager.getActiveWorkTrees();

      expect(Array.isArray(worktrees)).toBe(true);
    });
  });
});
