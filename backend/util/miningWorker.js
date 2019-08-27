console.log(`[Worker# ${process.pid}] Initialized. \u{1F680}\u{1F680}\u{1F680}\u{1F680}`);
const crypto = require('crypto');
let positive = Math.random() > .5 ? 1 : -1;
let nonce = Math.ceil(Math.random() * 21474836 * Math.random() * positive);
let last_nonce = '00';
let increment = Math.random() > .5 ? 1 : -1;
let hash = crypto.createHash('sha256')
    .update(last_nonce + nonce.toString())
    .digest('hex');
let difficulty = 100;
let reset = false;
mine();

// All messages received from Master process (on initialization and new block found)
// Will include the new difficulty- So reset it and the nonce
process.on('message', function (msg) {
    console.log(`[Worker# ${process.pid}] New Difficulty Received: ${msg.difficulty} \u{1F4D3}\u{1F4D3}\u{1F4D3}`);
    difficulty = msg.difficulty;
    last_nonce = msg.proof;
    positive = Math.random() > .5 ? 1 : -1;
    increment = Math.random() > .5 ? 1 : -1;
    nonce = Math.ceil(Math.random() * 21474836 * Math.random() * positive);
    console.log(`[Worker# ${process.pid}] Random Nonce = ${nonce}`);
    reset = true;
    mine();
});

//Runs while hash is invalid
function mine() {
    //Increase nonce and recalculate hash
    nonce += increment;
    hash = crypto.createHash('sha256')
        .update(last_nonce + nonce.toString())
        .digest('hex');

    if (nonce % 99999999999 === 0)
        console.log(`[Worker# ${process.pid}] Mining On Nonce# ${nonce} \u{26CF} \u{26CF} \u{26CF} Looking For: ${"0".repeat(difficulty)}`);
    const validHash = hash.startsWith("0".repeat(difficulty));

    if (validHash) {
        console.log(`[Worker# ${process.pid}] Found A Block \u{1F4B0}\u{1F4B0}\u{1F4B0}\u{1F4B0} ${hash} ${nonce}`)
        // Send message to master process to indicate a new block was found
        process.send({
            type: 'block-found',
            proof: nonce
        });
    }

    if(reset) {
        reset=false;
        return;
    } else {
        setImmediate(() => mine());
    }
}