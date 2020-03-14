////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
//
//
//
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Exported Types
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export type StateConstructor<UserData, Protocol> = Function & {
    initialState?: StateConstructor<UserData, Protocol>; exceptionState?: StateConstructor<UserData, Protocol>; isInitialState?: boolean; prototype: IState<UserData, Protocol>;
};

export type PostProtocol<Protocol = undefined> = Protocol extends undefined ? { [key: string]: (...payload: any[]) => void } : { [key in keyof Protocol]: PostFunction<Protocol[key]> };
export type PostFunction<EventHandler> = EventHandler extends (...payload: infer Payload) => infer ReturnedValue ? ReturnedValue extends (void | undefined | null | Promise<any>) ? (...payload: Payload) => void : never : never;

export type SendProtocol<Protocol = undefined> = Protocol extends undefined ? { [key: string]: (...payload: any[]) => Promise<any> } : { [key in keyof Protocol]: SendFunction<Protocol[key]>; };
export type SendFunction<EventHandler> = EventHandler extends (...payload: infer Payload) => infer ReturnedPromise ? ReturnedPromise extends Promise<infer Value> ? (...payload: Payload) => Promise<Value> : never : never;

export interface IBaseHsm<UserData, Protocol> {
    logLevel: LogLevel;
    name: string;
    readonly typeName: string;
    readonly currentState: StateConstructor<UserData, Protocol>;
    readonly topState: StateConstructor<UserData, Protocol>;
    readonly post: PostProtocol<Protocol>;
}

export interface IHsm<UserData = { [key: string]: any }, Protocol = {}> extends IBaseHsm<UserData, Protocol> {
    readonly ctx: UserData;
    readonly send: SendProtocol<Protocol>;
}

export interface IHsmLogger {
    logTrace(msg?: any, ...optionalParameters: any[]): void;
    logDebug(msg?: any, ...optionalParameters: any[]): void;
    logWarn(msg?: any, ...optionalParameters: any[]): void;
    logInfo(msg?: any, ...optionalParameters: any[]): void;
    logError(msg?: any, ...optionalParameters: any[]): void;
    logFatal(msg?: any, ...optionalParameters: any[]): void;
}

export interface IBoundHsm<UserData = { [key: string]: any }, Protocol = {}> extends IBaseHsm<UserData, Protocol>, IHsmLogger {
    transition(nextState: StateConstructor<UserData, Protocol>): void;
    unhandled(): never;
    wait(millis: number): Promise<void>;
}

export interface IState<UserData = { [key: string]: any }, Protocol = undefined> {
    readonly ctx: UserData;
    readonly hsm: IBoundHsm<UserData, Protocol>;
    readonly post: PostProtocol<Protocol>;
    _init(...args: any[]): Promise<void> | void;
    _exit(): Promise<void> | void;
    _entry(): Promise<void> | void;
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Exported Values
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export enum LogLevel { ALL = 0, TRACE = 20, DEBUG = 30, INFO = 30, WARN = 40, ERROR = 50, FATAL = 60, OFF = 70 }

export class State<UserData = { [key: string]: any }, Protocol = undefined> {
    readonly ctx!: UserData;
    readonly hsm!: IBoundHsm<UserData, Protocol>;
    readonly post!: PostProtocol<Protocol>;
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
    while (true) {
        if (Object.prototype.hasOwnProperty.call(currState.prototype, '_init')) {
            currState.prototype['_init'].call(hsm, userData);
            hsm.logTrace(`${currState.name} init done`);
        } else {
            hsm.logTrace(`${currState.name} init [unimplemented]`);
        }
        if (Object.prototype.hasOwnProperty.call(currState, 'initialState') && currState.initialState) {
            hsm.logTrace(`${currState.name} initialState found on state '${currState.name}'`);
            currState = currState.initialState;
            hsm.currentState = currState!;
        } else {
            break;
        }
    }
    return hsm;
}

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

export function initialState<UserData, Protocol>(): (TargetState: StateConstructor<UserData, Protocol>) => void {
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

type Task = (done: () => void) => void;

interface IStateThisBinding<UserData, Protocol> {
    readonly ctx: UserData;
    readonly hsm: IBoundHsm<UserData, Protocol>;
    readonly post: PostProtocol<Protocol>;
}

interface IPrivateHsm<UserData, Protocol> extends IHsmLogger {
    indent: number;
    currentState: StateConstructor<UserData, Protocol>;
}

interface ITransition<UserData, Protocol> {
    execute(hsm: IPrivateHsm<UserData, Protocol>): Promise<void>;
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Private Values
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////



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


class Hsm<UserData, Protocol> implements IStateThisBinding<UserData, Protocol>, IBoundHsm<UserData, Protocol>, IHsm<UserData, Protocol>, IPrivateHsm<UserData, Protocol> {
    hsm: IBoundHsm<UserData, Protocol>;
    ctx: UserData;
    post: PostProtocol<Protocol>;
    send: SendProtocol<Protocol>;
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
        this.post = createPostProtocol(this);
        this.send = createSendProtocol(this);
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
        queueMicrotask(function (): void {
            Promise
                .resolve()
                .then(function () {
                    return new Promise<void>(function (resolve: () => void) { task(resolve) })
                })
                .then(function () {
                    self.dequeue()
                });
        });
    }
}

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

async function debugDispatch<UserData, Protocol>(hsm: Hsm<UserData, Protocol>, signalName: string, ...payload: any[]): Promise<any> {
    hsm.logTrace(`[${hsm.currentState.name}] #${signalName}`);
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

function createAsyncTask<UserData, Protocol, ReturnType>(hsm: Hsm<UserData, Protocol>, resolve: (value: ReturnType | undefined) => void, reject: (value: Error) => void, signalName: string, ...payload: any[]): (doneCallback: () => void) => void {
    return function (doneCallback: () => void) {
        debugDispatch(hsm, signalName, ...payload)
            .then(function (result) {resolve(result);})
            .catch(function (err) {reject(err);})
            .finally(function () {
                doneCallback();
            });
    };
}

function createSyncTask<UserData, Protocol, ReturnType>(hsm: Hsm<UserData, Protocol>, signalName: string, ...payload: any[]): (doneCallback: () => void) => void {
    return function (doneCallback: () => void): void {
        debugDispatch(hsm, signalName, ...payload)
            .catch(function (err) {
                hsm.logError(err);
            })
            .finally(function () {
                doneCallback();
            });
    };
}

function createSendProtocol<UserData, Protocol, ReturnType>(hsm: Hsm<UserData, Protocol>): SendProtocol<Protocol> {
    const asyncSendProtocolHandler = {
        get: function (target: Hsm<UserData, Protocol>, signalName: string) {
            return function <T>(...payload: any[]): Promise<T> {
                return new Promise<T>(function (resolve: (value: T | undefined) => void, reject: (value: Error) => void) {
                    target.pushTask(createAsyncTask(target, resolve, reject, signalName, ...payload));
                });
            };
        },

    };
    return new Proxy(hsm, asyncSendProtocolHandler) as unknown as SendProtocol<Protocol>;
}

function createPostProtocol<UserData, Protocol>(hsm: Hsm<UserData, Protocol>): PostProtocol<Protocol> {
    const sendProtocolHandler = {
        get: function (self: Hsm<UserData, Protocol>, signalName: string): (...payload: any[]) => void {
            return function (...payload: any[]): void {
                let task: (doneCallback: () => void) => void = createSyncTask(self, signalName, ...payload);
                self.pushTask(task);
            }
        }
    };
    return new Proxy(hsm, sendProtocolHandler) as unknown as PostProtocol<Protocol>;
}
