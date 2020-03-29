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

export type State<UserData = Any, Protocol extends {} | undefined = undefined> = Function & { prototype: BaseTopState<UserData, Protocol> };
/**
 * The default context type
 */
export type Any = Record<string, any>;

export abstract class RuntimeError<Context, Protocol extends {} | undefined, EventName extends keyof Protocol> extends Error {
	eventName: EventHandlerName<Protocol, EventName>;
	eventPayload: EventHandlerPayload<Protocol, EventName>;
	hsmCurrentState: State<Context, Protocol>;
	hsmContext: Context;
	hsmId: number;

	protected constructor(errorName: string, hsm: StateBoundHsm<Context, Protocol>, message: string, public cause?: Error) {
		super(message);
		this.name = errorName;
		this.eventName = hsm.eventName as EventHandlerName<Protocol, EventName>;
		this.eventPayload = hsm.eventPayload as EventHandlerPayload<Protocol, EventName>;
		this.hsmCurrentState = hsm.currentState;
		this.hsmContext = hsm.ctx;
		this.hsmId = hsm.id;
	}
}

export class TransitionError<Context, Protocol extends {} | undefined, EventName extends keyof Protocol> extends RuntimeError<Context, Protocol, EventName> {
	constructor(hsm: StateBoundHsm<Context, Protocol>, error: Error, public failedState: State<Context, Protocol>, public failedCallback: 'onExit' | 'onEntry', public transitionFrom: State<Context, Protocol>, public transitionTo: State<Context, Protocol>) {
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

export class InitialStateError<Context, Protocol extends {} | undefined> extends Error {
	constructor(targetState: State<Context, Protocol>) {
		super(`State '${Object.getPrototypeOf(targetState).constructor.name}' must not have more than one initial state`);
		this.name = 'InitialStateError';
	}
}

/**
 * todo
 * @category Configuration
 */
export enum TraceLevel {
	NONE,
	DEBUG,
	TRACE,
}

/**
 * todo
 * @category Configuration
 */
export interface TraceWriter {
	write<Context, Protocol>(hsm: TraceWriterBoundHsm<Context, Protocol>, msg: any): void;
	writeTrace<Context, Protocol>(hsm: TraceWriterBoundHsm<Context, Protocol>, trace: TraceLevel, msg: any): void;
}

/**
 * @category StateMachineEvents machine
 */
export interface TraceWriterBoundHsm<Context, Protocol extends {} | undefined> {
	readonly id: number;
	readonly currentState: State<Context, Protocol>;
	readonly currentStateName: string;
	readonly topState: State<Context, Protocol>;
	readonly topStateName: string;
	readonly ctxTypeName: string;
	readonly traceContextLevel: number;
	readonly traceHeader: string;
	readonly eventName: string;
	readonly eventPayload: any[];

	traceLevel: TraceLevel;
	traceWriter: TraceWriter;
	dispatchErrorCallback: DispatchErrorCallback<Context, Protocol>;
}

/**
 * @category StateMachineEvents machine
 */
export interface BaseHsm<Context, Protocol extends {} | undefined> extends TraceWriterBoundHsm<Context, Protocol> {
	post<EventName extends keyof Protocol>(eventName: EventHandlerName<Protocol, EventName>, ...eventPayload: EventHandlerPayload<Protocol, EventName>): void;
	deferredPost<EventName extends keyof Protocol>(millis: number, eventName: EventHandlerName<Protocol, EventName>, ...eventPayload: EventHandlerPayload<Protocol, EventName>): void;
}

/**
 * @category StateMachineEvents machine
 */
export interface Hsm<Context = Any, Protocol extends {} | undefined = undefined> extends BaseHsm<Context, Protocol> {
	sync(): Promise<void>;
	restore(TopState: State<Context, Protocol>, state: State<Context, Protocol>, ctx: Context, options?: Options): void;
}

/**
 * @category StateMachineEvents machine
 */
export interface StateBoundHsm<Context, Protocol extends {} | undefined> extends BaseHsm<Context, Protocol> {
	readonly ctx: Context;
	traceWriter: TraceWriter;
	transition(nextState: State<Context, Protocol>): void;
	unhandled(): never;
	sleep(millis: number): Promise<void>;
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
	srcState: State<Context, Protocol>;
	dstState: State<Context, Protocol>;
	execute(hsm: HsmObject<Context, Protocol>): Promise<void>;
}

/**
 * todo
 * @category Configuration
 */
export interface Options {
	traceLevel: TraceLevel;
	traceWriter: TraceWriter;
	dispatchErrorCallback: <Context, Protocol extends {} | undefined>(hsm: Hsm<Context, Protocol>, traceWriter: TraceWriter, err: Error) => void;
}

/**
 * todo
 * @param {Hsm<Context, Protocol>} hsm
 * @param {TraceWriter} traceWriter
 * @param {Error} err
 */
export function defaultDispatchErrorCallback<Context, Protocol extends {} | undefined>(hsm: Hsm<Context, Protocol>, traceWriter: TraceWriter, err: Error): void {
	traceWriter.write(hsm, `An event dispatch has failed; error ${err.name}: ${err.message} has not been managed`);
	traceWriter.write(hsm, err);
	throw err;
}

/**
 * @category Configuration
 */
export class ConsoleTraceWriter implements TraceWriter {
	writeTrace<Context, Protocol extends {} | undefined>(hsm: StateBoundHsm<Context, Protocol>, traceLevel: TraceLevel, trace: any): void {
		if (hsm.traceLevel < traceLevel) return;
		if (typeof trace == 'string') {
			console.log(`${TraceLevel[traceLevel]}|${hsm.traceHeader}|${trace}`);
		} else {
			console.log(trace);
		}
	}

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
 * @param {State<Context, Protocol>} State
 * @return {State<Context, Protocol>}
 * @typeparam Context
 * @typeparam Protocol
 * @category Initial state
 */
export function getInitialState<Context, Protocol extends {} | undefined>(State: State<Context, Protocol>): State<Context, Protocol> {
	if (Object.prototype.hasOwnProperty.call(State, '_initialState')) {
		return (State as { [key: string]: any })._initialState as State<Context, Protocol>;
	}
	throw new Error(State.name);
}

/**
 * todo
 *
 * @typeparam Context
 * @typeparam Protocol
 *
 * @param {State<Context, Protocol>} State
 * @return {boolean}
 * @category Initial state
 */
export function isInitialState<Context, Protocol extends {} | undefined>(State: State<Context, Protocol>): boolean {
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
 * @param {State<Context, Protocol>} State
 * @return {boolean}
 * @category Initial state
 */
export function hasInitialState<Context, Protocol extends {} | undefined>(State: State<Context, Protocol>): boolean {
	return Object.prototype.hasOwnProperty.call(State, '_initialState');
}

/**
 * todo
 *
 * @param {State<Context, Protocol>} TargetState
 *
 * @typeparam Context
 * @typeparam Protocol
 *
 * @category Initial state
 */
// prettier-ignore
export function initialState<Context, Protocol extends {} | undefined>(TargetState: State<Context, Protocol>): void {
	const ParentOfTargetState = Object.getPrototypeOf(TargetState.prototype).constructor;
	if (hasInitialState(ParentOfTargetState)) throw new InitialStateError(TargetState);
	Object.defineProperty(TargetState, '_isInitialState', {
		value: true, writable: false, configurable: false, enumerable: false,
	});
	Object.defineProperty(ParentOfTargetState, '_initialState', {
		value: TargetState, writable: false, configurable: false, enumerable: false,
	});
}

export interface StateMachineEvents<Context, Protocol> {
	onExit(): Promise<void> | void;
	onEntry(): Promise<void> | void;
	onError<EventName extends keyof Protocol>(error: EventHandlerError<Context, Protocol, EventName>): Promise<void> | void;
	onUnhandled<EventName extends keyof Protocol>(error: UnhandledEventError<Context, Protocol, EventName>): Promise<void> | void;
}

// prettier-ignore
export abstract class BaseTopState<Context = Any, Protocol extends {} | undefined = undefined> implements StateBoundHsm<Context, Protocol>, StateMachineEvents<Context, Protocol> {
	readonly ctx!: Context;
	readonly hsm!: StateBoundHsm<Context, Protocol>;

	constructor() { throw new Error('Fatal error: States cannot be instantiated'); }

	get eventName(): string { return this.hsm.eventName; }

	get eventPayload(): any[] { return this.hsm.eventPayload; }

	get traceContextLevel(): number { return this.hsm.traceContextLevel; }

	get traceHeader(): string { return this.hsm.traceHeader; }

	get topState(): State<Context, Protocol> { return this.hsm.topState; }

	get currentStateName(): string { return this.hsm.currentStateName; }

	get currentState(): State<Context, Protocol> { return this.hsm.currentState; }

	get ctxTypeName(): string { return this.hsm.ctxTypeName; }

	get id(): number { return this.hsm.id; }

	get traceLevel(): TraceLevel { return this.hsm.traceLevel; }

	get topStateName(): string { return this.hsm.topStateName; }

	get traceWriter(): TraceWriter { return this.hsm.traceWriter; }

	set traceWriter(value) {
		this.hsm.traceWriter = value;
	}

	// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
	get dispatchErrorCallback() {
		return this.hsm.dispatchErrorCallback;
	}

	set dispatchErrorCallback(value) {
		this.hsm.dispatchErrorCallback = value;
	}

	transition(nextState: State<Context, Protocol>): void { this.hsm.transition(nextState); }

	unhandled(): never { this.hsm.unhandled(); }

	sleep(millis: number): Promise<void> { return this.hsm.sleep(millis); }

	writeTrace(msg: any): void { this.hsm.traceWriter.write(this.hsm, msg);}

	post<EventName extends keyof Protocol>(eventName: EventHandlerName<Protocol, EventName>, ...eventPayload: EventHandlerPayload<Protocol, EventName>): void {
		this.hsm.post(eventName, ...eventPayload);
	}

	deferredPost<EventName extends keyof Protocol>(millis: number, eventName: EventHandlerName<Protocol, EventName>, ...eventPayload: EventHandlerPayload<Protocol, EventName>): void {
		this.hsm.deferredPost(millis, eventName, ...eventPayload);
	}

	// eslint-disable-next-line @typescript-eslint/no-empty-function
	onExit(): Promise<void> | void {}

	// eslint-disable-next-line @typescript-eslint/no-empty-function
	onEntry(): Promise<void> | void {}

	onError<EventName extends keyof Protocol>(error: RuntimeError<Context, Protocol, EventName>): Promise<void> | void {
		throw error;
	}

	onUnhandled<EventName extends keyof Protocol>(error: UnhandledEventError<Context, Protocol, EventName>): Promise<void> | void {
		throw error;
	}

}

export class FatalErrorState<Context, Protocol extends {} | undefined> extends BaseTopState<Context, Protocol> {}

// eslint-disable-next-line valid-jsdoc
/** @internal */
async function dispatchInitWithTracing<Context, Protocol extends {} | undefined, EventName extends keyof Protocol>(hsm: HsmObject<Context, Protocol>): Promise<void> {
	let currState: State<Context, Protocol> = hsm.topState;
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
		hsm.logDebug(`initialized from state top state '${hsm.topState.name}' to state '${hsm.currentStateName}'`);
	} catch (err) {
		hsm.logTrace(`error #onEntry '${currState.name}'`);
		--hsm.traceContextLevel;
		hsm.logTrace(`end initialize`);
		hsm.currentState = FatalErrorState;
		hsm.logDebug(`fatal error: initialization failed from top state '${hsm.topState.name}' in state '${currState.name}': #onEntry handler has raised ${err.name}${err.message ? `: ${err.message}` : ' with no error message'}; final state is '${hsm.currentStateName}'`);
		throw err;
	}
}

// eslint-disable-next-line valid-jsdoc
/** @internal */
class TraceTransition<Context, Protocol extends {} | undefined, EventName extends keyof Protocol> implements Transition<Context, Protocol> {
	constructor(private exitList: Array<State<Context, Protocol>>, private entryList: Array<State<Context, Protocol>>, public srcState: State<Context, Protocol>, public dstState: State<Context, Protocol>) {}

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
					} catch (cause) {
						hsm.logTrace(`error #onExit '${stateName}' has failed`);
						throw new TransitionError(hsm, cause, state, 'onExit', this.srcState, this.dstState);
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
					} catch (cause) {
						hsm.logTrace(`error #onEntry '${stateName}' has failed`);
						throw new TransitionError(hsm, cause, state, 'onEntry', this.srcState, this.dstState);
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
function getTransitionWithTracing<Context, Protocol extends {} | undefined, EventName extends keyof Protocol>(srcState: State<Context, Protocol>, destState: State<Context, Protocol>): Transition<Context, Protocol> {
	const src: State<Context, Protocol> = srcState;
	let dst: State<Context, Protocol> = destState;
	let srcPath: State<Context, Protocol>[] = [];
	const end: State<Context, Protocol> = BaseTopState;
	const srcIndex: Map<State<Context, Protocol>, number> = new Map();
	const dstPath: State<Context, Context>[] = [];
	let cur: State<Context, Context> = src;
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

async function doTransitionWithTracing<Context, Protocol extends {} | undefined>(hsm: HsmObject<Context, Protocol>): Promise<void> {
	try {
		if (hsm.transitionState) {
			const srcState = hsm.currentState;
			const destState = hsm.transitionState;
			hsm.logTrace(`requested transition to from '${srcState.name}' to '${destState.name}'`);
			let tr: Transition<Context, Protocol> | undefined = hsm.transitionCache.get([srcState, destState]);
			if (!tr) {
				tr = getTransitionWithTracing(hsm.currentState, destState);
				hsm.transitionCache.set([hsm.currentState, destState], tr);
			}
			try {
				hsm.logTrace(`begin transition`);
				await tr.execute(hsm);
				hsm.logTrace(`end transition`);
				hsm.logDebug(`Transition from '${srcState.name}' to '${destState.name}' done; final state is '${hsm.currentState.name}'`);
			} catch (transitionError) {
				hsm.currentState = FatalErrorState;
				hsm.logDebug(`Transition from '${srcState.name}' to '${destState.name}' failed in ${transitionError.failedState.name}.${transitionError.failedCallback}(); final state is '${hsm.currentState.name}'`);
				throw transitionError;
			}
		} else {
			hsm.logTrace('no transition requested');
		}
	} finally {
		hsm.transitionState = undefined;
	}
}

function lookupErrorHandlerWithTracing<Context, Protocol extends {} | undefined, EventName extends keyof Protocol>(hsm: HsmObject<Context, Protocol>): (error: RuntimeError<Context, Protocol, EventName>) => Promise<void> | void {
	let state = hsm.currentState;
	hsm.logTrace(`begin lookup of #onError`);
	++hsm.traceContextLevel;
	while (true) {
		const prototype = state.prototype;
		if (Object.prototype.hasOwnProperty.call(prototype, 'onError')) {
			hsm.logTrace(`found in state '${prototype.constructor.name}'`);
			--hsm.traceContextLevel;
			hsm.logTrace(`end lookup of #onError`);
			hsm.logDebug(`#onError found in state '${prototype.constructor.name}'`);
			return prototype['onError'];
		} else {
			hsm.logTrace(`not found in state '${prototype.constructor.name}'`);
			if (state == BaseTopState) break;
			state = Object.getPrototypeOf(state);
		}
	}
	throw new Error('Illegal state');
}

async function doErrorWithTracing<Context, Protocol extends {} | undefined, EventName extends keyof Protocol>(hsm: HsmObject<Context, Protocol>, err: Error): Promise<void> {
	hsm.logTrace('begin error recovery');
	++hsm.traceContextLevel;

	const errorHandler = lookupErrorHandlerWithTracing<Context, Protocol, EventName>(hsm);
	try {
		// Execute call
		hsm.logTrace(`pre #onError handler`);
		const dispatchResult = errorHandler.call(hsm.instance, new EventHandlerError(hsm, err));
		if (dispatchResult) await dispatchResult;
		hsm.logTrace(`post #onError handler`);
	} catch (error) {
		hsm.currentState = FatalErrorState;
		hsm.logDebug(`fatal error: #onError handler has raised ${error.name}${error.message ? `: ${error.message}` : ' with no error message'}; final state is '${FatalErrorState.name}'`);
		--hsm.traceContextLevel;
		hsm.logTrace('end error recovery');
		throw error;
	}
	// Execute Transition
	try {
		await doTransitionWithTracing(hsm);
		hsm.logDebug('recovery successful');
		--hsm.traceContextLevel;
		hsm.logTrace('end error recovery');
	} catch (transitionError) {
		hsm.logDebug(`fatal error: #onError handler has raised ${transitionError.name}${transitionError.message ? `: ${transitionError.message}` : ' with no error message'}; final state is '${FatalErrorState.name}'`);
		--hsm.traceContextLevel;
		hsm.logTrace('end error recovery');
		throw transitionError;
	}
}

function lookupUnhandledWithTracing<Context, Protocol extends {} | undefined, EventName extends keyof Protocol>(hsm: HsmObject<Context, Protocol>): (error: UnhandledEventError<Context, Protocol, EventName>) => Promise<void> | void {
	let state = hsm.currentState;
	hsm.logTrace(`begin lookup of #onUnhandled`);
	++hsm.traceContextLevel;
	while (true) {
		const prototype = state.prototype;
		if (Object.prototype.hasOwnProperty.call(prototype, 'onUnhandled')) {
			hsm.logTrace(`found in state '${prototype.constructor.name}'`);
			--hsm.traceContextLevel;
			hsm.logTrace(`end lookup of #onUnhandled`);
			hsm.logDebug(`#onUnhandled found in state '${prototype.constructor.name}'`);
			return prototype['onUnhandled'];
		} else {
			hsm.logTrace(`not found in state '${prototype.constructor.name}'`);
			if (state == BaseTopState) break;
			state = Object.getPrototypeOf(state);
		}
	}
	throw new Error('Illegal state');
}

async function doUnhandledEventWithTracing<Context, Protocol extends {} | undefined, EventName extends keyof Protocol>(hsm: HsmObject<Context, Protocol>, error: UnhandledEventError<Context, Protocol, EventName>): Promise<void> {
	try {
		hsm.logTrace(`using #onUnhandled as event handler for #${error.eventName}`);
		const onUnhandledEventHandler = lookupUnhandledWithTracing<Context, Protocol, EventName>(hsm);
		hsm.logTrace(`pre #onUnhandled event handler`);
		const result = onUnhandledEventHandler.call(hsm.instance, error);
		if (result) await result;
		hsm.logTrace(`post #onUnhandled event handler`);
		await doTransitionWithTracing(hsm);
	} catch (err) {
		hsm.logDebug(`#onUnhandled handler has raised ${err.name}${err.message ? `: ${err.message}` : ' with no error message'}`);
		await doErrorWithTracing(hsm, err);
	}
}

function lookupEventHandlerWithTracing<Context, Protocol extends {} | undefined, EventName extends keyof Protocol>(hsm: HsmObject<Context, Protocol>, eventName: EventHandlerName<Protocol, EventName>): ((...args: EventHandlerPayload<Protocol, EventName>) => Promise<void> | void) | undefined {
	let state = hsm.currentState;
	hsm.logTrace(`begin #${eventName} lookup`);
	++hsm.traceContextLevel;
	while (true) {
		const prototype = state.prototype;
		if (Object.prototype.hasOwnProperty.call(prototype, eventName)) {
			hsm.logTrace(`found in state '${prototype.constructor.name}'`);
			--hsm.traceContextLevel;
			hsm.logTrace(`end #${eventName} lookup`);
			hsm.logDebug(`#${eventName} found in state '${prototype.constructor.name}'`);
			return prototype[eventName];
		} else {
			hsm.logTrace(`not found in state '${prototype.constructor.name}'`);
			if (state == BaseTopState) break;
			state = Object.getPrototypeOf(state);
		}
	}
	--hsm.traceContextLevel;
	hsm.logTrace(`end #${eventName} lookup`);
	hsm.logDebug(`lookup failed: #${eventName} not found in state ${hsm.currentStateName}`);
	return undefined;
}

// eslint-disable-next-line valid-jsdoc
/** @internal */
async function dispatchEventWithTracing<Context, Protocol extends {} | undefined, EventName extends keyof Protocol>(hsm: HsmObject<Context, Protocol>, eventName: EventHandlerName<Protocol, EventName>, ...eventPayload: EventHandlerPayload<Protocol, EventName>): Promise<void> {
	hsm.logDebug(`dispatch of #${eventName}`);
	try {
		hsm.logTrace(`begin dispatch`);
		hsm.currentEventName = eventName as string;
		hsm.currentEventPayload = eventPayload;
		++hsm.traceContextLevel;
		const messageHandler = lookupEventHandlerWithTracing(hsm, eventName);
		if (!messageHandler) {
			await doUnhandledEventWithTracing(hsm, new UnhandledEventError(hsm));
		} else {
			try {
				hsm.logTrace(`pre #${eventName} event handler`);
				const result = messageHandler.call(hsm.instance, ...eventPayload);
				if (result) await result;
				hsm.logTrace(`post #${eventName} event handler`);
				await doTransitionWithTracing(hsm);
			} catch (err) {
				if (err instanceof UnhandledEventError) {
					hsm.logTrace(`error #${eventName} event handler has signalled that the event is unhandled`);
					await doUnhandledEventWithTracing(hsm, err);
				} else {
					hsm.logDebug(`error #${eventName} has raised ${err.name}${err.message ? `: ${err.message}` : ' with no error message'}`);
					await doErrorWithTracing(hsm, err);
				}
			}
		}
	} finally {
		--hsm.traceContextLevel;
		hsm.logTrace(`end dispatch`);
		hsm.currentEventName = undefined;
		hsm.currentEventPayload = undefined;
		hsm.transitionState = undefined;
	}
}

export type DispatchErrorCallback<Context, Protocol extends {} | undefined> = (hsm: Hsm<Context, Protocol>, traceWriter: TraceWriter, err: Error) => void;

/** @internal */
// prettier-ignore
class HsmObject<Context, Protocol extends {} | undefined> implements Hsm<Context, Protocol>, StateBoundHsm<Context, Protocol> {
	public static instanceId = 9999999;

	public id: number;
	public topState: State<Context, Protocol>;
	public topStateName: string;
	public readonly ctxTypeName: string;
	public ctx: Context;
	public instance: HsmInstance<Context, Protocol>;
	public traceContextLevel: number;
	public transitionCache: Map<[State<Context, Protocol>, State<Context, Protocol>], Transition<Context, Protocol>> = new Map();
	public jobs: Task[];
	public isRunning = false;
	public transitionState?: State<Context, Protocol>;
	public traceWriter: TraceWriter;
	public currentEventName?: string;
	public currentEventPayload?: any[];
	public dispatchErrorCallback: DispatchErrorCallback<Context, Protocol>;
	public traceLevel: TraceLevel;

	constructor(TopState: State<Context, Protocol>, instance: HsmInstance<Context, Protocol>, traceWriter: TraceWriter, traceLevel: TraceLevel, dispatchErrorCallback: DispatchErrorCallback<Context, Protocol>) {
		this.id = ++HsmObject.instanceId;
		this.instance = instance;
		this.ctx = instance.ctx;
		this.topState = TopState;
		this.topStateName = TopState.name;
		this.ctxTypeName = Object.getPrototypeOf(instance.ctx).constructor.name;
		this.currentState = TopState;
		this.transitionState = undefined;
		this.traceWriter = traceWriter;
		this.traceContextLevel = 0;
		this.transitionCache = new Map();
		this.jobs = [];
		this.isRunning = false;
		this.traceLevel = traceLevel;
		this.currentEventName = undefined;
		this.currentEventPayload = undefined;
		this.dispatchErrorCallback = dispatchErrorCallback;
	}

	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	get eventName(): string { return this.currentEventName!; }

	// eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/no-non-null-assertion
	get eventPayload(): any[] { return this.currentEventPayload!; }

	get currentStateName(): string { return Object.getPrototypeOf(this.instance).constructor.name; }

	get traceHeader(): string {
		return `${this.ctxTypeName}|${this.id}|${' '.repeat(this.traceContextLevel * 4)}${this.currentStateName}`;
	}

	get currentState(): State<Context, Protocol> { return Object.getPrototypeOf(this.instance).constructor; }

	set currentState(newState: State<Context, Protocol>) { Object.setPrototypeOf(this.instance, newState.prototype); }

	logTrace(msg: string): void { this.traceWriter.writeTrace(this,TraceLevel.TRACE, msg) }

	logDebug(msg: string): void { this.traceWriter.writeTrace(this,TraceLevel.DEBUG, msg)  }

	logError(err: Error): void { this.traceWriter.write(this, err); }

	trace(msg: any): void { this.traceWriter.write(this, msg); }

	//
	// Event Send
	//
	post<EventName extends keyof Protocol>(eventName: EventHandlerName<Protocol, EventName>, ...eventPayload: EventHandlerPayload<Protocol, EventName>): void {
		this.pushTask(this.createEventDispatchTask(eventName, ...eventPayload));
	}

	deferredPost<EventName extends keyof Protocol>(millis: number, eventName: EventHandlerName<Protocol, EventName>, ...eventPayload: EventHandlerPayload<Protocol, EventName>): void {
		setTimeout(() => this.pushTask(this.createEventDispatchTask(eventName, ...eventPayload)), millis);
	}

	sync(): Promise<void> {
		this.logTrace('sync(): waiting for task completion ...');
		return new Promise(resolve => {
			this.pushTask((doneCallback: () => void): void => {
				resolve();
				doneCallback();
				this.logTrace('sync(): all tasks completed');
			});
		});
	}

	transition(nextState: State<Context, Protocol>): void { this.transitionState = nextState; }

	unhandled(): never { throw new UnhandledEventError(this); }

	sleep(millis: number): Promise<void> { return new Promise(resolve => setTimeout(() => resolve(), millis)); }

	public pushTask(t: (done: () => void) => void): void {
		this.jobs.push(t);
		if (this.isRunning) return;
		this.isRunning = true;
		this.dequeue();
	}

	restore(topState: State<Context, Protocol>, state: State<Context, Protocol>, ctx: Context, options?: Options): void {
		if (!Object.prototype.isPrototypeOf.call(topState, state)) {
			throw new Error('state must inherit from topState');
		}
		this.topState = topState;
		this.currentState = state;
		this.instance.ctx = ctx;
		this.ctx = ctx;
		if (options) {
			this.traceWriter = options.traceWriter;
			this.traceLevel = options.traceLevel;
			this.dispatchErrorCallback = options.dispatchErrorCallback;
		}
		if (topState !== this.topState) {
			this.transitionCache = new Map();
		}
	}

	public createInitDispatchTask(): this {
		this.pushTask((doneCallback: () => void) => dispatchInitWithTracing(this)
		.catch((err: Error) => {
			this.dispatchErrorCallback(this, this.traceWriter, err);
		})
		.finally(() => doneCallback()));
		return this;
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
		setTimeout(() => Promise.resolve()
		.then(() => new Promise<void>((resolve: () => void) => task(resolve)))
		.then(() => this.dequeue()), 0);
	}

	private createEventDispatchTask<EventName extends keyof Protocol>(eventName: EventHandlerName<Protocol, EventName>, ...eventPayload: EventHandlerPayload<Protocol, EventName>): Task {
		return (doneCallback: () => void): void => {
			dispatchEventWithTracing(this, eventName, ...eventPayload)
			.catch((err: Error) => {
				this.dispatchErrorCallback(this, this.traceWriter, err);
			})
			.finally(() => doneCallback());
		};
	}

}

/** @internal */
const defaultTraceWriter = new ConsoleTraceWriter();
/** @internal */
let defaultCreateOptions: Options = {
	traceLevel: TraceLevel.NONE,
	traceWriter: defaultTraceWriter,
	dispatchErrorCallback: defaultDispatchErrorCallback,
};

/**
 * Used to configureHsm the default _options_ object used when executing the {@link create} or {@link create} functions.
 *
 * @param {HsmOptions} options the new default options object
 * @category Configuration
 */
export function configureHsm(
	options: Options = {
		traceLevel: TraceLevel.NONE,
		traceWriter: defaultTraceWriter,
		dispatchErrorCallback: defaultDispatchErrorCallback,
	}
): void {
	defaultCreateOptions = {
		traceLevel: options.traceLevel,
		traceWriter: options.traceWriter,
		dispatchErrorCallback: options.dispatchErrorCallback,
	};
}

/**
 * todo
 * @param {TraceLevel} traceLevel
 * @category Configuration
 */
// prettier-ignore
export function configureTraceLevel(traceLevel: TraceLevel = TraceLevel.NONE): void { defaultCreateOptions.traceLevel = traceLevel; }

// eslint-disable-next-line valid-jsdoc
/**
 * todo
 * @param {{new(): TraceWriter}} traceWriter
 * @category Configuration
 */
// prettier-ignore
export function configureTraceWriter(traceWriter: TraceWriter = defaultTraceWriter): void { defaultCreateOptions.traceWriter = traceWriter; }

// prettier-ignore
export function configureDispatchErrorCallback<Context, Protocol extends {} | undefined>(dispatchErrorCallback: <Context, Protocol extends {} | undefined>(hsm: Hsm<Context, Protocol>, traceWriter: TraceWriter, err: Error) => void = defaultDispatchErrorCallback): void {
	defaultCreateOptions.dispatchErrorCallback = dispatchErrorCallback;
}

/**
 *
 * @param {State<Context, Protocol>} topState
 * @param {Context} ctx
 * @param {boolean} start
 * @param {HsmOptions} options
 * @return {Hsm<Context, Protocol>}
 * @category BaseTopState machine factory
 */
export function create<Context, Protocol extends {} | undefined, EventName extends keyof Protocol>(topState: State<Context, Protocol>, ctx: Context, start = true, options?: Options): Hsm<Context, Protocol> {
	const userOptions = options ? options : defaultCreateOptions;
	const instance: HsmInstance<Context, Protocol> = {
		hsm: (undefined as unknown) as HsmObject<Context, Protocol>,
		ctx: ctx,
	};
	Object.setPrototypeOf(instance, topState.prototype);
	instance.hsm = new HsmObject(topState, instance, userOptions.traceWriter, userOptions.traceLevel, userOptions.dispatchErrorCallback);
	if (start) {
		instance.hsm.createInitDispatchTask();
	}
	return instance.hsm;
}

/**
 * Resets the Hsm Id counter.
 */
export function resetId(): void {
	HsmObject.instanceId = 9999999;
}
