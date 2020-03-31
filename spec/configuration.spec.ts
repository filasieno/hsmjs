import { expect } from 'chai';
import 'mocha';
import { HsmProperties } from '../src/defs';
import * as ihsm from '../src/index';
import { createTestDispatchErrorCallback } from './spec.utils';
ihsm.configureDispatchErrorCallback(createTestDispatchErrorCallback());

class TestTraceWriter implements ihsm.TraceWriter {
	write<Context, Protocol>(hsm: HsmProperties<Context, Protocol>, msg: any): void {
		console.log(msg);
	}

	writeTrace<Context, Protocol>(hsm: HsmProperties<Context, Protocol>, trace: ihsm.TraceLevel, msg: any): void {}
}
describe(`changeTraceLevelTest`, function() {});
