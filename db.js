const mysql = require('mysql2/promise');
require('dotenv').config();

const connection = mysql.createPool({
    host: "gateway01.ap-southeast-1.prod.aws.tidbcloud.com",
    port: 4000,
    user: "43424bdhBv9c58R.root",
    password: process.env.PASSWORD,
    database: process.env.DATABASE ,
    ssl: {
        rejectUnauthorized: true, // Enable SSL
    },
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 6000, // 60 seconds
});

module.exports = {
    connection,
};
