import { expect } from 'chai';
import 'mocha';
import * as ihsm from '../src/index';

class TestTraceWriter implements ihsm.TraceWriter {
	write<Context, Protocol>(hsm: ihsm.TraceWriterBoundHsm<Context, Protocol>, msg: any): void {
		console.log(msg);
	}
}
describe(`changeTraceLevelTest`, function() {});
