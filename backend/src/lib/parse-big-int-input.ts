export const parseBigIntInput = (value: unknown): bigint | null => {
	if (typeof value === "number") {
		if (!Number.isSafeInteger(value) || value < 0) return null;
		return BigInt(value);
	}
	if (typeof value === "string") {
		if (!/^\d+$/.test(value)) return null;
		return BigInt(value);
	}
	return null;
};
