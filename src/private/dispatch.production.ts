import { EventHandlerName, EventHandlerPayload } from 'src/defs';
import { HsmWithTracing, Task } from 'src/private/defs.private';

export function createInitTask<DispatchContext, DispatchProtocol extends {} | undefined>(hsm: HsmWithTracing<DispatchContext, DispatchProtocol>): Task {
	hsm._traceWrite('Unimplemented');
	throw new Error('Unimplemented');
}

export function createEventDispatchTask<DispatchContext, DispatchProtocol extends {} | undefined, EventName extends keyof DispatchProtocol>(hsm: HsmWithTracing<DispatchContext, DispatchProtocol>, eventName: EventHandlerName<DispatchProtocol, EventName>, ...eventPayload: EventHandlerPayload<DispatchProtocol, EventName>): Task {
	hsm._traceWrite('Unimplemented');
	throw new Error('Unimplemented');
}
