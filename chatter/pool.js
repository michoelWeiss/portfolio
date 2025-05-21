import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

let pool;
function createPool() {
  pool = mysql.createPool({
    host: process.env.SQL_HOST,
    user: process.env.SQL_USER,
    password: process.env.SQL_PASSWORD,
    database: process.env.SQL_DATABASE,
    port: process.env.SQL_PORT,
    waitForConnections: true,
    connectionLimit: 100,
    idleTimeout: 300000,
    maxIdle: 5,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
  });
   pool.getConnection()
    .then(conn => {
      console.log('✅ MySQL pool connected');
      conn.release();
    })
    .catch(err => {
      console.error('❌ MySQL pool creation failed:', err.message);
    });
  return pool;
}
 export default function run_sqlPool() {
  return async (sql, params, retries = 3, delayMs = 500) => {
     try {
    const [results] = await pool.execute(sql, params);
    return results;
  } catch (err) {
    if (err.code === 'ECONNRESET' && retries > 0) {
      console.warn(`ECONNRESET encountered, reconnection and retrying... (${retries} retries left)`);
     createPool();
      await new Promise(res => setTimeout(res, delayMs));
      return run_sqlPool(req, sql, params, retries - 1, delayMs);
    }
    throw err;
  }
  };
}

createPool();