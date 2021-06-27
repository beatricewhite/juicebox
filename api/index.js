
const express = require('express');
const server = express();
const apiRouter = express.Router();


//usersRoute will try to match (now with /api/users removed from original matching path )
// and fire any middleware

server.use(async (req, res, next) => {
    const prefix = 'Bearer '
    const auth = req.headers['Authorization'];

    if (!auth) {
        next(); //we don't set req.user because there was no token passed in 
    }

    if (auth.startsWith(prefix)) {
        //recover the token:
        const token = auth.slice(prefix.length) //provides user authentication 
        try {
            //recover the data
            const {id} = jwt.verify(data, 'secret message');

            //get user from DB
            const user = await getUserById(id);
            //if user does not exist it might be null

            //attach the user
            req.user = user;


        } catch(error) {
            throw error;
        }
    }
})

const jwt = require('jsonwebtoken');
const { getUserById } = require('../db');
const { JWT_SECRET} = process.env;

apiRouter.use(async (req, res, next) => {
    const prefix = 'Bearer ';
    const auth = req.header('Authorization');

    if (!auth) {
        next();
    } else if (auth.startsWith(prefix)) {
        const token = auth.slice(prefix.length);

        try {
            const { id } = jwt.verify(token, JWT_SECRET);

            if (id) {
                req.user = await getUserById(id);
                next();
            }
        } catch ({
            name, message
        }) {
            next({name, message});
        }
    } else {
        next({
            name: 'AuthorizationHeaderError',
            message: `Authorization token must start with ${ prefix }`
        })
    }
})

apiRouter.use((req, res, next) => {
    if (req.user) {
        console.log("User is set:", req.user);
    }

    next();
})


const usersRouter = require('./users');
apiRouter.use('/users', usersRouter);

const postsRouter = require('./posts');
apiRouter.use('/posts', postsRouter);

const tagsRouter = require('./tags');
apiRouter.use('/tags', tagsRouter);


apiRouter.use((error, req, res, next) => {
    res.send(error);
});
//now any time middleware that the apiRouter might be parent router for,
//calls next with an object (rather than just next()), we skip to the error handling
//middleware and send back the object to the front end

module.exports = apiRouter;