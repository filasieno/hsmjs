export function quoteError(err: Error) {
	return `'${err.name}${err.message ? `: ${err.message}'` : "' with no error message"}`;
}
