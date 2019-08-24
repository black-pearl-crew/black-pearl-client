const cluster = require('cluster');
const express = require('express');
const axios = require('axios');

if (cluster.isMaster) {

    console.log('Master ' + process.pid + ' has started.');

    const server = express();
    server.use(express.json());
    const port = process.env.PORT || 8000;

    server.get('/', (req, res) => res.status(200).send("It's alive!"));

    server.listen(port, () => console.log(`\u{1F680}\u{1F680}\u{1F680} http://localhost:${port}/ \u{1F680}\u{1F680}\u{1F680}`))

    // Fork workers.
    for (let i = 0; i < 2; i++) {
        const worker = cluster.fork();

        // Receive messages from this worker and handle them in the master process.
        worker.on('message', function (msg) {
            console.log('Master ' + process.pid + ' received message from worker ' + this.process.pid + '.', msg);
        });

        // Send a message from the master process to the worker.
        worker.send({
            msgFromMaster: 'This is from master ' + process.pid + ' to worker ' + worker.process.pid + '.'
        });
    }

    // Be notified when worker processes die.
    cluster.on('death', function (worker) {
        console.log('Worker ' + worker.pid + ' died.');
    });

}