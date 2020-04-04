import { expect } from 'chai';
import 'mocha';
import * as ihsm from '../';

import { clearLastError } from './spec.utils';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
class TestTraceWriter implements ihsm.HsmTraceWriter {
	write<Context, Protocol>(hsm: ihsm.HsmProperties<Context, Protocol>, msg: any): void {
		console.log(msg);
	}
}

describe(`changeTraceLevelTest`, function() {
	beforeEach(async () => {
		clearLastError();
		expect(true);
	});
});
