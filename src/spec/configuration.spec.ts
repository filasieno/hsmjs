import { expect } from 'chai';
import 'mocha';
import { HsmProperties } from '../defs';
import * as ihsm from '../index';
import { clearLastError, createTestDispatchErrorCallback } from './spec.utils';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
class TestTraceWriter implements ihsm.TraceWriter {
	write<Context, Protocol>(hsm: HsmProperties<Context, Protocol>, msg: any): void {
		console.log(msg);
	}
}

describe(`changeTraceLevelTest`, function() {
	beforeEach(async () => {
		clearLastError();
		ihsm.configureDispatchErrorCallback(createTestDispatchErrorCallback());
		expect(true);
	});
});
