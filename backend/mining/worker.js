const cluster = require('cluster');

if (cluster.isWorker) {
    console.log('Worker ' + process.pid + ' has started.');
    const crypto = require('crypto');
    let nonce = Math.random() * 1000000000000000000000000000000000000000000;
    let hash = crypto.createHash('sha256')
                   .update(nonce.toString())
                   .digest('hex');
    let difficulty = 1;

    //Runs while hash is invalid
    while (!hash.startsWith("0".repeat(difficulty))) {

        // All messages received from Master process (on initialization and new block found)
        // Will include the new difficulty- So reset it and the nonce
        process.on('message', function (msg) {
            difficulty = msg.difficulty;
            nonce = Math.random() * 1000000000000000000000000000000000000000000;
        });

        //Increase nonce and recalculate hash
        nonce += 1;
        hash = crypto.createHash('sha256')
        .update(nonce.toString())
        .digest('hex');
    }

    // Send message to master process to indicate a new block was found
    if(hash.startsWith("0".repeat(difficulty))) {
        process.send({
            type: 'block-found',
            proof: nonce
        });
    }
}