// Log cleanup service for removing old activity logs
import { db } from '../database/database';
import { logger } from '../utils/logger';

export class LogCleanupService {
  private readonly RETENTION_DAYS = 365; // 1 year

  /**
   * Delete logs older than the retention period
   * @returns Number of logs deleted
   */
  public async deleteOldLogs(): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.RETENTION_DAYS);

      logger.info('Starting log cleanup', {
        retentionDays: this.RETENTION_DAYS,
        cutoffDate: cutoffDate.toISOString()
      });

      // Count logs to be deleted
      const countResult = await db.get<{ count: number }>(
        'SELECT COUNT(*) as count FROM admin_user_logs WHERE created_at < $1',
        [cutoffDate]
      );
      const deleteCount = countResult?.count || 0;

      if (deleteCount === 0) {
        logger.info('No logs to clean up');
        return 0;
      }

      // Delete old logs
      await db.run(
        'DELETE FROM admin_user_logs WHERE created_at < $1',
        [cutoffDate]
      );

      logger.info('Log cleanup completed', {
        deletedCount: deleteCount,
        cutoffDate: cutoffDate.toISOString()
      });

      return deleteCount;
    } catch (error) {
      logger.error('Error during log cleanup', { error });
      throw error;
    }
  }

  /**
   * Get statistics about log storage
   */
  public async getLogStatistics(): Promise<{
    totalLogs: number;
    oldestLog: Date | null;
    newestLog: Date | null;
    logsToCleanup: number;
  }> {
    try {
      const total = await db.get<{ count: number }>(
        'SELECT COUNT(*) as count FROM admin_user_logs'
      );

      const oldest = await db.get<{ created_at: Date }>(
        'SELECT created_at FROM admin_user_logs ORDER BY created_at ASC LIMIT 1'
      );

      const newest = await db.get<{ created_at: Date }>(
        'SELECT created_at FROM admin_user_logs ORDER BY created_at DESC LIMIT 1'
      );

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.RETENTION_DAYS);

      const toCleanup = await db.get<{ count: number }>(
        'SELECT COUNT(*) as count FROM admin_user_logs WHERE created_at < $1',
        [cutoffDate]
      );

      return {
        totalLogs: total?.count || 0,
        oldestLog: oldest?.created_at || null,
        newestLog: newest?.created_at || null,
        logsToCleanup: toCleanup?.count || 0
      };
    } catch (error) {
      logger.error('Error fetching log statistics', { error });
      throw error;
    }
  }
}

// Export singleton instance
export const logCleanup = new LogCleanupService();
