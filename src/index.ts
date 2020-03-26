/**
 * @category Event handler
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type EventHandlerName<Protocol extends {} | undefined, EventName extends keyof Protocol> = Protocol extends undefined ? string : EventName extends keyof StateBoundHsm<any, any> ? never : EventName;

/**
 * @category Event handler
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type EventHandlerPayload<Protocol extends {} | undefined, EventName extends keyof Protocol> = Protocol extends undefined ? any[] : Protocol[EventName] extends (...payload: infer Payload) => any ? (Payload extends any[] ? Payload : never) : never; // ;

/**
 * @category Event handler
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type EventHandlerReply<Protocol extends {} | undefined, EventName extends keyof Protocol> = Protocol extends undefined ? any : Protocol[EventName] extends (...payload: any[]) => infer ReturnType ? (ReturnType extends Promise<infer Value> ? Value : ReturnType) : never;

export type StateConstructor<UserData, Protocol extends {} | undefined> = Function & { prototype: TopState<UserData, Protocol> };

/**
 * todo
 * @category Configuration
 */
export enum TraceLevel {
	ALL = 'ALL',
	DEBUG = 'DEBUG',
	NONE = 'NONE',
}

/** @internal */
type DispatchType = 'post' | 'send' | 'deferredPost';

/**
 * todo
 * @category Configuration
 */
export interface TraceWriter {
	write<Context, Protocol>(hsm: TraceWriterBoundHsm<Context, Protocol>, msg: string): void;
	writeError<Context, Protocol>(hsm: TraceWriterBoundHsm<Context, Protocol>, error: Error): void;
}

/**
 * @category State machine
 */
export interface TraceWriterBoundHsm<Context, Protocol extends {} | undefined> {
	readonly id: string;
	readonly currentState: StateConstructor<Context, Protocol>;
	readonly currentStateName: string;
	readonly topState: StateConstructor<Context, Protocol>;
	readonly topStateName: string;
	readonly contextTypeName: string;
	readonly traceLevel: TraceLevel;
	readonly traceContextLevel: number;
	readonly traceHeader: string;
	readonly eventName: string;
	readonly eventPayload: any[];
	readonly dispatchType: DispatchType;
}

/**
 * @category State machine
 */
export interface BaseHsm<Context, Protocol extends {} | undefined> extends TraceWriterBoundHsm<Context, Protocol> {
	post<EventName extends keyof Protocol>(eventName: EventHandlerName<Protocol, EventName>, ...eventPayload: EventHandlerPayload<Protocol, EventName>): void;
	deferredPost<EventName extends keyof Protocol>(millis: number, eventName: EventHandlerName<Protocol, EventName>, ...eventPayload: EventHandlerPayload<Protocol, EventName>): void;
}

/**
 * @category State machine
 */
export interface Hsm<Context, Protocol extends {} | undefined> extends BaseHsm<Context, Protocol> {
	send<EventName extends keyof Protocol>(eventName: EventHandlerName<Protocol, EventName>, ...eventPayload: EventHandlerPayload<Protocol, EventName>): Promise<EventHandlerReply<Protocol, EventName>>;
	sync(): Promise<void>;
	// restore(state: StateConstructor<Context, Protocol>, ctx: Context): void;
}

/**
 * @category State machine
 */
export type HsmWithProtocol<Protocol extends {} | undefined> = Hsm<{ [key: string]: any }, Protocol>;

/**
 * @category State machine
 */
export type HsmWithContext<Context> = Hsm<Context, undefined>;

/**
 * @category State machine
 */
export interface StateBoundHsm<Context, Protocol extends {} | undefined> extends BaseHsm<Context, Protocol> {
	readonly traceWriter: TraceWriter;
	transition(nextState: StateConstructor<Context, Protocol>): void;
	unhandled(): never;
	sleep(millis: number): Promise<void>;
}

/** @internal */
interface HsmInstance<Context, Protocol extends {} | undefined, EventName extends keyof Protocol> {
	ctx: Context;
	hsm: HsmObject<Context, Protocol, EventName>;
}

