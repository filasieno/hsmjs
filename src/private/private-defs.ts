import { EventHandlerName, EventHandlerPayload, Hsm, State, StateBoundHsm, TraceLevel } from '../defs';

/** @internal */
export interface HsmInstance<Context, Protocol extends {} | undefined> {
	ctx: Context;
	hsm: HsmWithTracing<Context, Protocol>;
}

/** @internal */
export interface Transition<Context, Protocol extends {} | undefined> {
	srcState: State<Context, Protocol>;
	dstState: State<Context, Protocol>;
	execute(hsm: HsmWithTracing<Context, Protocol>): Promise<void>;
}

export type DoneCallback = () => void;

/** @internal */
export type Task = (done: DoneCallback) => void;

export interface HsmWithTracing<Context, Protocol extends {} | undefined> extends Hsm<Context, Protocol>, StateBoundHsm<Context, Protocol> {
	transitionCache: Map<[State<Context, Protocol>, State<Context, Protocol>], Transition<Context, Protocol>>;
	createInitTask: <DispatchContext, DispatchProtocol extends {} | undefined>(hsm: HsmWithTracing<DispatchContext, DispatchProtocol>) => Task;
	createEventDispatchTask: <DispatchContext, DispatchProtocol extends {} | undefined, EventName extends keyof DispatchProtocol>(hsm: HsmWithTracing<DispatchContext, DispatchProtocol>, eventName: EventHandlerName<DispatchProtocol, EventName>, ...eventPayload: EventHandlerPayload<DispatchProtocol, EventName>) => Task;
	instance: HsmInstance<Context, Protocol>;
	transitionState?: State<Context, Protocol>;
	currentEventName?: string;
	currentEventPayload?: any[];
	currentState: State<Context, Protocol>;

	tracePush(d: string, msg: string): void;
	tracePopDone(msg: string): void;
	tracePopError(err: Error | string): void;
	tracePop(msg: string): void;
	writeTrace(msg: string): void;
	writeDebug(msg: string): void;
	writeError(err: Error): void;
	write(msg: any): void;
}
