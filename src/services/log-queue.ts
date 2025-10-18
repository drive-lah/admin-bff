// In-memory queue for asynchronous activity logging
import { db } from '../database/database';
import { logger } from '../utils/logger';
import { CreateLogDto } from '../types/logs';

interface QueueItem {
  logData: CreateLogDto;
  retryCount: number;
  enqueuedAt: Date;
}

class LogQueue {
  private queue: QueueItem[] = [];
  private isProcessing: boolean = false;
  private readonly MAX_RETRIES = 3;
  private readonly PROCESS_INTERVAL_MS = 1000; // Process every 1 second
  private readonly BATCH_SIZE = 10; // Process 10 logs at a time

  constructor() {
    // Start the background worker
    this.startBackgroundWorker();
  }

  /**
   * Add a log entry to the queue for async processing
   */
  public enqueue(logData: CreateLogDto): void {
    try {
      this.queue.push({
        logData,
        retryCount: 0,
        enqueuedAt: new Date()
      });
    } catch (error) {
      // Never throw errors from enqueue - just log to console
      console.error('Failed to enqueue log:', error);
    }
  }

  /**
   * Get current queue size
   */
  public getQueueSize(): number {
    return this.queue.length;
  }

  /**
   * Start the background worker that processes the queue
   */
  private startBackgroundWorker(): void {
    setInterval(() => {
      this.processQueue();
    }, this.PROCESS_INTERVAL_MS);

    logger.info('Log queue background worker started');
  }

  /**
   * Process logs from the queue in batches
   */
  private async processQueue(): Promise<void> {
    // Prevent concurrent processing
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;

    try {
      // Get a batch of items to process
      const batch = this.queue.slice(0, this.BATCH_SIZE);

      for (const item of batch) {
        const success = await this.writeLogToDatabase(item.logData);

        if (success) {
          // Remove from queue on success
          this.queue.shift();
        } else {
          // Increment retry count
          item.retryCount++;

          if (item.retryCount >= this.MAX_RETRIES) {
            // Max retries reached - remove from queue and log error
            this.queue.shift();
            console.error('Max retries reached for log entry, discarding:', {
              user_id: item.logData.user_id,
              action_type: item.logData.action_type,
              endpoint: item.logData.endpoint_path,
              retries: item.retryCount
            });
          } else {
            // Keep in queue for retry, move to end
            this.queue.shift();
            this.queue.push(item);
          }
        }
      }
    } catch (error) {
      // Never let queue processing errors crash the app
      console.error('Error processing log queue:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Write a single log entry to the database
   */
  private async writeLogToDatabase(logData: CreateLogDto): Promise<boolean> {
    try {
      await db.run(
        `
        INSERT INTO admin_user_logs (
          user_id, email, action_type, action_description, module,
          http_method, endpoint_path, request_payload, response_status,
          response_time_ms, ip_address, user_agent, geo_city, geo_country,
          before_state, after_state, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW())
        `,
        [
          logData.user_id,
          logData.email,
          logData.action_type,
          logData.action_description,
          logData.module || null,
          logData.http_method || null,
          logData.endpoint_path || null,
          logData.request_payload ? JSON.stringify(logData.request_payload) : null,
          logData.response_status || null,
          logData.response_time_ms || null,
          logData.ip_address || null,
          logData.user_agent || null,
          logData.geo_city || null,
          logData.geo_country || null,
          logData.before_state ? JSON.stringify(logData.before_state) : null,
          logData.after_state ? JSON.stringify(logData.after_state) : null
        ]
      );

      return true;
    } catch (error) {
      console.error('Failed to write log to database:', error);
      return false;
    }
  }

  /**
   * Graceful shutdown - attempt to flush remaining logs
   */
  public async flush(): Promise<void> {
    logger.info(`Flushing log queue (${this.queue.length} items remaining)...`);

    const startTime = Date.now();
    const maxFlushTime = 5000; // Max 5 seconds to flush

    while (this.queue.length > 0 && (Date.now() - startTime) < maxFlushTime) {
      await this.processQueue();
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    if (this.queue.length > 0) {
      logger.warn(`Log queue flush timeout - ${this.queue.length} items remaining`);
    } else {
      logger.info('Log queue flushed successfully');
    }
  }
}

// Export singleton instance
export const logQueue = new LogQueue();
