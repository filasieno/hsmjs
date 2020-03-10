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
 *     class TopState extends ihsm.IState {
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
 * Defines a State.
 */
export interface StateConstructor<TopState extends State<TopState, UserData>, UserData> {
    new(): State<TopState, UserData>;
    prototype: any;
    initialState?: StateConstructor<TopState, UserData>;
    exceptionState?: StateConstructor<TopState, UserData>;
    isInitialState?: boolean;
}

/**
 * Defines a State.
 */
export interface TopStateConstructor<TopState extends State<TopState, UserData>, UserData> extends StateConstructor<TopState, UserData> {
    new(): TopState;
}

/**
 * Any JS Object that does not have a property named *__hsm__* con be converted to a hierarchical state machine.
 *
 * The only requirement is that the field {@link UserDataEx.__hsm__} is not present in the object.
 *
 */
export type UserDataEx<TopState extends State<TopState, UserData>, UserData> =
    UserData
    & { __hsm__: IHsm<TopState, UserData>; };

export type StateMachineDefinition<TopState extends State<TopState, UserData>, UserData> = { State: TopStateConstructor<TopState, UserData> };
export type MessageSender<MessageHandler> = MessageHandler extends (...payload: any[]) => void | Promise<any> ? (...payload: any[]) => void : never;
export type AsyncMessageSender<MessageHandler> = MessageHandler extends (...payload: any[]) => infer C ? C extends void ? (...payload: any[]) => Promise<void> : C extends Promise<infer RT> ? (...payload: any[]) => Promise<RT> : never : never;
export type SendProtocol<TopState extends State<TopState, UserData>, UserData> = { [P in keyof TopState]: MessageSender<TopState[P]> };
export type AsyncSendProtocol<TopState extends State<TopState, UserData>, UserData> = { [P in keyof TopState]: AsyncMessageSender<TopState[P]> };

export interface IBaseHsm<TopState extends State<TopState, UserData>, UserData> {
    logLevel: LogLevel;
    name: string;
    readonly typeName: string;
    readonly currentState: StateConstructor<TopState, UserData>;
    readonly topState: StateConstructor<TopState, UserData>;
}

export interface IHsm<TopState extends State<TopState, UserData>, UserData> extends IBaseHsm<TopState, UserData> {
    readonly ctx: UserDataEx<TopState, UserData>;
    readonly send: SendProtocol<TopState, UserData>;
    readonly asyncSend: AsyncSendProtocol<TopState, UserData>;
}

export interface IHsmObject<TopState extends State<TopState, UserData>, UserData> extends IBaseHsm<TopState, UserData> {
    transition(nextState: StateConstructor<TopState, UserData>): void;
    unhandled(): never;
    logTrace(msg?: any, ...optionalParameters: any[]): void;
    logDebug(msg?: any, ...optionalParameters: any[]): void;
    logWarn(msg?: any, ...optionalParameters: any[]): void;
    logInfo(msg?: any, ...optionalParameters: any[]): void;
    logError(msg?: any, ...optionalParameters: any[]): void;
    logFatal(msg?: any, ...optionalParameters: any[]): void;
}

export abstract class BindTarget<TopState extends State<TopState, UserData>, UserData> {
    protected readonly ctx!: UserDataEx<TopState, UserData>;
    protected readonly hsm!: IHsmObject<TopState, UserData>;
    protected readonly send!: SendProtocol<TopState, UserData>;
}

export class State<TopState extends State<TopState, UserData>, UserData = { [k: string]: any }> extends BindTarget<TopState, UserData> {
    constructor() {
        super();
        throw new Error("State classes are stateless and cannot be instantiated"); // TODO: Manage Errors
    }
    _init(): Promise<void> | void {}
    _exit(): Promise<void> | void {}
    _entry(): Promise<void> | void {}
    onError(err: Error): Promise<void> {
        this.hsm.logError(err);
        throw err;
    }
}

/**
 *
 * @param {StateMachineDefinition<TopState, UserData>} def
 */
export function validate<TopState extends State<TopState, UserData>, UserData>(def: StateMachineDefinition<TopState, UserData>): void {
    throw new Error("Unimplemented");
}

/**
 *
 * @param {StateMachineDefinition<TopState, UserData>} def
 * @param {UserData} data
 * @param {LogLevel} logLevel
 * @returns {UserDataEx<TopState, UserData>}
 */
export function init<TopState extends State<TopState, UserData>, UserData>(def: StateMachineDefinition<TopState, UserData>, data: UserData, logLevel: LogLevel = LogLevel.INFO): UserDataEx<TopState, UserData> {
    if (def === undefined) {
        throw new Error('def must not be null'); // TODO:
    }
    if (!def.State) {
        throw new Error('def must have a State'); // TODO:
    }
    let hsm: Hsm<TopState, UserData>;
    try {
        hsm = new Hsm(def.State, data, logLevel === undefined ? defaultLogLevel : logLevel);
        (data as UserDataEx<TopState, UserData>).__hsm__ = hsm;
    } catch (ex) {
        throw new Error(`failed to set property __hsm__ on ${Object.getPrototypeOf(data).constructor.name}`); // TODO: Set Error
    }
    let currState: StateConstructor<TopState, UserData> = def.State;
    while (true) {
        if (Object.prototype.hasOwnProperty.call(currState.prototype, '_init')) {
            currState.prototype['_init'].call(hsm);
            hsm.logTrace(`${currState.name} init done`);
        } else {
            hsm.logTrace(`${currState.name} init [unimplemented]`);
        }
        if (currState.initialState !== undefined) {
            currState = currState.initialState;
            hsm.currentState = currState.initialState!;
        } else {
            break;
        }
    }
    return data as UserDataEx<TopState, UserData>;
}

/**
 *
 * @param {UserDataEx<TopState, UserData>} data
 * @returns {IHsm<TopState, UserData>}
 */
export function get<TopState extends State<TopState, UserData>, UserData>(data: UserDataEx<TopState, UserData>): IHsm<TopState, UserData> {
    return data.__hsm__;
}

/**
 * A utility function that initializes a user Object as a hierarchical state machine.
 *
 * @param {StateMachineDefinition<TopState, UserData>} def
 * @param {UserData} data
 * @param {LogLevel} logLevel
 * @returns {IHsm<TopState, UserData>}
 */
export function initHsm<TopState extends State<TopState, UserData>, UserData>(def: StateMachineDefinition<TopState, UserData>, data: UserData, logLevel: LogLevel = LogLevel.INFO): IHsm<TopState, UserData> {
    let dataEx = init(def, data, logLevel);
    return get(dataEx);
}

/**
 *
 * @param {LooseObject} state
 */
export function initialState<TopState extends State<TopState, UserData>, UserData>(state: LooseObject): void {
    if (state.isInitialState) {
        return;
    }
    state.isInitialState = true;
    let parent: LooseObject = Object.getPrototypeOf(state) as LooseObject;
    if (parent.initialState === State) {
        throw new Error(`Cannot assign an initial state to the Top State (as it inherits from ihsm.State)`); //TODO:
    }
    if (!parent.initialState) {
        state.isInitialState = true;
        parent.initialState = state;
    } else {
        throw new Error(`already assigned initial state for: ${parent.name}`); //TODO:
    }
}

/**
 *
 * @param {{new(): UserState}} state
 */
export function errorState<UserState extends TopState, TopState extends State<TopState, UserData>, UserData>(state: new () => UserState): void {
    throw new Error("Unimplemented"); //TODO:
}

/**
 *
 */
interface OpenBindTarget<TopState extends State<TopState, UserData>, UserData> {
    ctx: UserDataEx<TopState, UserData>;
    hsm: IHsmObject<TopState, UserData>;
    send: SendProtocol<TopState, UserData>;
}

interface IInternalHsmTopState<TopState extends State<TopState, UserData>, UserData> extends IHsm<TopState, UserData> {
    clearTransition(): void;
}

class Transition<TopState extends State<TopState, UserData>, UserData> {

    readonly exitList: Array<StateConstructor<TopState, UserData>>;
    readonly entryList: Array<StateConstructor<TopState, UserData>>;
    readonly exitPrototypeList: Array<any>;
    readonly entryPrototypeList: Array<any>;

    constructor(exitList: Array<StateConstructor<TopState, UserData>>, entryList: Array<StateConstructor<TopState, UserData>>, exitPrototypeList: Array<any>, entryPrototypeList: Array<any>) {
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

class Hsm<TopState extends State<TopState, UserData>, UserData> implements IInternalHsmTopState<TopState, UserData>, IHsmObject<TopState, UserData>, OpenBindTarget<TopState, UserData> {
    hsm: IHsmObject<TopState, UserData>;
    ctx: UserDataEx<TopState, UserData>;
    send: SendProtocol<TopState, UserData>;
    asyncSend: AsyncSendProtocol<TopState, UserData>;
    topState: StateConstructor<TopState, UserData>;
    currentState: StateConstructor<TopState, UserData>;
    typeName: string;
    name: string;
    logLevel: LogLevel;
    nextState?: StateConstructor<TopState, UserData>;
    transitionCache: Map<[string, string], Transition<TopState, UserData>>;
    log: (message?: string, ...optionalParameters: any[]) => void;
    queue: TaskQueue;
    indent: number;

    constructor(topState: TopStateConstructor<TopState, UserData>, userData: UserData, logLevel: LogLevel) {
        this.hsm = this as unknown as IHsmObject<TopState, UserData>;
        this.ctx = (userData as UserDataEx<TopState, UserData>); //Mark user data
        this.ctx.__hsm__ = this; // set link to the HSM
        this.send = createSendProtocol(this, topState);
        this.asyncSend = createAsyncSendProtocol(this, topState);
        this.topState = topState;
        this.currentState = topState;
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

    transition(nextState: new() => State<TopState, UserData>): void {
        if (nextState === undefined) {
            throw new Error("Cannot transition to undefined"); // TODO:
        }
        this.nextState = nextState;
    }

    unhandled(): never {
        throw new Error("Unhandled method"); // TODO:
    }

    logTrace(msg?: any, ...optionalParameters: any[]): void { if (this.logLevel >= LogLevel.TRACE) { this.log(msg, ...optionalParameters) } }
    logDebug(msg?: any, ...optionalParameters: any[]): void { if (this.logLevel >= LogLevel.DEBUG) { this.log(msg, ...optionalParameters) } }
    logWarn(msg?: any, ...optionalParameters: any[]): void { if (this.logLevel >= LogLevel.WARN) { this.log(msg, ...optionalParameters) } }
    logInfo(msg?: any, ...optionalParameters: any[]): void { if (this.logLevel >= LogLevel.INFO) { this.log(msg, ...optionalParameters) } }
    logError(msg?: any, ...optionalParameters: any[]): void { if (this.logLevel >= LogLevel.ERROR) { this.log(msg, ...optionalParameters) } }
    logFatal(msg?: any, ...optionalParameters: any[]): void { this.log(msg, ...optionalParameters) }
}

export function getTransition<TopState extends State<TopState, UserData>, UserData>(srcState: StateConstructor<TopState, UserData>, destState: StateConstructor<TopState, UserData>): Transition<TopState, UserData> {
    let src: any = srcState;
    let dst: any = destState;
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

    return new Transition<TopState, UserData>(srcPath, srcPath, srcPath.map(x => x.prototype), dstPath.map(x => x.prototype));
}


async function executeTransition<TopState extends State<TopState, UserData>, UserData>(sm: Hsm<TopState, UserData>, tr: Transition<TopState, UserData>) {
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
            sm.logTrace(`exit ${tr.exitList[i].name}`); //TODO:
        } else {
            console.log(`enter ${tr.entryList[i].name} [unimplemented]`);
        }
    }
    sm.currentState = lastState;
}

async function dispatch<TopState extends State<TopState, UserData>, UserData>(hsm: Hsm<TopState, UserData>, signalName: string, payload: any[]) {
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

        let result = messageHandler.call(hsm, payload);

        // In case of a Promise wait for the actual result
        let output = undefined;
        if (result instanceof Promise) {
            output = await result;
        }

        if (hsm.nextState != null) {
            const destState = hsm.nextState;
            // Begin Transition
            hsm.logTrace(`Begin Transition to: ${destState.name}`);
            const srcName: string = hsm.currentState.name;
            const destName: string = destState.name;
            let tr: Transition<TopState, UserData> | undefined = hsm.transitionCache.get([srcName, destName]);
            if (!tr) {
                tr = getTransition(hsm.currentState, destState);
                hsm.transitionCache.set([srcName, destName], tr);
            }
            await executeTransition(hsm, tr);
            hsm.nextState = undefined;
            hsm.logTrace('End execute Transition');
            // End Transition
        }

        if (output !== undefined) {
            return output[0];
        }

    } finally {
        --hsm.indent;
        hsm.logTrace('End Dispatch');
    }
}

///////////////////////////////////////////////////////////////////////////////
// Message Send Protocol
///////////////////////////////////////////////////////////////////////////////

interface LooseObject {[key: string]: any}

function createAsyncSendProtocol<TopState extends State<TopState, UserData>, UserData>(hsm: Hsm<TopState, UserData>, topState: StateConstructor<TopState, UserData>): AsyncSendProtocol<TopState, UserData> {
    const sendProtocolHandler = {
        get: function (object: LooseObject, signalName: string) {
            if (signalName in object) {
                return object[signalName];
            } else {
                function messageSender(...payload: any): void {
                    // hsm.queue.enqueue(dispatch<TopState, UserData>(hsm, signalName, payload));
                    // create async task
                    // enqueue
                }
                object[signalName] = messageSender;
                return messageSender;
            }
        }
    };
    return new Proxy({}, sendProtocolHandler) as unknown as AsyncSendProtocol<TopState, UserData>;
}

function createSendProtocol<TopState extends State<TopState, UserData>, UserData>(hsm: Hsm<TopState, UserData>, topState: StateConstructor<TopState, UserData>): SendProtocol<TopState, UserData> {
    const sendProtocolHandler = {
        get: function (object: LooseObject, signalName: string) {
            if (signalName in object) {
                return object[signalName];
            } else {
                function messageSender(...payload: any): void {
                    // hsm.queue.enqueue(dispatch<TopState, UserData>(hsm, signalName, payload));
                    // create sync task
                    // enqueue
                }
                object[signalName] = messageSender;
                return messageSender;
            }
        }
    };
    return new Proxy({}, sendProtocolHandler) as unknown as SendProtocol<TopState, UserData>;
}
