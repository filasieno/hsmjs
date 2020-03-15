////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
//
//
//
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Exported Types
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


export type EventHandlerSignal<Protocol extends { [key: string]: any} | undefined, Signal extends keyof Protocol> = Protocol extends undefined ? string : Signal;
export type EventHandlerPayload<Protocol extends { [key: string]: any} | undefined, Signal extends keyof Protocol> = Protocol extends undefined ? any[] : Protocol[Signal] extends (...payload: infer Payload) => any ? Payload : never;
export type EventHandlerReturnType<Protocol extends { [key: string]: any} | undefined, Signal extends keyof Protocol> = Protocol extends undefined ? any
    : Protocol[Signal] extends (...payload: any[]) => infer ReturnType ? ReturnType extends Promise<infer Value> ? Value
        : ReturnType : never;

/**
 * StateConstructor
 */
export type StateConstructor<UserData, Protocol extends { [key: string]: any} | undefined> = Function & {
    initialState?: StateConstructor<UserData, Protocol>;
    exceptionState?: StateConstructor<UserData, Protocol>;
    isInitialState?: boolean;
    prototype: IState<UserData, Protocol>;
};

// Conditional Types: Type extends TestType ? TT : FT;

/**
 * Base Hsm
 */
export interface IBaseHsm<UserData, Protocol extends { [key: string]: any} | undefined> {
    logLevel: LogLevel;
    readonly name: string;
    readonly typeName: string;
    readonly currentState: StateConstructor<UserData, Protocol>;
    readonly topState: StateConstructor<UserData, Protocol>;
    post<Signal extends keyof Protocol>(signal: EventHandlerSignal<Protocol, Signal>, ...payload:EventHandlerPayload<Protocol, Signal>): void;
}

/**
 * IHsm
 */
export interface IHsm<UserData = { [key: string]: any }, Protocol extends { [key: string]: any} | undefined = undefined> extends IBaseHsm<UserData, Protocol> {
    /**
     * ctx
     */
    readonly ctx: UserData;

    send<Signal extends keyof Protocol>(signal: EventHandlerSignal<Protocol, Signal>, ...payload:EventHandlerPayload<Protocol, Signal>): Promise<EventHandlerReturnType<Protocol, Signal>>;
}

// TODO: Replace with Hooks ???
export interface IHsmDebug {
    // preTransition(ctx, from:State, to:State): void
    // postTransition(ctx, from:State, to:State): void
    // preInit(ctx, args, State): void
    // postInit(ctx, args, State): void
    // preStateEntry(ctx, State): void
    // postStateEntry(ctx, State): void
    // preStateExit(ctx, State): void
    // postStateExit(ctx, State): void
    // preDispatch(ctx, args): void
    // postDispatch(ctx, args, result, error): void

    logTrace(msg?: any, ...optionalParameters: any[]): void;
    logDebug(msg?: any, ...optionalParameters: any[]): void;
    logWarn(msg?: any, ...optionalParameters: any[]): void;
    logInfo(msg?: any, ...optionalParameters: any[]): void;
    logError(msg?: any, ...optionalParameters: any[]): void;
    logFatal(msg?: any, ...optionalParameters: any[]): void;
}

/**
 * IHsmHooks: ...
 */
export interface IHsmHooks<UserData, Protocol extends { [key: string]: any} | undefined> {
    preTransition(ctx: UserData, from: StateConstructor<UserData, Protocol>, to: StateConstructor<UserData, Protocol>): void;
    postTransition(ctx: UserData, from: StateConstructor<UserData, Protocol>, to:StateConstructor<UserData, Protocol>): void;
    preInit(ctx: UserData, args: any[], state: StateConstructor<UserData, Protocol>): void;
    postInit(ctx: UserData, args: any[], state: StateConstructor<UserData, Protocol>): void;
    preStateEntry(ctx: UserData, state: StateConstructor<UserData, Protocol>): void;
    postStateEntry(ctx: UserData, state: StateConstructor<UserData, Protocol>): void;
    preStateExit(ctx: UserData, state: StateConstructor<UserData, Protocol>): void;
    postStateExit(ctx: UserData, state: StateConstructor<UserData, Protocol>): void;
    preDispatch(ctx: UserData, state: StateConstructor<UserData, Protocol>): void;
    postDispatch(ctx: UserData, state: StateConstructor<UserData, Protocol>, result?: any, error?: Error): void;
}

