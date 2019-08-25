const cluster = require('cluster');

if (cluster.isMaster) {
    const express = require('express');
    const mining = require('./mining/api');
    const miningRouter = require('./mining/router');
    mining.startMining();

    console.log('Master ' + process.pid + ' has started.');

    const server = express();
    server.use(express.json());
    const port = process.env.PORT || 8000;

    server.get('/', (req, res) => res.status(200).send("It's alive!"));
    server.use('mining', miningRouter);

    server.listen(port, () => console.log(`\u{1F680}\u{1F680}\u{1F680} http://localhost:${port}/ \u{1F680}\u{1F680}\u{1F680}`))
}