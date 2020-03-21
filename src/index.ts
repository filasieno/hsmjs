// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Any = { [key: string]: any };
export type EventHandlerName<Protocol extends undefined | Any, EventName extends keyof Protocol> = Protocol extends undefined ? string : EventName;
export type EventHandlerPayload<Protocol extends undefined | Any, EventName extends keyof Protocol> = Protocol extends undefined ? any[] : Protocol[EventName] extends (...payload: infer Payload) => any ? Payload : never;
export type EventHandlerReply<Protocol extends undefined | Any, EventName extends keyof Protocol> = Protocol extends undefined ? any : Protocol[EventName] extends (...payload: any[]) => infer ReturnType ? (ReturnType extends Promise<infer Value> ? Value : ReturnType) : never;
export type StateConstructor<Context = Any, Protocol extends Any | undefined = undefined> = Function & {
	initialState?: StateConstructor<Context, Protocol>;
	isInitialState?: boolean;
	prototype: IState<Context, Protocol>;
	name: string;
};

export enum LogLevel {
	ALL = 0,
	TRACE,
	DEBUG,
	INFO,
	WARN,
	ERROR,
	FATAL,
	OFF,
}

export type Trace = string | Error | Any;

function logLevelToString(level: LogLevel): string {
	switch (level) {
		case LogLevel.TRACE:
			return 'TRACE';
		case LogLevel.DEBUG:
			return 'DEBUG';
		case LogLevel.INFO:
			return 'INFO ';
		case LogLevel.WARN:
			return 'INFO ';
		case LogLevel.ERROR:
			return 'ERROR';
		case LogLevel.FATAL:
			return 'ERROR';
		case LogLevel.OFF:
			return 'OFF  ';
		case LogLevel.ALL:
			return 'ALL  ';
	}
}

export interface ITraceWriter {
	logLevel: number;
	write<Context, Protocol>(hsm: IHsm<Context, Protocol>, logLevel: number, indentLevel: number, msg?: any, ...optionalParameters: any[]): void;
}

export interface IBoundHsm<Context, Protocol> {
	currentStateName: string;
	currentState: StateConstructor<Context, Protocol>;
	readonly TopState: StateConstructor<Context, Protocol>;

	transition(nextState: StateConstructor<Context, Protocol>): void;
	unhandled(): never;
	sleep(millis: number): Promise<void>;
	log(level: LogLevel, msg?: any, ...optionalParameters: any[]): void;
	logTrace(trace: Trace): void;
	logDebug(trace: Trace): void;
	logWarn(trace: Trace): void;
	logInfo(trace: Trace): void;
	logError(trace: Trace): void;
	logFatal(trace: Trace): void;
	post<EventName extends keyof Protocol>(eventName: EventHandlerName<Protocol, EventName>, ...eventPayload: EventHandlerPayload<Protocol, EventName>): void;
	deferredPost<EventName extends keyof Protocol>(millis: number, eventName: EventHandlerName<Protocol, EventName>, ...eventPayload: EventHandlerPayload<Protocol, EventName>): void;
	setStateForced(state: StateConstructor<Context, Protocol>): void;
}

export class BoundHsm<Context, Protocol> implements IBoundHsm<Context, Protocol> {
	protected readonly ctx!: Context;
	private readonly hsm!: IBoundHsm<Context, Protocol>;

	get TopState(): StateConstructor<Context, Protocol> {
		return this.hsm.TopState;
	}
	get currentStateName(): string {
		return Object.getPrototypeOf(this).constructor.name;
	}

	get currentState(): StateConstructor<Context, Protocol> {
		return Object.getPrototypeOf(this);
	}

	transition(nextState: StateConstructor<Context, Protocol>): void {
		this.hsm.transition(nextState);
	}

	unhandled(): never {
		throw new Error('Unhandled');
	}

	sleep(millis: number): Promise<void> {
		return new Promise<void>(function(resolve) {
			setTimeout(function() {
				resolve();
			}, millis);
		});
	}

