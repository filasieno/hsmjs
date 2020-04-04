import { HsmStateClass, HsmTraceLevel, Hsm, HsmTraceWriter } from './';
import { HsmProperties } from './hsm';
import { Instance, HsmWithTracing } from './internal/defs.private';
import { HsmObject } from './internal/hsm';

/** @internal */
class ConsoleTraceWriter implements HsmTraceWriter {
	write<Context, Protocol extends {} | undefined>(hsm: HsmProperties<Context, Protocol>, Message: any): void {
		if (typeof Message == 'string') {
			console.log(`${hsm.traceHeader}${hsm.currentStateName}: ${Message}`);
		} else {
			console.log(Message);
		}
	}
}

/**
 * todo
 * @category Factory
 */
export class HsmFactory<Context, Protocol extends undefined | {}> {
	private static defaultDispatchErrorCallback<Context, Protocol extends {} | undefined>(hsm: Hsm<Context, Protocol>, traceWriter: HsmTraceWriter, err: Error): void {
		traceWriter.write(hsm, `An event dispatch has failed; error ${err.name}: ${err.message} has not been managed`);
		traceWriter.write(hsm, err);
		throw err;
	}
	private static defaultTraceWriter = new ConsoleTraceWriter();
	private static defaultTraceLevel = HsmTraceLevel.DEBUG;
	private static defaultInitialize = true;
	constructor(public topState: HsmStateClass<Context, Protocol>, public initialize = HsmFactory.defaultInitialize, public traceLevel = HsmFactory.defaultTraceLevel, public traceWriter = HsmFactory.defaultTraceWriter, public dispatchErrorCallback = HsmFactory.defaultDispatchErrorCallback) {}

	create(ctx: Context, initialize: boolean = this.initialize, traceLevel = this.traceLevel, traceWriter = this.traceWriter, dispatchErrorCallback = this.dispatchErrorCallback): Hsm<Context, Protocol> {
		const instance: Instance<Context, Protocol> = {
			hsm: (undefined as unknown) as HsmWithTracing<Context, Protocol>,
			ctx: ctx,
		};
		Object.setPrototypeOf(instance, this.topState.prototype);
		instance.hsm = new HsmObject(this.topState, instance, traceWriter, traceLevel, dispatchErrorCallback, initialize);
		return instance.hsm;
	}
}
