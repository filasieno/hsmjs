// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Any = { [key: string]: any };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ReservedEventName = keyof IBoundHsm<any, any>;
export type EventHandlerName<Protocol extends {} | undefined, Signal extends keyof Protocol> = Protocol extends undefined ? string : Signal extends ReservedEventName ? never : Signal;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type EventHandlerPayload<Protocol extends {} | undefined, Signal extends keyof Protocol> = Protocol extends undefined ? any[] : Protocol[Signal] extends (...payload: infer Payload) => any ? Payload : never;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type EventHandlerReply<Protocol extends {} | undefined, Signal extends keyof Protocol> = Protocol extends undefined ? any : Protocol[Signal] extends (...payload: any[]) => infer ReturnType ? (ReturnType extends Promise<infer Value> ? Value : ReturnType) : never;
export type StateConstructor<UserData, Protocol extends {} | undefined> = Function & { prototype: TopState<UserData, Protocol> };

export type TraceLevel = 'none' | 'debug' | 'all';
export type DispatchKind = 'post' | 'send' | 'deferredPost';

export interface ITraceWriter {
	write<Context, Protocol>(hsm: IHsm<Context, Protocol>, indentLevel: number, msg: string): void;
	writeError<Context, Protocol>(hsm: IHsm<Context, Protocol>, indentLevel: number, error: Error): void;
}

export interface IBaseHsm<Context, Protocol> {
	readonly id: string;
	readonly state: StateConstructor<Context, Protocol>;
	readonly stateName: string;
	readonly TopState: StateConstructor<Context, Protocol>;
	readonly topStateName: string;
	readonly contextTypeName: string;
	readonly traceLevel: TraceLevel;

	post<EventName extends keyof Protocol>(eventName: EventHandlerName<Protocol, EventName>, ...eventPayload: EventHandlerPayload<Protocol, EventName>): void;
	deferredPost<EventName extends keyof Protocol>(millis: number, eventName: EventHandlerName<Protocol, EventName>, ...eventPayload: EventHandlerPayload<Protocol, EventName>): void;
}

export interface IHsm<Context, Protocol> extends IBaseHsm<Context, Protocol> {
	send<EventName extends keyof Protocol>(eventName: EventHandlerName<Protocol, EventName>, ...eventPayload: EventHandlerPayload<Protocol, EventName>): Promise<EventHandlerReply<Protocol, EventName>>;
	sync(): Promise<void>;
}

export interface IBoundHsm<Context, Protocol> extends IBaseHsm<Context, Protocol> {
	readonly traceWriter: ITraceWriter;
	readonly traceHeader: string;
	transition(nextState: StateConstructor<Context, Protocol>): void;
	unhandled(): never;
	sleep(millis: number): Promise<void>;
	setStateForced(state: StateConstructor<Context, Protocol>): void;
}

interface IHsmInstance<Context, Protocol> {
	ctx: Context;
	hsm: Hsm<Context, Protocol>;
}

/** @internal */
type Task = (done: () => void) => void;

/** @internal */
interface ITransition<Context, Protocol> {
	execute(hsm: Hsm<Context, Protocol>): Promise<void>;
}

export interface IHsmOptions {
	traceLevel: TraceLevel;
	TraceWriterFactory: new () => ITraceWriter;
}

class ConsoleTraceWriter implements ITraceWriter {
	write<Context, Protocol>(hsm: IHsm<Context, Protocol>, indentLevel: number, trace: string): void {
		console.log(`${hsm.contextTypeName}|${hsm.id}|${'   '.repeat(indentLevel)}${hsm.stateName}|${trace}`);
	}
	writeError<Context, Protocol>(hsm: IHsm<Context, Protocol>, indentLevel: number, error: Error): void {
		console.log(`${hsm.contextTypeName}|${hsm.id}|${'   '.repeat(indentLevel)}${hsm.stateName}|begin error`);
		console.log(error);
		console.log(`${hsm.contextTypeName}|${hsm.id}|${'   '.repeat(indentLevel)}${hsm.stateName}|end error`);
	}
}

