
const mysql = require('mysql');
require('dotenv').config();

const conn = mysql.createConnection({  // mysql 접속 설정
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    multipleStatements: true,
    typeCast: function (field, next) {
        if (field.type == 'VAR_STRING') {
            return field.string();
        }
        return next();
    }
});

try {
    conn.connect();
        if (!conn) {
            console.log("[ERROR] Database connection failed.");
            process.exit(1);
        }
        console.log("[INFO] Database connected successfully.");
}
catch (err) {
    console.log(`[ERROR] ${err}`);
}

module.exports = conn;
