let cooldown = 0;
let queue = [];

function pop() {
    setTimeout(() => {
        const promise = queue.shift();
        promise.cb()
            .then(response => {
                cooldown = response.cooldown;
                if (queue.length > 1) {
                    pop();
                }
                promise.resolve(response);
            })
            .catch(err => promise.reject(err));
    }, cooldown * 1000);
}

function wait(cb) {
    var res,rej;
    const promise = new Promise((resolve, reject) => {
        res = resolve;
        rej = reject;
    });
    promise.resolve = res;
    promise.reject = rej;
    promise.cb = cb;
    queue.push(promise);
    if (queue.length === 1) {
        pop();
    }
    return promise;
}

module.exports = wait