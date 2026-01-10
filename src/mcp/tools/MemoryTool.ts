import { BaseMCPTool } from '../MCPManager';

export class MemoryTool extends BaseMCPTool {
  private memory: Map<string, any>;

  constructor() {
    super('memory', 'Persistent memory storage and retrieval');
    this.capabilities = ['memory-storage', 'data-persistence', 'information-retrieval'];
    this.memory = new Map();
  }

  async execute(params: { action: string; key?: string; value?: any; ttl?: number }): Promise<any> {
    try {
      this.logger.info(`Memory action: ${params.action}`);

      switch (params.action) {
        case 'store':
          this.memory.set(params.key!, {
            value: params.value,
            timestamp: Date.now(),
            ttl: params.ttl,
          });
          return { success: true, message: `Stored data for key: ${params.key}` };

        case 'retrieve':
          const item = this.memory.get(params.key!);
          if (!item) {
            return { success: false, message: 'Key not found' };
          }
          // Check TTL
          if (item.ttl && Date.now() - item.timestamp > item.ttl * 1000) {
            this.memory.delete(params.key!);
            return { success: false, message: 'Key expired' };
          }
          return { success: true, data: item.value };

        case 'delete':
          const deleted = this.memory.delete(params.key!);
          return { success: deleted, message: deleted ? 'Key deleted' : 'Key not found' };

        case 'list':
          return { success: true, keys: Array.from(this.memory.keys()) };

        default:
          throw new Error(`Unknown action: ${params.action}`);
      }
    } catch (error) {
      return this.handleError('memory operation', error);
    }
  }

  override async isAvailable(): Promise<boolean> {
    return true; // In-memory storage is always available
  }
}
