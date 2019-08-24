const cluster = require('cluster');

if (cluster.isWorker) {

    console.log('Worker ' + process.pid + ' has started.');

    // Send message to master process.
    process.send({
        msgFromWorker: 'This is from worker ' + process.pid + '.'
    })

    // Receive messages from the master process.
    process.on('message', function (msg) {
        console.log('Worker ' + process.pid + ' received message from master.', msg);
    });
}