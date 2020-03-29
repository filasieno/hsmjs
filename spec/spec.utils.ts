import { Hsm, TraceLevel, TraceWriter } from '../src/index';
export const TRACE_LEVELS: TraceLevel[] = [
	TraceLevel.TRACE,
	TraceLevel.DEBUG,
	//	TraceLevel.NONE
];

let lastError: Error | undefined = undefined;

export function createTestDispatchErrorCallback(eatError = false) {
	return <Context, Protocol extends {} | undefined>(hsm: Hsm<Context, Protocol>, traceWriter: TraceWriter, err: Error): void => {
		console.log('// -------------------------------------------------------------------------------------------------------');
		console.log(`// The following error has escaped the dispatch (eat error = ${eatError})`);
		console.log('// -------------------------------------------------------------------------------------------------------');
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
