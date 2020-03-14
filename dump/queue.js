// Queue for Browsers

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Inherits
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

let inherits = null;
if (typeof Object.create === 'function') {
    // implementation from standard node.js 'util' module
    inherits = function inherits(ctor, superCtor) {
        if (superCtor) {
            ctor.super_ = superCtor;
            ctor.prototype = Object.create(superCtor.prototype, {
                constructor: {
                    value: ctor,
                    enumerable: false,
                    writable: true,
                    configurable: true,
                },
            });
        }
    };
} else {
    // old school shim for old browsers
    inherits = function inherits(ctor, superCtor) {
        if (superCtor) {
            ctor.super_ = superCtor;
            var TempCtor = function() {};
            TempCtor.prototype = superCtor.prototype;
            ctor.prototype = new TempCtor();
            ctor.prototype.constructor = ctor;
        }
    };
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Events
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

let R = typeof Reflect === 'object' ? Reflect : null;
let ReflectApply = R && typeof R.apply === 'function'
    ? R.apply
    : function ReflectApply(target, receiver, args) {
        return Function.prototype.apply.call(target, receiver, args);
    };

let ReflectOwnKeys;
if (R && typeof R.ownKeys === 'function') {
    ReflectOwnKeys = R.ownKeys;
} else if (Object.getOwnPropertySymbols) {
    ReflectOwnKeys = function ReflectOwnKeys(target) {
        return Object.getOwnPropertyNames(target)
            .concat(Object.getOwnPropertySymbols(target));
    };
} else {
    ReflectOwnKeys = function ReflectOwnKeys(target) {
        return Object.getOwnPropertyNames(target);
    };
}

function ProcessEmitWarning(warning) {
    if (console && console.warn) console.warn(warning);
}

let NumberIsNaN = Number.isNaN || function NumberIsNaN(value) {
    return value !== value;
};

function EventEmitter() {
    EventEmitter.init.call(this);
}

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._eventsCount = 0;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
let defaultMaxListeners = 10;

function checkListener(listener) {
    if (typeof listener !== 'function') {
        throw new TypeError('The "listener" argument must be of type Function. Received type ' + typeof listener);
    }
}

Object.defineProperty(EventEmitter, 'defaultMaxListeners', {
    enumerable: true,
    get: function() {
        return defaultMaxListeners;
    },
    set: function(arg) {
        if (typeof arg !== 'number' || arg < 0 || NumberIsNaN(arg)) {
            throw new RangeError('The value of "defaultMaxListeners" is out of range. It must be a non-negative number. Received ' + arg + '.');
        }
        defaultMaxListeners = arg;
    },
});

EventEmitter.init = function() {

    if (this._events === undefined ||
        this._events === Object.getPrototypeOf(this)._events) {
        this._events = Object.create(null);
        this._eventsCount = 0;
    }

    this._maxListeners = this._maxListeners || undefined;
};

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function setMaxListeners(n) {
    if (typeof n !== 'number' || n < 0 || NumberIsNaN(n)) {
        throw new RangeError('The value of "n" is out of range. It must be a non-negative number. Received ' + n + '.');
    }
    this._maxListeners = n;
    return this;
};

function _getMaxListeners(that) {
    if (that._maxListeners === undefined) {
        return EventEmitter.defaultMaxListeners;
    }
    return that._maxListeners;
}

EventEmitter.prototype.getMaxListeners = function getMaxListeners() {
    return _getMaxListeners(this);
};

EventEmitter.prototype.emit = function emit(type) {
    var args = [];
    for (var i = 1; i < arguments.length; i++) args.push(arguments[i]);
    var doError = (type === 'error');

    var events = this._events;
    if (events !== undefined) {
        doError = (doError && events.error === undefined);
    } else if (!doError) {
        return false;
    }

    // If there is no 'error' event listener then throw.
    if (doError) {
        var er;
        if (args.length > 0) {
            er = args[0];
        }
        if (er instanceof Error) {
            // Note: The comments on the `throw` lines are intentional, they show
            // up in Node's output if this results in an unhandled exception.
            throw er; // Unhandled 'error' event
        }
        // At least give some kind of context to the user
        var err = new Error('Unhandled error.' + (er ? ' (' + er.message + ')' : ''));
        err.context = er;
        throw err; // Unhandled 'error' event
    }

    var handler = events[type];

    if (handler === undefined) {
        return false;
    }

    if (typeof handler === 'function') {
        ReflectApply(handler, this, args);
    } else {
        var len = handler.length;
        var listeners = arrayClone(handler, len);
        for (var i = 0; i < len; ++i) {
            ReflectApply(listeners[i], this, args);
        }
    }

    return true;
};

function _addListener(target, type, listener, prepend) {
    var m;
    var events;
    var existing;

    checkListener(listener);

    events = target._events;
    if (events === undefined) {
        events = target._events = Object.create(null);
        target._eventsCount = 0;
    } else {
        // To avoid recursion in the case that type === "newListener"! Before
        // adding it to the listeners, first emit "newListener".
        if (events.newListener !== undefined) {
            target.emit('newListener', type,
                listener.listener ? listener.listener : listener);

            // Re-assign `events` because a newListener handler could have caused the
            // this._events to be assigned to a new object
            events = target._events;
        }
        existing = events[type];
    }

    if (existing === undefined) {
        // Optimize the case of one listener. Don't need the extra array object.
        existing = events[type] = listener;
        ++target._eventsCount;
    } else {
        if (typeof existing === 'function') {
            // Adding the second element, need to change to array.
            existing = events[type] =
                prepend ? [listener, existing] : [existing, listener];
            // If we've already got an array, just append.
        } else if (prepend) {
            existing.unshift(listener);
        } else {
            existing.push(listener);
        }

        // Check for listener leak
        m = _getMaxListeners(target);
        if (m > 0 && existing.length > m && !existing.warned) {
            existing.warned = true;
            // No error code for this since it is a Warning
            // eslint-disable-next-line no-restricted-syntax
            var w = new Error('Possible EventEmitter memory leak detected. ' +
                existing.length + ' ' + String(type) + ' listeners ' +
                'added. Use emitter.setMaxListeners() to ' +
                'increase limit');
            w.name = 'MaxListenersExceededWarning';
            w.emitter = target;
            w.type = type;
            w.count = existing.length;
            ProcessEmitWarning(w);
        }
    }

    return target;
}

EventEmitter.prototype.addListener = function addListener(type, listener) {
    return _addListener(this, type, listener, false);
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.prependListener =
    function prependListener(type, listener) {
        return _addListener(this, type, listener, true);
    };

function onceWrapper() {
    if (!this.fired) {
        this.target.removeListener(this.type, this.wrapFn);
        this.fired = true;
        if (arguments.length === 0) {
            return this.listener.call(this.target);
        }
        return this.listener.apply(this.target, arguments);
    }
}

function _onceWrap(target, type, listener) {
    var state = {fired: false, wrapFn: undefined, target: target, type: type, listener: listener};
    var wrapped = onceWrapper.bind(state);
    wrapped.listener = listener;
    state.wrapFn = wrapped;
    return wrapped;
}

EventEmitter.prototype.once = function once(type, listener) {
    checkListener(listener);
    this.on(type, _onceWrap(this, type, listener));
    return this;
};

EventEmitter.prototype.prependOnceListener =
    function prependOnceListener(type, listener) {
        checkListener(listener);
        this.prependListener(type, _onceWrap(this, type, listener));
        return this;
    };

// Emits a 'removeListener' event if and only if the listener was removed.
EventEmitter.prototype.removeListener =
    function removeListener(type, listener) {
        var list, events, position, i, originalListener;

        checkListener(listener);

        events = this._events;
        if (events === undefined) {
            return this;
        }

        list = events[type];
        if (list === undefined) {
            return this;
        }

        if (list === listener || list.listener === listener) {
            if (--this._eventsCount === 0) {
                this._events = Object.create(null);
            } else {
                delete events[type];
                if (events.removeListener) {
                    this.emit('removeListener', type, list.listener || listener);
                }
            }
        } else if (typeof list !== 'function') {
            position = -1;

            for (i = list.length - 1; i >= 0; i--) {
                if (list[i] === listener || list[i].listener === listener) {
                    originalListener = list[i].listener;
                    position = i;
                    break;
                }
            }

            if (position < 0) {
                return this;
            }

            if (position === 0) {
                list.shift();
            } else {
                spliceOne(list, position);
            }

            if (list.length === 1) {
                events[type] = list[0];
            }

            if (events.removeListener !== undefined) {
                this.emit('removeListener', type, originalListener || listener);
            }
        }

        return this;
    };

EventEmitter.prototype.off = EventEmitter.prototype.removeListener;

EventEmitter.prototype.removeAllListeners =
    function removeAllListeners(type) {
        var listeners, events, i;

        events = this._events;
        if (events === undefined) {
            return this;
        }

        // not listening for removeListener, no need to emit
        if (events.removeListener === undefined) {
            if (arguments.length === 0) {
                this._events = Object.create(null);
                this._eventsCount = 0;
            } else if (events[type] !== undefined) {
                if (--this._eventsCount === 0) {
                    this._events = Object.create(null);
                } else {
                    delete events[type];
                }
            }
            return this;
        }

        // emit removeListener for all listeners on all events
        if (arguments.length === 0) {
            var keys = Object.keys(events);
            var key;
            for (i = 0; i < keys.length; ++i) {
                key = keys[i];
                if (key === 'removeListener') continue;
                this.removeAllListeners(key);
            }
            this.removeAllListeners('removeListener');
            this._events = Object.create(null);
            this._eventsCount = 0;
            return this;
        }

        listeners = events[type];

        if (typeof listeners === 'function') {
            this.removeListener(type, listeners);
        } else if (listeners !== undefined) {
            // LIFO order
            for (i = listeners.length - 1; i >= 0; i--) {
                this.removeListener(type, listeners[i]);
            }
        }

        return this;
    };

function _listeners(target, type, unwrap) {
    var events = target._events;

    if (events === undefined) {
        return [];
    }

    var evlistener = events[type];
    if (evlistener === undefined) {
        return [];
    }

    if (typeof evlistener === 'function') {
        return unwrap ? [evlistener.listener || evlistener] : [evlistener];
    }

    return unwrap ?
        unwrapListeners(evlistener) : arrayClone(evlistener, evlistener.length);
}

EventEmitter.prototype.listeners = function listeners(type) {
    return _listeners(this, type, true);
};

EventEmitter.prototype.rawListeners = function rawListeners(type) {
    return _listeners(this, type, false);
};

EventEmitter.listenerCount = function(emitter, type) {
    if (typeof emitter.listenerCount === 'function') {
        return emitter.listenerCount(type);
    } else {
        return listenerCount.call(emitter, type);
    }
};

EventEmitter.prototype.listenerCount = listenerCount;

function listenerCount(type) {
    var events = this._events;

    if (events !== undefined) {
        var evlistener = events[type];

        if (typeof evlistener === 'function') {
            return 1;
        } else if (evlistener !== undefined) {
            return evlistener.length;
        }
    }

    return 0;
}

EventEmitter.prototype.eventNames = function eventNames() {
    return this._eventsCount > 0 ? ReflectOwnKeys(this._events) : [];
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Queue
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function arrayClone(arr, n) {
    var copy = new Array(n);
    for (var i = 0; i < n; ++i) {
        copy[i] = arr[i];
    }
    return copy;
}

function spliceOne(list, index) {
    for (; index + 1 < list.length; index++) {
        list[index] = list[index + 1];
    }
    list.pop();
}

function unwrapListeners(arr) {
    var ret = new Array(arr.length);
    for (var i = 0; i < ret.length; ++i) {
        ret[i] = arr[i].listener || arr[i];
    }
    return ret;
}

function Queue(options) {
    if (!(this instanceof Queue)) {
        return new Queue(options);
    }

    EventEmitter.call(this);
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

inherits(Queue, EventEmitter);

var arrayMethods = [
    'pop',
    'shift',
    'indexOf',
    'lastIndexOf',
];

arrayMethods.forEach(function(method) {
    Queue.prototype[method] = function() {
        return Array.prototype[method].apply(this.jobs, arguments);
    };
});

Queue.prototype.slice = function(begin, end) {
    this.jobs = this.jobs.slice(begin, end);
    return this;
};

Queue.prototype.reverse = function() {
    this.jobs.reverse();
    return this;
};

var arrayAddMethods = [
    'push',
    'unshift',
    'splice',
];

arrayAddMethods.forEach(function(method) {
    Queue.prototype[method] = function() {
        var methodResult = Array.prototype[method].apply(this.jobs, arguments);
        if (this.autostart) {
            this.start();
        }
        return methodResult;
    };
});

Object.defineProperty(Queue.prototype, 'length', {
    get: function() {
        return this.pending + this.jobs.length;
    },
});

Queue.prototype.start = function(cb) {
    if (cb) {
        callOnErrorOrEnd.call(this, cb);
    }

    this.running = true;

    if (this.pending >= this.concurrency) {
        return;
    }

    if (this.jobs.length === 0) {
        if (this.pending === 0) {
            done.call(this);
        }
        return;
    }

    var self = this;
    var job = this.jobs.shift();
    var once = true;
    var session = this.session;
    var timeoutId = null;
    var didTimeout = false;
    var resultIndex = null;
    var timeout = job.hasOwnProperty('timeout') ? job.timeout : this.timeout;

    function next(err, result) {
        if (once && self.session === session) {
            once = false;
            self.pending--;
            if (timeoutId !== null) {
                delete self.timers[timeoutId];
                clearTimeout(timeoutId);
            }

            if (err) {
                self.emit('error', err, job);
            } else if (didTimeout === false) {
                if (resultIndex !== null) {
                    self.results[resultIndex] = Array.prototype.slice.call(arguments, 1);
                }
                self.emit('success', result, job);
            }

            if (self.session === session) {
                if (self.pending === 0 && self.jobs.length === 0) {
                    done.call(self);
                } else if (self.running) {
                    self.start();
                }
            }
        }
    }

    if (timeout) {
        timeoutId = setTimeout(function() {
            didTimeout = true;
            if (self.listeners('timeout').length > 0) {
                self.emit('timeout', next, job);
            } else {
                next();
            }
        }, timeout);
        this.timers[timeoutId] = timeoutId;
    }

    if (this.results) {
        resultIndex = this.results.length;
        this.results[resultIndex] = null;
    }

    this.pending++;
    self.emit('start', job);
    var promise = job(next);
    if (promise && promise.then && typeof promise.then === 'function') {
        promise.then(function(result) {
            return next(null, result);
        }).catch(function(err) {
            return next(err || true);
        });
    }

    if (this.running && this.jobs.length > 0) {
        this.start();
    }
};

Queue.prototype.stop = function() {
    this.running = false;
};

Queue.prototype.end = function(err) {
    clearTimers.call(this);
    this.jobs.length = 0;
    this.pending = 0;
    done.call(this, err);
};

function clearTimers() {
    for (var key in this.timers) {
        var timeoutId = this.timers[key]
        delete this.timers[key]
        clearTimeout(timeoutId)
    }
}

function callOnErrorOrEnd(cb) {
    var self = this
    this.on('error', onerror)
    this.on('end', onend)

    function onerror(err) { self.end(err) }

    function onend(err) {
        self.removeListener('error', onerror)
        self.removeListener('end', onend)
        cb(err, this.results)
    }
}

function done(err) {
    this.session++
    this.running = false
    this.emit('end', err)
}

