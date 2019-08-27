const axios = require('axios');
const fs = require('fs');
let queue = [];

function getCooldown() {
    try {
        const data = fs.readFileSync('.cooldown', 'utf8');
        return number(data.toString())
    } catch(e) {
        const now = new Date().getTime()
        fs.writeFileSync(".cooldown", now.toString());
        return now
    }
}

function setCooldown(date) {
    fs.writeFileSync(".cooldown", date.getTime().toString());
}

function shift() {
    currentDate = new Date().getTime();
    const nextAvailableRequest = getCooldown();
    let difference = nextAvailableRequest - currentDate;
    if (difference < 0) difference = 0;
    console.log(`\u{26A0} \u{26A0} \u{26A0} Seconds Until Next Request: ${difference/1000} \u{26A0} \u{26A0} \u{26A0}`);
    setTimeout(() => {
        const {promise,config} = queue.shift();
        console.log(`Processing Next Request In Queue... (${queue.length} other requests waiting)`)
        promise.resolve({
            ...config,
            headers: {
                'Authorization': `Token ${process.env.LAMBDA_TOKEN}`,
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
    console.log(`${config.method} ${config.url.replace('https://lambda-treasure-hunt.herokuapp.com','')} Added To Request Queue (${queue.length} Requests In Queue)`);
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
    console.log("Success...");
    console.log(`New Cooldown: ${response.data.cooldown}`);
    setCooldown(new Date(new Date().getTime() + 1000 * response.data.cooldown));
    if (queue.length > 0) {
        shift();
    }
    return response;
}, (error) => {
    console.log("Error...");
    console.log(`New Cooldown: ${error.response.data.cooldown}`);
    setCooldown(new Date(new Date().getTime() + 1000 * error.response.data.cooldown));
    return Promise.reject(error);
});

module.exports = axios;