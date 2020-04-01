import { DispatchErrorCallback, Hsm, Options, State, StateBoundHsm, TraceLevel, TraceWriter } from './defs';
import { HsmInstance, HsmWithTracing } from './private/defs.private';
import { HsmObject } from './private/hsm';

/**
 * @category Configuration
 */
export class ConsoleTraceWriter implements TraceWriter {
	write<Context, Protocol extends {} | undefined>(hsm: StateBoundHsm<Context, Protocol>, trace: any): void {
		if (typeof trace == 'string') {
			console.log(`${hsm.traceHeader}${trace}`);
		} else {
			console.log(trace);
		}
	}
}

/** @internal */
const defaultTraceWriter = new ConsoleTraceWriter();

/**
 * todo
 * @param {Hsm<Context, Protocol>} hsm
 * @param {TraceWriter} traceWriter
 * @param {Error} err
 */
export function defaultDispatchErrorCallback<Context, Protocol extends {} | undefined>(hsm: Hsm<Context, Protocol>, traceWriter: TraceWriter, err: Error): void {
	traceWriter.write(hsm, `An event dispatch has failed; error ${err.name}: ${err.message} has not been managed`);
	traceWriter.write(hsm, err);
	throw err;
}

/** @internal */
let defaultCreateOptions: Options = {
	traceLevel: TraceLevel.PRODUCTION,
	traceWriter: defaultTraceWriter,
	dispatchErrorCallback: defaultDispatchErrorCallback,
};

/**
 * Used to configureHsm the default _options_ object used when executing the {@link create} or {@link create} functions.
 *
 * @param {HsmOptions} options the new default options object
 * @category Configuration
 */
export function configureHsm(
	options: Options = {
		traceLevel: TraceLevel.PRODUCTION,
		traceWriter: defaultTraceWriter,
		dispatchErrorCallback: defaultDispatchErrorCallback,
	}
): void {
	defaultCreateOptions = {
		traceLevel: options.traceLevel,
		traceWriter: options.traceWriter,
		dispatchErrorCallback: options.dispatchErrorCallback,
	};
}

/**
 * todo
 * @param {TraceLevel} traceLevel
 * @category Configuration
 */
// prettier-ignore
export function configureTraceLevel(traceLevel: TraceLevel = TraceLevel.PRODUCTION): void { defaultCreateOptions.traceLevel = traceLevel; }

// eslint-disable-next-line valid-jsdoc
/**
 * todo
 * @param {TraceWriter} traceWriter
 * @category Configuration
 */
// prettier-ignore
export function configureTraceWriter(traceWriter: TraceWriter = defaultTraceWriter): void { defaultCreateOptions.traceWriter = traceWriter; }

// prettier-ignore
export function configureDispatchErrorCallback<Context, Protocol extends {} | undefined>(dispatchErrorCallback: <Context, Protocol extends {} | undefined>(hsm: Hsm<Context, Protocol>, traceWriter: TraceWriter, err: Error) => void = defaultDispatchErrorCallback): void {
	defaultCreateOptions.dispatchErrorCallback = dispatchErrorCallback;
}

/**
 *
 * @param {State<Context, Protocol>} topState
 * @param {Context} ctx
 * @param {boolean} initialize
 * @param dispatchErrorCallback
 * @param {HsmOptions} options
 * @return {Hsm<Context, Protocol>}
 * @category Configuration
 */
// prettier-ignore
export function create<Context, Protocol extends {} | undefined, EventName extends keyof Protocol>(
	topState: State<Context, Protocol>,
	ctx: Context,
	initialize = true,
	dispatchErrorCallback?: DispatchErrorCallback<Context, Protocol>,
	options?: Options
): Hsm<Context, Protocol> {
	const userOptions = options ? options : defaultCreateOptions;
	const instance: HsmInstance<Context, Protocol> = {
		hsm: (undefined as unknown) as HsmWithTracing<Context, Protocol>,
		ctx: ctx,
	};
	const dec: DispatchErrorCallback<Context, Protocol> = dispatchErrorCallback ? dispatchErrorCallback : userOptions.dispatchErrorCallback;
	Object.setPrototypeOf(instance, topState.prototype);
	instance.hsm = new HsmObject(topState, instance, userOptions.traceWriter, userOptions.traceLevel, dec, initialize);
	return instance.hsm;
}
