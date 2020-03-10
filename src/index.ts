// Type definitions for ihsm 1.0.0
// Project: ihsm - Idiomatic Hierarchical State Machine - <https://github.com/filasieno/ihsm>
// Definitions by: Fabio N. Filasieno <https://github.com/filasieno/ihsm>
// TypeScript Version: 3.8

/**
 * import * as ihsm from "ihsm";
 *
 * The minimal state machine:
 *
 * ```typescript
 * namespace StateMachine {
 *     class topState extends ihsm.IState {
 *         sayHello() { console.log("Hello World"); }
 *     };
 * }
 * let obj = { ... }; // add some fields
 * ihsm.init(obj);
 *
 * ```
 */


import { createTaskQueue, TaskQueue } from "./taskqueue";

/**
 * Levels used for identifying the severity of an event.
 *
 * Levels are organized from most specific to least:
 *   - OFF: (most specific, no logging)
 *   - FATAL: (most specific, little data)
 *   - ERROR
 *   - WARN
 *   - INFO
 *   - DEBUG
 *   - TRACE (least specific, a lot of data)
 *   - ALL (least specific, all data)
 *
 * Typically, configuring a level in a filter or on a logger will cause logging events of that level
 * and those that are more specific to pass through the filter.
 *
 * A special level, ALL, is guaranteed to capture all levels when used in logging configurations.
 */
export const enum LogLevel {
    ALL = 0, TRACE = 20, DEBUG = 30, INFO = 30, WARN = 40, ERROR = 50, FATAL = 60, OFF = 70
}

export let defaultLogLevel: LogLevel = LogLevel.INFO;

/**
 * Defines a State Class.
 */
export type StateConstructor<UserTopState extends State<UserTopState, UserData>, UserData> = Function & {
    initialState?: StateConstructor<UserTopState, UserData>; exceptionState?: StateConstructor<UserTopState, UserData>; isInitialState?: boolean; prototype: State<UserTopState, UserData>;
};

/**
 * Defines tge State class..
 */
export type TopStateConstructor<UserTopState extends State<UserTopState, UserData>, UserData> = Function & {
    initialState?: StateConstructor<UserTopState, UserData>; exceptionState?: StateConstructor<UserTopState, UserData>; isInitialState?: boolean; prototype: UserTopState;
};

/**
 * Any JS Object that does not have a property named *__hsm__* con be converted to a hierarchical state machine.
 *
 * The only requirement is that the field {@link UserDataEx.__hsm__} is not present in the object.
 *
 */
export type UserDataEx<UserTopState extends State<UserTopState, UserData>, UserData> =
    UserData
    & { __hsm__: IHsm<UserTopState, UserData>; };

export type StateMachineDefinition<UserTopState extends State<UserTopState, UserData>, UserData> = { TopState: TopStateConstructor<UserTopState, UserData> };
export type MessageSender<MessageHandler> = MessageHandler extends (...payload: any[]) => void | Promise<any> ? (...payload: any[]) => void : never;
export type AsyncMessageSender<MessageHandler> = MessageHandler extends (...payload: any[]) => infer C ? C extends void ? (...payload: any[]) => Promise<void> : C extends Promise<infer RT> ? (...payload: any[]) => Promise<RT> : never : never;
export type SendProtocol<UserTopState extends State<UserTopState, UserData>, UserData> = { [P in keyof UserTopState]: MessageSender<UserTopState[P]> };
export type AsyncSendProtocol<UserTopState extends State<UserTopState, UserData>, UserData> = { [P in keyof UserTopState]: AsyncMessageSender<UserTopState[P]> };

export interface IBaseHsm<UserTopState extends State<UserTopState, UserData>, UserData> {
    logLevel: LogLevel;
    name: string;
    readonly typeName: string;
    readonly currentState: StateConstructor<UserTopState, UserData>;
    readonly topState: StateConstructor<UserTopState, UserData>;
}

export interface IHsm<UserTopState extends State<UserTopState, UserData>, UserData> extends IBaseHsm<UserTopState, UserData> {
    readonly ctx: UserDataEx<UserTopState, UserData>;
    readonly send: SendProtocol<UserTopState, UserData>;
    readonly asyncSend: AsyncSendProtocol<UserTopState, UserData>;
    readonly queue: TaskQueue;
}

