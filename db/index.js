//this line imports the pg module that was created
const { Client } = require('pg');

//supplies the db name and location of the database
const client = new Client('postgres://localhost:5432/juicebox-dev');

module.exports = {
    client,
}


//starting to build helper functions
async function getAllUsers() {
    const { rows } = await client.query(
        `SELECT id, username
        FROM users
    `);
    
    return rows
}

async function createUser({ username, password }) {
    try {
        const {rows} = await client.query(`
            INSERT INTO users(username, password)
            VALUES ($1, $2)
            ON CONFLICT (username) DO NOTHING
            RETURNING *;
        `, [username, password]);

        return rows
    } catch(error) {
        throw error;
    }
}


//export
module.exports = {
    client,
    getAllUsers,
    createUser,
}