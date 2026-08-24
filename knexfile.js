require('dotenv').config();

const base = {
  client: 'pg',
  connection: {
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes('sslmode=require')
      ? { rejectUnauthorized: false }
      : false,
  },
  migrations: {
    directory: './src/db/migrations',
  },
  seeds: {
    directory: './src/db/seeds',
  },
};

module.exports = {
  development: base,
  production: base,
  // Jest sets NODE_ENV=test; no test suite issues real queries against this
  // connection, but requiring src/db/knex.js still constructs a knex(...)
  // instance eagerly, which crashes if this key is missing.
  test: base,
};
