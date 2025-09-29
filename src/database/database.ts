import { Pool, Client } from 'pg';
import { logger } from '../utils/logger';

export class Database {
  private static instance: Database;
  private pool: Pool;

  private constructor() {
    // PostgreSQL connection configuration
    const dbConfig = {
      host: process.env.DB_HOST || 'collections-db.compunokr5xr.ap-southeast-2.rds.amazonaws.com',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'collections-db',
      user: process.env.DB_USER || 'collectionsagent',
      password: process.env.DB_PASSWORD || 'collectionsagent',
      ssl: {
        rejectUnauthorized: false // For AWS RDS
      },
      max: 10, // Maximum number of clients in the pool
      idleTimeoutMillis: 30000, // How long a client is allowed to remain idle
      connectionTimeoutMillis: 2000, // How long to wait before timing out when connecting
    };

    this.pool = new Pool(dbConfig);

    // Test connection
    this.pool.on('connect', () => {
      logger.info('Connected to PostgreSQL database', {
        host: dbConfig.host,
        database: dbConfig.database,
        port: dbConfig.port
      });
    });

    this.pool.on('error', (err) => {
      logger.error('PostgreSQL pool error:', err);
    });
  }

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  public getPool(): Pool {
    return this.pool;
  }

  public async run(sql: string, params: any[] = []): Promise<void> {
    try {
      await this.pool.query(sql, params);
    } catch (err) {
      logger.error('Database run error:', err);
      throw err;
    }
  }

  public async get<T>(sql: string, params: any[] = []): Promise<T | undefined> {
    try {
      const result = await this.pool.query(sql, params);
      return result.rows[0] as T;
    } catch (err) {
      logger.error('Database get error:', err);
      throw err;
    }
  }

  public async all<T>(sql: string, params: any[] = []): Promise<T[]> {
    try {
      const result = await this.pool.query(sql, params);
      return result.rows as T[];
    } catch (err) {
      logger.error('Database all error:', err);
      throw err;
    }
  }

  public async close(): Promise<void> {
    try {
      await this.pool.end();
      logger.info('PostgreSQL connection pool closed');
    } catch (err) {
      logger.error('Error closing database pool:', err);
      throw err;
    }
  }
}

export const db = Database.getInstance();