const cluster = require('cluster');

if (cluster.isWorker) {
    console.log(`Worker ${process.pid} has started. \u{1F680}\u{1F680}\u{1F680}\u{1F680}`);
    const crypto = require('crypto');
    let nonce = Math.random() * 1000000000000000000000000000000000000000000;
    let hash = crypto.createHash('sha256')
        .update(nonce.toString())
        .digest('hex');
    let difficulty = 7;

    // All messages received from Master process (on initialization and new block found)
    // Will include the new difficulty- So reset it and the nonce
    process.on('message', function (msg) {
        console.log(`[Worker# ${process.pid}] New Difficulty Received: ${msg.difficulty} \u{1F4D3}\u{1F4D3}\u{1F4D3}`)
        difficulty = msg.difficulty;
        nonce = Math.random() * 1000000000000000000000000000000000000000000;
        mine();
    });

    //Runs while hash is invalid
    function mine() {
        //Increase nonce and recalculate hash
        nonce += 1;
        hash = crypto.createHash('sha256')
            .update(nonce.toString())
            .digest('hex');
        console.log(`[Worker# ${process.pid}] Mining On Nonce# ${nonce} \u{26CF} \u{26CF} \u{26CF}`);

        const validHash = hash.startsWith("0".repeat(difficulty));

        // Send message to master process to indicate a new block was found

        if (validHash) {
            console.log(`[Worker# ${process.pid}] Found A Block \u{1F4B0}\u{1F4B0}\u{1F4B0}\u{1F4B0}`)
            process.send({
                type: 'block-found',
                proof: nonce
            });
            return;
        } else {
            mine();
        }
    }

}