	log(level: number, trace: Trace): void {
		this.hsm.log(level, trace);
	}
	logTrace(trace: Trace): void {
		this.hsm.log(LogLevel.TRACE, trace);
	}
	logDebug(trace: Trace): void {
		this.hsm.log(LogLevel.DEBUG, trace);
	}
	logWarn(trace: Trace): void {
		this.hsm.log(LogLevel.WARN, trace);
	}
	logInfo(trace: Trace): void {
		this.hsm.log(LogLevel.INFO, trace);
	}
	logError(trace: Trace): void {
		this.hsm.log(LogLevel.ERROR, trace);
	}
	logFatal(trace: Trace): void {
		this.hsm.log(LogLevel.FATAL, trace);
	}

	post<EventName extends keyof Protocol>(eventName: EventHandlerName<Protocol, EventName>, ...eventPayload: EventHandlerPayload<Protocol, EventName>): void {
		this.hsm.post(eventName, ...eventPayload);
	}

	deferredPost<EventName extends keyof Protocol>(millis: number, eventName: EventHandlerName<Protocol, EventName>, ...eventPayload: EventHandlerPayload<Protocol, EventName>): void {
		this.hsm.deferredPost(millis, eventName, ...eventPayload);
	}

	setStateForced(state: StateConstructor<Context, Protocol>): void {
		this.hsm.setStateForced(state);
	}
}

class ConsoleTraceWriter implements ITraceWriter {
	logLevel: LogLevel = LogLevel.INFO;
	write<Context, Protocol>(hsm: IHsm<Context, Protocol>, logLevel: LogLevel, indentLevel: number, trace: Trace): void {
		if (this.logLevel <= logLevel) {
			if (typeof trace === 'function') {
				console.log(`${hsm.contextTypeName}|${logLevelToString(logLevel)}|${hsm.id}|${'   '.repeat(indentLevel)}${hsm.currentStateName}|${trace()}`);
			} else if (typeof trace === 'string') {
				console.log(`${hsm.contextTypeName}|${logLevelToString(logLevel)}|${hsm.id}|${'   '.repeat(indentLevel)}${hsm.currentStateName}|${trace}`);
			} else {
				console.log(trace);
			}
		}
	}
}

export interface IState<Context, Protocol> {
	_init(): Promise<void> | void;
	_exit(): Promise<void> | void;
	_entry(): Promise<void> | void;
	_error(error: Error): Promise<void> | void;
}

export class TopState<Context = Any, Protocol = undefined> extends BoundHsm<Context, Protocol> implements IState<Context, Protocol> {
	static get isInitialState(): boolean {
		if (Object.prototype.hasOwnProperty.call(this, '_isInitialState')) {
			return (this as Any)._isInitialState;
		}
		return false;
	}

	static set isInitialState(value: boolean) {
		Object.defineProperty(this, '_isInitialState', {
			value: value,
			writable: false,
			enumerable: false,
			configurable: false,
		});
	}

	static get initialState(): StateConstructor | undefined {
		if (Object.prototype.hasOwnProperty.call(this, '_initialState')) {
			return (this as Any)._initialState as StateConstructor;
		}
		return undefined;
	}

	static set initialState(value: StateConstructor | undefined) {
		Object.defineProperty(this, '_initialState', {
			value: value,
			writable: false,
			enumerable: false,
			configurable: false,
		});
	}

	// eslint-disable-next-line @typescript-eslint/no-empty-function
	_init(): Promise<void> | void {}
	// eslint-disable-next-line @typescript-eslint/no-empty-function
	_exit(): Promise<void> | void {}
	// eslint-disable-next-line @typescript-eslint/no-empty-function
	_entry(): Promise<void> | void {}
	_error(error: Error): Promise<void> | void {
		this.logError(error);
	}
}

interface IHsmInstance<Context, Protocol> {
	ctx: Context;
	hsm: Hsm<Context, Protocol>;
}

