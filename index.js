require('dotenv').config();

const PORT = 3000;
const express = require('express');
const server = express();

//bodyParser.json() is a function that reads incoming JSON from requests
//the request's header has to be Contesnt-Type: application/json but we get benefit
// of being able to send objects easily to our server
const bodyParser = require('body-parser');
server.use(bodyParser.json());

//morgan('dev') is a function which logs out the incoming requests 
//which gives the method, the route, the HTTP response code, and how long it took to form
const morgan = require('morgan');
server.use(morgan('dev'));

server.use((req, res, next) => {
    console.log("<____Body Logger START____>");
    console.log(req.body);
    console.log("<_____Body Logger END_____>");
  
    next();
  });

const { client } = require('./db');
client.connect();

server.listen(PORT, () => {
    console.log('The server is up on port', PORT)
})

const apiRouter = require('./api');
server.use('/api', apiRouter);
//any time a requrest is made to a path starting with /api the apiRouter
//will be responsible for making decisions, calling middleware, etc