/** @internal */
type Task = (done: () => void) => void;

/** @internal */
interface Transition<Context, Protocol extends {} | undefined, EventName extends keyof Protocol> {
	srcState: StateConstructor<Context, Protocol>;
	dstState: StateConstructor<Context, Protocol>;
	execute<EventName extends keyof Protocol>(hsm: HsmObject<Context, Protocol, EventName>, eventName: EventHandlerName<Protocol, EventName>): Promise<void>;
}

/**
 * todo
 * @category Configuration
 */
export interface HsmOptions {
	traceLevel: TraceLevel;
	TraceWriterFactory: new () => TraceWriter;
}

/**
 * Common fields and methods to ALL _ihsm_ errors.
 * @category Error
 */
export interface HsmError<Context> extends Error {
	errorCode: 1000 | 2001 | 2002 | 2003 | 2004;
	cause: string;
	solution: string;
	toString(): string;
}

/**
 *
 * @category Error
 */
export interface InitialStateError<Context, Protocol extends {} | undefined> extends HsmError<Context> {
	errorCode: 1000;
	targetState: StateConstructor<Context, Protocol>;
}

/**
 * Common fields and methods to ALL _ihsm runtime errors_.
 *
 * A runtime error provides the usual fields and the _context_ and the _state_ at the instant that the error was thrown.
 * @category Error
 */
export interface HsmRuntimeError<Context, Protocol> extends HsmError<Context> {
	errorCode: 2001 | 2002 | 2003 | 2004;
	ctx: Context;
	state: StateConstructor<Context, Protocol>;
}

/**
 * todo
 * @category Error
 */
export interface UnhandledEventError<Context, Protocol extends {} | undefined, EventName extends keyof Protocol> extends HsmRuntimeError<Context, Protocol> {
	errorCode: 2001;
	eventName: EventHandlerName<Protocol, EventName>;
	eventPayload: EventHandlerPayload<Protocol, EventName>;
}

/**
 * todo
 * @category Error
 */
export interface TransitionError<Context, Protocol extends {} | undefined, EventName extends keyof Protocol> extends HsmRuntimeError<Context, Protocol> {
	errorCode: 2002;
	srcState: StateConstructor<Context, Protocol>;
	dstState: StateConstructor<Context, Protocol>;
	eventName: EventHandlerName<Protocol, EventName>;
	callback: 'entry' | 'exit';
	error: Error;
}

/**
 * todo
 * @category Error
 */
export interface EventHandlerError<Context, Protocol extends {} | undefined, EventName extends keyof Protocol> extends HsmRuntimeError<Context, Protocol> {
	errorCode: 2003;
	eventName: EventHandlerName<Protocol, EventName>;
	eventPayload: EventHandlerPayload<Protocol, EventName>;
	error: Error;
}

/**
 * todo
 * @category Error
 */
interface InitializationError<Context, Protocol extends {} | undefined> extends HsmRuntimeError<Context, Protocol> {
	errorCode: 2004;
	topState: StateConstructor<Context, Protocol>;
	callback: 'init' | 'entry';
	error: Error;
}

/**
 * @category Configuration
 */
export class ConsoleTraceWriter implements TraceWriter {
	write<Context, Protocol extends {} | undefined>(hsm: StateBoundHsm<Context, Protocol>, trace: string): void {
		console.log(`${hsm.contextTypeName}|${hsm.id}|${'   '.repeat(hsm.traceContextLevel)}${hsm.currentStateName}|${trace}`);
	}
	writeError<Context, Protocol extends {} | undefined>(hsm: StateBoundHsm<Context, Protocol>, error: Error): void {
		console.log(`${hsm.contextTypeName}|${hsm.id}|${'   '.repeat(hsm.traceContextLevel)}${hsm.currentStateName}|begin error`);
		console.log(error);
		console.log(`${hsm.contextTypeName}|${hsm.id}|${'   '.repeat(hsm.traceContextLevel)}${hsm.currentStateName}|end error`);
	}
}

