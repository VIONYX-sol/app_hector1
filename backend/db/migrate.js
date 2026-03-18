'use strict';

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function createMigrationsTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id SERIAL PRIMARY KEY,
      filename VARCHAR(255) UNIQUE NOT NULL,
      executed_at TIMESTAMP DEFAULT NOW()
    )
  `);
}

async function getExecutedMigrations(client) {
  const result = await client.query('SELECT filename FROM schema_migrations ORDER BY filename');
  return result.rows.map(r => r.filename);
}

async function runMigrations() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await createMigrationsTable(client);
    const executed = await getExecutedMigrations(client);
    const migrationsDir = path.join(__dirname, 'migrations');
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();
    let count = 0;
    for (const file of files) {
      if (executed.includes(file)) {
        console.log(`  Skipping ${file} (already executed)`);
        continue;
      }
      console.log(`  Running ${file}...`);
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [file]);
      count++;
      console.log(`  ✓ ${file}`);
    }
    await client.query('COMMIT');
    console.log(`\nMigrations complete. Ran ${count} new migration(s).`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations();
