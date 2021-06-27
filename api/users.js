const express = require('express');
const usersRouter = express.Router();
const jwt = require('jsonwebtoken');

// const { getUserByUsername } = require('../index')

//uses the router function to create a new router
usersRouter.use((req, res, next) => {
    console.log("A request is being made to /users");

    // res.send({ message: 'hello from /users!'});
    next();
});

//middleware will fire whenever a GET request is made to /api/users
//sends back a simple object with an empty array
//Next, updating this to get users from database and send them back:
const { getAllUsers, getUserById, getUserByUsername, createUser} = require('../db');

usersRouter.get('/', async (req, res) => {
    const users = await getAllUsers();

    res.send({
        users
    });
});
//Now when a request comes in, we first ask the database for the data we want,
// then send it back to the user


usersRouter.post('/login', async (req, res, next) => {
    const { username, password } = req.body;

    //requests need both
    if (!username || !password) {
        next({
            name: "MissingCredentialsError",
            message: "Please supply both a username and password"
        });
    }

    try {
        console.log(username)
        const user = await getUserByUsername(username);
        console.log(user)
        if(user && user.password == password) {
            //craete a token and return to user
            const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET);
            res.send({ message: "you're logged in!", token:token });
        } else {
            next ({
                name: 'IncorrectCredentialsError',
                message: 'Username or password is incorrect'
            });
        }
    } catch (error) {
        console.log(error);
        next(error);
    }

})


usersRouter.post('/register', async (req, res, next) => {
    const {username, password, name, location} = req.body;

    try {
        const _user = await getUserByUsername(username);

        if (_user) {
            next({
                name: 'UserExistsError',
                message: 'A user by that username already exists'
            });
        }

        const user = await createUser ({
            username,
            password,
            name,
            location,
        });

        const token = jwt.sign({
            id: user.id,
            username
        }, process.env.JWT_SECRET, {
            expiresIn: '1w'
        });

        res.send({
            message: "thank you for signing up",
            token
        });
    } catch ({ name, message}) {
        next({ name, message })
    }
})

//then export it to script
module.exports = usersRouter;