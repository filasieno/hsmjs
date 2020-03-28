/**
 * @category Event handler
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type EventHandlerName<Protocol extends {} | undefined, EventName extends keyof Protocol> = Protocol extends undefined ? string : EventName extends keyof StateBoundHsm<any, any> ? never : EventName;

/**
 * @category Event handler
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type EventHandlerPayload<Protocol extends {} | undefined, EventName extends keyof Protocol> = Protocol extends undefined ? any[] : Protocol[EventName] extends (...payload: infer Payload) => Promise<void> | void ? (Payload extends any[] ? Payload : never) : never;

export type StateConstructor<UserData, Protocol extends {} | undefined> = Function & { prototype: TopState<UserData, Protocol> };
/**
 * The default context type
 */
export type Ctx = Record<string, any>;

export abstract class RuntimeError<Context, Protocol extends {} | undefined, EventName extends keyof Protocol> extends Error {
	eventName: EventName;
	eventPayload: EventHandlerPayload<Protocol, EventName>;
	hsmCurrentState: StateConstructor<Context, Protocol>;
	hsmContext: Context;
	hsmId: string;

	protected constructor(errorName: string, hsm: StateBoundHsm<Context, Protocol>, message: string, public cause?: Error) {
		super(message);
		this.name = errorName;
		this.eventName = hsm.eventName as EventName;
		this.eventPayload = hsm.eventPayload as EventHandlerPayload<Protocol, EventName>;
		this.hsmCurrentState = hsm.currentState;
		this.hsmContext = hsm.ctx;
		this.hsmId = hsm.id;
	}
}

export class TransitionError<Context, Protocol extends {} | undefined, EventName extends keyof Protocol> extends RuntimeError<Context, Protocol, EventName> {
	constructor(hsm: StateBoundHsm<Context, Protocol>, error: Error, public failedState: StateConstructor<Context, Protocol>, public failedCallback: 'onExit' | 'onEntry', public transitionFrom: StateConstructor<Context, Protocol>, public transitionTo: StateConstructor<Context, Protocol>) {
		super('TransitionError', hsm, `an error was thrown by ${failedState.name}.${failedCallback}()`, error);
	}
}

export class EventHandlerError<Context, Protocol extends {} | undefined, EventName extends keyof Protocol> extends RuntimeError<Context, Protocol, EventName> {
	constructor(hsm: StateBoundHsm<Context, Protocol>, cause: Error) {
		super('EventHandlerError', hsm, `an error was thrown while executing event handler #${hsm.eventName} in state '${hsm.currentStateName}'`, cause);
	}
}

export class UnhandledEventError<Context, Protocol extends {} | undefined, EventName extends keyof Protocol> extends RuntimeError<Context, Protocol, EventName> {
	constructor(hsm: StateBoundHsm<Context, Protocol>) {
		super('UnhandledEventError', hsm, `event #${hsm.eventName} was unhandled in state '${hsm.currentStateName}'`);
	}
}

/**
 * todo
 * @category Configuration
 */
export enum TraceLevel {
	NONE,
	DEBUG,
	ALL,
}

/**
 * todo
 * @category Configuration
 */
