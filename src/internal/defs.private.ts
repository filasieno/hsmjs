import { EventHandlerName, EventHandlerPayload, Hsm, State, StateBoundHsm } from '../defs';

/** @internal */
export interface HsmInstance<Context, Protocol extends {} | undefined> {
	ctx: Context;
	hsm: HsmWithTracing<Context, Protocol>;
}

/** @internal */
export interface Transition<Context, Protocol extends {} | undefined> {
	execute(hsm: HsmWithTracing<Context, Protocol>, srcState: State<Context, Protocol>, dstState: State<Context, Protocol>): Promise<void>;
}

/** @internal */
export type DoneCallback = () => void;

/** @internal */
export type Task = (done: DoneCallback) => void;

/** @internal */
export interface HsmWithTracing<Context, Protocol extends {} | undefined> extends Hsm<Context, Protocol>, StateBoundHsm<Context, Protocol> {
	_transitionCache: Map<[State<Context, Protocol>, State<Context, Protocol>], Transition<Context, Protocol>>;
	_createInitTask: <DispatchContext, DispatchProtocol extends {} | undefined>(hsm: HsmWithTracing<DispatchContext, DispatchProtocol>) => Task;
	_createEventDispatchTask: <DispatchContext, DispatchProtocol extends {} | undefined, EventName extends keyof DispatchProtocol>(hsm: HsmWithTracing<DispatchContext, DispatchProtocol>, eventName: EventHandlerName<DispatchProtocol, EventName>, ...eventPayload: EventHandlerPayload<DispatchProtocol, EventName>) => Task;
	_instance: HsmInstance<Context, Protocol>;
	_transitionState?: State<Context, Protocol>;
	_currentEventName?: string;
	_currentEventPayload?: any[];
	currentState: State<Context, Protocol>;

	_tracePush(domain: string, msg: string): void;
	_tracePopDone(msg: string): void;
	_tracePopError(msg: string): void;
	_traceWrite(msg: any): void;
}
