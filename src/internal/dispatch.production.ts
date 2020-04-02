import { BaseTopState, EventHandlerError, EventHandlerName, EventHandlerPayload, FatalErrorState, InitializationError, FatalError, State, TransitionError, UnhandledEventError } from '../defs';

import { getInitialState, hasInitialState } from '../initialstate';
import { DoneCallback, HsmWithTracing, Task, Transition } from './defs.private';

/** @internal */
// eslint-disable-next-line valid-jsdoc
class ProductionTransition<Context, Protocol extends {} | undefined, EventName extends keyof Protocol> implements Transition<Context, Protocol> {
	constructor(private exitList: Array<State<Context, Protocol>>, private entryList: Array<State<Context, Protocol>>, private finalState?: State<Context, Protocol>) {}

	async execute<EventName extends keyof Protocol>(hsm: HsmWithTracing<Context, Protocol>, srcState: State<Context, Protocol>, dstState: State<Context, Protocol>): Promise<void> {
		// Execute exit
		for (const state of this.exitList) {
			try {
				const res = state.prototype.onExit.call(hsm._instance);
				if (res) await res;
			} catch (cause) {
				throw new TransitionError(hsm, cause, state.name, 'onExit', srcState.name, dstState.name);
			}
		}

		// Execute entry
		for (const state of this.entryList) {
			try {
				const res = state.prototype.onEntry.call(hsm._instance);
				if (res) await res;
			} catch (cause) {
				throw new TransitionError(hsm, cause, state.name, 'onEntry', srcState.name, dstState.name);
			}
		}

		if (this.finalState) {
			hsm.currentState = this.finalState;
		}
	}
}

/** @internal */
// eslint-disable-next-line valid-jsdoc
function createTransition<Context, Protocol extends {} | undefined, EventName extends keyof Protocol>(srcState: State<Context, Protocol>, destState: State<Context, Protocol>): Transition<Context, Protocol> {
	const src: State<Context, Protocol> = srcState;
	let dst: State<Context, Protocol> = destState;
	let srcPath: State<Context, Protocol>[] = [];
	const end: State<Context, Protocol> = BaseTopState;
	const srcIndex: Map<State<Context, Protocol>, number> = new Map();
	let dstPath: State<Context, Context>[] = [];
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

	let finalState: State<Context, Protocol> | undefined;
	if (dstPath.length !== 0) {
		finalState = dstPath[dstPath.length - 1];
	} else if (srcPath.length !== 0) {
		finalState = Object.getPrototypeOf(srcPath[srcPath.length - 1]);
	} else {
		finalState = undefined;
	}

	srcPath = srcPath.filter(value => !value.hasOwnProperty('onExit'));
	dstPath = dstPath.filter(value => !value.hasOwnProperty('onEntry'));

	return new ProductionTransition<Context, Protocol, EventName>(srcPath, dstPath, finalState);
}

/** @internal */
// eslint-disable-next-line valid-jsdoc
async function doTransition<Context, Protocol extends {} | undefined>(hsm: HsmWithTracing<Context, Protocol>): Promise<void> {
	if (hsm._transitionState) {
		try {
			const srcState = hsm.currentState;
			const destState = hsm._transitionState;
			let tr: Transition<Context, Protocol> | undefined = hsm._transitionCache.get([srcState, destState]);
			if (!tr) {
				tr = createTransition(hsm.currentState, destState);
				hsm._transitionCache.set([hsm.currentState, destState], tr);
			}
			try {
				await tr.execute(hsm, srcState, destState);
			} catch (transitionError) {
				hsm.currentState = FatalErrorState;
				throw transitionError;
			}
		} finally {
			hsm._transitionState = undefined;
		}
	}
}

/** @internal */
// eslint-disable-next-line valid-jsdoc
async function doError<Context, Protocol extends {} | undefined, EventName extends keyof Protocol>(hsm: HsmWithTracing<Context, Protocol>, err: Error): Promise<void> {
	hsm._transitionState = undefined; // clear next state
	const messageHandler = hsm.currentState.prototype.onError;
	try {
		const result = messageHandler.call(hsm._instance, new EventHandlerError(hsm, err));
		if (result) await result;
		await doTransition(hsm);
	} catch (err) {
		if (err instanceof TransitionError) {
			throw new FatalError(hsm, err);
		} else {
			hsm.transition(FatalErrorState);
			try {
				await doTransition(hsm);
			} catch (transitionError) {
				throw new FatalError(hsm, err);
			}
		}
		throw new FatalError(hsm, err);
	}
}