export interface IHsmObject<UserTopState extends State<UserTopState, UserData>, UserData> extends IBaseHsm<UserTopState, UserData> {
    transition(nextState: StateConstructor<UserTopState, UserData>): void;
    unhandled(): never;
    logTrace(msg?: any, ...optionalParameters: any[]): void;
    logDebug(msg?: any, ...optionalParameters: any[]): void;
    logWarn(msg?: any, ...optionalParameters: any[]): void;
    logInfo(msg?: any, ...optionalParameters: any[]): void;
    logError(msg?: any, ...optionalParameters: any[]): void;
    logFatal(msg?: any, ...optionalParameters: any[]): void;
}

export abstract class BindTarget<UserTopState extends State<UserTopState, UserData>, UserData> {
    protected readonly ctx!: UserDataEx<UserTopState, UserData>;
    protected readonly hsm!: IHsmObject<UserTopState, UserData>;
    protected readonly send!: SendProtocol<UserTopState, UserData>;
}

export class State<UserTopState extends State<UserTopState, UserData>, UserData = { [k: string]: any }> extends BindTarget<UserTopState, UserData> {
    constructor() {
        super();
        throw new Error("State classes are stateless and cannot be instantiated"); // TODO: Manage Errors
    }
    _init(): Promise<void> | void {}
    _exit(): Promise<void> | void {}
    _entry(): Promise<void> | void {}
    onError(err: Error): Promise<void> | void {
        this.hsm.logError(err);
    }
}


/**
 *
 * @param {StateMachineDefinition<UserTopState, UserData>} def
 */
export function validate<UserTopState extends State<UserTopState, UserData>, UserData>(def: StateMachineDefinition<UserTopState, UserData>): void {
    throw new Error("Unimplemented");
}

/**
 *
 * @param {StateMachineDefinition<UserTopState, UserData>} def
 * @param {UserData} data
 * @param {LogLevel} logLevel
 * @returns {UserDataEx<UserTopState, UserData>}
 */
export function init<UserTopState extends State<UserTopState, UserData>, UserData>(def: StateMachineDefinition<UserTopState, UserData>, data: UserData, logLevel: LogLevel = LogLevel.INFO): UserDataEx<UserTopState, UserData> {
    if (def === undefined) {
        throw new Error('def must not be null'); // TODO:
    }
    if (!def.TopState) {
        throw new Error('def must have a State'); // TODO:
    }
    let hsm: Hsm<UserTopState, UserData>;
    try {
        hsm = new Hsm(def.TopState, data, logLevel === undefined ? defaultLogLevel : logLevel);
        (data as UserDataEx<UserTopState, UserData>).__hsm__ = hsm;
    } catch (ex) {
        throw new Error(`failed to set property __hsm__ on ${Object.getPrototypeOf(data).constructor.name}`); // TODO: Set Error
    }
    let currState: StateConstructor<UserTopState, UserData> = def.TopState;
    while (true) {
        if (Object.prototype.hasOwnProperty.call(currState.prototype, '_init')) {
            currState.prototype['_init'].call(hsm);
            hsm.logTrace(`${currState.name} init done`);
        } else {
            hsm.logTrace(`${currState.name} init [unimplemented]`);
        }

        console.log(currState);


        if (Object.prototype.hasOwnProperty.call(currState, 'initialState') && currState.initialState) {
            currState = currState.initialState;
            hsm.currentState = currState!;
        } else {
            break;
        }
    }
    return data as UserDataEx<UserTopState, UserData>;
}

/**
 *
 * @param {UserDataEx<UserTopState, UserData>} data
 * @returns {IHsm<UserTopState, UserData>}
 */
export function get<UserTopState extends State<UserTopState, UserData>, UserData>(data: UserDataEx<UserTopState, UserData>): IHsm<UserTopState, UserData> {
    return data.__hsm__;
}

/**
 * A utility function that initializes a user Object as a hierarchical state machine.
 *
 * @param {StateMachineDefinition<UserTopState, UserData>} def
 * @param {UserData} data
 * @param {LogLevel} logLevel
 * @returns {IHsm<UserTopState, UserData>}
 */
