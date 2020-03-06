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
const queue = __importStar(require('./queue'));

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
    async _init() { }

    async _exit() { }

    async _entry() { }
}

exports.State = State;

class StateMachine {
    constructor(initialState, protocol, data, logLevel = logging.Level.INFO) {
        const bindObject = new StateBindObject(data, this);
        this.currentState = initialState;
        this.bindObject = bindObject;
        this.data = data;
        this.queue = queue.create();
        this.logLevel = logLevel;
        this.protocol = protocol.prototype;
    }

    send(signal, ...payload) {
        send(this.data, signal, ...payload);
    }

    async valueWithTransition(returnValue, transition) {
        return new Reply(returnValue, transition);
    }

    logTrace(msg) {
        logging.trace(msg);
    }

    logDebug(msg) {
        logging.debug(msg);
    }

    logWarn(msg) {
        logging.warn(msg);
    }

    logInfo(msg) {
        logging.info(msg);
    }

    logError(msg) {
        logging.error(msg);
    }

    logFatal(msg) {
        logging.fatal(msg);
    }

    logMe() {
    }
}

exports.StateMachine = StateMachine;
// # sourceMappingURL=../.map/stateMachine.js.map
