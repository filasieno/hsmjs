import { DispatchErrorCallback, EventHandlerName, EventHandlerPayload, Options, State, TraceLevel, TraceWriter, UnhandledEventError } from '../defs';
import { HsmInstance, HsmWithTracing, Task, Transition } from './defs.private';
import { createEventDispatchTask as createEventDispatchVerboseDebug, createInitTask as createInitVerboseDebug } from './dispatch.trace';
import { createEventDispatchTask as createEventDispatchDebug, createInitTask as createInitTaskDebug } from './dispatch.debug';
import { createEventDispatchTask as createEventDispatchProduction, createInitTask as createInitTaskProduction } from './dispatch.production';

function mapInitTaskFactory(traceLevel: TraceLevel): <DispatchContext, DispatchProtocol extends {} | undefined>(hsm: HsmWithTracing<DispatchContext, DispatchProtocol>) => Task {
	switch (traceLevel) {
		case TraceLevel.PRODUCTION:
			return createInitTaskProduction;
		case TraceLevel.DEBUG:
			return createInitTaskDebug;
		case TraceLevel.VERBOSE_DEBUG:
			return createInitVerboseDebug;
	}
}

function mapEventDispatchTaskFactory(traceLevel: TraceLevel): <DispatchContext, DispatchProtocol extends {} | undefined, EventName extends keyof DispatchProtocol>(hsm: HsmWithTracing<DispatchContext, DispatchProtocol>, eventName: EventHandlerName<DispatchProtocol, EventName>, ...eventPayload: EventHandlerPayload<DispatchProtocol, EventName>) => Task {
	switch (traceLevel) {
		case TraceLevel.PRODUCTION:
			return createEventDispatchProduction;
		case TraceLevel.DEBUG:
			return createEventDispatchDebug;
		case TraceLevel.VERBOSE_DEBUG:
			return createEventDispatchVerboseDebug;
	}
}

/** @internal */
// prettier-ignore
export class HsmObject<Context, Protocol extends {} | undefined> implements HsmWithTracing<Context, Protocol> {

	public topState: State<Context, Protocol>;
	public topStateName: string;
	public readonly ctxTypeName: string;
	public ctx: Context;
	public traceWriter: TraceWriter;

	public _instance: HsmInstance<Context, Protocol>;
	public _transitionCache: Map<[State<Context, Protocol>, State<Context, Protocol>], Transition<Context, Protocol>> = new Map();
	public _jobs: Task[];
	private _isRunning = false;
	public _transitionState?: State<Context, Protocol>;

	public _currentEventName?: string;
	public _currentEventPayload?: any[];
	public dispatchErrorCallback: DispatchErrorCallback<Context, Protocol>;
	private _traceLevel: TraceLevel;
	private _traceDomainStack: string[];
	public _createInitTask: <DispatchContext, DispatchProtocol extends {} | undefined>(hsm: HsmWithTracing<DispatchContext, DispatchProtocol>) => Task;
	public _createEventDispatchTask: <DispatchContext, DispatchProtocol extends {} | undefined, EventName extends keyof DispatchProtocol>(hsm: HsmWithTracing<DispatchContext, DispatchProtocol>, eventName: EventHandlerName<DispatchProtocol, EventName>, ...eventPayload: EventHandlerPayload<DispatchProtocol, EventName>) => Task;

