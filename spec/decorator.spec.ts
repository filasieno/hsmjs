import { expect } from 'chai';
import 'mocha';
import * as ihsm from '../src/index';
import { createTestDispatchErrorCallback } from './spec.utils';
ihsm.configureDispatchErrorCallback(createTestDispatchErrorCallback());

describe('@initialState decorator', function() {
	it('sets BaseTopState._isInitialState and BaseTopState._initialState on BaseTopState constructor', async (): Promise<void> => {
		class TopState extends ihsm.BaseTopState {}

		@ihsm.initialState
		class A extends TopState {}

		class B extends TopState {}

		expect(ihsm.isInitialState(A)).eq(true);
		expect(ihsm.hasInitialState(A)).eq(false);
		expect(ihsm.isInitialState(B)).eq(false);
		expect(ihsm.hasInitialState(B)).eq(false);
		expect(ihsm.isInitialState(TopState)).eq(false);
		expect(ihsm.hasInitialState(TopState)).eq(true);
		expect(ihsm.getInitialState(TopState)).eq(A);
	});

	it('throws InitialStateError if @initialState is set on two or more states that have the same parent', async (): Promise<void> => {
		class TopState extends ihsm.BaseTopState {}

		@ihsm.initialState
		class A extends TopState {}

		try {
			@ihsm.initialState
			class B extends TopState {}
			expect.fail('Should have failed');
		} catch (e) {}
	});
});
