import { MCPManager } from '../../src/mcp/MCPManager';

describe('MCPManager', () => {
  let manager: MCPManager;

  beforeEach(() => {
    manager = new MCPManager();
  });

  describe('executeTool', () => {
    it('should execute brave-search tool', async () => {
      const result = await manager.executeTool('brave-search', {
        query: 'test query',
        numResults: 5,
      });

      expect(result).toBeDefined();
      expect(result.tool).toBe('brave-search');
      expect(result.success).toBe(true);
    });
  });

  describe('getAvailableTools', () => {
    it('should return available MCP tools', () => {
      const tools = manager.getAvailableTools();

      expect(Array.isArray(tools)).toBe(true);
      expect(tools.length).toBeGreaterThan(0);
    });
  });
});