/** @internal */
// eslint-disable-next-line valid-jsdoc
async function doUnhandledEventWithTracing<Context, Protocol extends {} | undefined, EventName extends keyof Protocol>(hsm: HsmWithTracing<Context, Protocol>, error: UnhandledEventError<Context, Protocol, EventName>): Promise<void> {
	try {
		const result = hsm.currentState.prototype.onUnhandled.call(hsm._instance, error);
		if (result) await result;
		await doTransition(hsm);
	} catch (err) {
		if (err instanceof TransitionError) {
			hsm.currentState = FatalErrorState;
			throw err;
		}
		await doError(hsm, err);
	}
}

/** @internal */
// eslint-disable-next-line valid-jsdoc
async function executeInit<Context, Protocol extends {} | undefined, EventName extends keyof Protocol>(hsm: HsmWithTracing<Context, Protocol>): Promise<void> {
	let currState: State<Context, Protocol> = hsm.topState;
	try {
		while (true) {
			const proto = currState.prototype;
			if (proto.hasOwnProperty('onEntry')) {
				proto.onEntry.call(hsm._instance);
			}
			if (hasInitialState(currState)) {
				currState = getInitialState(currState);
			} else break;
		}
		hsm.currentState = currState;
	} catch (cause) {
		hsm.currentState = FatalErrorState;
		throw new InitializationError(hsm, currState, cause);
	}
}

/** @internal */
// eslint-disable-next-line valid-jsdoc
async function dispatchEvent<Context, Protocol extends {} | undefined, EventName extends keyof Protocol>(hsm: HsmWithTracing<Context, Protocol>, eventName: EventHandlerName<Protocol, EventName>, ...eventPayload: EventHandlerPayload<Protocol, EventName>): Promise<void> {
	hsm._currentEventName = eventName as string;
	hsm._currentEventPayload = eventPayload;
	try {
		const eventHandler = hsm.currentState.prototype[eventName];
		if (!eventHandler) {
			await doUnhandledEventWithTracing(hsm, new UnhandledEventError(hsm));
			return;
		}
		try {
			const result = eventHandler.call(hsm._instance, ...eventPayload);
			if (result) await result;
			await doTransition(hsm);
		} catch (err) {
			if (err instanceof UnhandledEventError) {
				await doUnhandledEventWithTracing(hsm, err);
			} else if (err instanceof TransitionError) {
				throw err;
			} else {
				await doError(hsm, err);
			}
		}
	} finally {
		hsm._currentEventName = undefined;
		hsm._currentEventPayload = undefined;
		hsm._transitionState = undefined;
	}
}

// ---------------------------------------------------------------------------------------------------------------------
// Export: _createInitTask, _createEventDispatchTask
// ---------------------------------------------------------------------------------------------------------------------

export function createInitTask<DispatchContext, DispatchProtocol extends {} | undefined>(hsm: HsmWithTracing<DispatchContext, DispatchProtocol>): Task {
	return (done: DoneCallback): void => {
		executeInit(hsm)
			.catch((err: Error) => hsm.dispatchErrorCallback(hsm, hsm.traceWriter, err))
			.finally(() => done());
	};
}

export function createEventDispatchTask<DispatchContext, DispatchProtocol extends {} | undefined, EventName extends keyof DispatchProtocol>(hsm: HsmWithTracing<DispatchContext, DispatchProtocol>, eventName: EventHandlerName<DispatchProtocol, EventName>, ...eventPayload: EventHandlerPayload<DispatchProtocol, EventName>): Task {
	return (done: DoneCallback): void => {
		dispatchEvent(hsm, eventName, ...eventPayload)
			.catch((err: Error) => hsm.dispatchErrorCallback(hsm, hsm.traceWriter, err))
			.finally(() => done());
	};
}
