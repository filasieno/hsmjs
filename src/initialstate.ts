import { InitialStateError, State } from './defs';

/**
 * todo
 *
 * @param {State<Context, Protocol>} State
 * @return {State<Context, Protocol>}
 * @typeparam DispatchContext
 * @typeparam DispatchProtocol
 * @category Initial state
 */
export function getInitialState<Context, Protocol extends {} | undefined>(State: State<Context, Protocol>): State<Context, Protocol> {
	if (Object.prototype.hasOwnProperty.call(State, '_initialState')) {
		return (State as { [key: string]: any })._initialState as State<Context, Protocol>;
	}
	throw new Error(State.name);
}

export function isInitialState<Context, Protocol extends {} | undefined>(State: State<Context, Protocol>): boolean {
	if (Object.prototype.hasOwnProperty.call(State, '_isInitialState')) {
		/**
		 * todo
		 *
		 * @typeparam DispatchContext
		 * @typeparam DispatchProtocol
		 *
		 * @param {State<Context, Protocol>} State
		 * @return {boolean}
		 * @category Initial state
		 */
		return (State as { [key: string]: any })._isInitialState;
	}
	return false;
}

/**
 * todo
 *
 * @typeparam DispatchContext
 * @typeparam DispatchProtocol
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
 * @typeparam DispatchContext
 * @typeparam DispatchProtocol
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