export interface IHsm<Context, Protocol> {
	readonly id: string;
	readonly currentStateName: string;
	readonly contextTypeName: string;
	readonly topStateName: string;
	readonly currentState: StateConstructor<Context, Protocol>;
	readonly TopState: StateConstructor<Context, Protocol>;
	readonly ctx: Context;

	logLevel: LogLevel;

	send<EventName extends keyof Protocol>(eventName: EventHandlerName<Protocol, EventName>, ...eventPayload: EventHandlerPayload<Protocol, EventName>): Promise<EventHandlerReply<Protocol, EventName>>;
	post<EventName extends keyof Protocol>(eventName: EventHandlerName<Protocol, EventName>, ...eventPayload: EventHandlerPayload<Protocol, EventName>): void;
	deferredPost<EventName extends keyof Protocol>(millis: number, eventName: EventHandlerName<Protocol, EventName>, ...eventPayload: EventHandlerPayload<Protocol, EventName>): void;
	done(): Promise<void>;
}

/** @internal */
let id = 10000000;

/** @internal */
type Task = (done: () => void) => void;

/** @internal */
interface ITransition<Context, Protocol> {
	execute(hsm: Hsm<Context, Protocol>): Promise<void>;
}

// eslint-disable-next-line valid-jsdoc
/** @internal */
function generateHsmId(): string {
	return `${++id}`;
}

// eslint-disable-next-line valid-jsdoc
/** @internal */
async function dispatchDebugInit<Context, Protocol>(hsm: Hsm<Context, Protocol>): Promise<void> {
	let currState: StateConstructor<Context, Protocol> = hsm.TopState;
	hsm.logTrace(`about to initialize`);
	++hsm.indent;
	while (true) {
		// Init
		if (Object.prototype.hasOwnProperty.call(currState.prototype, '_init')) {
			hsm.logTrace(`about to call #_init`);
			currState.prototype['_init'].call(hsm);
			hsm.logTrace(`#_init called`);
		} else {
			hsm.logTrace(`#_init - default empty implementation`);
		}
		// Entry
		if (Object.prototype.hasOwnProperty.call(currState.prototype, '_entry')) {
			hsm.logTrace(`about to call #_entry`);
			currState.prototype['_entry'].call(hsm);
			hsm.logTrace(`#_entry called`);
		} else {
			hsm.logTrace(`#_entry - default empty implementation`);
		}

		if (currState.initialState !== undefined) {
			hsm.logTrace(`initial state is present and refers to '${currState.initialState.name}'`);
			currState = currState.initialState;
			hsm.currentState = currState;
		} else {
			break;
		}
	}
	--hsm.indent;
	hsm.logDebug(`initialized from top state '${hsm.TopState.name}'`);
}

// eslint-disable-next-line valid-jsdoc
/** @internal */
class DebugTransition<Context, Protocol> implements ITransition<Context, Protocol> {
	readonly exitList: Array<StateConstructor<Context, Protocol>>;
	readonly entryList: Array<StateConstructor<Context, Protocol>>;

	constructor(exitList: Array<StateConstructor<Context, Protocol>>, entryList: Array<StateConstructor<Context, Protocol>>) {
		this.exitList = exitList;
		this.entryList = entryList;
	}

