const cluster = require('cluster');

if (cluster.isMaster) {
    const express = require('express');
    const axios = require('./axios');
    const os = require('os');

    console.log('Master ' + process.pid + ' has started.');

    const server = express();
    server.use(express.json());
    const port = process.env.PORT || 8000;

    server.get('/', (req, res) => res.status(200).send("It's alive!"));

    axios.get('https://lambda-treasure-hunt.herokuapp.com/api/adv/init/')
        .then(res => {
            console.log(res.data)
        })
        .catch(err => {
            console.log(err)
        })

    axios.post('https://lambda-treasure-hunt.herokuapp.com/api/adv/move/', {
        direction: 's'
    })
        .then(res => {
            console.log(res.data)
        })
        .catch(err => {
            console.log(err)
        })

    server.listen(port, () => console.log(`\u{1F680}\u{1F680}\u{1F680} http://localhost:${port}/ \u{1F680}\u{1F680}\u{1F680}`))

    console.log(`Starting ${os.cpus().length-1} Worker Processes...`)

    // Fork workers.
    for (let i = 0; i < os.cpus().length-1; i++) {
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