import { expect } from 'chai';
import 'mocha';
import * as ihsm from '../src/index';

class TopState extends ihsm.TopState {}

@ihsm.initialState
class A extends TopState {}

class B extends TopState {}

describe('@initialState decorator', function() {
	it('sets isInitialState and initialState static fields', async (): Promise<void> => {
		expect(A.isInitialState).eq(true);
		expect(A.initialState).eq(undefined);
		expect(B.isInitialState).eq(false);
		expect(B.initialState).eq(undefined);
		expect(TopState.initialState).eq(A);
		expect(TopState.isInitialState).eq(false);
	});
});
