if (process.env.NODE_ENV !== 'production') require('dotenv').config();

//Express Init
const express = require('express');
const server = express();
server.use(express.json());
const cors = require('cors');
server.use(cors());
const port = process.env.PORT || 8000;

//Express Routers
server.get('/', (req, res) => res.status(200).send("It's alive!"));
const miningRouter = require('./routers/mining');
server.use('/mining', miningRouter);
const traversalRouter = require('./routers/traversal');
server.use('/traversal', traversalRouter);
const playerRouter = require('./routers/player');
server.use('/player', playerRouter);
const roomsRouter = require('./routers/rooms');
server.use('/rooms', roomsRouter);

//Traversal- For testing purposes
const traversalApi = require("./traversal/api");
// traversalApi.traversal();
// traversalApi.collectTreasure();
//traversalApi.changeName("\u{1F680}\u{1F680}\u{1F680} \u{1F921} \u{1F680}\u{1F680}\u{1F680}");
// traversalApi.mineCoinz(250);
// traversalApi.prayAtShrine("Linh's Shrine")

// const lambdaApi = require('./apis/mining');
// console.log(lambdaApi.getBalance().then(res => {
//     console.log(res.data)
// }))
//2,4,8,16,32,64,128,256

server.listen(port, () => console.log(`\u{1F680}\u{1F680}\u{1F680} http://localhost:${port}/ \u{1F680}\u{1F680}\u{1F680}`));