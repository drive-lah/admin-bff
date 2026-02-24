import { db } from './database';
import { logger } from '../utils/logger';

export class DatabaseMigrations {
  public static async runMigrations(): Promise<void> {
    try {
      logger.info('Running database migrations...');

      // Create users table (base version)
      await db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          name VARCHAR(255) NOT NULL,
          role VARCHAR(50) NOT NULL,
          teams TEXT[] NOT NULL,
          status VARCHAR(50) NOT NULL DEFAULT 'active',
          google_workspace_id VARCHAR(255) UNIQUE,
          google_org_unit VARCHAR(255),
          google_groups TEXT,
          intercom_id VARCHAR(255),
          aircall_id VARCHAR(255),
          slack_id VARCHAR(255),
          profile_photo_url TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          last_login_at TIMESTAMP,
          last_google_sync_at TIMESTAMP
        )
      `);

      // Add new columns if they don't exist
      await db.run(`
        DO $$
        BEGIN
          -- Add address column
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='address') THEN
            ALTER TABLE users ADD COLUMN address TEXT;
          END IF;

          -- Add country column
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='country') THEN
            ALTER TABLE users ADD COLUMN country VARCHAR(100);
          END IF;

          -- Add date_of_joining column
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='date_of_joining') THEN
            ALTER TABLE users ADD COLUMN date_of_joining DATE;
          END IF;

          -- Add org_role column
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='org_role') THEN
            ALTER TABLE users ADD COLUMN org_role TEXT;
          END IF;

          -- Add manager_id column
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='manager_id') THEN
            ALTER TABLE users ADD COLUMN manager_id INTEGER;
          END IF;

          -- Add phone_number column
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='phone_number') THEN
            ALTER TABLE users ADD COLUMN phone_number VARCHAR(50);
          END IF;

          -- Add region column with default value
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='region') THEN
            ALTER TABLE users ADD COLUMN region VARCHAR(50) DEFAULT 'global' CHECK (region IN ('singapore', 'australia', 'global'));
          END IF;
        END $$;
      `);

      // Add foreign key constraint for manager_id if it doesn't exist
      await db.run(`
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_manager_id_fkey') THEN
            ALTER TABLE users ADD CONSTRAINT users_manager_id_fkey
              FOREIGN KEY (manager_id) REFERENCES users(id) ON DELETE SET NULL;
          END IF;
        END $$;
      `);

      // Create user_permissions table
      await db.run(`
        CREATE TABLE IF NOT EXISTS user_permissions (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL,
          module VARCHAR(100) NOT NULL,
          access_level VARCHAR(50) NOT NULL CHECK (access_level IN ('read', 'write', 'admin')),
          granted_by INTEGER NOT NULL,
          granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (granted_by) REFERENCES users(id),
          UNIQUE(user_id, module)
        )
      `);

      // Create admin_user_logs table for activity tracking
      await db.run(`
        CREATE TABLE IF NOT EXISTS admin_user_logs (
          id BIGSERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL,
          email VARCHAR(255) NOT NULL,
          action_type VARCHAR(50) NOT NULL CHECK (action_type IN ('login', 'logout', 'create', 'update', 'delete', 'view', 'export')),
          action_description TEXT NOT NULL,
          module VARCHAR(50),
          http_method VARCHAR(10),
          endpoint_path VARCHAR(255),
          request_payload JSONB,
          response_status INTEGER,
          response_time_ms INTEGER,
          ip_address INET,
          user_agent TEXT,
          geo_city VARCHAR(100),
          geo_country VARCHAR(100),
          before_state JSONB,
          after_state JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);

      // Create indexes for performance
      await db.run(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`);
      await db.run(`CREATE INDEX IF NOT EXISTS idx_users_google_workspace_id ON users(google_workspace_id)`);
      await db.run(`CREATE INDEX IF NOT EXISTS idx_users_status ON users(status)`);
      await db.run(`CREATE INDEX IF NOT EXISTS idx_users_teams ON users USING GIN(teams)`);
      await db.run(`CREATE INDEX IF NOT EXISTS idx_users_manager_id ON users(manager_id)`);
      await db.run(`CREATE INDEX IF NOT EXISTS idx_user_permissions_user_id ON user_permissions(user_id)`);
      await db.run(`CREATE INDEX IF NOT EXISTS idx_user_permissions_module ON user_permissions(module)`);

      // Create indexes for admin_user_logs table
      await db.run(`CREATE INDEX IF NOT EXISTS idx_logs_user_id ON admin_user_logs(user_id)`);
      await db.run(`CREATE INDEX IF NOT EXISTS idx_logs_email ON admin_user_logs(email)`);
      await db.run(`CREATE INDEX IF NOT EXISTS idx_logs_action_type ON admin_user_logs(action_type)`);
      await db.run(`CREATE INDEX IF NOT EXISTS idx_logs_module ON admin_user_logs(module)`);
      await db.run(`CREATE INDEX IF NOT EXISTS idx_logs_created_at ON admin_user_logs(created_at)`);
      await db.run(`CREATE INDEX IF NOT EXISTS idx_logs_ip_address ON admin_user_logs(ip_address)`);

      // Create function and trigger to update updated_at timestamp (PostgreSQL style)
      await db.run(`
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
        END;
        $$ language 'plpgsql'
      `);

      await db.run(`
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_users_updated_at') THEN
            CREATE TRIGGER update_users_updated_at
              BEFORE UPDATE ON users
              FOR EACH ROW
              EXECUTE FUNCTION update_updated_at_column();
          END IF;
        END
        $$
      `);

      // Grant 'verification' module access to all admin-role users (idempotent)
      await db.run(`
        INSERT INTO user_permissions (user_id, module, access_level, granted_by, granted_at)
        SELECT u.id, 'verification', 'admin', u.id, CURRENT_TIMESTAMP
        FROM users u
        WHERE u.role = 'admin'
        ON CONFLICT (user_id, module) DO NOTHING
      `);

      logger.info('Database migrations completed successfully');
    } catch (error) {
      logger.error('Error running database migrations:', error);
      throw error;
    }
  }

  public static async insertDefaultData(): Promise<void> {
    try {
      // Check if we already have users
      const existingUsers = await db.all('SELECT COUNT(*) as count FROM users');
      if (existingUsers[0] && parseInt((existingUsers[0] as any).count) > 0) {
        logger.info('Default data already exists, skipping...');
        return;
      }

      logger.info('Inserting default admin user...');

      // Insert a default admin user (this would typically be synced from Google Workspace)
      await db.run(`
        INSERT INTO users (
          email, name, role, teams, status, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `, [
        'admin@drivelah.sg',
        'System Admin',
        'admin',
        ['tech'],
        'active'
      ]);

      // Get the admin user ID
      const adminUser = await db.get<{ id: number }>('SELECT id FROM users WHERE email = $1', ['admin@drivelah.sg']);

      if (adminUser) {
        // Grant all module permissions to the admin
        const modules = ['users', 'finance', 'ai-agents', 'tech', 'listings', 'transactions', 'resolution', 'claims', 'host-management', 'verification'];

        for (const module of modules) {
          await db.run(`
            INSERT INTO user_permissions (user_id, module, access_level, granted_by, granted_at)
            VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
          `, [adminUser.id, module, 'admin', adminUser.id]);
        }
      }

      logger.info('Default data inserted successfully');
    } catch (error) {
      logger.error('Error inserting default data:', error);
      throw error;
    }
  }
}