export function initHsm<UserTopState extends State<UserTopState, UserData>, UserData>(def: StateMachineDefinition<UserTopState, UserData>, data: UserData, logLevel: LogLevel = LogLevel.INFO): IHsm<UserTopState, UserData> {
    let dataEx = init(def, data, logLevel);
    return get(dataEx);
}

/**
 *
 * @param {StateConstructor<UserTopState, UserData>} TargetState
 */
export function initialState<UserTopState extends State<UserTopState, UserData>, UserData>(TargetState: StateConstructor<UserTopState, UserData>): void {
    let ParentOfTargetState = Object.getPrototypeOf(TargetState.prototype).constructor;
    if (ParentOfTargetState.initialState) {
        throw new Error(`@ihsm.initialState has been set twice for parent class "${ParentOfTargetState.name}"; check all classes that extend "${ParentOfTargetState.name}"`); //TODO: move to errors
    }
    // if (Object.prototype.hasOwnProperty.call(State// , 'isInitial') && State['isInitial'] !== undefined) {
    //     throw new Error(`@ihsm.initialState has been set twice for target class: ${State.__proto__.name}`); //TODO: move to errors
    // }
    TargetState.isInitialState = true;
    ParentOfTargetState.initialState = TargetState;
}

/**
 *
 * @param {{new(): UserState}} state
 */
export function errorState<UserState extends UserTopState, UserTopState extends State<UserTopState, UserData>, UserData>(state: new () => UserState): void {
    throw new Error("Unimplemented"); //TODO:
}

/**
 *
 */
interface OpenBindTarget<UserTopState extends State<UserTopState, UserData>, UserData> {
    ctx: UserDataEx<UserTopState, UserData>;
    hsm: IHsmObject<UserTopState, UserData>;
    send: SendProtocol<UserTopState, UserData>;
}

interface IInternalHsmUserTopState<UserTopState extends State<UserTopState, UserData>, UserData> extends IHsm<UserTopState, UserData> {
    clearTransition(): void;
}

class Transition<UserTopState extends State<UserTopState, UserData>, UserData> {

    readonly exitList: Array<StateConstructor<UserTopState, UserData>>;
    readonly entryList: Array<StateConstructor<UserTopState, UserData>>;
    readonly exitPrototypeList: Array<any>;
    readonly entryPrototypeList: Array<any>;

    constructor(exitList: Array<StateConstructor<UserTopState, UserData>>, entryList: Array<StateConstructor<UserTopState, UserData>>, exitPrototypeList: Array<any>, entryPrototypeList: Array<any>) {
        this.exitList = exitList;
        this.entryList = entryList;
        this.exitPrototypeList = exitPrototypeList;
        this.entryPrototypeList = entryPrototypeList;
    }

