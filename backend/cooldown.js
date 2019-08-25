let cooldown = 0;
let queue = [];

function pop() {
    while (queue.length > 0) {
        setTimeout(() => {
            const promise = queue.shift();
            promise.cb(...promise.args)
            .then(response => {
                cooldown = response.cooldown;
                promise.resolve(response);
            })            
        }, cooldown * 1000);
    }
}

function wait(cb) {
    var res,hydratedCb,args;
    const promise = new Promise((resolve) => {
        args = [];
        if (arguments.length > 1) {
            for (let i = 1; i < arguments.length - 1; i++) {
                args.push(arguments[i])
            }
        }
        hydratedCb = cb
        res = resolve;
    });
    promise.resolve = res;
    promise.cb = hydratedCb;
    promise.args = args;
    queue.push(promise);
    if(queue.length === 1) {
        pop();
    }
    return promise;
}

module.exports = {
    wait
}