// Each dispatch implementation function exports 3 functions:
//   - a Transition Factory
//   - an Init Dispatch function
//   - an Event Dispatch Function

// eslint-disable-next-line valid-jsdoc
import { HsmWithTracing, Task, Transition, DoneCallback } from './private-defs';
import { quoteError } from './utils';
import { BaseTopState, EventHandlerError, EventHandlerName, EventHandlerPayload, FatalErrorState, RuntimeError, State, TransitionError, UnhandledEventError, StateBoundHsm } from '../defs';

import { getInitialState, hasInitialState } from '../initialstate';

// ---------------------------------------------------------------------------------------------------------------------
// Private Implementation
// ---------------------------------------------------------------------------------------------------------------------

/** @internal */
// eslint-disable-next-line valid-jsdoc
class TraceTransition<Context, Protocol extends {} | undefined, EventName extends keyof Protocol> implements Transition<Context, Protocol> {
	constructor(private exitList: Array<State<Context, Protocol>>, private entryList: Array<State<Context, Protocol>>, public srcState: State<Context, Protocol>, public dstState: State<Context, Protocol>) {}

	async execute<EventName extends keyof Protocol>(hsm: HsmWithTracing<Context, Protocol>): Promise<void> {
		hsm.tracePush(`transition from ${this.srcState.name} to ${this.dstState.name}`, `started transition from ${this.srcState.name} to ${this.dstState.name} `);

		// Execute exit
		for (const state of this.exitList) {
			const statePrototype = state.prototype;
			const stateName = state.name;
			if (Object.prototype.hasOwnProperty.call(statePrototype, 'onExit')) {
				try {
					const res = statePrototype.onExit.call(hsm);
					if (res) await res;
					hsm.writeTrace(`${stateName}.onExit() done`);
				} catch (cause) {
					hsm.tracePopError(`${stateName}.onExit() has thrown ${quoteError(cause)}`);
					throw new TransitionError(hsm, cause, state.name, 'onExit', this.srcState.name, this.dstState.name);
				}
			} else {
				hsm.writeTrace(`${stateName}.onExit() skipped: default empty implementation`);
			}
		}

		// Execute entry
		for (const state of this.entryList) {
			const statePrototype = state.prototype;
			const stateName = state.name;
			if (Object.prototype.hasOwnProperty.call(statePrototype, 'onEntry')) {
				try {
					const res = statePrototype.onEntry.call(hsm);
					if (res) await res;
					hsm.writeTrace(`${stateName}.onEntry() done`);
				} catch (cause) {
					hsm.tracePopError(`${stateName}.onExit() has thrown ${quoteError(cause)}`);
					throw new TransitionError(hsm, cause, state.name, 'onEntry', this.srcState.name, this.dstState.name);
				}
			} else {
				hsm.writeTrace(`${stateName}.onEntry() skipped: default empty implementation`);
			}
		}
		let newState;
		if (this.entryList.length !== 0) {
			newState = this.entryList[this.entryList.length - 1];
		} else if (this.exitList.length !== 0) {
			newState = Object.getPrototypeOf(this.exitList[this.exitList.length - 1]);
		} else {
			newState = hsm.currentState;
		}
		hsm.tracePopDone(`final state is ${newState.name}`);
		hsm.currentState = newState;
		return; // Empty transition lists
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

/** @internal */
// eslint-disable-next-line valid-jsdoc
async function doTransitionWithTracing<Context, Protocol extends {} | undefined>(hsm: HsmWithTracing<Context, Protocol>): Promise<void> {
	try {
		if (hsm.transitionState) {
			const srcState = hsm.currentState;
			const destState = hsm.transitionState;
			hsm.writeTrace(`requested transition from ${srcState.name} to ${destState.name} `);
			let tr: Transition<Context, Protocol> | undefined = hsm.transitionCache.get([srcState, destState]);
			if (!tr) {
				tr = createTransition(hsm.currentState, destState);
				hsm.transitionCache.set([hsm.currentState, destState], tr);
			}
			try {
				await tr.execute(hsm);
			} catch (transitionError) {
				hsm.currentState = FatalErrorState;
				throw transitionError;
			}
		} else {
			hsm.writeTrace('no transition requested');
		}
	} finally {
		hsm.transitionState = undefined;
	}
}

/** @internal */
// eslint-disable-next-line valid-jsdoc
function lookupErrorHandlerWithTracing<Context, Protocol extends {} | undefined, EventName extends keyof Protocol>(hsm: HsmWithTracing<Context, Protocol>): (error: RuntimeError<Context, Protocol, EventName>) => Promise<void> | void {
	let state = hsm.currentState;
	hsm.tracePush(`lookup`, `started lookup of #onError event handler`);
	while (true) {
		const prototype = state.prototype;
		if (Object.prototype.hasOwnProperty.call(prototype, 'onError')) {
			hsm.tracePopDone(`found in state ${prototype.constructor.name}`);
			return prototype['onError'];
		} else {
			hsm.writeTrace(`not found in state ${prototype.constructor.name}`);
			if (state == BaseTopState) break;
			state = Object.getPrototypeOf(state);
		}
	}
	throw new Error('Illegal state');
}

/** @internal */
// eslint-disable-next-line valid-jsdoc
async function doErrorWithTracing<Context, Protocol extends {} | undefined, EventName extends keyof Protocol>(hsm: HsmWithTracing<Context, Protocol>, err: Error): Promise<void> {
	try {
		hsm.tracePush(`error recovery`, `started error recovery`);
		const messageHandler = lookupErrorHandlerWithTracing(hsm);
		try {
			hsm.tracePush('execute', 'started #onError handler execution');
			const result = messageHandler.call(hsm.instance, new EventHandlerError(hsm, err));
			if (result) await result;
			hsm.tracePopDone('error handler execution successful');
			await doTransitionWithTracing(hsm);
		} catch (err) {
			hsm.tracePopError(err);
			if (!(err instanceof TransitionError)) {
				hsm.transition(FatalErrorState);
				await doTransitionWithTracing(hsm);
			}
			throw err;
		}
		hsm.tracePopDone('error recovery successful');
	} catch (err) {
		hsm.tracePopError(`error recovery failure: ${quoteError(err)}`);
		throw err;
	}
}

/** @internal */
// eslint-disable-next-line valid-jsdoc
function lookupUnhandledWithTracing<Context, Protocol extends {} | undefined, EventName extends keyof Protocol>(hsm: HsmWithTracing<Context, Protocol>): (error: UnhandledEventError<Context, Protocol, EventName>) => Promise<void> | void {
	let state = hsm.currentState;
	hsm.tracePush(`lookup`, `started lookup of #onUnhandled event handler`);
	while (true) {
		const prototype = state.prototype;
		if (Object.prototype.hasOwnProperty.call(prototype, 'onUnhandled')) {
			hsm.tracePopDone(`found in state ${prototype.constructor.name}`);
			return prototype['onUnhandled'];
		} else {
			hsm.writeTrace(`not found in state ${prototype.constructor.name}`);
			if (state == BaseTopState) break;
			state = Object.getPrototypeOf(state);
		}
	}
	throw new Error('Illegal state');
}

/** @internal */
// eslint-disable-next-line valid-jsdoc
async function doUnhandledEventWithTracing<Context, Protocol extends {} | undefined, EventName extends keyof Protocol>(hsm: HsmWithTracing<Context, Protocol>, error: UnhandledEventError<Context, Protocol, EventName>): Promise<void> {
	try {
		hsm.tracePush('unhandled recovery', `started unhandled event recovery`);
		const messageHandler = lookupUnhandledWithTracing(hsm);
		try {
			hsm.tracePush('execute', 'started #onUnhandled handler execution');
			const result = messageHandler.call(hsm.instance, error);
			if (result) await result;
			hsm.tracePopDone('unhandled handler execution successful');
			await doTransitionWithTracing(hsm);
		} catch (err) {
			hsm.tracePopError(err);
			if (!(err instanceof TransitionError)) {
				hsm.transition(FatalErrorState);
				await doTransitionWithTracing(hsm);
			}
			throw err;
		}
		hsm.tracePopDone('unhandled event recovery successful');
	} catch (err) {
		hsm.tracePopError(`unhandled event recovery failure: ${quoteError(err)}`);
		throw err;
	}
}

/** @internal */
// eslint-disable-next-line valid-jsdoc
function lookupEventHandlerWithTracing<Context, Protocol extends {} | undefined, EventName extends keyof Protocol>(hsm: HsmWithTracing<Context, Protocol>, eventName: EventHandlerName<Protocol, EventName>): ((...args: EventHandlerPayload<Protocol, EventName>) => Promise<void> | void) | undefined {
	let state = hsm.currentState;
	hsm.tracePush(`lookup`, `started lookup of #${eventName} event handler`);
	while (true) {
		const prototype = state.prototype;
		if (Object.prototype.hasOwnProperty.call(prototype, eventName)) {
			hsm.tracePopDone(`#${eventName} found in state ${prototype.constructor.name}`);
			return prototype[eventName];
		} else {
			hsm.writeTrace(`not found in state ${prototype.constructor.name}`);
			if (state == BaseTopState) break;
			state = Object.getPrototypeOf(state);
		}
	}
	hsm.tracePopError(`not found in state ${hsm.currentStateName}`);
	return undefined;
}

/** @internal */
// eslint-disable-next-line valid-jsdoc
async function executeInit<Context, Protocol extends {} | undefined, EventName extends keyof Protocol>(hsm: HsmWithTracing<Context, Protocol>): Promise<void> {
	let currState: State<Context, Protocol> = hsm.topState;
	hsm.tracePush(`initialize`, `started initialization from ${hsm.topState.name}`);
	try {
		while (true) {
			if (Object.prototype.hasOwnProperty.call(currState.prototype, 'onEntry')) {
				currState.prototype['onEntry'].call(hsm);
				hsm.writeTrace(`${currState.name}.onEntry() done`);
			} else {
				hsm.writeTrace(`skip ${currState.name}.onEntry(): default empty implementation`);
			}

			if (hasInitialState(currState)) {
				const newInitialState = getInitialState(currState);
				hsm.writeTrace(`${currState.name} initial state is ${newInitialState.name}`);
				currState = newInitialState;
			} else {
				hsm.writeTrace(`${currState.name} has no initial state; final state is ${currState.name}`);
				break;
			}
		}
		hsm.tracePopDone(`final state is ${currState.name}`);
		hsm.currentState = currState;
	} catch (err) {
		hsm.tracePopError(`fatal error: initialization failed from top state '${hsm.topState.name}' as ${currState.name}.onEntry() handler has raised ${quoteError(err)}; final state is ${FatalErrorState.name}`);
		hsm.currentState = FatalErrorState;
		throw err; // TODO: add InitializationFailedError
	}
}

/** @internal */
// eslint-disable-next-line valid-jsdoc
async function dispatchEvent<Context, Protocol extends {} | undefined, EventName extends keyof Protocol>(hsm: HsmWithTracing<Context, Protocol>, eventName: EventHandlerName<Protocol, EventName>, ...eventPayload: EventHandlerPayload<Protocol, EventName>): Promise<void> {
	try {
		hsm.writeDebug(`requested dispatch of #${eventName}`);
		hsm.tracePush(`#${eventName}`, `started dispatch`);
		hsm.currentEventName = eventName as string;
		hsm.currentEventPayload = eventPayload;
		const messageHandler = lookupEventHandlerWithTracing(hsm, eventName);
		if (!messageHandler) {
			hsm.writeTrace(`event #${eventName} is unhandled in state ${hsm.currentStateName}`);
			await doUnhandledEventWithTracing(hsm, new UnhandledEventError(hsm));
			return;
		}
		try {
			hsm.tracePush('execute', 'started event handler execution');
			const result = messageHandler.call(hsm.instance, ...eventPayload);
			if (result) await result;
			await doTransitionWithTracing(hsm);
			hsm.tracePopDone('event handler execution successful');
		} catch (err) {
			if (err instanceof UnhandledEventError) {
				hsm.writeDebug(`event handler has signalled that the event is unhandled`);
				await doUnhandledEventWithTracing(hsm, err);
			} else if (err instanceof TransitionError) {
				hsm.tracePopError(err);
				throw err;
			} else {
				hsm.tracePopError(err);
				await doErrorWithTracing(hsm, err);
			}
		}

		hsm.tracePopDone('dispatch successful');
		hsm.writeTrace(`dispatch done`);
	} catch (err) {
		hsm.tracePopError(`dispatch failure: ${quoteError(err)}`);
		hsm.writeTrace(`dispatch failed`);
		throw err;
	} finally {
		hsm.currentEventName = undefined;
		hsm.currentEventPayload = undefined;
		hsm.transitionState = undefined;
	}
}

// ---------------------------------------------------------------------------------------------------------------------
// Export: createInitTask, createEventDispatchTask
// ---------------------------------------------------------------------------------------------------------------------

export function createInitTask<DispatchContext, DispatchProtocol extends {} | undefined>(hsm: HsmWithTracing<DispatchContext, DispatchProtocol>): Task {
	return (done: DoneCallback) => {
		executeInit(hsm)
			.catch((err: Error) => hsm.dispatchErrorCallback(hsm, hsm.traceWriter, err))
			.finally(() => done());
	};
}

export function createEventDispatchTask<DispatchContext, DispatchProtocol extends {} | undefined, EventName extends keyof DispatchProtocol>(hsm: HsmWithTracing<DispatchContext, DispatchProtocol>, eventName: EventHandlerName<DispatchProtocol, EventName>, ...eventPayload: EventHandlerPayload<DispatchProtocol, EventName>): Task {
	return (done: DoneCallback) => {
		dispatchEvent(hsm, eventName, ...eventPayload)
			.catch((err: Error) => hsm.dispatchErrorCallback(hsm, hsm.traceWriter, err))
			.finally(() => done());
	};
}
