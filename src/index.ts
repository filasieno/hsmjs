////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//
//
//
//
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Exported Types
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export type StateConstructor<UserTopState extends State<UserTopState, UserData>, UserData> = Function & {
    initialState?: StateConstructor<UserTopState, UserData>; exceptionState?: StateConstructor<UserTopState, UserData>; isInitialState?: boolean; prototype: State<UserTopState, UserData>;
};

export type TopStateConstructor<UserTopState extends State<UserTopState, UserData>, UserData> = Function & {
    initialState?: StateConstructor<UserTopState, UserData>; exceptionState?: StateConstructor<UserTopState, UserData>; isInitialState?: boolean; prototype: UserTopState;
};

export type PostProtocol<UserTopState extends State<UserTopState, UserData>, UserData> = { [P in keyof UserTopState]: PostFunction<UserTopState[P]>; };
export type PostFunction<EventHandler> = EventHandler extends (...payload: infer Payload) => infer ReturnedValue ? ReturnedValue extends (void | undefined | null | Promise<any>) ? (...payload: Payload) => void : never : never;
export type SendProtocol<UserTopState extends State<UserTopState, UserData>, UserData> = { [P in keyof UserTopState]: SendFunction<UserTopState[P]>; };
export type SendFunction<EventHandler> = EventHandler extends (...payload: infer Payload) => infer ReturnedPromise ? ReturnedPromise extends Promise<infer Value> ? (...payload: Payload) => Promise<Value> : never : never;
export type UserDataType<UserTopState extends State<UserTopState, any>> = UserTopState extends State<UserTopState, infer UserData> ? UserData : never;

export interface IBaseHsm<UserTopState extends State<UserTopState, UserData>, UserData> {
    logLevel: LogLevel;
    name: string;
    readonly typeName: string;
    readonly currentState: StateConstructor<UserTopState, UserData>;
    readonly topState: StateConstructor<UserTopState, UserData>;
    readonly post: PostProtocol<UserTopState, UserData>;
}

export interface IHsm<UserTopState extends State<UserTopState, UserData>, UserData = UserDataType<UserTopState>> extends IBaseHsm<UserTopState, UserData> {
    readonly ctx: UserData;
    readonly send: SendProtocol<UserTopState, UserData>;
}

