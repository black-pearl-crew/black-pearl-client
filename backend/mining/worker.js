const cluster = require('cluster');

if (cluster.isWorker) {
    const crypto = require('crypto');
    let nonce = Math.random() * 1000000000000000000000000000000000000000000;
    let hash = crypto.createHash('sha256')
                   .update(nonce.toString())
                   .digest('hex');
    let difficulty = 1;

    console.log('Worker ' + process.pid + ' has started.');
    
    // Receive messages from the master process.
    process.on('message', function (msg) {
        console.log("hshshshs")
        // console.log('Worker ' + process.pid + ' received message from master.', msg);
        difficulty = msg.difficulty
    });

    // while (!hash.startsWith("0".repeat(difficulty))) {
    //     nonce += 1;
    //     hash = crypto.createHash('sha256')
    //     .update(nonce.toString())
    //     .digest('hex');
    // }

    // Send message to master process to console.log()
    // process.send({
    //     type: 'message',
    //     msgFromWorker: 'This is from worker ' + process.pid + '.'
    // })

    // Send message to master process to indicate a new block was found
    process.send({
        type: 'block-found',
        proof: nonce
    })


}