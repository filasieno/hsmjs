import { DispatchErrorCallback, EventHandlerName, EventHandlerPayload, Options, State, TraceLevel, TraceWriter, UnhandledEventError } from '../defs';
import { HsmInstance, HsmWithTracing, Task, Transition } from './private-defs';
import { createInitTask as createInitTaskWithTracing, createEventDispatchTask as createEventDispatchWithTracing } from './dispatch-trace';

/** @internal */
// prettier-ignore
export class HsmObject<Context, Protocol extends {} | undefined> implements HsmWithTracing<Context, Protocol> {
	public static instanceId = 9999999;

	public id: number;
	public topState: State<Context, Protocol>;
	public topStateName: string;
	public readonly ctxTypeName: string;
	public ctx: Context;
	public instance: HsmInstance<Context, Protocol>;
	public transitionCache: Map<[State<Context, Protocol>, State<Context, Protocol>], Transition<Context, Protocol>> = new Map();
	public jobs: Task[];
	public isRunning = false;
	public transitionState?: State<Context, Protocol>;
	public traceWriter: TraceWriter;
	public currentEventName?: string;
	public currentEventPayload?: any[];
	public dispatchErrorCallback: DispatchErrorCallback<Context, Protocol>;
	public traceLevel: TraceLevel;
	public traceDomainStack: string[];
	public createInitTask: <DispatchContext, DispatchProtocol extends {} | undefined>(hsm: HsmWithTracing<DispatchContext, DispatchProtocol>) => Task;
	public createEventDispatchTask: <DispatchContext, DispatchProtocol extends {} | undefined, EventName extends keyof DispatchProtocol>(hsm: HsmWithTracing<DispatchContext, DispatchProtocol>, eventName: EventHandlerName<DispatchProtocol, EventName>, ...eventPayload: EventHandlerPayload<DispatchProtocol, EventName>) => Task;

	constructor(TopState: State<Context, Protocol>, instance: HsmInstance<Context, Protocol>, traceWriter: TraceWriter, traceLevel: TraceLevel, dispatchErrorCallback: DispatchErrorCallback<Context, Protocol>, initialize: boolean) {
		this.id = ++HsmObject.instanceId;
		this.instance = instance;
		this.ctx = instance.ctx;
		this.topState = TopState;
		this.topStateName = TopState.name;
		this.ctxTypeName = Object.getPrototypeOf(instance.ctx).constructor.name;
		this.currentState = TopState;
		this.transitionState = undefined;
		this.traceWriter = traceWriter;
		this.transitionCache = new Map();
		this.jobs = [];
		this.isRunning = false;
		this.traceLevel = traceLevel;
		this.currentEventName = undefined;
		this.currentEventPayload = undefined;
		this.dispatchErrorCallback = dispatchErrorCallback;
		this.traceDomainStack = [];
		// TODO: select correct implementation based on trace leve
		this.createInitTask = createInitTaskWithTracing;
		this.createEventDispatchTask = createEventDispatchWithTracing;
		if (initialize) {
			this.pushTask(this.createInitTask(this));
		}
	}

	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	get eventName(): string { return this.currentEventName!; }

	// eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/no-non-null-assertion
	get eventPayload(): any[] { return this.currentEventPayload!; }

	get currentStateName(): string { return Object.getPrototypeOf(this.instance).constructor.name; }

	get currentState(): State<Context, Protocol> { return Object.getPrototypeOf(this.instance).constructor; }

	set currentState(newState: State<Context, Protocol>) { Object.setPrototypeOf(this.instance, newState.prototype); }

	//
	// Event Send
	//
	post<EventName extends keyof Protocol>(eventName: EventHandlerName<Protocol, EventName>, ...eventPayload: EventHandlerPayload<Protocol, EventName>): void {
		this.pushTask(this.createEventDispatchTask(this, eventName, ...eventPayload));
	}

	deferredPost<EventName extends keyof Protocol>(millis: number, eventName: EventHandlerName<Protocol, EventName>, ...eventPayload: EventHandlerPayload<Protocol, EventName>): void {
		setTimeout(() => this.pushTask(this.createEventDispatchTask(this, eventName, ...eventPayload)), millis);
	}

	sync(): Promise<void> {
		this.writeTrace('begin sync(): waiting for task completion ...');
		return new Promise(resolve => {
			this.pushTask((doneCallback: () => void): void => {
				resolve();
				doneCallback();
				this.writeTrace('end sync(): all tasks completed');
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

	tracePush(d: string, msg: string): void {
		this.traceDomainStack.push(d);
		this.writeDebug(`${msg}`);
	}

	tracePopDone(msg: string): void {
		this.writeDebug(`done: ${msg}`);
		this.traceDomainStack.pop();

	}

	tracePopError(err: Error | string): void{
		if (err instanceof Error) {
			this.writeDebug(`failure: error '${err.name}${err.message ? `: ${err.message}'` : "' with no error message"} was thrown`);
		} else {
			this.writeDebug(`failure: ${err}`);
		}
		this.traceDomainStack.pop();
	}

	tracePop(msg: string): void{
		this.writeDebug(`done: ${msg}`);
		this.traceDomainStack.pop();
	}

	get traceHeader(): string {
		const str = `${this.ctxTypeName}|${this.id}|${this.traceDomainStack.length === 0 ? '' : this.traceDomainStack.join('|') + '|' }`;
		return str;
	}

	writeTrace(msg: string): void { this.traceWriter.writeTrace(this, TraceLevel.TRACE, msg) }

	writeDebug(msg: string): void { this.traceWriter.writeTrace(this, TraceLevel.DEBUG, msg)  }

	writeError(err: Error): void { this.traceWriter.write(this, err) }

	write(msg: any): void { this.traceWriter.write(this, msg) }

}