/**
 * todo
 *
 * @param {StateConstructor<Context, Protocol>} State
 * @return {StateConstructor<Context, Protocol>}
 * @typeparam Context
 * @typeparam Protocol
 * @category Initial state
 */
export function getInitialState<Context, Protocol extends {} | undefined>(State: StateConstructor<Context, Protocol>): StateConstructor<Context, Protocol> {
	if (Object.prototype.hasOwnProperty.call(State, '_initialState')) {
		return (State as { [key: string]: any })._initialState as StateConstructor<Context, Protocol>;
	}
	throw new InitialStateErrorObject(State);
}
/**
 * todo
 *
 * @typeparam Context
 * @typeparam Protocol
 *
 * @param {StateConstructor<Context, Protocol>} State
 * @return {boolean}
 * @category Initial state
 */
export function isInitialState<Context, Protocol extends {} | undefined>(State: StateConstructor<Context, Protocol>): boolean {
	if (Object.prototype.hasOwnProperty.call(State, '_isInitialState')) {
		return (State as { [key: string]: any })._isInitialState;
	}
	return false;
}

/**
 * todo
 *
 * @typeparam Context
 * @typeparam Protocol
 *
 * @param {StateConstructor<Context, Protocol>} State
 * @return {boolean}
 * @category Initial state
 */
export function hasInitialState<Context, Protocol extends {} | undefined>(State: StateConstructor<Context, Protocol>): boolean {
	return Object.prototype.hasOwnProperty.call(State, '_initialState');
}

/**
 * todo
 *
 * @param {StateConstructor<Context, Protocol>} TargetState
 *
 * @typeparam Context
 * @typeparam Protocol
 *
 * @category Initial state
 */