export function getInitialState<Context, Protocol>(State: StateConstructor<Context, Protocol>): StateConstructor<Context, Protocol> {
	if (Object.prototype.hasOwnProperty.call(State, '_initialState')) {
		return (State as Any)._initialState as StateConstructor<Context, Protocol>;
	}
	throw new Error('Initial State not found');
}

export function isInitialState<Context, Protocol>(State: StateConstructor<Context, Protocol>): boolean {
	if (Object.prototype.hasOwnProperty.call(State, '_isInitialState')) {
		return (State as Any)._isInitialState;
	}
	return false;
}

export function hasInitialState<Context, Protocol>(State: StateConstructor<Context, Protocol>): boolean {
	return Object.prototype.hasOwnProperty.call(State, '_initialState');
}

export class TopState<Context = Any, Protocol = undefined> implements IBoundHsm<Context, Protocol> {
	protected readonly ctx!: Context;
	private readonly hsm!: IBoundHsm<Context, Protocol>;

	get traceHeader(): string {
		return this.hsm.traceHeader;
	}
	get TopState(): StateConstructor<Context, Protocol> {
		return this.hsm.TopState;
	}
	get stateName(): string {
		return Object.getPrototypeOf(this).constructor.name;
	}
	get state(): StateConstructor<Context, Protocol> {
		return Object.getPrototypeOf(this);
	}
	get contextTypeName(): string {
		return this.hsm.contextTypeName;
	}
	get id(): string {
		return this.hsm.id;
	}
	get traceLevel(): TraceLevel {
		return this.hsm.traceLevel;
	}
	get topStateName(): string {
		return this.hsm.topStateName;
	}
	get traceWriter(): ITraceWriter {
		return this.hsm.traceWriter;
	}
	// eslint-disable-next-line @typescript-eslint/no-empty-function
	_init(): Promise<void> | void {}
	// eslint-disable-next-line @typescript-eslint/no-empty-function
	_exit(): Promise<void> | void {}
	// eslint-disable-next-line @typescript-eslint/no-empty-function
	_entry(): Promise<void> | void {}
	// eslint-disable-next-line @typescript-eslint/no-empty-function,@typescript-eslint/no-unused-vars
	_error(err: Error): Promise<void> | void {}

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

export class FatalError<Context, Protocol> extends TopState<Context, Protocol> {}

/** @internal */
let id = 10000000;

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
			hsm.logTrace(`about to call #_init on '${currState.name}'`);
			currState.prototype['_init'].call(hsm);
			hsm.logTrace(`#_init on '${currState.name}' called`);
		} else {
			hsm.logTrace(`#_init on '${currState.name}' - default empty implementation`);
		}
		// Entry
		if (Object.prototype.hasOwnProperty.call(currState.prototype, '_entry')) {
			hsm.logTrace(`about to call #_entry on '${currState.name}'`);
			currState.prototype['_entry'].call(hsm);
			hsm.logTrace(`#_entry on '${currState.name}' called`);
		} else {
			hsm.logTrace(`#_entry on '${currState.name}' - default empty implementation`);
		}

		if (hasInitialState(currState)) {
			const newInitialState = getInitialState(currState);
			hsm.logTrace(`'${currState.name}' initial state is '${newInitialState.name}'`);
			currState = newInitialState;
		} else {
			hsm.logTrace(`'${currState.name}' has no initial state; final state is '${currState.name}'`);
			hsm.state = currState;
			break;
		}
	}
	--hsm.indent;
	hsm.logDebug(`initialized from top state '${hsm.TopState.name}'`);
}

// eslint-disable-next-line valid-jsdoc
/** @internal */
class DebugTransition<Context, Protocol> implements ITransition<Context, Protocol> {
	constructor(private exitList: Array<StateConstructor<Context, Protocol>>, private entryList: Array<StateConstructor<Context, Protocol>>, private src: StateConstructor<Context, Protocol>, private dst: StateConstructor<Context, Protocol>) {}