	async execute(hsm: Hsm<Context, Protocol>): Promise<void> {
		++hsm.indent;
		const exitLen = this.exitList.length;
		const src = this.exitList[0];
		const dest = this.entryList[this.entryList.length - 1];
		try {
			for (let i = 0; i < exitLen; ++i) {
				const lastState = this.exitList[i].prototype;
				if (Object.prototype.hasOwnProperty.call(lastState, '_exit')) {
					hsm.logTrace(`(${this.entryList[i].name}) about to call #_exit`);
					const res = lastState._exit.call(hsm);
					if (Object.isPrototypeOf.call(hsm, Promise)) {
						await res;
					}
					if (i < exitLen - 2) {
						hsm.currentState = this.exitList[i + 1];
					}
					hsm.logDebug(`(${this.exitList[i].name}) #_exit done`);
				} else {
					if (i < exitLen - 2) {
						hsm.currentState = this.exitList[i + 1];
					}
					hsm.logDebug(`#_exit done - default empty implementation`);
				}
			}
			const entryLen = this.entryList.length;
			let lastState = hsm.currentState;
			for (let i = 0; i < entryLen; ++i) {
				lastState = this.entryList[i];

				const stateProto = lastState.prototype;
				if (Object.prototype.hasOwnProperty.call(stateProto, '_entry')) {
					hsm.logTrace(`about to call #_entry`);
					const res = stateProto._entry.call(hsm);
					if (Object.isPrototypeOf.call(hsm, Promise)) {
						await res;
					}
					hsm.logTrace(`#_entry done`);
				} else {
					hsm.logTrace(`#_entry done - default empty implementation`);
				}
				if (i < exitLen - 2) {
					hsm.currentState = this.exitList[i + 1];
				}
			}
			hsm.currentState = lastState;
		} catch (err) {
			hsm.logTrace(`an error has been thrown while executing a transition from ${src.name} to ${dest.name}`);

			hsm.logTrace(`an error has been thrown while executing a transition from ${src.name} to ${dest.name}`);
		} finally {
			--hsm.indent;
		}
	}
}

// eslint-disable-next-line valid-jsdoc
/** @internal */
function getDebugTransition<Context, Protocol>(srcState: StateConstructor<Context, Protocol>, destState: StateConstructor<Context, Protocol>): ITransition<Context, Protocol> {
	const src: StateConstructor<Context, Protocol> = srcState;
	let dst: StateConstructor<Context, Protocol> = destState;
	let srcPath: StateConstructor<Context, Protocol>[] = [];
	const end: StateConstructor<Context, Protocol> = TopState;
	const srcIndex: Map<StateConstructor<Context, Protocol>, number> = new Map();
	const dstPath: StateConstructor<Context, Context>[] = [];
	let cur: StateConstructor<Context, Context> = src;
	let i = 0;

	while (cur !== end) {
		srcPath.push(cur);
		srcIndex.set(cur, i);
		cur = Object.getPrototypeOf(cur);
		++i;
	}
	cur = dst;

	while (cur !== end) {
		const i = srcIndex.get(cur);
		if (i !== undefined) {
			srcPath = srcPath.slice(0, i);
			break;
		}
		dstPath.unshift(cur);
		cur = Object.getPrototypeOf(cur);
	}

	while (dst.initialState !== undefined) {
		dst = dst.initialState;
		dstPath.push(dst);
	}

	return new DebugTransition<Context, Protocol>(srcPath, dstPath);
}

