"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Database connection for PostgreSQL using node-postgres
var pg_1 = require("pg");
var pool = new pg_1.Pool({
    connectionString: process.env.DATABASE_URL,
});
exports.default = pool;