	async execute(hsm: Hsm<Context, Protocol>): Promise<void> {
		++hsm.indent;
		const exitLen = this.exitList.length;
		try {
			for (let i = 0; i < exitLen; ++i) {
				const lastState = this.exitList[i].prototype;
				if (Object.prototype.hasOwnProperty.call(lastState, '_exit')) {
					hsm.logTrace(`about to call #_exit on '${this.exitList[i].name}'`);
					const res = lastState._exit.call(hsm);
					if (Object.isPrototypeOf.call(hsm, Promise)) {
						await res;
					}
					hsm.logTrace(`#_exit on '${this.exitList[i].name}' done`);
				} else {
					hsm.logTrace(`#_exit on '${this.exitList[i].name}' - default empty implementation`);
				}
			}
			const entryLen = this.entryList.length;
			let lastState = hsm.state;
			for (let i = 0; i < entryLen; ++i) {
				lastState = this.entryList[i];
				const stateProto = lastState.prototype;
				if (Object.prototype.hasOwnProperty.call(stateProto, '_entry')) {
					hsm.logTrace(`about to call #_entry on '${this.entryList[i].name}'`);
					const res = stateProto._entry.call(hsm);
					if (Object.isPrototypeOf.call(hsm, Promise)) {
						await res;
					}
					hsm.logTrace(`#_entry on '${this.entryList[i].name}' done`);
				} else {
					hsm.logTrace(`#_entry on '${this.entryList[i].name}' - default empty implementation`);
				}
			}
			hsm.state = lastState;
		} catch (err) {
			hsm.logTrace(`an Error has been thrown while executing a transition from '${this.src.name}' to '${this.dst.name}'`);
			hsm.logError(err);
			hsm.logTrace(`an Error has been thrown while executing a transition from '${this.src.name}' to '${this.dst.name}'`);
		} finally {
			--hsm.indent;
		}
	}
}

// eslint-disable-next-line valid-jsdoc
/** @internal */
function getTraceTransition<Context, Protocol>(srcState: StateConstructor<Context, Protocol>, destState: StateConstructor<Context, Protocol>, topState: StateConstructor<Context, Protocol>): ITransition<Context, Protocol> {
	const src: StateConstructor<Context, Protocol> = srcState;
	let dst: StateConstructor<Context, Protocol> = destState;
	let srcPath: StateConstructor<Context, Protocol>[] = [];
	const end: StateConstructor<Context, Protocol> = topState;
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

	while (hasInitialState(dst)) {
		dst = getInitialState(dst);
		dstPath.push(dst);
	}

	return new DebugTransition<Context, Protocol>(srcPath, dstPath, src, dst);
}