async function debugDispatch<Context, Protocol extends Any | undefined, EventName extends keyof Protocol>(hsm: Hsm<Context, Protocol>, dispatchKind: 'post' | 'send', eventName: EventHandlerName<Protocol, EventName>, eventPayload: EventHandlerPayload<Protocol, EventName>): Promise<EventHandlerReply<Protocol, EventName> | undefined> {
	hsm.logDebug(`${dispatchKind} #${eventName}${JSON.stringify(eventPayload)}`);
	++hsm.indent;
	try {
		// Execute the Method lookup
		let messageHandler;
		try {
			const currentState = hsm.currentState;
			const proto = currentState.prototype;
			messageHandler = proto[eventName];
			if (!messageHandler) {
				// noinspection ExceptionCaughtLocallyJS
				throw new Error(`Unhandled event #${eventName}`); // TODO:
			}
		} catch (err) {
			hsm.logTrace(`failure: call to the #${eventName} handler has raised an error: "${err.message}"`);
			hsm.logTrace(`about to call the #_error handler`);
			const errorHandler = hsm.currentState.prototype['_error'];
			let output;
			try {
				const result = errorHandler.call(hsm.instance, err);
				if (result instanceof Promise) {
					output = await result;
				} else {
					output = result;
				}
				hsm.logTrace(`#_error call done`);
				if (hsm.nextState != null) {
					const destState = hsm.nextState;
					// Begin Transition
					hsm.logTrace(`transition to '${destState.name}'`);
					let tr: ITransition<Context, Protocol> | undefined = hsm.transitionCache.get([hsm.currentState, destState]);
					if (tr === undefined) {
						tr = getDebugTransition(hsm.currentState, destState);
						hsm.transitionCache.set([hsm.currentState, destState], tr);
					}
					await tr.execute(hsm);
					hsm.nextState = undefined;
					// End Transition
				} else {
					hsm.logTrace(`no transition requested`);
				}
				if (output !== undefined && dispatchKind === 'send') {
					hsm.logTrace(`#${eventName} handler is returning: ${JSON.stringify(output)}`);
					return output;
				} else {
					return;
				}
			} catch (err) {
				hsm.logTrace(`failure: call the #_error event handler has raised an error: "${err.message}"`);
				hsm.logTrace(`fatal error an #_error handler should not throw any errors`);
				hsm.logFatal(err);
				return;
			}
		}

		// Here we have a valid message handler

		let output;
		try {
			hsm.logTrace(`about to call the #${eventName} handler`);
			const result = messageHandler.call(hsm.instance, ...eventPayload);
			// In case of a Promise sleep for the actual result
			if (result instanceof Promise) {
				output = await result;
			} else {
				output = result;
			}
			hsm.logTrace(`call to the #${eventName} handler done`);
		} catch (err) {
			hsm.logTrace(`failure: call to the #${eventName} handler has raised an error: "${err.message}"`);
			const errorHandler = hsm.currentState.prototype['_error'];
			hsm.logTrace(`about to call the #_error handler`);
			try {
				const result = errorHandler.call(hsm, err);
				if (result instanceof Promise) {
					await result;
				}
				hsm.logTrace(`#_error call done`);
			} catch (err) {
				hsm.logTrace(`failure: call the #_error handler has raised an error: "${err.message}"`);
				hsm.logTrace(`fatal error an #_error handler should not throw any errors`);
				hsm.logFatal(err);
				return;
			}
		}
		if (hsm.nextState != null) {
			const destState = hsm.nextState;
			// Begin Transition
			hsm.logTrace(`transition to '${destState.name}'`);
			let tr: ITransition<Context, Protocol> | undefined = hsm.transitionCache.get([hsm.currentState, destState]);
			if (!tr) {
				tr = getDebugTransition(hsm.currentState, destState);
				hsm.transitionCache.set([hsm.currentState, destState], tr);
			}
			await tr.execute(hsm);
			hsm.nextState = undefined;
			// End Transition
		} else {
			hsm.logTrace(`no transition requested`);
		}
		if (output !== undefined && dispatchKind === 'send') {
			hsm.logTrace(`#${eventName} handler is returning: ${JSON.stringify(output)}`);
			return output;
		} else {
			return;
		}
	} finally {
		--hsm.indent;
	}
}

/** @internal */
class Hsm<Context, Protocol> implements IHsm<Context, Protocol>, IBoundHsm<Context, Protocol> {
	public readonly id: string;
	public readonly ctx: Context;
	public readonly TopState: StateConstructor<Context, Protocol>;
	public readonly topStateName: string;
	public readonly contextTypeName: string;

	public instance: IHsmInstance<Context, Protocol>;
	public indent: number;
	public transitionCache: Map<[StateConstructor<Context, Protocol>, StateConstructor<Context, Protocol>], ITransition<Context, Protocol>> = new Map();
	public jobs: Task[];
	public isRunning = false;
	public nextState?: StateConstructor<Context, Protocol>;
	public traceWriter: ITraceWriter;

	constructor(TopState: StateConstructor<Context, Protocol>, instance: IHsmInstance<Context, Protocol>, traceWriter: ITraceWriter) {
		this.id = generateHsmId();
		this.instance = instance;
		this.ctx = instance.ctx;
		this.TopState = TopState;
		this.topStateName = TopState.name;
		this.contextTypeName = typeof instance.ctx;
		this.currentState = TopState;
		this.nextState = undefined;
		this.traceWriter = traceWriter;
		this.indent = 0;
		this.transitionCache = new Map();
		this.jobs = [];
		this.isRunning = false;
	}

