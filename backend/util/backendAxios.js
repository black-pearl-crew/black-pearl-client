const backendAxios = require('axios').create();

// Add a request interceptor which pushes request to the queue
backendAxios.interceptors.request.use(function (config) {
    return {
        ...config,
        headers: {
            'authorization': `${process.env.SERVER_TOKEN}`,
            'Content-Type': 'application/json'
        }
    }    
}, function (error) {
    return Promise.reject(error);
});

module.exports = backendAxios;