/**
 * IBoundHsm: ...
 */
export interface IBoundHsm<UserData, Protocol extends { [key: string]: any} | undefined> extends IBaseHsm<UserData, Protocol>, IHsmDebug {

    /**
     * transition
     * @param {StateConstructor<UserData, Protocol>} nextState
     */
    transition(nextState: StateConstructor<UserData, Protocol>): void;

    /**
     *
     * @returns {never}
     */
    unhandled(): never;

    /**
     * wait ...
     * @param {number} millis
     * @returns {Promise<void>}
     */
    wait(millis: number): Promise<void>;
}

/**
 * IState
 */
export interface IState<UserData = { [key: string]: any }, Protocol extends { [key: string]: any} | undefined = undefined> {
    /**
     * user data
     */
    readonly ctx: UserData;
    /**
     * user data
     */
    readonly hsm: IBoundHsm<UserData, Protocol>;
    /**
     * init
     * @param {any[]} args
     */
    _init(...args: any[]): Promise<void> | void;
    /**
     * exit
     */
    _exit(): Promise<void> | void;
    /**
     * entry
     */
    _entry(): Promise<void> | void;
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Exported Values
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export enum LogLevel { ALL = 0, TRACE = 20, DEBUG = 30, INFO = 30, WARN = 40, ERROR = 50, FATAL = 60, OFF = 70 }

/**
 * State
 */
export class State<UserData = { [key: string]: any }, Protocol extends { [key: string]: any} | undefined = undefined> implements IState<UserData, Protocol> {
    readonly ctx!: UserData;
    readonly hsm!: IBoundHsm<UserData, Protocol>;
    _init(..._: any[]): Promise<void> | void {}
    _exit(): Promise<void> | void {}
    _entry(): Promise<void> | void {}
}

export function createObject(topState: StateConstructor<{ [key: string]: any }, undefined>, logLevel: LogLevel = LogLevel.INFO): IHsm<{ [key: string]: any }, undefined> {
    return create(topState, {}, logLevel);
}

export function create<UserData, Protocol>(topState: StateConstructor<UserData, Protocol>, userData: UserData, logLevel: LogLevel = LogLevel.INFO): IHsm<UserData, Protocol> {
    let hsm = new Hsm(topState, userData, logLevel);
    let currState: StateConstructor<UserData, Protocol> = topState;
    hsm.logTrace(`[${currState.name}] #_init`);
    while (true) {
        if (Object.prototype.hasOwnProperty.call(currState.prototype, '_init')) {
            currState.prototype['_init'].call(hsm, userData);
            hsm.logTrace(`    [${currState.name}] init`);
        } else {
            hsm.logTrace(`    [${currState.name}] init?`);
        }
        if (Object.prototype.hasOwnProperty.call(currState, 'initialState') && currState.initialState) {
            hsm.logTrace(`    [${currState.name}] initialState found in '${currState.name}'`);
            currState = currState.initialState;
            hsm.currentState = currState!;
        } else {
            break;
        }
    }
    return hsm;
}

/**
 *
 * @param {StateConstructor<UserData, Protocol>} topState
 * @param {LogLevel} logLevel
 * @param {string} fieldName
 * @returns {(constructor: {new(...args: any[]): any}) => {new(...args: any[]): any}}
 */
export function init<UserData, Protocol>(topState: StateConstructor<UserData, Protocol>, logLevel: LogLevel = LogLevel.INFO, fieldName = 'hsm'): (constructor: new (...args: any[]) => any) => (new (...args: any[]) => any) {
    return function (constructor: new (...args: any[]) => any): new (...args: any[]) => any {
        return class extends constructor {
            constructor(...args: any[]) {
                super(...args);
                let self: { [k: string]: any } = this;
                let hsm = new Hsm(topState, this as unknown as UserData, logLevel);
                Object.defineProperty(self, fieldName, {
                    get() { return hsm }, set(_) { throw new Error(`Field ${fieldName} is constant`) }
                });
                let currState: StateConstructor<UserData, Protocol> = topState;
                hsm.logTrace(`[${currState.name}] #_init`);
                ++hsm.indent;
                while (true) {

                    if (Object.prototype.hasOwnProperty.call(currState.prototype, '_init')) {
                        currState.prototype['_init'].call(hsm, ...args);
                        hsm.logTrace(`[${currState.name}] init`);
                    } else {
                        hsm.logTrace(`[${currState.name}] init?`);
                    }
                    if (Object.prototype.hasOwnProperty.call(currState, 'initialState') && currState.initialState) {
                        hsm.logTrace(`[${currState.name}] initial state is [${currState.initialState.name}]`);
                        currState = currState.initialState;
                        hsm.currentState = currState!;
                    } else {
                        break;
                    }
                }
                hsm.logTrace(`current state: [${currState.name}]`);
                --hsm.indent;
            }
        }
    }
}

/**
 *
 * @returns {(state: StateConstructor<UserData, Protocol>) => void}
 */
export function initialState<UserData, Protocol>(): (state: StateConstructor<UserData, Protocol>) => void {
    return function <UserData, Protocol>(TargetState: StateConstructor<UserData, Protocol>): void {
        let ParentOfTargetState = Object.getPrototypeOf(TargetState.prototype).constructor;
        if (ParentOfTargetState.initialState) {
            throw new Error(`@ihsm.initialState has been set twice for parent class "${ParentOfTargetState.name}"; check all classes that extend "${ParentOfTargetState.name}"`); //TODO: move to errors
        }
        TargetState.isInitialState = true;
        ParentOfTargetState.initialState = TargetState;
    }
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Private Types
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/** @internal */
type Task = (done: () => void) => void;

/** @internal */
interface IPrivateHsm<UserData, Protocol> extends IHsmDebug {
    indent: number;
    currentState: StateConstructor<UserData, Protocol>;
}

/** @internal */
interface ITransition<UserData, Protocol> {
    execute(hsm: IPrivateHsm<UserData, Protocol>): Promise<void>;
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Private Values
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/** @internal */
class DebugTransition<UserData, Protocol> implements ITransition<UserData, Protocol> {

    readonly exitList: Array<StateConstructor<UserData, Protocol>>;
    readonly entryList: Array<StateConstructor<UserData, Protocol>>;

    constructor(exitList: Array<StateConstructor<UserData, Protocol>>, entryList: Array<StateConstructor<UserData, Protocol>>) {
        this.exitList = exitList;
        this.entryList = entryList;
    }

    async execute(hsm: IPrivateHsm<UserData, Protocol>): Promise<void> {
        ++hsm.indent;
        const exitLen = this.exitList.length;
        for (let i = 0; i < exitLen; ++i) {
            let lastState = this.exitList[i].prototype;
            if (Object.prototype.hasOwnProperty.call(lastState, '_exit')) {
                let res = lastState._exit.call(hsm);
                if (Object.isPrototypeOf.call(hsm, Promise)) {
                    res = await res;
                }
                hsm.logTrace(`[${this.exitList[i].name}] exit`);
            } else {
                hsm.logTrace(`[${this.exitList[i].name}] exit?`);
            }

        }
        const entryLen = this.entryList.length;
        let lastState = hsm.currentState;
        for (let i = 0; i < entryLen; ++i) {
            lastState = this.entryList[i];

            let stateProto = lastState.prototype;
            if (Object.prototype.hasOwnProperty.call(stateProto, '_entry')) {
                let res = stateProto._entry.call(hsm);
                if (Object.isPrototypeOf.call(hsm, Promise)) {
                    res = await res;
                }
                hsm.logTrace(`[${this.entryList[i].name}] enter`);
            } else {
                hsm.logTrace(`[${this.entryList[i].name}] enter?`);
            }
        }
        hsm.currentState = lastState;
        --hsm.indent;
    }
}

/** @internal */
class Hsm<UserData, Protocol extends {[key: string]: any} | undefined> implements IBoundHsm<UserData, Protocol>, IHsm<UserData, Protocol>, IPrivateHsm<UserData, Protocol> {
    hsm: IBoundHsm<UserData, Protocol>;
    ctx: UserData;
    topState: StateConstructor<UserData, Protocol>;
    currentState: StateConstructor<UserData, Protocol>;
    typeName: string;
    name: string;
    logLevel: LogLevel;
    nextState?: StateConstructor<UserData, Protocol>;
    transitionCache: Map<[StateConstructor<UserData, Protocol>, StateConstructor<UserData, Protocol>], ITransition<UserData, Protocol>>;
    log: (message?: string, ...optionalParameters: any[]) => void;
    indent: number;
    jobs: Task[] = [];
    isRunning: boolean;

    constructor(UserTopState: StateConstructor<UserData, Protocol>, userData: UserData, logLevel: LogLevel) {
        this.hsm = <any>this;
        this.ctx = userData;
        this.topState = UserTopState;
        this.currentState = UserTopState;
        this.typeName = Object.getPrototypeOf(userData).constructor.name;
        this.name = this.typeName;
        this.logLevel = logLevel;
        this.log = console.log;
        this.transitionCache = new Map();
        this.jobs = [];
        this.isRunning = false;
        this.indent = 0;
    }

    post<Signal extends keyof Protocol>(signal: EventHandlerSignal<Protocol, Signal>, ...payload:EventHandlerPayload<Protocol, Signal>): void {
        this.pushTask(createSyncTask(this, signal, ...payload));
    }

    send<Signal extends keyof Protocol>(signal: EventHandlerSignal<Protocol, Signal>, ...payload:EventHandlerPayload<Protocol, Signal>): Promise<EventHandlerReturnType<Protocol, Signal>> {
        let self = this;
        return new Promise<EventHandlerReturnType<Protocol, Signal>>(function (resolve: (value: EventHandlerReturnType<Protocol, Signal> | undefined) => void, reject: (value: Error) => void) {
            self.pushTask(createAsyncTask(self, resolve, reject, signal, ...payload));
        });
    }

    transition(nextState: new () => IState<UserData, Protocol>): void {
        if (nextState === undefined) {
            throw new Error("Cannot transition to undefined"); // TODO:
        }
        this.nextState = nextState;
    }

    unhandled(): never {
        throw new Error("Unhandled method"); // TODO:
    }

    prepLine(msg: string, ...optionalParameters: any[]) {
        return `${this.typeName} | ${' '.repeat(this.indent * 4)}${msg}`
    }

    public logTrace(msg?: any, ...optionalParameters: any[]): void {
        if (this.logLevel <= LogLevel.TRACE) {
            if (typeof msg === "string") {
                this.log(this.prepLine(msg, optionalParameters));
            } else {
                this.log(msg);
            }
        }
    }

    public logDebug(msg?: any, ...optionalParameters: any[]): void {
        if (this.logLevel <= LogLevel.DEBUG) {
            if (typeof msg === "string") {
                this.log(this.prepLine(msg, optionalParameters));
            } else {
                this.log(msg);
            }
        }
    }

    public logWarn(msg?: any, ...optionalParameters: any[]): void {
        if (this.logLevel <= LogLevel.WARN) {
            if (typeof msg === "string") {
                this.log(this.prepLine(msg, optionalParameters));
            } else {
                this.log(msg);
            }
        }
    }

    public logInfo(msg?: any, ...optionalParameters: any[]): void {
        if (this.logLevel <= LogLevel.INFO) {
            if (typeof msg === "string") {
                this.log(this.prepLine(msg, optionalParameters));
            } else {
                this.log(msg);
            }
        }
    }

    public logError(msg?: any, ...optionalParameters: any[]): void {
        if (this.logLevel <= LogLevel.ERROR) {
            if (typeof msg === "string") {
                this.log(this.prepLine(msg, optionalParameters));
            } else {
                this.log(msg);
            }
        }
    }

    public logFatal(msg?: any, ...optionalParameters: any[]): void {
        if (typeof msg === "string") {
            this.log(this.prepLine(msg, optionalParameters));
        } else {
            this.log(msg);
        }
    }

    public wait(millis: number): Promise<void> {
        return new Promise<void>(function (resolve) {
            setTimeout(function () { resolve() }, millis);
        });
    }

    public pushTask(t: (done: () => void) => void): void {
        this.jobs.push(t);
        if (this.isRunning) {
            return;
        }
        this.isRunning = true;
        this.dequeue();
    }

    private dequeue(): void {
        if (this.jobs.length == 0) {
            this.isRunning = false;
            return;
        }
        let task = this.jobs.shift();
        this.exec(task!);
    }

    private exec(task: Task) {
        let self = this;
        setTimeout(function (): void {
            Promise
                .resolve()
                .then(function () {
                    return new Promise<void>(function (resolve: () => void) { task(resolve) })
                })
                .then(function () {
                    self.dequeue()
                });
        }, 0);
    }
}

/** @internal */
function getDebugTransition<UserData, Protocol>(srcState: StateConstructor<UserData, Protocol>, destState: StateConstructor<UserData, Protocol>, topState: StateConstructor<UserData, Protocol>): ITransition<UserData, Protocol> {
    let src: StateConstructor<UserData, Protocol> = srcState;
    let dst: StateConstructor<UserData, Protocol> = destState;
    let srcPath: StateConstructor<UserData, Protocol>[] = [];
    const end: StateConstructor<UserData, Protocol> = topState;
    let srcIndex: Map<StateConstructor<UserData, Protocol>, number> = new Map();
    let dstPath: StateConstructor<UserData, UserData>[] = [];
    let cur: StateConstructor<UserData, UserData> = src;
    let i: number = 0;

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
        dst = dst.initialState!;
        dstPath.push(dst);
    }

    return new DebugTransition<UserData, Protocol>(srcPath, dstPath);
}

/** @internal */
async function debugDispatch<UserData, Protocol extends {[Signal: string]:any} | undefined, Signal extends keyof Protocol>(hsm: Hsm<UserData, Protocol>, signal: EventHandlerSignal<Protocol, Signal>, ...payload: any[]): Promise<any> {
    hsm.logTrace(`[${hsm.currentState.name}] #${signal}`);
    ++hsm.indent;
    try {
        // Execute the Method lookup
        let messageHandler = hsm.currentState.prototype[signal];
        if (!messageHandler) {
            throw {
                errorType: 'UnknownMessage',
                errorLevel: 'Application Error',
                errorMessage: `Cannot handle the #${signal} message`,
                actorType: `${hsm.name}`,
                currentState: `${hsm.currentState.name}`
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
            hsm.logTrace(`transition [${hsm.currentState.name}] => [${destState.name}]`);

            let tr: ITransition<UserData, Protocol> | undefined = hsm.transitionCache.get([hsm.currentState, destState]);
            if (!tr) {
                tr = getDebugTransition(hsm.currentState, destState, hsm.topState);
                hsm.transitionCache.set([hsm.currentState, destState], tr);
            }
            await tr.execute(hsm);
            hsm.nextState = undefined;

            hsm.logTrace(`current state: [${hsm.currentState.name}]`);
            // End Transition
        }

        if (output !== undefined) {
            return output;
        } else {
            return undefined;
        }

    } finally {
        --hsm.indent;
    }
}

/** @internal */
function createAsyncTask<
    UserData,
    ReturnType,
    Protocol extends {[Signal: string]: any} | undefined,
    Signal extends keyof Protocol
>(
    hsm: Hsm<UserData, Protocol>,
    resolve: (value: ReturnType | undefined) => void,
    reject: (value: Error) => void,
    signal: EventHandlerSignal<Protocol, Signal>,
    ...payload: any[]
): (doneCallback: () => void) => void {
    return function (doneCallback: () => void) {
        debugDispatch(hsm, signal, ...payload)
            .then(function (result) {resolve(result);})
            .catch(function (err) {reject(err);})
            .finally(function () {
                doneCallback();
            });
    };
}

/** @internal */
function createSyncTask<
    UserData,
    Protocol extends {[Signal: string]: any} | undefined,
    ReturnType,
    Signal extends keyof Protocol
>(
    hsm: Hsm<UserData, Protocol>,
    signal: EventHandlerSignal<Protocol, Signal>,
    ...payload: any[]
): (doneCallback: () => void) => void {
    return function (doneCallback: () => void): void {
        debugDispatch(hsm, signal, ...payload)
            .catch(function (err) {
                hsm.logError(err);
            })
            .finally(function () {
                doneCallback();
            });
    };
}
