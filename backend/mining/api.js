const cluster = require('cluster');

if (cluster.isMaster) {
    const axios = require('../axios');
    const os = require('os');

    function lastProof() {
        return axios.get('https://lambda-treasure-hunt.herokuapp.com/api/bc/last_proof/');
    }

    function getBalance() {
        return axios.get('https://lambda-treasure-hunt.herokuapp.com/api/bc/get_balance/');
    }

    function submitProof(proof) {
        return axios.post('https://lambda-treasure-hunt.herokuapp.com/api/bc/mine/', {proof});
    }

    function startMining() {
        lastProof()
            .then(lambdaRes => {
                var {
                    proof,
                    difficulty,
                } = lambdaRes.data;
                console.log(`\u{1F477}\u{1F477}\u{1F477} Starting ${os.cpus().length-1} Mining Workers... \u{1F477}\u{1F477}\u{1F477}`);
                const workers = [];

                // Fork workers.
                for (let i = 0; i < os.cpus().length - 1; i++) {
                    const worker = cluster.fork();
                    workers.push(worker);

                    // Receive messages from this worker and handle them in the master process.
                    worker.on('message', function (msg) {
                        switch (msg.type) {
                            case 'block-found':
                                // console.log(`A new block was found by Worker ${this.process.pid}`)
                                //Submit Proof
                                submitProof(msg.proof)
                                    .then(res => {
                                        console.log('Proof Submitted')
                                        console.log(res.data)
                                        // Make sure difficulty has not changed
                                        return lastProof();
                                    })
                                    .then(lambdaRes => {
                                        console.log("Updating Workers")
                                        const {
                                            proof,
                                            difficulty
                                        } = lambdaRes;
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
                            default:
                                console.log('Master ' + process.pid + ' received message from worker ' + this.process.pid + '.', msg);
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

                // Be notified when worker processes die.
                cluster.on('death', function (worker) {
                    console.log('Worker ' + worker.pid + ' died.');
                });

            })
            .catch(err => {
                startMining()
                //console.log(err.response.data)
            });
    }

}

module.exports = {
    lastProof,
    submitProof,
    getBalance,
    startMining
}