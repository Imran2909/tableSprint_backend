const { connection } = require("../db");

const userModel = {
    // Create a new user
    create: async (user) => {
        const query = `INSERT INTO users (email, password) VALUES (?, ?)`;
        const [result] = await connection.execute(query, [user.email, user.password]);
        return result;
    },
    // Find a user by email
    findByEmail: async (email) => {
        const query = `SELECT * FROM users WHERE email = ?`;
        const [rows] = await connection.execute(query, [email]);
        return rows[0]; // Return the first user
    },
    // Update password by email
    updatePassword: async (email, password) => {
        const query = `UPDATE users SET password = ? WHERE email = ?`;
        const [result] = await connection.execute(query, [password, email]);
        return result;
    }
};

module.exports = userModel;