	constructor(
		TopState: State<Context, Protocol>,
		instance: HsmInstance<Context, Protocol>,
		traceWriter: TraceWriter,
		traceLevel: TraceLevel,
		dispatchErrorCallback: DispatchErrorCallback<Context, Protocol>,
		initialize: boolean
	) {
		this._instance = instance;
		this.ctx = instance.ctx;

		this._transitionState = undefined;
		this._transitionCache = new Map();
		this._traceLevel = traceLevel;
		this._currentEventName = undefined;
		this._currentEventPayload = undefined;
		this._traceDomainStack = [];
		this._createInitTask = mapInitTaskFactory(traceLevel);
		this._createEventDispatchTask = mapEventDispatchTaskFactory(traceLevel);
		this._jobs = [];
		this._isRunning = false;


		this.topState = TopState;
		this.topStateName = TopState.name;
		this.ctxTypeName = Object.getPrototypeOf(instance.ctx).constructor.name;
		this.currentState = TopState;
		this.traceWriter = traceWriter;
		this.dispatchErrorCallback = dispatchErrorCallback;


		if (initialize) {
			this.pushTask(this._createInitTask(this));
		}
	}

	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	get eventName(): string { return this._currentEventName!; }
	// eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/no-non-null-assertion
	get eventPayload(): any[] { return this._currentEventPayload!; }
	get currentStateName(): string { return Object.getPrototypeOf(this._instance).constructor.name; }
	get currentState(): State<Context, Protocol> { return Object.getPrototypeOf(this._instance).constructor; }
	set currentState(newState: State<Context, Protocol>) { Object.setPrototypeOf(this._instance, newState.prototype); }
	post<EventName extends keyof Protocol>(eventName: EventHandlerName<Protocol, EventName>, ...eventPayload: EventHandlerPayload<Protocol, EventName>): void { this.pushTask(this._createEventDispatchTask(this, eventName, ...eventPayload)); }
	deferredPost<EventName extends keyof Protocol>(millis: number, eventName: EventHandlerName<Protocol, EventName>, ...eventPayload: EventHandlerPayload<Protocol, EventName>): void { setTimeout(() => this.pushTask(this._createEventDispatchTask(this, eventName, ...eventPayload)), millis); }
	transition(nextState: State<Context, Protocol>): void { this._transitionState = nextState; }
	unhandled(): never { throw new UnhandledEventError(this); }
	sleep(millis: number): Promise<void> { return new Promise(resolve => setTimeout(() => resolve(), millis)); }

	get traceLevel(): TraceLevel {
		return this._traceLevel;
	}

	set traceLevel(traceLevel: TraceLevel) {
		this._createInitTask = mapInitTaskFactory(traceLevel);
		this._createEventDispatchTask = mapEventDispatchTaskFactory(traceLevel);
		this._traceLevel = traceLevel;
	}

	sync(): Promise<void> {
		this._traceWrite('begin sync(): waiting for task completion ...');
		return new Promise(resolve => {
			this.pushTask((doneCallback: () => void): void => {
				resolve();
				doneCallback();
				this._traceWrite('end sync(): all tasks completed');
			});
		});
	}


	public pushTask(t: (done: () => void) => void): void {
		this._jobs.push(t);
		if (this._isRunning) return;
		this._isRunning = true;
		this.dequeue();
	}

	public restore(topState: State<Context, Protocol>, state: State<Context, Protocol>, ctx: Context, options?: Options): void {
		if (!Object.prototype.isPrototypeOf.call(topState, state)) {
			throw new Error('state must inherit from topState');
		}
		this.topState = topState;
		this.currentState = state;
		this._instance.ctx = ctx;
		this.ctx = ctx;
		if (options) {
			this.traceWriter = options.traceWriter;
			this._traceLevel = options.traceLevel;
			this.dispatchErrorCallback = options.dispatchErrorCallback;
		}
		if (topState !== this.topState) {
			this._transitionCache = new Map();
		}
	}

	private dequeue(): void {
		if (this._jobs.length == 0) {
			this._isRunning = false;
			return;
		}
		const task = this._jobs.shift();
		// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
		this.exec(task!);
	}

	private exec(task: Task): void {
		setTimeout(() => Promise.resolve()
			.then(() => new Promise<void>((resolve: () => void) => task(resolve)))
			.then(() => this.dequeue()), 0);
	}

	public _tracePush(d: string, msg: string): void {
		this._traceDomainStack.push(d);
		this.traceWriter.write(this, msg);
	}

	public _tracePopDone(msg: string): void {
		this.traceWriter.write(this, `done: ${msg}`);
		this._traceDomainStack.pop();
	}

	public _tracePopError(msg: string): void{
		this.traceWriter.write(this, `failure: ${msg}`);
		this._traceDomainStack.pop();
	}

	public _traceWrite(msg: any): void {
		this.traceWriter.write(this, msg)
	}

	get traceHeader(): string {
		return `${this._traceDomainStack.length === 0 ? '' : this._traceDomainStack.join('|') + '|'}`;
	}

}