export function initialState<Context, Protocol extends {} | undefined>(TargetState: StateConstructor<Context, Protocol>): void {
	const ParentOfTargetState = Object.getPrototypeOf(TargetState.prototype).constructor;
	if (hasInitialState(ParentOfTargetState)) {
		throw new InitialStateErrorObject(TargetState);
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

export abstract class TopState<Context = { [key: string]: any }, Protocol extends {} | undefined = undefined> implements StateBoundHsm<Context, Protocol> {
	protected readonly ctx!: Context;
	private readonly hsm!: StateBoundHsm<Context, Protocol>;
	get dispatchType(): DispatchType {
		return this.hsm.dispatchType;
	}
	get eventName(): string {
		return this.hsm.eventName;
	}
	get eventPayload(): any[] {
		return this.hsm.eventPayload;
	}
	get traceContextLevel(): number {
		return this.hsm.traceContextLevel;
	}
	get traceHeader(): string {
		return this.hsm.traceHeader;
	}
	get topState(): StateConstructor<Context, Protocol> {
		return this.hsm.topState;
	}
	get currentStateName(): string {
		return Object.getPrototypeOf(this).constructor.name;
	}
	get currentState(): StateConstructor<Context, Protocol> {
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
	get traceWriter(): TraceWriter {
		return this.hsm.traceWriter;
	}
	// eslint-disable-next-line @typescript-eslint/no-empty-function
	_exit(): Promise<void> | void {}
	// eslint-disable-next-line @typescript-eslint/no-empty-function
	_entry(): Promise<void> | void {}
	// eslint-disable-next-line @typescript-eslint/no-empty-function,@typescript-eslint/no-unused-vars
	_error(err: Error): Promise<void> | void {
		this.hsm.traceWriter.writeError(this.hsm, err);
		this.transition(FatalErrorState);
	}
	// eslint-disable-next-line @typescript-eslint/no-empty-function,@typescript-eslint/no-unused-vars
	_unhandled<EventName extends keyof Protocol>(eventName: EventHandlerName<Protocol, EventName>, payload: EventHandlerPayload<Protocol, EventName>): Promise<void> | void {
		this.hsm.unhandled();
	}

	transition(nextState: StateConstructor<Context, Protocol>): void {
		this.hsm.transition(nextState);
	}
	unhandled(): never {
		this.hsm.unhandled();
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
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class TopStateWithProtocol<Protocol extends {} | undefined> extends TopState<{ [key: string]: any }, Protocol> {}

export class TopStateWithContext<Context> extends TopState<Context> {}

/** @internal */
class FatalErrorState<Context, Protocol extends {} | undefined> extends TopState<Context, Protocol> {}

/** @internal */
let id = 10000000;

// eslint-disable-next-line valid-jsdoc
/** @internal */
function generateHsmId(): string {
	return `${++id}`;
}

// eslint-disable-next-line valid-jsdoc
/** @internal */
async function dispatchTraceInit<Context, Protocol extends {} | undefined, EventName extends keyof Protocol>(hsm: HsmObject<Context, Protocol, EventName>): Promise<void> {
	let currState: StateConstructor<Context, Protocol> = hsm.topState;
	hsm.logTrace(`about to initialize`);
	++hsm.traceContextLevel;
	while (true) {
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
			hsm.currentState = currState;
			break;
		}
	}
	--hsm.traceContextLevel;
	hsm.logDebug(`initialized from state '${hsm.topState.name}'`);
}

// eslint-disable-next-line valid-jsdoc
/** @internal */
class TraceTransition<Context, Protocol extends {} | undefined, EventName extends keyof Protocol> implements Transition<Context, Protocol, EventName> {
	constructor(private exitList: Array<StateConstructor<Context, Protocol>>, private entryList: Array<StateConstructor<Context, Protocol>>, public srcState: StateConstructor<Context, Protocol>, public dstState: StateConstructor<Context, Protocol>) {}

	async execute<EventName extends keyof Protocol>(hsm: HsmObject<Context, Protocol, EventName>, eventName: EventHandlerName<Protocol, EventName>): Promise<void> {
		++hsm.traceContextLevel;
		try {
			// Execute exit
			const exitLen = this.exitList.length;
			for (let i = 0; i < exitLen; ++i) {
				const lastState = this.exitList[i].prototype;
				if (Object.prototype.hasOwnProperty.call(lastState, '_exit')) {
					hsm.logTrace(`about to call #_exit on '${this.exitList[i].name}'`);
					try {
						const res = lastState._exit.call(hsm);
						if (Object.isPrototypeOf.call(hsm, Promise)) {
							await res;
						}
						hsm.logTrace(`#_exit on '${this.exitList[i].name}' done`);
					} catch (e) {
						hsm.logTrace(`#_exit on '${this.exitList[i].name}' failed`);
						throw new TransitionErrorObject(this.srcState, this.dstState, hsm.currentState, eventName, 'exit', e, hsm.ctx);
					}
				} else {
					hsm.logTrace(`#_exit on '${this.exitList[i].name}' - default empty implementation`);
				}
			}

			// Execute entry
			const entryLen = this.entryList.length;
			let lastState = hsm.currentState;
			for (let i = 0; i < entryLen; ++i) {
				lastState = this.entryList[i];
				const stateProto = lastState.prototype;
				if (Object.prototype.hasOwnProperty.call(stateProto, '_entry')) {
					hsm.logTrace(`about to call #_entry on '${this.entryList[i].name}'`);
					try {
						const res = stateProto._entry.call(hsm);
						if (Object.isPrototypeOf.call(hsm, Promise)) {
							await res;
						}
						hsm.logTrace(`#_entry on '${this.entryList[i].name}' done`);
					} catch (e) {
						hsm.logTrace(`#_entry on '${this.entryList[i].name}' failed`);
						throw new TransitionErrorObject(this.srcState, this.dstState, hsm.currentState, eventName, 'exit', e, hsm.ctx);
					}
				} else {
					hsm.logTrace(`#_entry on '${this.entryList[i].name}' - default empty implementation`);
				}
			}

			// Change TopState
			hsm.currentState = lastState;
		} finally {
			--hsm.traceContextLevel;
		}
	}
}

// eslint-disable-next-line valid-jsdoc
/** @internal */
function getTraceTransition<Context, Protocol extends {} | undefined, EventName extends keyof Protocol>(srcState: StateConstructor<Context, Protocol>, destState: StateConstructor<Context, Protocol>, topState: StateConstructor<Context, Protocol>): Transition<Context, Protocol, EventName> {
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

	return new TraceTransition<Context, Protocol, EventName>(srcPath, dstPath, srcState, destState);
}

// eslint-disable-next-line valid-jsdoc
/** @internal */
async function traceDispatch<Context, Protocol extends {} | undefined, EventName extends keyof Protocol>(hsm: HsmObject<Context, Protocol, EventName>, dispatchType: DispatchType, eventName: EventHandlerName<Protocol, EventName>, ...eventPayload: EventHandlerPayload<Protocol, EventName>): Promise<EventHandlerReply<Protocol, EventName> | undefined> {
	hsm.logDebug(`dispatch of ${dispatchType} #${eventName}`);
	hsm.currentEventName = eventName;
	hsm.currentEventPayload = eventPayload;
	hsm.dispatchType = dispatchType;
	++hsm.traceContextLevel;

	try {
		// Execute the Method lookup
		const currentState = hsm.currentState;
		const proto = currentState.prototype;
		const messageHandler = proto[eventName];
		if (!messageHandler) {
			// noinspection ExceptionCaughtLocallyJS
			throw new UnhandledEventErrorObject(hsm.currentState, eventName, eventPayload, hsm.ctx);
		}

		// Here we have a valid message handler; call the event Handler
		hsm.logTrace(`about to call the #${eventName} handler`);
		let output;
		try {
			const result = messageHandler.call(hsm.instance, ...eventPayload);
			if (result instanceof Promise) {
				// In case of a Promise sleep for the actual result
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
				hsm.logError(err);
				return;
			}
		}

		// Check if a transition was requested

		if (hsm.nextState != null) {
			const srcState = hsm.currentState;
			const destState = hsm.nextState;
			// Begin Transition
			hsm.logTrace(`requested transition to '${destState.name}'`);
			let tr: Transition<Context, Protocol, EventName> | undefined = hsm.transitionCache.get([srcState, destState]);
			if (!tr) {
				tr = getTraceTransition(hsm.currentState, destState, TopState);
				hsm.transitionCache.set([hsm.currentState, destState], tr);
			}
			await tr.execute(hsm, eventName);
			hsm.logDebug(`Transition from '${srcState.name}' to '${destState.name}' done`);
			hsm.nextState = undefined;
			// End Transition
		} else {
			hsm.logTrace(`no transition requested`);
		}
		if (output !== undefined && dispatchType === 'send') {
			hsm.logTrace(`#${eventName} handler is returning: ${JSON.stringify(output)}`);
			return output;
		} else {
			return;
		}
	} finally {
		--hsm.traceContextLevel;
		hsm.logTrace(`dispatch of ${dispatchType} #${eventName} done`);
		hsm.currentEventName = (undefined as unknown) as EventHandlerName<Protocol, EventName>;
		hsm.currentEventPayload = (undefined as unknown) as EventHandlerPayload<Protocol, EventName>;
		hsm.dispatchType = (undefined as unknown) as DispatchType;
	}
}

/** @internal */
class HsmObject<Context, Protocol extends {} | undefined, EventName extends keyof Protocol> implements Hsm<Context, Protocol>, StateBoundHsm<Context, Protocol> {
	public readonly id: string;
	public readonly ctx: Context;
	public readonly topState: StateConstructor<Context, Protocol>;
	public readonly topStateName: string;
	public readonly contextTypeName: string;
	public instance: HsmInstance<Context, Protocol, EventName>;
	public traceContextLevel: number;
	public transitionCache: Map<[StateConstructor<Context, Protocol>, StateConstructor<Context, Protocol>], Transition<Context, Protocol, EventName>> = new Map();
	public jobs: Task[];
	public isRunning = false;
	public nextState?: StateConstructor<Context, Protocol>;
	public traceWriter: TraceWriter;
	public currentEventName!: EventHandlerName<Protocol, EventName>;
	public currentEventPayload!: EventHandlerPayload<Protocol, EventName>;
	public dispatchType!: DispatchType;
	constructor(TopState: StateConstructor<Context, Protocol>, instance: HsmInstance<Context, Protocol, EventName>, traceWriter: TraceWriter, traceLevel: TraceLevel) {
		this.id = generateHsmId();
		this.instance = instance;
		this.ctx = instance.ctx;
		this.topState = TopState;
		this.topStateName = TopState.name;
		this.contextTypeName = Object.getPrototypeOf(instance.ctx).constructor.name;
		this.currentState = TopState;
		this.nextState = undefined;
		this.traceWriter = traceWriter;
		this.traceContextLevel = 0;
		this.transitionCache = new Map();
		this.jobs = [];
		this.isRunning = false;
		this._traceLevel = traceLevel;
		this.currentEventName = (undefined as unknown) as EventHandlerName<Protocol, EventName>;
		this.currentEventPayload = (undefined as unknown) as EventHandlerPayload<Protocol, EventName>;
	}
	private _traceLevel: TraceLevel;
	get traceLevel(): TraceLevel {
		return this._traceLevel;
	}
	set traceLevel(traceLevel: TraceLevel) {
		this._traceLevel = traceLevel;
	}
	get eventName(): string {
		return this.currentEventName as string;
	}
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	get eventPayload(): any[] {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		return this.currentEventPayload as any[];
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
	get traceHeader(): string {
		return '';
	}

	logTrace(msg: string): void {
		if (this._traceLevel == TraceLevel.ALL) {
			this.traceWriter.write(this, msg);
		}
	}

	logDebug(msg: string): void {
		if (this._traceLevel == TraceLevel.ALL || this._traceLevel == TraceLevel.DEBUG) {
			this.traceWriter.write(this, msg);
		}
	}

	logError(err: Error): void {
		this.traceWriter.writeError(this, err);
	}

	send<EventName extends keyof Protocol>(eventName: EventHandlerName<Protocol, EventName>, ...eventPayload: EventHandlerPayload<Protocol, EventName>): Promise<EventHandlerReply<Protocol, EventName>> {
		this.logTrace(`requested send #${eventName}${JSON.stringify(eventPayload)}`);

		return new Promise<EventHandlerReply<Protocol, EventName>>((resolve: (result: EventHandlerReply<Protocol, EventName>) => void, reject: (err: Error) => void) => {
			this.pushTask((doneCallback: () => void) => {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				traceDispatch<Context, Protocol, EventName>(this as any, 'send', eventName, ...eventPayload)
					.then((result: EventHandlerReply<Protocol, EventName> | undefined) => {
						resolve(result as EventHandlerReply<Protocol, EventName>);
					})
					.catch((err: Error) => {
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
			function(self: HsmObject<Context, Protocol, EventName>) {
				self.pushTask(self.createPostTask('deferredPost', eventName, ...eventPayload));
			},
			millis,
			this
		);
	}
	sync(): Promise<void> {
		this.logTrace('sync(): waiting for task completion ...');
		function createDonePromise<Context, Protocol extends undefined | {}, EventName extends keyof Protocol>(self: HsmObject<Context, Protocol, EventName>): Promise<void> {
			return new Promise<void>(function(resolve) {
				self.pushTask(function(doneCallback: () => void): void {
					resolve();
					doneCallback();
					self.logTrace('sync(): all tasks completed');
				});
			});
		}
		return createDonePromise(this);
	}
	transition(nextState: StateConstructor<Context, Protocol>): void {
		this.nextState = nextState;
	}
	unhandled(): never {
		throw new UnhandledEventErrorObject(this.currentState, this.currentEventName, this.currentEventPayload, this.ctx);
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
		function createInitTask<Context, Protocol extends {} | undefined, EventName extends keyof Protocol>(self: HsmObject<Context, Protocol, EventName>) {
			return function(doneCallback: () => void): void {
				dispatchTraceInit(self)
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
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			traceDispatch<Context, Protocol, EventName>(this as any, postKind, eventName, ...eventPayload)
				.catch((err: Error) => {
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
		if (task === undefined) throw new Error('Illegal currentState exceptions');
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
let defaultCreateOptions: HsmOptions = { traceLevel: TraceLevel.NONE, TraceWriterFactory: ConsoleTraceWriter };

/**
 * Used to configureHsm the default _options_ object used when executing the {@link createHsm} or {@link createHsm} functions.
 *
 * @param {HsmOptions} options the new default options object
 * @category Configuration
 */
export function configureHsm(
	options: HsmOptions = {
		traceLevel: TraceLevel.NONE,
		TraceWriterFactory: ConsoleTraceWriter,
	}
): void {
	defaultCreateOptions = { traceLevel: options.traceLevel, TraceWriterFactory: options.TraceWriterFactory };
}

/**
 * todo
 * @param {TraceLevel} traceLevel
 * @category Configuration
 */
export function configureHsmTraceLevel(traceLevel: TraceLevel = TraceLevel.NONE): void {
	defaultCreateOptions.traceLevel = traceLevel;
}

// eslint-disable-next-line valid-jsdoc
/**
 * todo
 * @param {{new(): TraceWriter}} traceWriterFactory
 * @category Configuration
 */
export function configureHsmTraceWriter(traceWriterFactory: new () => TraceWriter = ConsoleTraceWriter): void {
	defaultCreateOptions.TraceWriterFactory = traceWriterFactory;
}

/**
 *
 * @param {StateConstructor<Context, Protocol>} topState
 * @param {Context} ctx
 * @param {boolean} start
 * @param {HsmOptions} options
 * @return {Hsm<Context, Protocol>}
 * @category TopState machine factory
 */
export function createHsm<Context, Protocol extends {} | undefined, EventName extends keyof Protocol>(topState: StateConstructor<Context, Protocol>, ctx: Context, start = true, options?: HsmOptions): Hsm<Context, Protocol> {
	const userOptions = options ? options : defaultCreateOptions;
	const instance: HsmInstance<Context, Protocol, EventName> = {
		ctx: ctx,
		hsm: (undefined as unknown) as HsmObject<Context, Protocol, EventName>,
	};
	Object.setPrototypeOf(instance, topState.prototype);
	const traceWriter = new userOptions.TraceWriterFactory();
	instance.hsm = new HsmObject(topState, instance, traceWriter, userOptions.traceLevel);
	if (start) {
		instance.hsm.postInitTask();
	}
	return instance.hsm;
}

// ---------------------------------------------------------------------------------------------------------------------
// Hsm Error Interface
// ---------------------------------------------------------------------------------------------------------------------

/** @internal */
abstract class HsmErrorObject<Context> extends Error implements HsmError<Context> {
	abstract readonly errorCode: 1000 | 2001 | 2002 | 2003 | 2004;
	protected constructor(message: string, public cause: string, public solution: string) {
		super(message);
	}
	toString(): string {
		return `IHSM-${this.errorCode}: ${this.message}`;
	}
}

/** @internal */
abstract class HsmRuntimeErrorObject<Context, Protocol extends {} | undefined> extends HsmErrorObject<Context> implements HsmRuntimeError<Context, Protocol> {
	abstract readonly errorCode: 2001 | 2002 | 2003 | 2004;
	protected constructor(message: string, cause: string, solution: string, public ctx: Context, public state: StateConstructor<Context, Protocol>) {
		super(message, cause, solution);
	}
}

/** @internal */
class InitialStateErrorObject<Context, Protocol extends {} | undefined> extends HsmErrorObject<Context> implements InitialStateError<Context, Protocol> {
	public targetState: StateConstructor<Context, Protocol>;
	public errorCode: 1000;
	constructor(targetState: StateConstructor<Context, Protocol>) {
		const ParentOfTargetState = Object.getPrototypeOf(targetState.prototype).constructor;
		const CurrentInitialState = getInitialState(ParentOfTargetState);
		const message = 'Non unique initialState';
		const cause = `the @initialState decorator has been set more than once on states that have the same parent state '${ParentOfTargetState.name}'; an initial state must be unique, but it has been found both on '${targetState.name}' and '${CurrentInitialState.name}'`;
		const solution = `Remove the @initialState decorator either from state '${targetState.name}' or from state '${CurrentInitialState.name}'`;
		super(message, cause, solution);
		this.targetState = targetState;
		this.errorCode = 1000;
	}
}

/** @internal */
class UnhandledEventErrorObject<Context, Protocol extends {} | undefined, EventName extends keyof Protocol> extends HsmRuntimeErrorObject<Context, Protocol> implements UnhandledEventError<Context, Protocol, EventName> {
	public readonly eventName: EventHandlerName<Protocol, EventName>;
	public readonly eventPayload: EventHandlerPayload<Protocol, EventName>;
	public readonly errorCode: 2001;
	constructor(errorState: StateConstructor<Context, Protocol>, eventName: EventHandlerName<Protocol, EventName>, eventPayload: EventHandlerPayload<Protocol, EventName>, ctx: Context) {
		const message = 'Unhandled event';
		const cause = `Event #${eventName} is unhandled in state '${errorState.name}'`;
		const solution = `Add an #${eventName} event handler in state '${errorState.name}' or in one of the parent states`;
		super(message, cause, solution, ctx, errorState);
		this.ctx = ctx;
		this.eventName = eventName;
		this.eventPayload = eventPayload;
		this.errorCode = 2001;
	}
}

/** @internal */
class TransitionErrorObject<Context, Protocol extends {} | undefined, EventName extends keyof Protocol> extends HsmRuntimeErrorObject<Context, Protocol> implements TransitionError<Context, Protocol, EventName> {
	public readonly errorCode: 2002;
	public readonly srcState: StateConstructor<Context, Protocol>;
	public readonly dstState: StateConstructor<Context, Protocol>;
	public readonly eventName: EventHandlerName<Protocol, EventName>;
	public readonly callback: 'entry' | 'exit';
	public readonly error: Error;
	constructor(srcState: StateConstructor<Context, Protocol>, dstState: StateConstructor<Context, Protocol>, errorState: StateConstructor<Context, Protocol>, eventName: EventHandlerName<Protocol, EventName>, callback: 'entry' | 'exit', error: Error, ctx: Context) {
		const message = 'Transition error';
		const cause = `during the dispatch of #${eventName} an error '${error.message}' was thrown while transitioning from state '${srcState.name}' to state '${dstState.name}'`;
		const solution = `_entry() and _exit() should not throw errors. Add a try/catch block to avoid errors`;
		super(message, cause, solution, ctx, errorState);
		this.srcState = srcState;
		this.dstState = dstState;
		this.eventName = eventName;
		this.callback = callback;
		this.error = error;
		this.errorCode = 2002;
	}
}

/** @internal */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
class InitializationErrorObject<Context, Protocol extends {} | undefined> extends HsmRuntimeErrorObject<Context, Protocol> implements InitializationError<Context, Protocol> {
	public readonly error: Error;
	public readonly topState: StateConstructor<Context, Protocol>;
	public readonly failedState: StateConstructor<Context, Protocol>;
	public readonly callback: 'init' | 'entry';
	public readonly errorCode: 2004;
	constructor(topState: StateConstructor<Context, Protocol>, errorState: StateConstructor<Context, Protocol>, callback: 'init' | 'entry', error: Error, ctx: Context) {
		const message = 'Transition error';
		const cause = `error '${error.message}' was thrown during the initialization of a state machine from top state '${topState.name}'`;
		const solution = `_entry() and _init() should not throw errors. Add a try/catch block in _init()/_entry() callbacks to avoid `;
		super(message, cause, solution, ctx, errorState);
		this.topState = topState;
		this.failedState = errorState;
		this.callback = callback;
		this.error = error;
		this.errorCode = 2004;
	}
}
