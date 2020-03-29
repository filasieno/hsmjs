import { expect } from 'chai';
import 'mocha';
import * as ihsm from '../src/index';
import { createTestDispatchErrorCallback } from './spec.utils';
ihsm.configureDispatchErrorCallback(createTestDispatchErrorCallback());

class TestTraceWriter implements ihsm.TraceWriter {
	write<Context, Protocol>(hsm: ihsm.TraceWriterBoundHsm<Context, Protocol>, msg: any): void {
		console.log(msg);
	}

	writeTrace<Context, Protocol>(hsm: ihsm.TraceWriterBoundHsm<Context, Protocol>, trace: ihsm.TraceLevel, msg: any): void {}
}
describe(`changeTraceLevelTest`, function() {});
