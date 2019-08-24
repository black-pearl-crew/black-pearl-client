const axios = require('axios');

// Add a request interceptor
axios.interceptors.request.use(function (config) {
    // Do something before request is sent
    return {
        ...config,
        headers: {
            'Authorization': `Token ${process.env.TOKEN}`,
            'Content-Type': 'application/json'
        }
    };
}, function (error) {
    // Do something with request error
    return Promise.reject(error);
});

module.exports = axios;