async function traceDispatch<Context, Protocol extends Any | undefined, EventName extends keyof Protocol>(hsm: Hsm<Context, Protocol>, dispatchKind: DispatchKind, eventName: EventHandlerName<Protocol, EventName>, ...eventPayload: EventHandlerPayload<Protocol, EventName>): Promise<EventHandlerReply<Protocol, EventName> | undefined> {
	hsm.logDebug(`dispatch of ${dispatchKind} #${eventName}`);
	++hsm.indent;
	try {
		// Execute the Method lookup
		let messageHandler;
		try {
			const currentState = hsm.state;
			const proto = currentState.prototype;
			messageHandler = proto[eventName];
			if (!messageHandler) {
				// noinspection ExceptionCaughtLocallyJS
				throw new Error(`Unhandled event #${eventName}`); // TODO:
			}
		} catch (err) {
			hsm.logTrace(`failure: call to the #${eventName} handler has raised an error: "${err.message}"`);
			hsm.logTrace(`about to call the #_error handler`);
			const errorHandler = hsm.state.prototype['_error'];
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
					let tr: ITransition<Context, Protocol> | undefined = hsm.transitionCache.get([hsm.state, destState]);
					if (tr === undefined) {
						tr = getTraceTransition(hsm.state, destState, hsm.TopState);
						hsm.transitionCache.set([hsm.state, destState], tr);
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
				hsm.logError(err);
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
			const errorHandler = hsm.state.prototype['_error'];
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
				hsm.logError(err);
				return;
			}
		}
		if (hsm.nextState != null) {
			const srcState = hsm.state;
			const destState = hsm.nextState;
			// Begin Transition
			hsm.logTrace(`requested transition to '${destState.name}'`);
			let tr: ITransition<Context, Protocol> | undefined = hsm.transitionCache.get([srcState, destState]);
			if (!tr) {
				tr = getTraceTransition(hsm.state, destState, TopState);
				hsm.transitionCache.set([hsm.state, destState], tr);
			}
			await tr.execute(hsm);
			hsm.logDebug(`Transition from '${srcState.name}' to '${destState.name}' done`);
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
	constructor(TopState: StateConstructor<Context, Protocol>, instance: IHsmInstance<Context, Protocol>, traceWriter: ITraceWriter, traceLevel: TraceLevel) {
		this.id = generateHsmId();
		this.instance = instance;
		this.ctx = instance.ctx;
		this.TopState = TopState;
		this.topStateName = TopState.name;
		this.contextTypeName = Object.getPrototypeOf(instance.ctx).constructor.name;
		this.state = TopState;
		this.nextState = undefined;
		this.traceWriter = traceWriter;
		this.indent = 0;
		this.transitionCache = new Map();
		this.jobs = [];
		this.isRunning = false;
		this._traceLevel = traceLevel;
	}
	private _traceLevel: TraceLevel;
	get traceLevel(): TraceLevel {
		return this._traceLevel;
	}
	set traceLevel(traceLevel: TraceLevel) {
		this._traceLevel = traceLevel;
	}
	get stateName(): string {
		return Object.getPrototypeOf(this.instance).constructor.name;
	}
	get state(): StateConstructor<Context, Protocol> {
		return Object.getPrototypeOf(this.instance).constructor;
	}
	set state(newState: StateConstructor<Context, Protocol>) {
		Object.setPrototypeOf(this.instance, newState.prototype);
	}
	get traceHeader(): string {
		return '';
	}

	logTrace(msg: string): void {
		if (this._traceLevel == 'all') {
			this.traceWriter.write(this, this.indent, msg);
		}
	}

	logDebug(msg: string): void {
		if (this._traceLevel == 'all' || this._traceLevel == 'debug') {
			this.traceWriter.write(this, this.indent, msg);
		}
	}

	logError(err: Error): void {
		this.traceWriter.writeError(this, this.indent, err);
	}

	send<EventName extends keyof Protocol>(eventName: EventHandlerName<Protocol, EventName>, ...eventPayload: EventHandlerPayload<Protocol, EventName>): Promise<EventHandlerReply<Protocol, EventName>> {
		this.logTrace(`requested send #${eventName}${JSON.stringify(eventPayload)}`);

		return new Promise<EventHandlerReply<Protocol, EventName>>((resolve: (result: EventHandlerReply<Protocol, EventName>) => void, reject: (err: Error) => void) => {
			this.pushTask((doneCallback: () => void) => {
				traceDispatch(this, 'send', eventName, ...eventPayload)
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
	post<EventName extends keyof Protocol>(eventName: EventHandlerName<Protocol, EventName>, ...eventPayload: EventHandlerPayload<Protocol, EventName>): void {
		this.logTrace(`requested post #${eventName}`);
		this.pushTask(this.createPostTask('post', eventName, ...eventPayload));
	}

	deferredPost<EventName extends keyof Protocol>(millis: number, eventName: EventHandlerName<Protocol, EventName>, ...eventPayload: EventHandlerPayload<Protocol, EventName>): void {
		this.logTrace(`requested deferredPost(${millis} millis) #${eventName}`);
		setTimeout(
			function(self: Hsm<Context, Protocol>) {
				self.pushTask(self.createPostTask('deferredPost', eventName, ...eventPayload));
			},
			millis,
			this
		);
	}
	sync(): Promise<void> {
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
	public postInitTask(): this {
		function createInitTask<Context, Protocol>(self: Hsm<Context, Protocol>) {
			return function(doneCallback: () => void): void {
				dispatchDebugInit(self)
					.catch(function(err) {
						console.log(err);
					})
					.finally(function() {
						doneCallback();
					});
			};
		}

		this.pushTask(createInitTask(this));
		return this;
	}

	private createPostTask<EventName extends keyof Protocol>(postKind: 'post' | 'deferredPost', eventName: EventHandlerName<Protocol, EventName>, ...eventPayload: EventHandlerPayload<Protocol, EventName>): Task {
		return (doneCallback: () => void): void => {
			traceDispatch(this, postKind, eventName, ...eventPayload)
				.catch(err => {
					console.log(err);
				})
				.finally(() => {
					doneCallback();
				});
		};
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
}

/** @internal */
let defaultCreateOptions: IHsmOptions = { traceLevel: 'debug', TraceWriterFactory: ConsoleTraceWriter };

/**
 * Used to configure the default _options_ object used when executing the {@link create} or {@link create} functions.
 *
 * @param {IHsmOptions} options the new default options object
 */
export function configure(options: IHsmOptions): void {
	defaultCreateOptions = options;
}

export function configureTraceLevel(TraceLevel: TraceLevel): void {
	defaultCreateOptions.traceLevel = TraceLevel;
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
	instance.hsm = new Hsm(State, instance, traceWriter, userOptions.traceLevel);
	return instance.hsm;
}

export function create<Context, Protocol>(topState: StateConstructor<Context, Protocol>, ctx: Context, options?: IHsmOptions): IHsm<Context, Protocol> {
	return (restore(topState, ctx, options) as Hsm<Context, Protocol>).postInitTask();
}

/**
 * TODO: add doc
 * @param {StateConstructor<Context, Protocol>} TargetState
 */
export function initialState<Context, Protocol>(TargetState: StateConstructor<Context, Protocol>): void {
	const ParentOfTargetState = Object.getPrototypeOf(TargetState.prototype).constructor;
	if (hasInitialState(ParentOfTargetState)) {
		throw new InitialStateError(TargetState);
	}
	Object.defineProperty(TargetState, '_isInitialState', {
		value: true,
		writable: false,
		configurable: false,
		enumerable: false,
	});
	Object.defineProperty(ParentOfTargetState, '_initialState', {
		value: TargetState,
		writable: false,
		configurable: false,
		enumerable: false,
	});
}

// ---------------------------------------------------------------------------------------------------------------------

/** @internal */
enum ErrorCode {
	INITIAL_STATE_ERROR = 1000,
}

export abstract class HsmError extends Error {
	protected constructor(public errorCode: number, message: string, public cause: string, public solution: string) {
		super(message);
	}
	toString(): string {
		return `IHSM-${this.errorCode}: ${this.message}`;
	}
}

export class InitialStateError<Context, Protocol> extends HsmError {
	constructor(TargetState: StateConstructor<Context, Protocol>) {
		const ParentOfTargetState = Object.getPrototypeOf(TargetState.prototype).constructor;
		const CurrentInitialState = getInitialState(ParentOfTargetState);
		const message = 'Non unique initialState';
		const cause = `the @initialState decorator has been set more than once on states that have the same parent state '${ParentOfTargetState.name}'; an initial state must be unique, but it has been found both on '${TargetState.name}' and '${CurrentInitialState.name}'`;
		const solution = `Remove the @initialState decorator either from state '${TargetState.name}' or from state '${CurrentInitialState.name}'`;
		super(ErrorCode.INITIAL_STATE_ERROR, message, cause, solution);
	}
}
