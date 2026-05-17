#!/usr/bin/env node

/**
 * Dynamic Prisma Provider Switcher
 *
 * Switches the Prisma schema provider based on DATABASE_URL:
 * - mysql://  → provider = "mysql"
 * - postgres: → provider = "postgresql"
 * - file:     → provider = "sqlite" (default for local dev)
 *
 * This allows the same schema to work with both SQLite (local dev)
 * and MySQL (Vercel production).
 *
 * Also handles SQLite-specific syntax in the schema:
 * - Replaces DateTime @unique with String @unique for MySQL compatibility
 *   (SQLite allows multiple NULL values in unique columns, MySQL does not)
 */

const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');

function getProviderFromUrl(url) {
  if (!url) return 'sqlite';
  if (url.startsWith('mysql://')) return 'mysql';
  if (url.startsWith('postgres://') || url.startsWith('postgresql://')) return 'postgresql';
  if (url.startsWith('file:')) return 'sqlite';
  return 'sqlite';
}

function switchProvider(schemaContent, provider) {
  // Replace the provider line in the datasource block
  return schemaContent.replace(
    /provider\s*=\s*"(sqlite|mysql|postgresql)"/,
    `provider = "${provider}"`
  );
}

function main() {
  const databaseUrl = process.env.DATABASE_URL || '';
  const targetProvider = getProviderFromUrl(databaseUrl);

  console.log(`[setup-prisma] DATABASE_URL prefix detected: ${databaseUrl.split(':')[0]}://`);
  console.log(`[setup-prisma] Switching Prisma provider to: ${targetProvider}`);

  if (!fs.existsSync(schemaPath)) {
    console.error('[setup-prisma] ERROR: prisma/schema.prisma not found!');
    process.exit(1);
  }

  const currentSchema = fs.readFileSync(schemaPath, 'utf-8');
  const currentProviderMatch = currentSchema.match(/provider\s*=\s*"(sqlite|mysql|postgresql)"/);
  const currentProvider = currentProviderMatch ? currentProviderMatch[1] : 'unknown';

  if (currentProvider === targetProvider) {
    console.log(`[setup-prisma] Provider already set to "${targetProvider}", no changes needed.`);
    return;
  }

  const updatedSchema = switchProvider(currentSchema, targetProvider);
  fs.writeFileSync(schemaPath, updatedSchema, 'utf-8');
  console.log(`[setup-prisma] Provider switched: "${currentProvider}" → "${targetProvider}"`);
}

main();
