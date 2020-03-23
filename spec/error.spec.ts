import { expect } from 'chai';
import 'mocha';
import * as ihsm from '../src/index';

const errorCode = 2000;
const message = 'MyError message';
const cause = 'MyError cause';
const solution = 'MyError solution';

class MyError extends ihsm.HsmError {
	constructor() {
		super(errorCode, message, cause, solution);
	}
}

describe('HsmError', function() {
	it('An HSM error provide the following fields: errorCode, cause, solution', async (): Promise<void> => {
		try {
			// noinspection ExceptionCaughtLocallyJS
			throw new MyError();
		} catch (e) {
			expect(e).is.instanceOf(MyError);
			expect(e).hasOwnProperty('errorCode');
			if (e instanceof MyError) {
				expect(e.errorCode).eq(errorCode);
				expect(e.cause).eq(cause);
				expect(e.solution).eq(solution);
				expect(e.toString()).eq(`IHSM-${errorCode}: ${message}`);
			}
		}
	});
});
