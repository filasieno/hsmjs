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
	write<Context, Protocol>(hsm: HsmProperties<Context, Protocol>, msg: any): void;
	writeTrace<Context, Protocol>(hsm: HsmProperties<Context, Protocol>, trace: TraceLevel, msg: any): void;
}

/**
 * @category State machine
 */
export interface HsmProperties<Context, Protocol extends {} | undefined> {
	readonly id: number;
	readonly currentState: State<Context, Protocol>;
	readonly currentStateName: string;
	readonly topState: State<Context, Protocol>;
	readonly topStateName: string;
	readonly ctxTypeName: string;
	readonly traceHeader: string;
	readonly eventName: string;
	readonly eventPayload: any[];

	traceLevel: TraceLevel;
	traceWriter: TraceWriter;
	dispatchErrorCallback: DispatchErrorCallback<Context, Protocol>;
}

/**
 * @category State machine
 */
export interface BaseHsm<Context, Protocol extends {} | undefined> extends HsmProperties<Context, Protocol> {
	post<EventName extends keyof Protocol>(eventName: EventHandlerName<Protocol, EventName>, ...eventPayload: EventHandlerPayload<Protocol, EventName>): void;
	deferredPost<EventName extends keyof Protocol>(millis: number, eventName: EventHandlerName<Protocol, EventName>, ...eventPayload: EventHandlerPayload<Protocol, EventName>): void;
}

/**
 * @category State machine
 */
export interface StateBoundHsm<Context, Protocol extends {} | undefined> extends BaseHsm<Context, Protocol> {
	readonly ctx: Context;
	traceWriter: TraceWriter;
	transition(nextState: State<Context, Protocol>): void;
	unhandled(): never;
	sleep(millis: number): Promise<void>;
}

/**
 * todo
 * @category Configuration
 */
export interface Hsm<Context = Any, Protocol extends {} | undefined = undefined> extends BaseHsm<Context, Protocol> {
	sync(): Promise<void>;
	restore(TopState: State<Context, Protocol>, state: State<Context, Protocol>, ctx: Context, options?: Options): void;
}

//
// Configuration
//

/**
 * todo
 * @category Configuration
 */
export interface Options {
	traceLevel: TraceLevel;
	traceWriter: TraceWriter;
	dispatchErrorCallback: <Context, Protocol extends {} | undefined>(hsm: Hsm<Context, Protocol>, traceWriter: TraceWriter, err: Error) => void;
}

export type DispatchErrorCallback<Context, Protocol extends {} | undefined> = (hsm: Hsm<Context, Protocol>, traceWriter: TraceWriter, err: Error) => void;

// prettier-ignore
export abstract class BaseTopState<Context = Any, Protocol extends {} | undefined = undefined> implements StateBoundHsm<Context, Protocol> {
	readonly ctx!: Context;
	readonly hsm!: StateBoundHsm<Context, Protocol>;
	constructor() { throw new Error('Fatal error: States cannot be instantiated') }
	get eventName(): string { return this.hsm.eventName }
	get eventPayload(): any[] { return this.hsm.eventPayload }
	get traceHeader(): string { return this.hsm.traceHeader }
	get topState(): State<Context, Protocol> { return this.hsm.topState }
	get currentStateName(): string { return this.hsm.currentStateName }
	get currentState(): State<Context, Protocol> { return this.hsm.currentState }
	get ctxTypeName(): string { return this.hsm.ctxTypeName }
	get id(): number { return this.hsm.id }
	get traceLevel(): TraceLevel { return this.hsm.traceLevel }
	get topStateName(): string { return this.hsm.topStateName }
	get traceWriter(): TraceWriter { return this.hsm.traceWriter }
	set traceWriter(value) { this.hsm.traceWriter = value }
	// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
	get dispatchErrorCallback() { return this.hsm.dispatchErrorCallback }
	set dispatchErrorCallback(value) { this.hsm.dispatchErrorCallback = value }
	transition(nextState: State<Context, Protocol>): void { this.hsm.transition(nextState) }
	unhandled(): never { this.hsm.unhandled() }
	sleep(millis: number): Promise<void> { return this.hsm.sleep(millis); }
	writeTrace(msg: any): void { this.hsm.traceWriter.write(this.hsm, msg);}
	post<EventName extends keyof Protocol>(eventName: EventHandlerName<Protocol, EventName>, ...eventPayload: EventHandlerPayload<Protocol, EventName>): void { this.hsm.post(eventName, ...eventPayload) }
	deferredPost<EventName extends keyof Protocol>(millis: number, eventName: EventHandlerName<Protocol, EventName>, ...eventPayload: EventHandlerPayload<Protocol, EventName>): void { this.hsm.deferredPost(millis, eventName, ...eventPayload) }
	// eslint-disable-next-line @typescript-eslint/no-empty-function
	onExit(): Promise<void> | void {}
	// eslint-disable-next-line @typescript-eslint/no-empty-function
	onEntry(): Promise<void> | void {}
	onError<EventName extends keyof Protocol>(error: RuntimeError<Context, Protocol, EventName>): Promise<void> | void { throw error }
	onUnhandled<EventName extends keyof Protocol>(error: UnhandledEventError<Context, Protocol, EventName>): Promise<void> | void { throw error }
}

