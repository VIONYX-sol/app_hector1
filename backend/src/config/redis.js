'use strict';

// Redis client - optional caching layer
// Falls back gracefully if Redis is not configured

let client = null;
let logger = null;

const getLogger = () => {
  if (!logger) {
    try {
      logger = require('../utils/logger');  
    } catch {
      logger = console;
    }
  }
  return logger;
};

const getClient = () => {
  if (!process.env.REDIS_URL) {
    return null;
  }
  if (!client) {
    try {
      // Lazy load to avoid errors when redis is not installed/needed
      const redis = require('redis');  
      client = redis.createClient({ url: process.env.REDIS_URL });
      client.on('error', (err) => {
        getLogger().error('Redis error:', err.message);
      });
      client.connect().catch((err) => getLogger().error('Redis connection error:', err.message));
    } catch (e) {
      getLogger().warn('Redis not available, caching disabled');
    }
  }
  return client;
};

const get = async (key) => {
  const c = getClient();
  if (!c) return null;
  try {
    return await c.get(key);
  } catch {
    return null;
  }
};

const set = async (key, value, ttlSeconds) => {
  const c = getClient();
  if (!c) return;
  try {
    await c.set(key, value, { EX: ttlSeconds });
  } catch {
    // silently fail
  }
};

const del = async (key) => {
  const c = getClient();
  if (!c) return;
  try {
    await c.del(key);
  } catch {
    // silently fail
  }
};

module.exports = { get, set, del, getClient };
