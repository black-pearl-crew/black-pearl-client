const axios = require('../util/lambdaAxios');
const cp = require('child_process');
const os = require('os');
const workers = [];

module.exports = {
    lastProof,
    submitProof,
    getBalance,
    startMining,
    stopMining
}

function lastProof() {
    return axios.get('https://lambda-treasure-hunt.herokuapp.com/api/bc/last_proof/');
}

function getBalance() {
    return axios.get('https://lambda-treasure-hunt.herokuapp.com/api/bc/get_balance/');
}

function submitProof(proof) {
    return axios.post('https://lambda-treasure-hunt.herokuapp.com/api/bc/mine/', {
        proof
    });
}

function stopMining() {
    console.log("\u{1F534}\u{1F534}\u{1F534} Mining Stopping \u{1F534}\u{1F534}\u{1F534}")
    workers.forEach(worker => {
        worker.kill();
    });
    console.log("\u{1F387}\u{1F387}\u{1F387} All Workers Terminated \u{1F387}\u{1F387}\u{1F387}")
}

function startMining() {
    lastProof()
        .then(lambdaRes => {
            var {
                proof,
                difficulty,
            } = lambdaRes.data;
            console.log(`\u{1F477}\u{1F477}\u{1F477} Starting ${os.cpus().length-1} Mining Workers... \u{1F477}\u{1F477}\u{1F477}`);
            var blockFound = false;

            // Fork workers.
            for (let i = 0; i < os.cpus().length - 1; i++) {
                const worker = cp.fork('./util/miningWorker.js');
                workers.push(worker);

                // Receive messages from this worker and handle them in the master process.
                worker.on('message', function (msg) {
                    console.log(msg)
                    switch (msg.type) {
                        case 'block-found':
                            console.log("switch case found")
                            //Submit Proof
                            if (!blockFound) {
                                console.log("Am I here?")
                                blockFound = true;
                                submitProof(msg.proof)
                                    .then(res => {
                                        console.log(`Proof Submitted Successfully \u{1F535}\u{1F535}\u{1F535}`);
                                        if (res.data.messages[0].includes('New Block Forged')) {
                                            console.log('New Block Forged \u{1F973}\u{1F973}\u{1F973}\u{1F973}')
                                        } else {
                                            console.log(`${res.data.messages[0]} SAD! \u{1F92A}\u{1F92A}\u{1F92A}`)
                                        }
                                        // Get last proof and make sure difficulty has not changed
                                        getBalance()
                                            .then(({
                                                data
                                            }) => {
                                                console.log(data);
                                                return lastProof();
                                            })
                                    })
                                    .then(({
                                        data
                                    }) => {
                                        console.log("Updating Workers");
                                        proof = data.proof;
                                        difficulty = data.difficulty;
                                        blockFound = false;
                                        // Update workers of the last proof and new difficulty
                                        workers.forEach(worker => {
                                            worker.send({
                                                type: 'block-found',
                                                proof,
                                                difficulty
                                            });
                                        });
                                    })
                                    .catch(err => {
                                        console.log(err)
                                    });
                            }
                            default:
                                break;
                    }
                });

                // Start mining
                // Send a message from the master process to the worker
                worker.send({
                    type: 'initialize',
                    proof: proof,
                    difficulty: difficulty
                });
            }

            // Check every 1.5 minutes if there's a new block
            setInterval(() => {
                lastProof()
                    .then(({
                        data
                    }) => {
                        newProof = data.proof;
                        newDifficulty = data.difficulty;

                        // If the difficulty or last proof changed
                        // Then update workers of the last proof and new difficulty
                        if (difficulty !== newDifficulty) {
                            console.log("Updating Workers...");
                            proof = newProof;
                            difficulty = newDifficulty;
                            workers.forEach(worker => {
                                worker.send({
                                    type: 'block-found',
                                    proof,
                                    difficulty
                                });
                            });
                        }
                    })
                    .catch(err => {
                        console.log(err)
                    });
            }, 120000);
        })
        .catch(err => {
            console.log(err)
        });
}