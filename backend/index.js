if (process.env.NODE_ENV !== 'production') require('dotenv').config();

//Express Init
const express = require('express');
const server = express();
server.use(express.json());
const port = process.env.PORT || 8000;

//Express Routers
server.get('/', (req, res) => res.status(200).send("It's alive!"));
const miningRouter = require('./mining/router');
server.use('mining', miningRouter);

//Mining Init
const mining = require('./mining/master');
mining.startMining();

server.listen(port, () => console.log(`\u{1F680}\u{1F680}\u{1F680} http://localhost:${port}/ \u{1F680}\u{1F680}\u{1F680}`));