export class FatalErrorState<Context, Protocol extends {} | undefined> extends BaseTopState<Context, Protocol> {}

/**
 * @category Error
 */
export abstract class RuntimeError<Context, Protocol extends {} | undefined, EventName extends keyof Protocol> extends Error {
	eventName: EventHandlerName<Protocol, EventName>;
	eventPayload: EventHandlerPayload<Protocol, EventName>;
	hsmStateName: string;
	hsmContext: Context;
	hsmId: number;

	protected constructor(errorName: string, hsm: StateBoundHsm<Context, Protocol>, message: string, public cause?: Error) {
		super(message);
		this.name = errorName;
		this.eventName = hsm.eventName as EventHandlerName<Protocol, EventName>;
		this.eventPayload = hsm.eventPayload as EventHandlerPayload<Protocol, EventName>;
		this.hsmStateName = hsm.currentState.name;
		this.hsmContext = hsm.ctx;
		this.hsmId = hsm.id;
	}
}

/**
 * @category Error
 */
export class TransitionError<Context, Protocol extends {} | undefined, EventName extends keyof Protocol> extends RuntimeError<Context, Protocol, EventName> {
	constructor(hsm: StateBoundHsm<Context, Protocol>, cause: Error, public failedStateName: string, public failedCallback: 'onExit' | 'onEntry', public fromStateName: string, public toStateName: string) {
		super('TransitionError', hsm, `${failedStateName}.${failedCallback}() has failed while executing a transition from ${fromStateName} to ${toStateName}`, cause);
	}
}

/**
 * @category Error
 */
export class EventHandlerError<Context, Protocol extends {} | undefined, EventName extends keyof Protocol> extends RuntimeError<Context, Protocol, EventName> {
	constructor(hsm: StateBoundHsm<Context, Protocol>, cause: Error) {
		super('EventHandlerError', hsm, `an error was thrown while executing event handler #${hsm.eventName} in state '${hsm.currentStateName}'`, cause);
	}
}

/**
 * @category Error
 */
export class UnhandledEventError<Context, Protocol extends {} | undefined, EventName extends keyof Protocol> extends RuntimeError<Context, Protocol, EventName> {
	constructor(hsm: StateBoundHsm<Context, Protocol>) {
		super('UnhandledEventError', hsm, `event #${hsm.eventName} was unhandled in state '${hsm.currentStateName}'`);
	}
}

/**
 * @category Error
 */
export class InitialStateError<Context, Protocol extends {} | undefined> extends Error {
	targetStateName: string;
	constructor(targetState: State<Context, Protocol>) {
		super(`State '${Object.getPrototypeOf(targetState).constructor.name}' must not have more than one initial state`);
		this.name = 'InitialStateError';
		this.targetStateName = targetState.name;
	}
}