	get currentStateName(): string {
		return Object.getPrototypeOf(this.instance).constructor.name;
	}

	get currentState(): StateConstructor<Context, Protocol> {
		return Object.getPrototypeOf(this.instance).constructor;
	}

	set currentState(newState: StateConstructor<Context, Protocol>) {
		Object.setPrototypeOf(this.instance, newState.prototype);
	}

	get logLevel(): LogLevel {
		return this.traceWriter.logLevel;
	}

	set logLevel(logLevel: LogLevel) {
		this.traceWriter.logLevel = logLevel;
	}

	send<EventName extends keyof Protocol>(eventName: EventHandlerName<Protocol, EventName>, ...eventPayload: EventHandlerPayload<Protocol, EventName>): Promise<EventHandlerReply<Protocol, EventName>> {
		this.logTrace(`requested send #${eventName}${JSON.stringify(eventPayload)}`);

		return new Promise<EventHandlerReply<Protocol, EventName>>((resolve: (result: EventHandlerReply<Protocol, EventName>) => void, reject: (err: Error) => void) => {
			this.pushTask((doneCallback: () => void) => {
				debugDispatch(this, 'send', eventName, eventPayload)
					.then(result => {
						resolve(result as EventHandlerReply<Protocol, EventName>);
					})
					.catch(err => {
						reject(err);
					})
					.finally(() => {
						doneCallback();
					});
			});
		});
	}

	private createPostTask<EventName extends keyof Protocol>(eventName: EventHandlerName<Protocol, EventName>, eventPayload: EventHandlerPayload<Protocol, EventName>): Task {
		return (doneCallback: () => void): void => {
			debugDispatch(this, 'post', eventName, eventPayload)
				.catch(err => {
					this.logError(err);
				})
				.finally(() => {
					doneCallback();
				});
		};
	}

	post<EventName extends keyof Protocol>(eventName: EventHandlerName<Protocol, EventName>, ...eventPayload: EventHandlerPayload<Protocol, EventName>): void {
		this.logTrace(`requested post #${eventName}${JSON.stringify(eventPayload)} `);
		this.pushTask(this.createPostTask(eventName, eventPayload));
	}

	deferredPost<EventName extends keyof Protocol>(millis: number, eventName: EventHandlerName<Protocol, EventName>, ...eventPayload: EventHandlerPayload<Protocol, EventName>): void {
		this.logTrace(`requested deferredPost(${millis} millis) #${eventName}${JSON.stringify(eventPayload)}`);
		setTimeout(
			function(self: Hsm<Context, Protocol>) {
				self.post(eventName, ...eventPayload);
			},
			millis,
			this
		);
	}

	done(): Promise<void> {
		this.logTrace('waiting for task completion ...');
		function createDonePromise<Protocol, Context>(self: Hsm<Protocol, Context>): Promise<void> {
			return new Promise<void>(function(resolve) {
				self.pushTask(function(doneCallback: () => void): void {
					resolve();
					doneCallback();
					self.logTrace('all tasks completed');
				});
			});
		}
		return createDonePromise(this);
	}

	logTrace(trace: Trace): void {
		this.traceWriter.write(this, LogLevel.TRACE, this.indent, trace);
	}
	logDebug(trace: Trace): void {
		this.traceWriter.write(this, LogLevel.DEBUG, this.indent, trace);
	}
	logWarn(trace: Trace): void {
		this.traceWriter.write(this, LogLevel.WARN, this.indent, trace);
	}
	logInfo(trace: Trace): void {
		this.traceWriter.write(this, LogLevel.INFO, this.indent, trace);
	}
	logError(trace: Trace): void {
		this.traceWriter.write(this, LogLevel.ERROR, this.indent, trace);
	}
	logFatal(trace: Trace): void {
		this.traceWriter.write(this, LogLevel.FATAL, this.indent, trace);
	}
	log(level: number, trace: Trace): void {
		this.traceWriter.write(this, level, this.indent, trace);
	}

