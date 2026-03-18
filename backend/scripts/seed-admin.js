#!/usr/bin/env node

/**
 * Admin seed script
 * Creates the first admin user from environment variables
 * 
 * Usage:
 *   ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=securepassword npm run seed
 */

'use strict';

require('dotenv').config();

const { pool } = require('../src/config/database');
const { hashPassword } = require('../src/utils/crypto');

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  const username = process.env.ADMIN_USERNAME || 'admin';

  if (!email || !password) {
    console.error('ERROR: ADMIN_EMAIL and ADMIN_PASSWORD environment variables are required');
    console.log('');
    console.log('Usage:');
    console.log('  ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=securepassword npm run seed');
    console.log('');
    console.log('Or add these to your .env file:');
    console.log('  ADMIN_EMAIL=admin@example.com');
    console.log('  ADMIN_PASSWORD=your_secure_password');
    process.exit(1);
  }

  if (password.length < 8) {
    console.error('ERROR: Password must be at least 8 characters');
    process.exit(1);
  }

  const client = await pool.connect();
  
  try {
    // Check if admin already exists
    const existing = await client.query(
      'SELECT id FROM admin_users WHERE email = $1',
      [email.toLowerCase().trim()]
    );

    if (existing.rows.length > 0) {
      console.log(`Admin user with email ${email} already exists.`);
      console.log('To update the password, delete the existing admin first or use the admin UI.');
      return;
    }

    // Hash password and create admin
    const passwordHash = await hashPassword(password);

    const result = await client.query(
      `INSERT INTO admin_users (email, username, password_hash, role, is_active)
       VALUES ($1, $2, $3, 'admin', true)
       RETURNING id, email, username, role`,
      [email.toLowerCase().trim(), username, passwordHash]
    );

    const admin = result.rows[0];
    
    console.log('');
    console.log('✓ Admin user created successfully!');
    console.log('');
    console.log('  ID:', admin.id);
    console.log('  Email:', admin.email);
    console.log('  Username:', admin.username);
    console.log('  Role:', admin.role);
    console.log('');
    console.log('You can now log in at /admin/login with these credentials.');
    console.log('');
  } catch (err) {
    console.error('Error creating admin user:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seedAdmin();
