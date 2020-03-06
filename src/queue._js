const EventEmitter = require('events').EventEmitter;

module.exports = Queue;
module.exports.default = Queue;

class Queue extends EventEmitter {
    constructor(options) {
        super();
        if (!(this instanceof Queue)) {
            return new Queue(options)
        }
        options = options || {};
        this.concurrency = options.concurrency || Infinity;
        this.timeout = options.timeout || 0;
        this.autostart = options.autostart || false;
        this.results = options.results || null;
        this.pending = 0;
        this.session = 0;
        this.running = false;
        this.jobs = [];
        this.timers = {};
    }

    get length() {
        return this.pending + this.jobs.length
    }

    slice(begin, end) {
        this.jobs = this.jobs.slice(begin, end);
        return this
    }

    reverse() {
        this.jobs.reverse();
        return this
    }
    stop() {
        this.running = false
    }
    start() {
        if (cb) {
            callOnErrorOrEnd.call(this, cb)
        }

        this.running = true;

        if (this.pending >= this.concurrency) {
            return
        }

        if (this.jobs.length === 0) {
            if (this.pending === 0) {
                done.call(this)
            }
            return
        }

        let self = this;
        let job = this.jobs.shift();
        let once = true;
        let session = this.session;
        let timeoutId = null;
        let didTimeout = false;
        let resultIndex = null;
        let timeout = Object.prototype.hasOwnProperty.call(job, 'timeout') ? job.timeout : this.timeout;

        function next(err, result) {
            if (once && self.session === session) {
                once = false;
                self.pending--;
                if (timeoutId !== null) {
                    delete self.timers[timeoutId];
                    clearTimeout(timeoutId)
                }

                if (err) {
                    self.emit('error', err, job)
                } else if (didTimeout === false) {
                    if (resultIndex !== null) {
                        self.results[resultIndex] = Array.prototype.slice.call(arguments, 1)
                    }
                    self.emit('success', result, job)
                }

                if (self.session === session) {
                    if (self.pending === 0 && self.jobs.length === 0) {
                        done.call(self)
                    } else if (self.running) {
                        self.start()
                    }
                }
            }
        }

        if (timeout) {
            timeoutId = setTimeout(function () {
                didTimeout = true;
                if (self.listeners('timeout').length > 0) {
                    self.emit('timeout', next, job)
                } else {
                    next()
                }
            }, timeout);
            this.timers[timeoutId] = timeoutId
        }

        if (this.results) {
            resultIndex = this.results.length;
            this.results[resultIndex] = null
        }

        this.pending++;
        self.emit('start', job);
        let promise = job(next);
        if (promise && promise.then && typeof promise.then === 'function') {
            promise.then(function (result) {
                return next(null, result)
            }).catch(function (err) {
                return next(err || true)
            })
        }

        if (this.running && this.jobs.length > 0) {
            this.start()
        }
    }
    end(err) {
        clearTimers.call(this);
        this.jobs.length = 0;
        this.pending = 0;
        done.call(this, err);
    }
}

const arrayMethods = [
    'pop',
    'shift',
    'indexOf',
    'lastIndexOf'
];

arrayMethods.forEach(function (method) {
    Queue.prototype[method] = function () {
        return Array.prototype[method].apply(this.jobs, arguments)
    }
});

let arrayAddMethods = [
    'push',
    'unshift',
    'splice'
];

arrayAddMethods.forEach(function (method) {
    Queue.prototype[method] = function () {
        let methodResult = Array.prototype[method].apply(this.jobs, arguments)
        if (this.autostart) {
            this.start()
        }
        return methodResult
    }
});

function clearTimers() {
    for (let key in this.timers) {
        let timeoutId = this.timers[key];
        delete this.timers[key];
        clearTimeout(timeoutId);
    }
}

function callOnErrorOrEnd(cb) {
    let self = this;
    this.on('error', onerror);
    this.on('end', onend);

    function onerror(err) { self.end(err) }

    function onend(err) {
        self.removeListener('error', onerror);
        self.removeListener('end', onend);
        cb(err, this.results);
    }
}

function done(err) {
    this.session++;
    this.running = false;
    this.emit('end', err);
}
