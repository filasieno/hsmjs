/** @internal */
import { HsmStateClass } from '../../lib';

// eslint-disable-next-line valid-jsdoc
export function quoteError(err: Error): string {
	return `${err.name}${err.message ? `: ${err.message}` : ' with no error message'}`;
}

/**
 * todo
 *
 * @param {State<Context, Protocol>} State
 * @return {State<Context, Protocol>}
 * @typeparam DispatchContext
 * @typeparam DispatchProtocol
 * @category Initial state
 * @internal
 */
export function getInitialState<Context, Protocol extends {} | undefined>(State: HsmStateClass<Context, Protocol>): HsmStateClass<Context, Protocol> {
	if (Object.prototype.hasOwnProperty.call(State, '_initialState')) {
		return (State as { [key: string]: any })._initialState as HsmStateClass<Context, Protocol>;
	}
	throw new Error(State.name); // TODO: add error
}

/**
 * todo
 *
 * @param {State<Context, Protocol>} State
 * @return {boolean}
 * @internal
 */
export function isInitialState<Context, Protocol extends {} | undefined>(State: HsmStateClass<Context, Protocol>): boolean {
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
 * @internal
 */
export function hasInitialState<Context, Protocol extends {} | undefined>(State: HsmStateClass<Context, Protocol>): boolean {
	return Object.prototype.hasOwnProperty.call(State, '_initialState');
}