export interface TraceWriter {
	write<Context, Protocol>(hsm: TraceWriterBoundHsm<Context, Protocol>, msg: any): void;
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
export interface Hsm<Context = Ctx, Protocol extends {} | undefined = undefined> extends BaseHsm<Context, Protocol> {
	sync(): Promise<void>;
	restore(state: StateConstructor<Context, Protocol>, ctx: Context): void;
}

/**
 * @category State machine
 */
export interface StateBoundHsm<Context, Protocol extends {} | undefined> extends BaseHsm<Context, Protocol> {
	readonly ctx: Context;
	readonly traceWriter: TraceWriter;
	transition(nextState: StateConstructor<Context, Protocol>): void;
	unhandled(): never;
	sleep(millis: number): Promise<void>;
	trace(msg: any): void;
}

/** @internal */
interface HsmInstance<Context, Protocol extends {} | undefined> {
	ctx: Context;
	hsm: HsmObject<Context, Protocol>;
}

/** @internal */
type Task = (done: () => void) => void;

/** @internal */
interface Transition<Context, Protocol extends {} | undefined> {
	srcState: StateConstructor<Context, Protocol>;
	dstState: StateConstructor<Context, Protocol>;
	execute(hsm: HsmObject<Context, Protocol>): Promise<void>;
}

/**
 * todo
 * @category Configuration
 */
export interface CreateOptions {
	traceLevel: TraceLevel;
	TraceWriterFactory: new () => TraceWriter;
}

/**
 * @category Configuration
 */
export class ConsoleTraceWriter implements TraceWriter {
	write<Context, Protocol extends {} | undefined>(hsm: StateBoundHsm<Context, Protocol>, trace: any): void {
		if (typeof trace == 'string') {
			console.log(`${hsm.traceHeader}|${trace}`);
		} else {
			console.log(trace);
		}
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
	throw new Error(State.name);
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
		throw new Error(TargetState.name);
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

export interface State<Context, Protocol> {
	onExit(): Promise<void> | void;
	onEntry(): Promise<void> | void;
	onError<EventName extends keyof Protocol>(error: EventHandlerError<Context, Protocol, EventName>): Promise<void> | void;
	onUnhandled<EventName extends keyof Protocol>(error: UnhandledEventError<Context, Protocol, EventName>): Promise<void> | void;
}

export abstract class TopState<Context = Ctx, Protocol extends {} | undefined = undefined> implements StateBoundHsm<Context, Protocol>, State<Context, Protocol> {
	readonly ctx!: Context;
	readonly hsm!: StateBoundHsm<Context, Protocol>;

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
		return this.hsm.currentStateName;
	}

	get currentState(): StateConstructor<Context, Protocol> {
		return this.hsm.currentState;
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
	onExit(): Promise<void> | void {}

	// eslint-disable-next-line @typescript-eslint/no-empty-function
	onEntry(): Promise<void> | void {}

	onError<EventName extends keyof Protocol>(error: RuntimeError<Context, Protocol, EventName>): Promise<void> | void {
		this.trace(error);
		this.transition(FatalErrorState);
	}

	onUnhandled<EventName extends keyof Protocol>(error: UnhandledEventError<Context, Protocol, EventName>): Promise<void> | void {
		this.trace(error);
		this.transition(FatalErrorState);
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

	trace(msg: any): void {
		this.hsm.trace(msg);
	}

	rawTrace(msg: any): void {
		this.hsm.traceWriter.write(this.hsm, msg);
	}
}

export class FatalErrorState<Context, Protocol extends {} | undefined> extends TopState<Context, Protocol> {}

/** @internal */
let id = 10000000;

// eslint-disable-next-line valid-jsdoc
/** @internal */
function generateHsmId(): string {
	return `${++id}`;
}

// eslint-disable-next-line valid-jsdoc
/** @internal */
async function dispatchTraceInit<Context, Protocol extends {} | undefined, EventName extends keyof Protocol>(hsm: HsmObject<Context, Protocol>): Promise<void> {
	let currState: StateConstructor<Context, Protocol> = hsm.topState;
	hsm.logTrace(`begin initialize`);
	++hsm.traceContextLevel;
	try {
		while (true) {
			if (Object.prototype.hasOwnProperty.call(currState.prototype, 'onEntry')) {
				hsm.logTrace(`pre #onEntry '${currState.name}'`);
				currState.prototype['onEntry'].call(hsm);
				hsm.logTrace(`post #onEntry '${currState.name}'`);
			} else {
				hsm.logTrace(`skip #onEntry '${currState.name}': default empty implementation`);
			}

			if (hasInitialState(currState)) {
				const newInitialState = getInitialState(currState);
				hsm.logTrace(`'${currState.name}' initial state is '${newInitialState.name}'`);
				currState = newInitialState;
			} else {
				hsm.logTrace(`'${currState.name}' has no initial state; final state is '${currState.name}'`);
				break;
			}
		}
		--hsm.traceContextLevel;
		hsm.currentState = currState;
		hsm.logTrace(`end initialize`);
		hsm.logDebug(`initialized from state '${hsm.topState.name}'`);
	} catch (err) {
		hsm.logTrace(`error #onEntry '${currState.name}'`);
		--hsm.traceContextLevel;
		hsm.logTrace(`end initialize`);
		hsm.currentState = FatalErrorState;
		hsm.logDebug(`initialized from state '${hsm.topState.name} in state ${currState.name}; final state is 'FatalErrorState'`);
		hsm.logError(err);
	}
}

// eslint-disable-next-line valid-jsdoc
/** @internal */
class TraceTransition<Context, Protocol extends {} | undefined, EventName extends keyof Protocol> implements Transition<Context, Protocol> {
	constructor(private exitList: Array<StateConstructor<Context, Protocol>>, private entryList: Array<StateConstructor<Context, Protocol>>, public srcState: StateConstructor<Context, Protocol>, public dstState: StateConstructor<Context, Protocol>) {}

	async execute<EventName extends keyof Protocol>(hsm: HsmObject<Context, Protocol>): Promise<void> {
		++hsm.traceContextLevel;
		try {
			// Execute exit
			for (const state of this.exitList) {
				const statePrototype = state.prototype;
				const stateName = state.name;
				if (Object.prototype.hasOwnProperty.call(statePrototype, 'onExit')) {
					hsm.logTrace(`pre #onExit '${stateName}'`);
					try {
						const res = statePrototype.onExit.call(hsm);
						if (res) await res;
						hsm.logTrace(`post #onExit '${stateName}'`);
					} catch (e) {
						hsm.logTrace(`FATAL ERROR! #onExit '${stateName}' has failed`);
						throw new TransitionError(hsm, e, state, 'onExit', this.srcState, this.dstState);
					}
				} else {
					hsm.logTrace(`skip #onExit '${stateName}': default empty implementation`);
				}
			}

			// Execute entry
			for (const state of this.entryList) {
				const statePrototype = state.prototype;
				const stateName = state.name;
				if (Object.prototype.hasOwnProperty.call(statePrototype, 'onEntry')) {
					hsm.logTrace(`pre #onEntry '${stateName}'`);
					try {
						const res = statePrototype.onEntry.call(hsm);
						if (res) await res;
						hsm.logTrace(`post #onEntry '${stateName}'`);
					} catch (e) {
						hsm.logTrace(`error #onEntry '${stateName}' has failed`);
						throw new TransitionError(hsm, e, state, 'onEntry', this.srcState, this.dstState);
					}
				} else {
					hsm.logTrace(`skip #onEntry '${stateName}': default empty implementation`);
				}
			}

			if (this.entryList.length !== 0) {
				hsm.currentState = this.entryList[this.entryList.length - 1];
				return;
			}
			if (this.exitList.length !== 0) {
				hsm.currentState = Object.getPrototypeOf(this.exitList[this.exitList.length - 1]);
			}

			return; // Empty transition lists
		} finally {
			--hsm.traceContextLevel;
		}
	}
}

// eslint-disable-next-line valid-jsdoc
/** @internal */
function getTraceTransition<Context, Protocol extends {} | undefined, EventName extends keyof Protocol>(srcState: StateConstructor<Context, Protocol>, destState: StateConstructor<Context, Protocol>): Transition<Context, Protocol> {
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

	while (hasInitialState(dst)) {
		dst = getInitialState(dst);
		dstPath.push(dst);
	}

	return new TraceTransition<Context, Protocol, EventName>(srcPath, dstPath, srcState, destState);
}

async function doTransition<Context, Protocol extends {} | undefined>(hsm: HsmObject<Context, Protocol>): Promise<void> {
	try {
		if (hsm.transitionState) {
			const srcState = hsm.currentState;
			const destState = hsm.transitionState;
			hsm.logTrace(`requested transition to from '${srcState.name}' to '${destState.name}'`);
			let tr: Transition<Context, Protocol> | undefined = hsm.transitionCache.get([srcState, destState]);
			if (!tr) {
				tr = getTraceTransition(hsm.currentState, destState);
				hsm.transitionCache.set([hsm.currentState, destState], tr);
			}
			try {
				hsm.logTrace(`begin transition`);
				await tr.execute(hsm);
				hsm.logDebug(`Transition from '${srcState.name}' to '${destState.name}' done; final state ${hsm.currentState.name}`);
			} catch (transitionError) {
				hsm.currentState = FatalErrorState;
				hsm.logDebug(`Transition from '${srcState.name}' to '${destState.name}' failed; final state ${hsm.currentState.name}`);
				throw transitionError;
			} finally {
				hsm.logTrace(`end transition`);
			}
		} else {
			hsm.logTrace('no transition requested');
		}
	} finally {
		hsm.transitionState = undefined;
	}
}

async function doError<Context, Protocol extends {} | undefined, EventName extends keyof Protocol>(hsm: HsmObject<Context, Protocol>, eventName: EventHandlerName<Protocol, EventName>, err: Error): Promise<void> {
	hsm.logDebug(`error: #${eventName} event handler has raised ${err.name}${err.message ? ': ' + err.message : ' with no error message'}`);
	hsm.logTrace('begin error recovery');
	++hsm.traceContextLevel;
	try {
		const errorHandler = hsm.currentState.prototype.onError;
		try {
			hsm.logTrace(`pre #onError handler`);
			const dispatchResult = errorHandler.call(hsm.instance, new EventHandlerError(hsm, err));
			if (dispatchResult) await dispatchResult;
			hsm.logTrace(`post #onError handler`);
		} catch (err) {
			hsm.currentState = FatalErrorState;
			hsm.logTrace(`error #onError handler has raised ${err.name}: ${err.message}; final state is '${FatalErrorState.name}'`);
			hsm.logError(err);
		}
		// Execute Transition
		try {
			await doTransition(hsm);
		} catch (transitionError) {
			hsm.logError(transitionError);
		}
	} finally {
		--hsm.traceContextLevel;
		hsm.logTrace('end error recovery');
		hsm.logTrace(`error recovery done: #${eventName} event handler has raised ${err.name}${err.message ? ': ' + err.message : ' with no error message'}`);
	}
}

async function doMessageHandlerCall<Context, Protocol extends {} | undefined, EventName extends keyof Protocol>(hsm: HsmObject<Context, Protocol>, messageHandler: (...payload: EventHandlerPayload<Protocol, EventName>) => Promise<void> | void, eventName: EventHandlerName<Protocol, EventName>, eventPayload: EventHandlerPayload<Protocol, EventName>): Promise<void> {
	try {
		hsm.logTrace(`pre #${eventName} event handler`);
		const result = messageHandler.call(hsm.instance, ...eventPayload);
		if (result) await result;
		hsm.logTrace(`post #${eventName} event handler`);
		try {
			await doTransition(hsm);
		} catch (transitionError) {
			hsm.logError(transitionError);
		}
	} catch (err) {
		await doError(hsm, eventName, err);
	}
}

async function doUnhandledEventCall<Context, Protocol extends {} | undefined, EventName extends keyof Protocol>(hsm: HsmObject<Context, Protocol>, eventName: EventHandlerName<Protocol, EventName>, messageHandler: (error: UnhandledEventError<Context, Protocol, EventName>) => Promise<void> | void, error: UnhandledEventError<Context, Protocol, EventName>): Promise<void> {
	try {
		hsm.logTrace(`pre #onUnhandled event handler`);
		const result = messageHandler.call(hsm.instance, error);
		if (result) await result;
		hsm.logTrace(`post #onUnhandled event handler`);
		try {
			await doTransition(hsm);
		} catch (transitionError) {
			hsm.logError(transitionError);
		}
	} catch (err) {
		await doError(hsm, eventName, err);
	}
}

function doHandlerLookup<Context, Protocol extends {} | undefined, EventName extends keyof Protocol>(hsm: HsmObject<Context, Protocol>, eventName: EventHandlerName<Protocol, EventName>): ((...args: EventHandlerPayload<Protocol, EventName>) => Promise<void> | void) | undefined {
	hsm.logTrace(`pre #${eventName} lookup `);
	const handler = hsm.currentState.prototype[eventName];
	if (handler) {
		hsm.logTrace(`post #${eventName} lookup `);
		return handler;
	} else {
		hsm.logTrace(`error #${eventName} lookup `);
		return undefined;
	}
}

// eslint-disable-next-line valid-jsdoc
/** @internal */
async function traceDispatch<Context, Protocol extends {} | undefined, EventName extends keyof Protocol>(hsm: HsmObject<Context, Protocol>, eventName: EventHandlerName<Protocol, EventName>, ...eventPayload: EventHandlerPayload<Protocol, EventName>): Promise<void> {
	if (hsm.currentEventName !== undefined) {
		throw new Error('Fatal dispatch error: the RTC condition has been violated; please post an issue');
	}
	hsm.logDebug(`dispatch of #${eventName}`);
	try {
		hsm.logTrace(`begin dispatch`);
		hsm.currentEventName = eventName as string;
		hsm.currentEventPayload = eventPayload;
		++hsm.traceContextLevel;

		const prototype = hsm.currentState.prototype;
		const messageHandler = doHandlerLookup(hsm, eventName);
		if (!messageHandler) {
			hsm.logTrace(`error #${eventName} lookup: using #onUnhandled as event handler for #${eventName}`);
			const onUnhandledEventHandler = prototype['onUnhandled'];
			await doUnhandledEventCall(hsm, eventName, onUnhandledEventHandler, new UnhandledEventError(hsm));
		} else {
			hsm.logTrace(`post #${eventName} lookup`);
			await doMessageHandlerCall(hsm, messageHandler, eventName, eventPayload);
		}
	} finally {
		--hsm.traceContextLevel;
		hsm.logTrace(`end dispatch`);
		hsm.currentEventName = undefined;
		hsm.currentEventPayload = undefined;
		hsm.transitionState = undefined;
	}
}

/** @internal */
class HsmObject<Context, Protocol extends {} | undefined> implements Hsm<Context, Protocol>, StateBoundHsm<Context, Protocol> {
	public readonly id: string;
	public readonly topState: StateConstructor<Context, Protocol>;
	public readonly topStateName: string;
	public readonly contextTypeName: string;
	public ctx: Context;
	public instance: HsmInstance<Context, Protocol>;
	public traceContextLevel: number;
	public transitionCache: Map<[StateConstructor<Context, Protocol>, StateConstructor<Context, Protocol>], Transition<Context, Protocol>> = new Map();
	public jobs: Task[];
	public isRunning = false;
	public transitionState?: StateConstructor<Context, Protocol>;
	public traceWriter: TraceWriter;
	public currentEventName?: string;
	public currentEventPayload?: any[];

	constructor(TopState: StateConstructor<Context, Protocol>, instance: HsmInstance<Context, Protocol>, traceWriter: TraceWriter, traceLevel: TraceLevel) {
		this.id = generateHsmId();
		this.instance = instance;
		this.ctx = instance.ctx;
		this.topState = TopState;
		this.topStateName = TopState.name;
		this.contextTypeName = Object.getPrototypeOf(instance.ctx).constructor.name;
		this.currentState = TopState;
		this.transitionState = undefined;
		this.traceWriter = traceWriter;
		this.traceContextLevel = 0;
		this.transitionCache = new Map();
		this.jobs = [];
		this.isRunning = false;
		this._traceLevel = traceLevel;
		this.currentEventName = undefined;
		this.currentEventPayload = undefined;
	}

	private _traceLevel: TraceLevel;
	get traceLevel(): TraceLevel {
		return this._traceLevel;
	}

	set traceLevel(traceLevel: TraceLevel) {
		this._traceLevel = traceLevel;
	}

	get eventName(): string {
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		return this.currentEventName! as string;
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	get eventPayload(): any[] {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/no-non-null-assertion
		return this.currentEventPayload! as any[];
	}

	get currentStateName(): string {
		const proto = Object.getPrototypeOf(this.instance);
		return proto.constructor.name;
	}

	get currentState(): StateConstructor<Context, Protocol> {
		const proto = Object.getPrototypeOf(this.instance);
		return proto.constructor;
	}

	set currentState(newState: StateConstructor<Context, Protocol>) {
		Object.setPrototypeOf(this.instance, newState.prototype);
	}

	get traceHeader(): string {
		return `${this.contextTypeName}|${this.id}|${' '.repeat(this.traceContextLevel * 4)}${this.currentStateName}`;
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
		this.traceWriter.write(this, err);
	}

	trace(msg: any): void {
		this.traceWriter.write(this, msg);
	}

	post<EventName extends keyof Protocol>(eventName: EventHandlerName<Protocol, EventName>, ...eventPayload: EventHandlerPayload<Protocol, EventName>): void {
		this.pushTask(this.createPostTask(eventName, ...eventPayload));
	}

	deferredPost<EventName extends keyof Protocol>(millis: number, eventName: EventHandlerName<Protocol, EventName>, ...eventPayload: EventHandlerPayload<Protocol, EventName>): void {
		setTimeout(
			function(self: HsmObject<Context, Protocol>) {
				self.pushTask(self.createPostTask(eventName, ...eventPayload));
			},
			millis,
			this
		);
	}

	sync(): Promise<void> {
		this.logTrace('sync(): waiting for task completion ...');

		function createDonePromise<Context, Protocol extends undefined | {}, EventName extends keyof Protocol>(self: HsmObject<Context, Protocol>): Promise<void> {
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
		this.transitionState = nextState;
	}

	unhandled(): never {
		throw new Error('Unhandled event');
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
		function createInitTask<Context, Protocol extends {} | undefined, EventName extends keyof Protocol>(self: HsmObject<Context, Protocol>) {
			return function(doneCallback: () => void): void {
				dispatchTraceInit(self)
					.catch(function(err) {
						console.log('!!!!!!!!!!!!!!! FATAL ERROR');
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

	private createPostTask<EventName extends keyof Protocol>(eventName: EventHandlerName<Protocol, EventName>, ...eventPayload: EventHandlerPayload<Protocol, EventName>): Task {
		return (doneCallback: () => void): void => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			traceDispatch(this, eventName, ...eventPayload)
				.catch((err: Error) => {
					this.logError(err);
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
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		this.exec(task!);
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

	restore(state: Function & { prototype: TopState<Context, Protocol> }, ctx: Context): void {
		this.currentState = state;
		this.instance.ctx = ctx;
		this.ctx = ctx;
	}
}

/** @internal */
let defaultCreateOptions: CreateOptions = { traceLevel: TraceLevel.NONE, TraceWriterFactory: ConsoleTraceWriter };

/**
 * Used to configureHsm the default _options_ object used when executing the {@link create} or {@link create} functions.
 *
 * @param {CreateOptions} options the new default options object
 * @category Configuration
 */
export function configureHsm(
	options: CreateOptions = {
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
 * @param {CreateOptions} options
 * @return {Hsm<Context, Protocol>}
 * @category TopState machine factory
 */
export function create<Context, Protocol extends {} | undefined, EventName extends keyof Protocol>(topState: StateConstructor<Context, Protocol>, ctx: Context, start = true, options?: CreateOptions): Hsm<Context, Protocol> {
	const userOptions = options ? options : defaultCreateOptions;
	const instance: HsmInstance<Context, Protocol> = {
		ctx: ctx,
		hsm: (undefined as unknown) as HsmObject<Context, Protocol>,
	};
	Object.setPrototypeOf(instance, topState.prototype);
	const traceWriter = new userOptions.TraceWriterFactory();
	instance.hsm = new HsmObject(topState, instance, traceWriter, userOptions.traceLevel);
	if (start) {
		instance.hsm.postInitTask();
	}
	return instance.hsm;
}
