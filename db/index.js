//this line imports the pg module that was created
const { Client } = require('pg');

//supplies the db name and location of the database
const client = new Client('postgres://localhost:5432/juicebox-dev');


//starting to build helper functions
async function createUser({ 
    username, 
    password, 
    name, 
    location 
}) {
    try {
        const { rows: [ user ] } = await client.query(`
            INSERT INTO users(username, password, name, location)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (username) DO NOTHING
            RETURNING *;
        `, [username, password, name, location]);

        return user;
    } catch(error) {
        throw error;
    }
}

async function updateUser(id, fields = {}) {
    //build the set string:
    //use map to turn each key into a string with the key name in quotes
    //for case sensitivity purposes. Then we have a parameter with a numeric value
    //one greater than the index of that key
    const setString = Object.keys(fields).map(
        (key, index) => `"${ key }"=$${ index + 1 }`
    ).join(',');

    //return early if this is called without fields
    if(setString.length === 0) {
        return;
    }
    
    //as long as fields object has something in it (from if statement above),
    //we call the query. We can interpolate id since we pass id when calling updateUser
    try {
        const { rows: [ user ] } = await client.query(`
            UPDATE users
            SET ${ setString }
            WHERE id=${ id }
            RETURNING *;
        `, Object.values(fields));

        return user;
    } catch (error) {
        throw error;
    }
}

async function getAllUsers() {
    try {
        const { rows } = await client.query(
            `SELECT id, username, name, location, active
            FROM users
        `);
        return rows;
    } catch (error) {
        throw error;
    }

}

async function getUserById(userId) {
    try {
        const { rows: [ user ] } = await client.query(`
        SELECT id, username, name, location, active
        FROM users
        WHERE id=${ userId }
    `);

    if (!user) {
        return null;
    }
    user.posts = await getPostsByUser(userId)

    } catch (error) {
        throw error;
    }

}

async function createPost({
    authorId,
    title,
    content
}) {
    try {
        const { rows: [ post ] } = await client.query(`
            INSERT INTO posts("authorId", title, content)
            VALUES (
                $1, $2, $3
            )
            RETURNING *;
        `, [authorId, title, content]);

        return post;
    } catch(error) {
        throw error;
    }
}

async function updatePost(id, fields = {
    title,
    content,
    active}) {
    const setString = Object.keys(fields).map(
        (key, index) => `"${ key }"=$${ index + 1 }`
    ).join(',');
    
    if (setString.length === 0) {
        return;
    }

    try {
        const { rows: [ post ] } = await client.query(`
            UPDATE posts
            SET ${ setString }
            WHERE id=${ id }
            RETURNING *;
        `, Object.values(fields));

        return post;

    } catch (error) {
        throw error;
    }
}


async function getAllPosts() {
    try {
        const { rows } = await client.query(`
        SELECT *
        FROM posts
        `);
        
        return rows
    } catch (error) {
        throw error;
    }
}

async function getPostsByUser(userId) {
    try {
        //add a WHERE clause to search
        const { rows } = client.query(`
            SELECT * 
            FROM posts
            WHERE "authorId"=${ userId };
        `);

        return rows;
    } catch (error) {
        throw error;
    }
}



//export
module.exports = {
    client,
    createUser,
    updateUser,
    getAllUsers,
    getUserById,
    createPost,
    updatePost,
    getAllPosts,
    getPostsByUser
}