    * getTransitionActions() {
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

class Hsm<UserTopState extends State<UserTopState, UserData>, UserData> implements IInternalHsmUserTopState<UserTopState, UserData>, IHsmObject<UserTopState, UserData>, OpenBindTarget<UserTopState, UserData> {
    hsm: IHsmObject<UserTopState, UserData>;
    ctx: UserDataEx<UserTopState, UserData>;
    send: SendProtocol<UserTopState, UserData>;
    asyncSend: AsyncSendProtocol<UserTopState, UserData>;
    topState: StateConstructor<UserTopState, UserData>;
    currentState: StateConstructor<UserTopState, UserData>;
    typeName: string;
    name: string;
    logLevel: LogLevel;
    nextState?: StateConstructor<UserTopState, UserData>;
    transitionCache: Map<[StateConstructor<UserTopState, UserData>, StateConstructor<UserTopState, UserData>], Transition<UserTopState, UserData>>;
    log: (message?: string, ...optionalParameters: any[]) => void;
    queue: TaskQueue;
    indent: number;

    constructor(UserTopState: TopStateConstructor<UserTopState, UserData>, userData: UserData, logLevel: LogLevel) {
        this.hsm = this as unknown as IHsmObject<UserTopState, UserData>;
        this.ctx = (userData as UserDataEx<UserTopState, UserData>); //Mark user data
        this.ctx.__hsm__ = this; // set link to the HSM
        this.send = createSendProtocol(this);
        this.asyncSend = createAsyncSendProtocol(this);
        this.topState = UserTopState;
        this.currentState = UserTopState;
        this.typeName = Object.getPrototypeOf(userData).constructor.name;
        this.name = this.typeName;
        this.logLevel = logLevel;
        this.log = console.log;
        this.transitionCache = new Map();
        this.queue = createTaskQueue();
        this.indent = 0;
    }

    clearTransition(): void {
        this.nextState = undefined;
    }

    transition(nextState: new() => State<UserTopState, UserData>): void {
        if (nextState === undefined) {
            throw new Error("Cannot transition to undefined"); // TODO:
        }
        this.nextState = nextState;
    }

    unhandled(): never {
        throw new Error("Unhandled method"); // TODO:
    }

    logTrace(msg?: any, ...optionalParameters: any[]): void { if (this.logLevel <= LogLevel.TRACE) { this.log(msg, ...optionalParameters) } }
    logDebug(msg?: any, ...optionalParameters: any[]): void { if (this.logLevel <= LogLevel.DEBUG) { this.log(msg, ...optionalParameters) } }
    logWarn(msg?: any, ...optionalParameters: any[]): void { if (this.logLevel <= LogLevel.WARN) { this.log(msg, ...optionalParameters) } }
    logInfo(msg?: any, ...optionalParameters: any[]): void { if (this.logLevel <= LogLevel.INFO) { this.log(msg, ...optionalParameters) } }
    logError(msg?: any, ...optionalParameters: any[]): void { if (this.logLevel <= LogLevel.ERROR) { this.log(msg, ...optionalParameters) } }
    logFatal(msg?: any, ...optionalParameters: any[]): void { this.log(msg, ...optionalParameters) }
}

export function getTransition<UserTopState extends State<UserTopState, UserData>, UserData>(srcState: StateConstructor<UserTopState, UserData>, destState: StateConstructor<UserTopState, UserData>, topState: StateConstructor<UserTopState, UserData>): Transition<UserTopState, UserData> {
    let src: any = srcState;
    let dst: any = destState;
    let srcPath = [];
    const end = topState;
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

    return new Transition<UserTopState, UserData>(srcPath, dstPath, srcPath.map(x => x.prototype), dstPath.map(x => x.prototype));
}


async function executeTransition<UserTopState extends State<UserTopState, UserData>, UserData>(sm: Hsm<UserTopState, UserData>, tr: Transition<UserTopState, UserData>) {
    const exitLen = tr.exitList.length;
    for (let i = 0; i < exitLen; ++i) {
        let stateProto = tr.exitList[i].prototype;
        if (Object.prototype.hasOwnProperty.call(stateProto, '_exit')) {
            let res = stateProto._exit.call(sm);
            if (Object.isPrototypeOf.call(sm, Promise)) {
                res = await res;
            }
            sm.logTrace(`exit ${tr.exitList[i].name}`); //TODO:
        } else {
            console.log(`exit ${tr.exitList[i].name} [unimplemented]`); //TODO:
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
            sm.logTrace(`enter ${tr.entryList[i].name}`); //TODO:
        } else {
            console.log(`enter ${tr.entryList[i].name} [unimplemented]`);
        }
    }
    sm.currentState = lastState;
}

async function dispatch<UserTopState extends State<UserTopState, UserData>, UserData>(hsm: Hsm<UserTopState, UserData>, signalName: string, ...payload: any[]) {
    hsm.logTrace(`Begin dispatch: #${signalName}`);
    ++hsm.indent;
    try {
        // Execute the Method lookup

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

        let result = messageHandler.call(hsm, ...payload);

        // In case of a Promise wait for the actual result
        let output = undefined;
        if (result instanceof Promise) {
            output = await result;
        }

        if (hsm.nextState != null) {
            const destState = hsm.nextState;
            // Begin Transition
            hsm.logTrace(`Begin Transition from '${hsm.currentState.name}' to '${destState.name}'`);
            let tr: Transition<UserTopState, UserData> | undefined = hsm.transitionCache.get([hsm.currentState, destState]);
            if (!tr) {
                tr = getTransition(hsm.currentState, destState, hsm.topState);
                hsm.transitionCache.set([hsm.currentState, destState], tr);
            }
            await executeTransition(hsm, tr);
            hsm.nextState = undefined;
            hsm.logTrace(`End Transition in '${hsm.currentState.name}'`);
            // End Transition
        }

        if (output !== undefined) {
            return output;
        } else {
            return undefined;
        }

    } finally {
        --hsm.indent;
        hsm.logTrace('End Dispatch');
    }
}

///////////////////////////////////////////////////////////////////////////////
// Message Send Protocol
///////////////////////////////////////////////////////////////////////////////
//
// Public send API
//
//function send(userDataEx, signal, ...payload) {
//    userDataEx.__state__.queue.push(createPostTask(userDataEx.__state__, signal.name, payload));
//}
//
//exports.send = send;
//
//function asyncSend(userDataEx, signal, ...payload) {
//    return new Promise(function(resolve, reject) {
//        userDataEx.__state__.queue.push(createSendTask(userDataEx.__state__, signal.name, payload, resolve, reject));
//    });
//}
//
//function createSendTask(sm, signalName, payload, resolve, reject) {
//    return function(doneCallback) {
//        dispatch(sm, signalName, payload)
//            .then(function(result) {resolve(result);})
//            .catch(function(err) {reject(err);})
//            .finally(function() {
//                doneCallback();
//            });
//    };
//}
//
//function createPostTask(sm, signalName, payload) {
//    return function(doneCallback) {
//        dispatch(sm, signalName, payload)
//            .catch(function(err) {
//                console.log(`${err}`);
//                throw err;
//                // createPostTask(sm, '_error', err);
//            })
//            .finally(function() {
//                doneCallback();
//            });
//    };
//}

interface LooseObject {[key: string]: any}


function createAsyncTask<UserTopState extends State<UserTopState, UserData>, UserData, ReturnType>(hsm: Hsm<UserTopState, UserData>, resolve: (value: ReturnType) => void, reject: (value: Error) => void, signalName: string, ...payload: any[]): (doneCallback: () => void) => void {
    return function (doneCallback: () => void) {
        dispatch(hsm, signalName, ...payload)
            .then(function (result) {resolve(result);})
            .catch(function (err) {reject(err);})
            .finally(function () {
                doneCallback();
            });
    };
}

function createSyncTask<UserTopState extends State<UserTopState, UserData>, UserData>(hsm: Hsm<UserTopState, UserData>, signalName: string, ...payload: any[]): (doneCallback: () => void) => void {
    return function (doneCallback: () => void): void {
        dispatch(hsm, signalName, ...payload)
            .catch(function (err) {
                hsm.logError(err);
                hsm.queue.push(createSyncTask(hsm, 'onError', err));
            })
            .finally(function () {
                doneCallback();
            });
    };
}

function createAsyncSendProtocol<UserTopState extends State<UserTopState, UserData>, UserData>(hsm: Hsm<UserTopState, UserData>): AsyncSendProtocol<UserTopState, UserData> {
    const asyncSendProtocolHandler = {
        get: function (object: LooseObject, signalName: string) {
            if (signalName in object) {
                return object[signalName];
            }

            function messageSender<T>(...payload: any[]): Promise<T> {
                return new Promise<T>(function (resolve: (value: T) => void, reject: (value: Error) => void) {
                    hsm.queue.push(createAsyncTask(hsm, resolve, reject, signalName, ...payload));
                });
            }

            object[signalName] = messageSender;
            return messageSender;
        }
    };
    return new Proxy({}, asyncSendProtocolHandler) as unknown as AsyncSendProtocol<UserTopState, UserData>;
}

function createSendProtocol<UserTopState extends State<UserTopState, UserData>, UserData>(hsm: Hsm<UserTopState, UserData>): SendProtocol<UserTopState, UserData> {
    const sendProtocolHandler = {
        get: function (object: LooseObject, signalName: string) {
            if (signalName in object) {
                return object[signalName];
            }

            function messageSender(...payload: any[]): void {
                let task: (doneCallback: () => void) => void = createSyncTask(hsm, signalName, ...payload);
                hsm.queue.push(task);
            }

            object[signalName] = messageSender;
            return messageSender;

        }
    };
    return new Proxy({}, sendProtocolHandler) as unknown as SendProtocol<UserTopState, UserData>;
}
