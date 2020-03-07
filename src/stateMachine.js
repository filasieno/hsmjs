'use strict';
// Begin Utils
// eslint-disable-next-line no-invalid-this


const __importStar = (this && this.__importStar) || function(mod) {
    if (mod && mod.__esModule) return mod;
    const result = {};
    if (mod != null) for (const k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result['default'] = mod;
    return result;
};
Object.defineProperty(exports, '__esModule', {value: true});
// End Util

const logging = __importStar(require('./logging'));
const queue = __importStar(require('./ihsm.queue'));
const {LogLevel, logTrace, logDebug, logWarn, logInfo, logError, logFatal} = logging;

class Reply {
    constructor(value, targetState) {
        this.value = value;
        this.targetState = targetState;
    }
}

exports.Reply = Reply;

class StateBindObject {
    constructor(ctx, hsm) {
        this.ctx = ctx;
        this.hsm = hsm;
    }
}

exports.StateBindObject = StateBindObject;

class State extends StateBindObject {
    _init() { }

    async _exit() { }

    async _entry() { }
}

exports.State = State;

class StateMachine {
    constructor(topState, data, logLevel = LogLevel.TRACE) {
        const q = queue.create();
        if (q === undefined) throw new Error('Cannot Create queue');
        const bindObject = new StateBindObject(data, this);
        this.topState = topState;
        this.currentState = topState;
        this.bindObject = bindObject;
        this.data = data;
        this.queue = q;
        this.logLevel = logLevel;
        this.indent = 0;
        this.name = data.__proto__.constructor.name;
        this.transitionCache = {};
        this.nextState = null;
    }

    tran(targetTransition) {
        if (this.nextState) {
            throw new Error('Illegal State: a nextState was set more than once');
        }
        if (this.topState.isPrototypeOf(this.nextState)) {
            throw new Error('Illegal State');
        }
        this.nextState = targetTransition;
    }

    send(signal, ...payload) {
        send(this.data, signal, ...payload);
    }

    async valueWithTransition(returnValue, transition) {
        return new Reply(returnValue, transition);
    }

    logTrace(msg) {
        if (this.logLevel >= LogLevel.TRACE) {
            logTrace(`${this.name}[${this.currentState.name}]:${msg}`);
        }
    }

    logDebug(msg) {
        if (this.logLevel >= LogLevel.DEBUG) {
            logDebug(`${this.name}[${this.currentState.name}]:${msg}`);
        }
    }

    logWarn(msg) {
        if (this.logLevel >= LogLevel.WARN) {
            logWarn(`${this.name}[${this.currentState.name}]:${msg}`);
        }
    }

    logInfo(msg) {
        if (this.logLevel >= LogLevel.INFO) {
            logInfo(`${this.name}[${this.currentState.name}]:${msg}`);
        }
    }

    logError(msg) {
        if (this.logLevel >= LogLevel.ERROR) {
            logError(`${this.name}[${this.currentState.name}]:${msg}`);
        }
    }

    logFatal(msg) {
        logFatal(`${this.name}[${this.currentState.name}]:${msg}`);
    }

    logMe() {
        logFatal(this);
    }

    unhandled() {
        throw new Error(`${this} does not know how to handle a message in state "${this.currentState.name}"`);
    }
}

exports.StateMachine = StateMachine;
// # sourceMappingURL=../.map/stateMachine.js.map
