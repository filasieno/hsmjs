/** @internal */
// eslint-disable-next-line valid-jsdoc
export function quoteError(err: Error): string {
	return `${err.name}${err.message ? `: ${err.message}` : ' with no error message'}`;
}