export interface IBoundHsm<UserTopState extends State<UserTopState, UserData>, UserData> extends IBaseHsm<UserTopState, UserData> {
    transition(nextState: StateConstructor<UserTopState, UserData>): void;
    unhandled(): never;
    wait(millis: number): Promise<void>;
    logTrace(msg?: any, ...optionalParameters: any[]): void;
    logDebug(msg?: any, ...optionalParameters: any[]): void;
    logWarn(msg?: any, ...optionalParameters: any[]): void;
    logInfo(msg?: any, ...optionalParameters: any[]): void;
    logError(msg?: any, ...optionalParameters: any[]): void;
    logFatal(msg?: any, ...optionalParameters: any[]): void;
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Exported Values
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export enum LogLevel { ALL = 0, TRACE = 20, DEBUG = 30, INFO = 30, WARN = 40, ERROR = 50, FATAL = 60, OFF = 70 }

export interface State<UserTopState extends State<UserTopState, UserData>, UserData = { [key: string]: any }> {
    readonly ctx: UserData;
    readonly hsm: IBoundHsm<UserTopState, UserData>;
    readonly post: PostProtocol<UserTopState, UserData>;
    _init(...args: any[]): Promise<void> | void;
    _exit(): Promise<void> | void;
    _entry(): Promise<void> | void;
}

export function create<UserTopState extends State<UserTopState, UserData>, UserData>(userData: UserData, topState: TopStateConstructor<UserTopState, UserData>, logLevel: LogLevel = LogLevel.INFO): IHsm<UserTopState, UserData> {
    let hsm = new Hsm(topState, userData, logLevel);
    let currState: StateConstructor<UserTopState, UserData> = topState;
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

export function init<UserTopState extends State<UserTopState, UserData>, UserData>(topState: TopStateConstructor<UserTopState, UserData>, logLevel: LogLevel = LogLevel.INFO, fieldName = 'hsm'): (constructor: new (...args: any[]) => any) => (new (...args: any[]) => any) {
    return function (constructor: new (...args: any[]) => any): new (...args: any[]) => any {
        return class extends constructor {
            constructor(...args: any[]) {
                super(...args);
                let self: { [k: string]: any } = this;
                let hsm = new Hsm(topState, this as unknown as UserData, logLevel);
                Object.defineProperty(self, fieldName, {
                    get() { return hsm }, set(_) { throw new Error(`Field ${fieldName} is constant`) }
                });
                let currState: StateConstructor<UserTopState, UserData> = topState;
                while (true) {
                    if (Object.prototype.hasOwnProperty.call(currState.prototype, '_init')) {
                        currState.prototype['_init'].call(hsm, ...args);
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
            }
        }
    }
}

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

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Private Types
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

type Task = (done: () => void) => void;

interface IStateThisBinding<UserTopState extends State<UserTopState, UserData>, UserData> {
    readonly ctx: UserData;
    readonly hsm: IBoundHsm<UserTopState, UserData>;
    readonly post: PostProtocol<UserTopState, UserData>;
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Private Values
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


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

}

class Hsm<UserTopState extends State<UserTopState, UserData>, UserData> implements IStateThisBinding<UserTopState, UserData>, IBoundHsm<UserTopState, UserData>, IHsm<UserTopState, UserData> {
    hsm: IBoundHsm<UserTopState, UserData>;
    ctx: UserData;
    post: PostProtocol<UserTopState, UserData>;
    send: SendProtocol<UserTopState, UserData>;
    topState: StateConstructor<UserTopState, UserData>;
    currentState: StateConstructor<UserTopState, UserData>;
    typeName: string;
    name: string;
    logLevel: LogLevel;
    nextState?: StateConstructor<UserTopState, UserData>;
    transitionCache: Map<[StateConstructor<UserTopState, UserData>, StateConstructor<UserTopState, UserData>], Transition<UserTopState, UserData>>;
    log: (message?: string, ...optionalParameters: any[]) => void;
    indent: number;
    jobs: Task[] = [];
    isRunning: boolean;

    constructor(UserTopState: TopStateConstructor<UserTopState, UserData>, userData: UserData, logLevel: LogLevel) {
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

    transition(nextState: new () => State<UserTopState, UserData>): void {
        if (nextState === undefined) {
            throw new Error("Cannot transition to undefined"); // TODO:
        }
        this.nextState = nextState;
    }

    unhandled(): never {
        throw new Error("Unhandled method"); // TODO:
    }

    public logTrace(msg?: any, ...optionalParameters: any[]): void { if (this.logLevel <= LogLevel.TRACE) { this.log(msg, ...optionalParameters) } }
    public logDebug(msg?: any, ...optionalParameters: any[]): void { if (this.logLevel <= LogLevel.DEBUG) { this.log(msg, ...optionalParameters) } }
    public logWarn(msg?: any, ...optionalParameters: any[]): void { if (this.logLevel <= LogLevel.WARN) { this.log(msg, ...optionalParameters) } }
    public logInfo(msg?: any, ...optionalParameters: any[]): void { if (this.logLevel <= LogLevel.INFO) { this.log(msg, ...optionalParameters) } }
    public logError(msg?: any, ...optionalParameters: any[]): void { if (this.logLevel <= LogLevel.ERROR) { this.log(msg, ...optionalParameters) } }
    public logFatal(msg?: any, ...optionalParameters: any[]): void { this.log(msg, ...optionalParameters) }
    public wait(millis: number): Promise<void> {
        return new Promise<void>(function (resolve) {
            setTimeout(function () { resolve() }, millis);
        });
    }

    public pushTask(t: (done: () => void) => void): void {
        console.log("enqueue");
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
                    console.log("Begin task")
                })
                .then(function () {
                    return new Promise<void>(function (resolve: () => void) { task(resolve) })
                })
                .then(function () {
                    console.log("End task")
                })
                .then(function () {
                    self.dequeue()
                });
        });
    }
}

function getTransition<UserTopState extends State<UserTopState, UserData>, UserData>(srcState: StateConstructor<UserTopState, UserData>, destState: StateConstructor<UserTopState, UserData>, topState: StateConstructor<UserTopState, UserData>): Transition<UserTopState, UserData> {
    let src: StateConstructor<UserTopState, UserData> = srcState;
    let dst: StateConstructor<UserTopState, UserData> = destState;
    let srcPath: StateConstructor<UserTopState, UserData>[] = [];
    const end: StateConstructor<UserTopState, UserData> = topState;
    let srcIndex: Map<StateConstructor<UserTopState, UserData>, number> = new Map();
    let dstPath: StateConstructor<UserTopState, UserData>[] = [];
    let cur: StateConstructor<UserTopState, UserData> = src;
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

async function dispatch<UserTopState extends State<UserTopState, UserData>, UserData>(hsm: Hsm<UserTopState, UserData>, signalName: string, ...payload: any[]): Promise<any> {
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


// Message Send Protocol ///////////////////////////////////////////////////////////////////////////////////////////////

function createAsyncTask<UserTopState extends State<UserTopState, UserData>, UserData, ReturnType>(hsm: Hsm<UserTopState, UserData>, resolve: (value: ReturnType | undefined) => void, reject: (value: Error) => void, signalName: string, ...payload: any[]): (doneCallback: () => void) => void {
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
            })
            .finally(function () {
                doneCallback();
            });
    };
}

function createSendProtocol<UserTopState extends State<UserTopState, UserData>, UserData>(hsm: Hsm<UserTopState, UserData>): SendProtocol<UserTopState, UserData> {
    const asyncSendProtocolHandler = {
        get: function (object: { [key: string]: any }, signalName: string) {
            if (signalName in object) {
                return object[signalName];
            }

            function messageSender<T>(...payload: any[]): Promise<T> {
                return new Promise<T>(function (resolve: (value: T | undefined) => void, reject: (value: Error) => void) {
                    hsm.pushTask(createAsyncTask(hsm, resolve, reject, signalName, ...payload));
                });
            }

            object[signalName] = messageSender;
            return messageSender;
        }
    };
    return new Proxy({}, asyncSendProtocolHandler) as unknown as SendProtocol<UserTopState, UserData>;
}

function createPostProtocol<UserTopState extends State<UserTopState, UserData>, UserData>(hsm: Hsm<UserTopState, UserData>): PostProtocol<UserTopState, UserData> {
    const sendProtocolHandler = {
        get: function (object: { [key: string]: any }, signalName: string) {
            if (signalName in object) {
                return object[signalName];
            }

            function messageSender(...payload: any[]): void {
                let task: (doneCallback: () => void) => void = createSyncTask(hsm, signalName, ...payload);
                hsm.pushTask(task);
            }

            object[signalName] = messageSender;
            return messageSender;

        }
    };
    return new Proxy({}, sendProtocolHandler) as unknown as PostProtocol<UserTopState, UserData>;
}
