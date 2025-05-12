import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

//console.log(process.env.SQL_HOST, process.env.SQL_USER, process.env.SQL_PASSWORD, process.env.SQL_DATABASE);
const pool = mysql.createPool({
  host: process.env.SQL_HOST ,
  user: process.env.SQL_USER ,
  password: process.env.SQL_PASSWORD ,
  database: process.env.SQL_DATABASE ,
  port: process.env.SQL_PORT ,
  waitForConnections: true,
  connectionLimit: 10,
  maxIdle: 10, 
  idleTimeout: 60000, 
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

pool.getConnection()
  .then(conn => {
    console.log("MySQL connection successful!");
    conn.release();
  })
  .catch(err => {
    console.error("MySQL connection error:", err.message);
  });

export default pool;