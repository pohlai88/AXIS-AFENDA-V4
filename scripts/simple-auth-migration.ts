import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import { sql } from "drizzle-orm"

const connectionString = process.env.DATABASE_URL!
const client = postgres(connectionString, { prepare: false })
const db = drizzle(client)

export async function runAuthMigration() {
  try {
    console.log("Starting NextAuth schema migration...")
    
    // Check if users table exists
    const usersTableExists = await db.execute(sql`SELECT 1 FROM information_schema.tables WHERE table_name = 'users' LIMIT 1`)
    
    if (usersTableExists.length > 0) {
      console.log("Users table exists, checking columns...")
      
      // Get current columns
      const existingColumns = await db.execute(sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'users'`)
      const columnNames = existingColumns.map((col: Record<string, unknown>) => String(col["column_name"]))
      
      // Add missing columns
      const columnsToAdd = [
        { name: 'username', type: 'VARCHAR(100)', constraint: 'UNIQUE' },
        { name: 'avatar', type: 'VARCHAR(500)' },
        { name: 'role', type: 'VARCHAR(20)', default: "'user'" },
        { name: 'email_verified', type: 'TIMESTAMP WITH TIME ZONE' },
        { name: 'password', type: 'VARCHAR(255)' },
        { name: 'provider', type: 'VARCHAR(50)', default: "'credentials'" },
        { name: 'provider_account_id', type: 'VARCHAR(255)' },
        { name: 'is_active', type: 'BOOLEAN', default: 'true' },
        { name: 'last_login_at', type: 'TIMESTAMP WITH TIME ZONE' },
        { name: 'login_count', type: 'INTEGER', default: '0' },
        { name: 'preferences', type: 'JSONB', default: "'{}'" },
        { name: 'created_at', type: 'TIMESTAMP WITH TIME ZONE', default: 'NOW()' },
        { name: 'updated_at', type: 'TIMESTAMP WITH TIME ZONE', default: 'NOW()' },
      ]
      
      for (const column of columnsToAdd) {
        if (!columnNames.includes(column.name)) {
          console.log(`Adding column: ${column.name}`)
          await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS ${sql.identifier(column.name)} ${column.type} ${column.default ? `DEFAULT ${column.default}` : ''} ${column.constraint || ''}`)
        }
      }
      
      // Add indexes
      const indexesToAdd = [
        { name: 'users_email_idx', columns: 'email' },
        { name: 'users_username_idx', columns: 'username' },
        { name: 'users_provider_idx', columns: 'provider' },
        { name: 'users_role_idx', columns: 'role' },
      ]
      
      for (const index of indexesToAdd) {
        try {
          await db.execute(sql`CREATE INDEX IF NOT EXISTS ${sql.identifier(index.name)} ON users(${sql.identifier(index.columns)})`)
          console.log(`Created index: ${index.name}`)
        } catch {
          console.log(`Index ${index.name} may already exist or failed to create`)
        }
      }
    }
    
    // Create NextAuth tables
    const tablesToCreate = [
      {
        name: 'accounts',
        columns: `
          id UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
          user_id UUID NOT NULL,
          type VARCHAR(50) NOT NULL,
          provider VARCHAR(50) NOT NULL,
          provider_account_id VARCHAR(255) NOT NULL,
          refresh_token VARCHAR(1000),
          access_token VARCHAR(1000),
          expires_at INTEGER,
          token_type VARCHAR(50),
          scope VARCHAR(500),
          id_token VARCHAR(2000),
          session_state VARCHAR(500),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
        `
      },
      {
        name: 'sessions',
        columns: `
          id UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
          session_token VARCHAR(255) NOT NULL UNIQUE,
          user_id UUID NOT NULL,
          expires TIMESTAMP WITH TIME ZONE NOT NULL,
          user JSONB NOT NULL,
          ip_address VARCHAR(45),
          user_agent VARCHAR(500),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
        `
      },
      {
        name: 'verification_tokens',
        columns: `
          identifier VARCHAR(255) NOT NULL,
          token VARCHAR(255) NOT NULL UNIQUE,
          expires TIMESTAMP WITH TIME ZONE NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
        `
      },
      {
        name: 'password_reset_tokens',
        columns: `
          id UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
          user_id UUID NOT NULL,
          token VARCHAR(255) NOT NULL UNIQUE,
          expires TIMESTAMP WITH TIME ZONE NOT NULL,
          used BOOLEAN DEFAULT false NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
        `
      },
      {
        name: 'user_activity_log',
        columns: `
          id UUID PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
          user_id UUID NOT NULL,
          action VARCHAR(50) NOT NULL,
          resource VARCHAR(100),
          resource_id VARCHAR(255),
          ip_address VARCHAR(45),
          user_agent VARCHAR(500),
          metadata JSONB DEFAULT '{}',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
        `
      }
    ]
    
    for (const table of tablesToCreate) {
      try {
        await db.execute(sql`CREATE TABLE IF NOT EXISTS ${sql.identifier(table.name)} (${table.columns})`)
        console.log(`Created table: ${table.name}`)
        
        // Add indexes for each table
        if (table.name === 'accounts') {
          await db.execute(sql`CREATE INDEX IF NOT EXISTS accounts_user_id_idx ON accounts(user_id)`)
          await db.execute(sql`CREATE INDEX IF NOT EXISTS accounts_provider_idx ON accounts(provider)`)
          await db.execute(sql`CREATE INDEX IF NOT EXISTS accounts_provider_account_idx ON accounts(provider_account_id)`)
        } else if (table.name === 'sessions') {
          await db.execute(sql`CREATE INDEX IF NOT EXISTS sessions_session_token_idx ON sessions(session_token)`)
          await db.execute(sql`CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions(user_id)`)
          await db.execute(sql`CREATE INDEX IF NOT EXISTS sessions_expires_idx ON sessions(expires)`)
        } else if (table.name === 'verification_tokens') {
          await db.execute(sql`CREATE INDEX IF NOT EXISTS verification_tokens_identifier_idx ON verification_tokens(identifier)`)
          await db.execute(sql`CREATE INDEX IF NOT EXISTS verification_tokens_token_idx ON verification_tokens(token)`)
          await db.execute(sql`CREATE INDEX IF NOT EXISTS verification_tokens_expires_idx ON verification_tokens(expires)`)
        } else if (table.name === 'password_reset_tokens') {
          await db.execute(sql`CREATE INDEX IF NOT EXISTS password_reset_tokens_user_id_idx ON password_reset_tokens(user_id)`)
          await db.execute(sql`CREATE INDEX IF NOT EXISTS password_reset_tokens_token_idx ON password_reset_tokens(token)`)
          await db.execute(sql`CREATE INDEX IF NOT EXISTS password_reset_tokens_expires_idx ON password_reset_tokens(expires)`)
        } else if (table.name === 'user_activity_log') {
          await db.execute(sql`CREATE INDEX IF NOT EXISTS user_activity_log_user_id_idx ON user_activity_log(user_id)`)
          await db.execute(sql`CREATE INDEX IF NOT EXISTS user_activity_log_action_idx ON user_activity_log(action)`)
          await db.execute(sql`CREATE INDEX IF NOT EXISTS user_activity_log_created_at_idx ON user_activity_log(created_at)`)
        }
        
        console.log(`Created indexes for table: ${table.name}`)
        
      } catch {
        console.log(`Table ${table.name} may already exist or failed to create`)
      }
    }
    
    // Add foreign key constraints
    try {
      await db.execute(sql`ALTER TABLE accounts ADD CONSTRAINT IF NOT EXISTS accounts_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE NO ACTION`)
      await db.execute(sql`ALTER TABLE sessions ADD CONSTRAINT IF NOT EXISTS sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE NO ACTION`)
      await db.execute(sql`ALTER TABLE password_reset_tokens ADD CONSTRAINT IF NOT EXISTS password_reset_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE NO ACTION`)
      await db.execute(sql`ALTER TABLE user_activity_log ADD CONSTRAINT IF NOT EXISTS user_activity_log_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE NO ACTION`)
      console.log("Added foreign key constraints")
    } catch {
      console.log("Foreign key constraints may already exist or failed to add")
    }
    
    console.log("✅ NextAuth database schema migration completed successfully!")
    return { success: true, message: "Migration completed successfully" }
    
  } catch (error) {
    console.error("❌ Migration failed:", error)
    return { success: false, message: `Migration failed: ${error}` }
  }
}

// Run the migration if this file is executed directly
if (require.main === module) {
  runAuthMigration()
    .then((result) => {
      console.log(result.message)
      process.exit(result.success ? 0 : 1)
    })
    .catch((error) => {
      console.error("Migration script error:", error)
      process.exit(1)
    })
}
