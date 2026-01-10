import { Logger } from '../utils/Logger';
import { Task } from '../types';

export interface ParallelExecutionResult {
  taskId: string;
  status: 'success' | 'failed' | 'cancelled';
  result?: any;
  error?: string;
  executionTime: number;
  conflicts?: string[];
}

export class ParallelExecutor {
  private logger: Logger;
  private maxConcurrentTasks: number;
  private activeTasks: Map<string, Promise<any>>;
  private taskQueue: Task[];
  private conflictDetector: ConflictDetector;

  constructor(maxConcurrentTasks: number = 3) {
    this.logger = new Logger('ParallelExecutor');
    this.maxConcurrentTasks = maxConcurrentTasks;
    this.activeTasks = new Map();
    this.taskQueue = [];
    this.conflictDetector = new ConflictDetector();
  }

  async executeTasks(tasks: Task[]): Promise<ParallelExecutionResult[]> {
    this.taskQueue.push(...tasks);
    const results: ParallelExecutionResult[] = [];

    while (this.taskQueue.length > 0 || this.activeTasks.size > 0) {
      // Start new tasks if slots available
      while (this.activeTasks.size < this.maxConcurrentTasks && this.taskQueue.length > 0) {
        const task = this.taskQueue.shift()!;
        if (!this.hasConflicts(task)) {
          this.startTask(task);
        } else {
          // Re-queue conflicted task
          this.taskQueue.push(task);
          this.logger.warn(`Task ${task.id} has conflicts, re-queuing`);
        }
      }

      // Wait for a task to complete
      if (this.activeTasks.size > 0) {
        const completedTaskId = await this.waitForAnyTask();
        const result = await this.activeTasks.get(completedTaskId)!;
        this.activeTasks.delete(completedTaskId);
        results.push(result);
      }
    }

    return results;
  }

  private async startTask(task: Task): Promise<void> {
    const startTime = Date.now();

    const taskPromise = this.executeSingleTask(task)
      .then(result => ({
        taskId: task.id,
        status: 'success' as const,
        result,
        executionTime: Date.now() - startTime,
      }))
      .catch(error => ({
        taskId: task.id,
        status: 'failed' as const,
        error: error.message,
        executionTime: Date.now() - startTime,
      }));

    this.activeTasks.set(task.id, taskPromise);
    this.logger.info(`Started task ${task.id}`);
  }

  private async executeSingleTask(task: Task): Promise<any> {
    // This would delegate to appropriate SubAgent or handler
    // For now, simulate task execution
    this.logger.info(`Executing task ${task.id}: ${task.description}`);

    // Simulate some work
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000));

    return { message: `Task ${task.id} completed` };
  }

  private hasConflicts(task: Task): boolean {
    return this.conflictDetector.detectConflicts(task, Array.from(this.activeTasks.keys()));
  }

  private async waitForAnyTask(): Promise<string> {
    const taskIds = Array.from(this.activeTasks.keys());
    const promises = taskIds.map(id => this.activeTasks.get(id)!);

    await Promise.race(promises);
    return taskIds[0]; // Simplified - in real implementation, need to track which one completed
  }

  getActiveTaskCount(): number {
    return this.activeTasks.size;
  }

  getQueuedTaskCount(): number {
    return this.taskQueue.length;
  }
}

class ConflictDetector {
  detectConflicts(_task: Task, _activeTaskIds: string[]): boolean {
    // Simplified conflict detection
    // In real implementation, would check resource usage patterns
    return false;
  }
}
