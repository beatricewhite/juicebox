//grabs the client with destructuring from the export in index.js
const {
    client,
    getAllUsers,
    createUser,
} = require('./index')


//dropTables func should call a query which DROPS all tables from database
async function dropTables() {
    try {
        console.log("Starting to drop tables ...");
        //drop all tables (*)
        await client.query(`
            DROP TABLE IF EXISTS users;
        `);

        console.log("Finished dropping tables!");
    } catch (error) {
        console.error("Error dropping tables!")
        throw error;
    }
}

//createTables should call query to CREATE ll talbes from database
async function createTables() {
    try {
        console.log("Starting to build tables ...");
        //create all tables
        await client.query(`
            CREATE TABLE users (
                id SERIAL PRIMARY KEY,
                username varchar(255) UNIQUE NOT NULL,
                password varchar(255) NOT NULL
            );
        `);

        console.log("Finished building tables!")
    } catch (error) {
        console.error("Error building tables!")
        throw error;
    }
}

//function attempts to create a few users
async function createInitialUsers() {
    try {
        console.log("Starting to create users...");

        const albert = await createUser({ username: 'albert', password: 'bertie99'});
        const sandra = await createUser({ username: 'sandra', password: '2sandy4me'});
        const glamgal = await createUser({ username: 'glamgal', password: 'soglam'});
        

        console.log(albert);

        console.log("Finished creating users!");
    } catch(error) {
        console.error("Error creating users!");
        throw error;
    }
}


async function rebuildDB() {
    try {
        client.connect();

        await dropTables();
        await createTables();
        await createInitialUsers();

    } catch (error) {
        throw error;
    } //REMOVED FINALLY CLIENT END
}



async function testDB() {
    try {
        // REMOVE client.connect();
        console.log("Starting to test database...");

        //queries = promises (use await)
        // change const results and console log to rows so we can access rows field
        // const { rows } = await client.query(`SELECT * FROM users;`);
        //Now that line above is in index file we can remove and use const users
        const users = await getAllUsers();
        console.log("getAllUsers:", users);

        console.log("Finished database tests!");
    } catch (error) {
        console.error("Error testing database!");
        throw error;
    } //REMOVED FINALLY CLIENT END
} 


rebuildDB()
    .then(testDB)
    .catch(console.error)
    .finally(() => client.end());