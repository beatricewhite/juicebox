//grabs the client with destructuring from the export in index.js
const {
    client,
    createUser,
    updateUser,
    getAllUsers,
    getUserById,
    createPost,
    updatePost,
    getAllPosts,
    getPostsByUser,
} = require('./index')


//dropTables func should call a query which DROPS all tables from database
async function dropTables() {
    try {
        console.log("Starting to drop tables ...");
        //drop all tables (*)
        await client.query(`
            DROP TABLE IF EXISTS posts;
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
                password varchar(255) NOT NULL,
                name varchar(255) NOT NULL,
                location varchar(255) NOT NULL,
                active boolean DEFAULT true
            );

            CREATE TABLE posts(
                id SERIAL PRIMARY KEY,
                "authorId" INTEGER REFERENCES users(id),
                title varchar(255) NOT NULL,
                content TEXT NOT NULL,
                active BOOLEAN DEFAULT true
            )
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

        await createUser({ 
            username: 'albert', 
            password: 'bertie99', 
            name: 'Al Bert', 
            location: 'Sidney, Australia'
        });
        await createUser({ 
            username: 'sandra', 
            password: '2sandy4me', 
            name: 'Just Sandra', 
            location: 'Ain\'t tellin\''
        });
        await createUser({ 
            username: 'glamgal', 
            password: 'soglam', 
            name: 'Joshua', 
            location: 'Upper East Side'
        });
        

        console.log("Finished creating users!");
    } catch(error) {
        console.error("Error creating users!");
        throw error;
    }
}

async function createInitialPosts() {
    try {
        const [albert, sandra, glamgal] = await getAllUsers();

        console.log("Starting to create posts ...");
        await createPost({
            authorId: albert.id,
            title: "First Post",
            content: "This is my first post I hope I love writing blogs as much as I love writing them."
        });

        await createPost({
            authorId: sandra.id,
            title: "How does this work?",
            content: "Seriously, does this even do anything?"
        });

        await createPost({
            authorId: glamgal.id,
            title: "Living the Glam Life",
            content: "Do you even? I swear that half of you are posing."
        });
        console.log("finished creating posts!")
    } catch(error) {
        console.log("Error creating posts!")
        throw error;
    }
}


async function rebuildDB() {
    try {
        client.connect();

        await dropTables();
        await createTables();
        await createInitialUsers();
        await createInitialPosts();

    } catch (error) {
        console.log("Error during rebuildDB")
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
        console.log("Calling getAllUsers");
        const users = await getAllUsers();
        console.log("Result:", users);

        console.log("Calling updateUser on users[0]");
        const updateUserResult = await updateUser(users[0].id, {
            name: "Newname Sogood",
            location: "Lesterville, KY"
        });
        console.log("Result:", updateUserResult);

        console.log("Calling getAllPosts");
        const posts = await getAllPosts();
        console.log("Result:", posts);

        console.log("Calling updatePost on posts[0]");
        const updatePostResult = await updatePost(posts[0].id, {
            title: "New Title",
            content: "Updated Content"
        });
        console.log("Result:", updatePostResult);

        console.log("Calling getUserById with 1");
        const albert = await getUserById(1);
        console.log("Result:", albert)

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