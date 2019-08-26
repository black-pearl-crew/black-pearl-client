const axios = require('axios');
let nextAvailableRequest = null;
let queue = [];

function shift() {
    currentDate = new Date();
    if(!nextAvailableRequest) {
        nextAvailableRequest = new Date();
    }
    let difference = nextAvailableRequest.getTime() - currentDate.getTime()
    if (difference < 0) difference = 0;
    console.log(`\u{26A0} \u{26A0} \u{26A0} Seconds Until Next Request: ${difference/1000} \u{26A0} \u{26A0} \u{26A0}`);
    setTimeout(() => {
        const {promise,config} = queue.shift();
        console.log(`Processing Next Request In Queue... (${queue.length} other requests waiting)`)
        promise.resolve({
            ...config,
            headers: {
                'Authorization': `Token ${process.env.TOKEN}`,
                'Content-Type': 'application/json'
            }
        });
    }, difference);
}

// Add a request interceptor which pushes request to the queue
axios.interceptors.request.use(function (config) {
    var res;
    const promise = new Promise((resolve) => {
        res = resolve;
    });
    promise.resolve = res;
    queue.push({promise,config});
    console.log(`Request Added To Queue (${queue.length} Requests In Queue)`)
    if (queue.length === 1) {
        shift();
    }
    return promise;    
}, function (error) {
    return Promise.reject(error);
});

// Add a response interceptor which:
// B. Calls shift() if queue is non-empty
// C. Updates the nextAvailableRequest
axios.interceptors.response.use((response) => {
    console.log("Success...")
    console.log(`New Cooldown: ${response.data.cooldown}`)
    // console.log(`nextAvailableRequest Before: ${nextAvailableRequest}`)
    nextAvailableRequest = new Date(new Date().getTime() + 1000 * response.data.cooldown)
    // console.log(`nextAvailableRequest After: ${nextAvailableRequest}`)
    if (queue.length > 0) {
        shift();
    }
    return response;
}, (error) => {
    console.log("Error...")
    console.log(`New Cooldown: ${error.response.data.cooldown}`)
    nextAvailableRequest = new Date()
    // console.log(`nextAvailableRequest Before: ${nextAvailableRequest}`)
    nextAvailableRequest = new Date(new Date().getTime() + 1000 * error.response.data.cooldown)
    // console.log(`nextAvailableRequest After: ${nextAvailableRequest}`)
    return Promise.reject(error);
});

module.exports = axios;