	setStateForced(state: StateConstructor<Context, Protocol>): void {
		Object.setPrototypeOf(this.instance, state.prototype);
	}

	transition(nextState: StateConstructor<Context, Protocol>): void {
		this.nextState = nextState;
	}

	unhandled(): never {
		throw new Error();
	}

	sleep(millis: number): Promise<void> {
		return new Promise<void>(function executor(resolve) {
			setTimeout(() => {
				resolve();
			}, millis);
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
		const task = this.jobs.shift();
		if (task === undefined) throw new Error('Illegal state exceptions');
		this.exec(task);
	}

	private exec(task: Task): void {
		setTimeout(
			function(self): void {
				Promise.resolve()
					.then(function() {
						return new Promise<void>(function(resolve: () => void) {
							task(resolve);
						});
					})
					.then(function() {
						self.dequeue();
					});
			},
			0,
			this
		);
	}

	public postInitTask(): this {
		function createInitTask<Context, Protocol>(self: Hsm<Context, Protocol>) {
			return function(doneCallback: () => void): void {
				dispatchDebugInit(self)
					.catch(function(err) {
						self.logError(err);
					})
					.finally(function() {
						doneCallback();
					});
			};
		}

		this.pushTask(createInitTask(this));
		return this;
	}
}

export interface IHsmOptions {
	logLevel: LogLevel;
	TraceWriterFactory: new () => ITraceWriter;
}

/** @internal */
let defaultCreateOptions: IHsmOptions = { logLevel: LogLevel.INFO, TraceWriterFactory: ConsoleTraceWriter };

/**
 * Used to configure the default _options_ object used when executing the {@link create} or {@link create} functions.
 *
 * @param {IHsmOptions} options the new default options object
 */
export function configure(options: IHsmOptions): void {
	defaultCreateOptions = options;
}

export function configureLogLevel(logLevel: LogLevel): void {
	defaultCreateOptions.logLevel = logLevel;
}

export function configureTracerFactory(traceWriterFactory?: new () => ITraceWriter): void {
	if (traceWriterFactory) {
		defaultCreateOptions.TraceWriterFactory = traceWriterFactory;
	} else {
		defaultCreateOptions.TraceWriterFactory = ConsoleTraceWriter;
	}
}

export function restore<Context, Protocol>(State: StateConstructor<Context, Protocol>, ctx: Context, options?: IHsmOptions): IHsm<Context, Protocol> {
	const userOptions = options ? options : defaultCreateOptions;
	const instance: IHsmInstance<Context, Protocol> = {
		ctx: ctx,
		hsm: (undefined as unknown) as Hsm<Context, Protocol>,
	};
	Object.setPrototypeOf(instance, State.prototype);
	const traceWriter = new userOptions.TraceWriterFactory();
	traceWriter.logLevel = userOptions.logLevel;
	instance.hsm = new Hsm(State, instance, traceWriter);
	return instance.hsm;
}

export function create<Context, Protocol>(topState: StateConstructor<Context, Protocol>, ctx: Context, options?: IHsmOptions): IHsm<Context, Protocol> {
	return (restore(topState, ctx, options) as Hsm<Context, Protocol>).postInitTask();
}

export function initialState<Context, Protocol>(TargetState: StateConstructor<Context, Protocol>): void {
	const ParentOfTargetState = Object.getPrototypeOf(TargetState.prototype).constructor;
	if (Object.prototype.hasOwnProperty.call(ParentOfTargetState, 'initialState') && ParentOfTargetState.initialState) {
		throw new Error(`@ihsm.initialState has been set twice for parent class "${ParentOfTargetState.name}"; check all classes that extend "${ParentOfTargetState.name}"`); // TODO: move to errors
	}
	TargetState.isInitialState = true;
	ParentOfTargetState.initialState = TargetState;
}
