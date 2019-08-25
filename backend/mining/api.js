const axios = require('../axios');
const cluster = require('cluster');
const cd = require('../cooldown');
const os = require('os');

function lastProof() {
    return axios.get('https://lambda-treasure-hunt.herokuapp.com/api/bc/last_proof/')
        .then(res => {
            return res.data;
        })
}

function getBalance() {
    return axios.get('https://lambda-treasure-hunt.herokuapp.com/api/bc/get_balance/')
        .then(res => {
            return res.data;
        })
}

function submitProof(proof) {
    return axios.post('https://lambda-treasure-hunt.herokuapp.com/api/bc/mine/', {
            proof
        })
        .then(res => {
            return res.data;
        });
}

function startMining(proof) {
    lastProof()
        .then(lambdaRes => {
            const {
                proof,
                difficulty,
                cooldown,
            } = lambdaRes;

            cd.setCooldown(cooldown);
            console.log(`\u{1F477}\u{1F477}\u{1F477} Starting ${os.cpus().length-1} Mining Workers... \u{1F477}\u{1F477}\u{1F477}`);
            const workers = [];

            // Fork workers.
            for (let i = 0; i < os.cpus().length - 1; i++) {
                const worker = cluster.fork();
                workers.push(worker);

                console.log(worker.process.pid)

                // Receive messages from this worker and handle them in the master process.
                worker.on('message', function (msg) {

                    switch (msg.type) {
                        case 'block-found':
                            //Submit Proof
                            submitProof(msg.proof)
                                .then(lambdaRes => {
                                    // Set cooldown
                                    cd.setCooldown(lambdaRes.cooldown);
                                    // Make sure difficulty has not changed
                                    return lastProof();
                                })
                                .then(lambdaRes => {
                                    const {
                                        proof,
                                        difficulty,
                                        cooldown,
                                    } = lambdaRes;
                                    // Set cooldown                   
                                    cd.setCooldown(cooldown);

                                    // Notify other workers a block was found
                                    workers.forEach(worker => {
                                        if (worker.process.pid !== this.process.pid) {
                                            worker.send({
                                                type: 'block-found',
                                                proof,
                                                difficulty
                                            });
                                        }
                                    });
                                })
                                .catch(err => {
                                    console.log(err)
                                });
                        default:
                            console.log('Master ' + process.pid + ' received message from worker ' + this.process.pid + '.', msg);
                    }
                });

                // Start mining
                // Send a message from the master process to the worker
                worker.send({
                    type: 'initialize',
                    proof,
                    difficulty
                });
            }

            // Be notified when worker processes die.
            cluster.on('death', function (worker) {
                console.log('Worker ' + worker.pid + ' died.');
            });

        })
        .catch(err => {
            console.log(err)
        });
}

module.exports = {
    lastProof,
    submitProof,
    getBalance,
    startMining
}