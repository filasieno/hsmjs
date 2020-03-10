(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "./taskqueue"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const taskqueue_1 = require("./taskqueue");
    exports.defaultLogLevel = 30;
    class BindTarget {
    }
    exports.BindTarget = BindTarget;
    class State extends BindTarget {
        constructor() {
            super();
            throw new Error("State classes are stateless and cannot be instantiated");
        }
        _init() { }
        _exit() { }
        _entry() { }
        onError(err) {
            this.hsm.logError(err);
            throw err;
        }
    }
    exports.State = State;
    function validate(def) {
        throw new Error("Unimplemented");
    }
    exports.validate = validate;
    function init(def, data, logLevel = 30) {
        if (def === undefined) {
            throw new Error('def must not be null');
        }
        if (!def.State) {
            throw new Error('def must have a State');
        }
        let hsm;
        try {
            hsm = new Hsm(def.State, data, logLevel === undefined ? exports.defaultLogLevel : logLevel);
            data.__hsm__ = hsm;
        }
        catch (ex) {
            throw new Error(`failed to set property __hsm__ on ${Object.getPrototypeOf(data).constructor.name}`);
        }
        let currState = def.State;
        while (true) {
            if (Object.prototype.hasOwnProperty.call(currState.prototype, '_init')) {
                currState.prototype['_init'].call(hsm);
                hsm.logTrace(`${currState.name} init done`);
            }
            else {
                hsm.logTrace(`${currState.name} init [unimplemented]`);
            }
            if (currState.initialState !== undefined) {
                currState = currState.initialState;
                hsm.currentState = currState.initialState;
            }
            else {
                break;
            }
        }
        return data;
    }
    exports.init = init;
    function get(data) {
        return data.__hsm__;
    }
    exports.get = get;
    function initHsm(def, data, logLevel = 30) {
        let dataEx = init(def, data, logLevel);
        return get(dataEx);
    }
    exports.initHsm = initHsm;
    function initialState(state) {
        if (state.isInitialState) {
            return;
        }
        state.isInitialState = true;
        let parent = Object.getPrototypeOf(state);
        if (parent.initialState === State) {
            throw new Error(`Cannot assign an initial state to the Top State (as it inherits from ihsm.State)`);
        }
        if (!parent.initialState) {
            state.isInitialState = true;
            parent.initialState = state;
        }
        else {
            throw new Error(`already assigned initial state for: ${parent.name}`);
        }
    }
    exports.initialState = initialState;
    function errorState(state) {
        throw new Error("Unimplemented");
    }
    exports.errorState = errorState;
    class Transition {
        constructor(exitList, entryList, exitPrototypeList, entryPrototypeList) {
            this.exitList = exitList;
            this.entryList = entryList;
            this.exitPrototypeList = exitPrototypeList;
            this.entryPrototypeList = entryPrototypeList;
        }
        *getTransitionActions() {
            for (const cls of this.exitList) {
                if (cls.prototype.hasOwnProperty('_exit')) {
                    yield cls.prototype._exit;
                }
            }
            for (const cls of this.entryList) {
                if (cls.prototype.hasOwnProperty('_entry')) {
                    yield cls.prototype._entry;
                }
            }
        }
    }
    class Hsm {
        constructor(topState, userData, logLevel) {
            this.hsm = this;
            this.ctx = userData;
            this.ctx.__hsm__ = this;
            this.send = createSendProtocol(this, topState);
            this.asyncSend = createAsyncSendProtocol(this, topState);
            this.topState = topState;
            this.currentState = topState;
            this.typeName = Object.getPrototypeOf(userData).constructor.name;
            this.name = this.typeName;
            this.logLevel = logLevel;
            this.log = console.log;
            this.transitionCache = new Map();
            this.queue = taskqueue_1.createTaskQueue();
            this.indent = 0;
        }
        clearTransition() {
            this.nextState = undefined;
        }
        transition(nextState) {
            if (nextState === undefined) {
                throw new Error("Cannot transition to undefined");
            }
            this.nextState = nextState;
        }
        unhandled() {
            throw new Error("Unhandled method");
        }
        logTrace(msg, ...optionalParameters) { if (this.logLevel >= 20) {
            this.log(msg, ...optionalParameters);
        } }
        logDebug(msg, ...optionalParameters) { if (this.logLevel >= 30) {
            this.log(msg, ...optionalParameters);
        } }
        logWarn(msg, ...optionalParameters) { if (this.logLevel >= 40) {
            this.log(msg, ...optionalParameters);
        } }
        logInfo(msg, ...optionalParameters) { if (this.logLevel >= 30) {
            this.log(msg, ...optionalParameters);
        } }
        logError(msg, ...optionalParameters) { if (this.logLevel >= 50) {
            this.log(msg, ...optionalParameters);
        } }
        logFatal(msg, ...optionalParameters) { this.log(msg, ...optionalParameters); }
    }
    function getTransition(srcState, destState) {
        let src = srcState;
        let dst = destState;
        const end = State.constructor;
        let srcPath = [];
        let srcIndex = new Map();
        let dstPath = [];
        let cur = src;
        let i = 0;
        while (cur !== end) {
            srcPath.push(cur);
            srcIndex.set(cur, i);
            cur = Object.getPrototypeOf(cur);
            ++i;
        }
        cur = dst;
        while (cur !== end) {
            let i = srcIndex.get(cur);
            if (i !== undefined) {
                srcPath = srcPath.slice(0, i);
                break;
            }
            dstPath.unshift(cur);
            cur = Object.getPrototypeOf(cur);
        }
        while (dst.hasOwnProperty('initialState')) {
            dst = dst.initialState;
            dstPath.push(dst);
        }
        return new Transition(srcPath, srcPath, srcPath.map(x => x.prototype), dstPath.map(x => x.prototype));
    }
    exports.getTransition = getTransition;
    async function executeTransition(sm, tr) {
        const exitLen = tr.exitList.length;
        for (let i = 0; i < exitLen; ++i) {
            let stateProto = tr.exitList[i].prototype;
            if (Object.prototype.hasOwnProperty.call(stateProto, '_exit')) {
                let res = stateProto._exit.call(sm);
                if (Object.isPrototypeOf.call(sm, Promise)) {
                    res = await res;
                }
                sm.logTrace(`exit ${tr.exitList[i].name}`);
            }
            else {
                console.log(`exit ${tr.exitList[i].name} [unimplemented]`);
            }
        }
        const entryLen = tr.entryList.length;
        let lastState = sm.currentState;
        for (let i = 0; i < entryLen; ++i) {
            lastState = tr.entryList[i];
            let stateProto = lastState.prototype;
            if (Object.prototype.hasOwnProperty.call(stateProto, '_entry')) {
                let res = stateProto._entry.call(sm);
                if (Object.isPrototypeOf.call(sm, Promise)) {
                    res = await res;
                }
                sm.logTrace(`exit ${tr.exitList[i].name}`);
            }
            else {
                console.log(`enter ${tr.entryList[i].name} [unimplemented]`);
            }
        }
        sm.currentState = lastState;
    }
    async function dispatch(hsm, signalName, payload) {
        hsm.logTrace(`Begin dispatch: #${signalName}`);
        ++hsm.indent;
        try {
            let messageHandler = hsm.currentState.prototype[signalName];
            if (!messageHandler) {
                throw {
                    errorType: 'UnknownMessage',
                    errorLevel: 'Application Error',
                    errorMessage: `Cannot handle the #${signalName} message`,
                    actorType: `${hsm.name}`,
                    currentState: `${hsm.currentState.name}`,
                    toString: function () {
                        return this.errorType + ': ' + this.errorMessage;
                    },
                };
            }
            let result = messageHandler.call(hsm, payload);
            let output = undefined;
            if (result instanceof Promise) {
                output = await result;
            }
            if (hsm.nextState != null) {
                const destState = hsm.nextState;
                hsm.logTrace(`Begin Transition to: ${destState.name}`);
                const srcName = hsm.currentState.name;
                const destName = destState.name;
                let tr = hsm.transitionCache.get([srcName, destName]);
                if (!tr) {
                    tr = getTransition(hsm.currentState, destState);
                    hsm.transitionCache.set([srcName, destName], tr);
                }
                await executeTransition(hsm, tr);
                hsm.nextState = undefined;
                hsm.logTrace('End execute Transition');
            }
            if (output !== undefined) {
                return output[0];
            }
        }
        finally {
            --hsm.indent;
            hsm.logTrace('End Dispatch');
        }
    }
    function createAsyncSendProtocol(hsm, topState) {
        const sendProtocolHandler = {
            get: function (object, signalName) {
                if (signalName in object) {
                    return object[signalName];
                }
                else {
                    function messageSender(...payload) {
                    }
                    object[signalName] = messageSender;
                    return messageSender;
                }
            }
        };
        return new Proxy({}, sendProtocolHandler);
    }
    function createSendProtocol(hsm, topState) {
        const sendProtocolHandler = {
            get: function (object, signalName) {
                if (signalName in object) {
                    return object[signalName];
                }
                else {
                    function messageSender(...payload) {
                    }
                    object[signalName] = messageSender;
                    return messageSender;
                }
            }
        };
        return new Proxy({}, sendProtocolHandler);
    }
});
//# sourceMappingURL=index.js.map