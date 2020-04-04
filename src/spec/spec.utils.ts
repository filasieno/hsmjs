import { Hsm, HsmTraceLevel, HsmTraceWriter } from '../';
export const TRACE_LEVELS: HsmTraceLevel[] = [HsmTraceLevel.VERBOSE_DEBUG, HsmTraceLevel.DEBUG, HsmTraceLevel.PRODUCTION];

let lastError: Error | undefined = undefined;

export function createTestDispatchErrorCallback(eatError = false) {
	return <Context, Protocol extends {} | undefined>(hsm: Hsm<Context, Protocol>, traceWriter: HsmTraceWriter, err: Error): void => {
		console.log(`
// -------------------------------------------------------------------------------------------------------
// The following error has escaped the dispatch (eat error = ${eatError})
// -------------------------------------------------------------------------------------------------------
`);
		traceWriter.write(hsm, err);
		lastError = err;
		if (!eatError) throw err;
	};
}

export function getLastError(): Error | undefined {
	return lastError;
}

export function clearLastError(): void {
	lastError = undefined;
}
