export function validateRoll(pool, count, allowDuplicates) {
  if (!Number.isInteger(count) || count < 1 || count > 20) return 'Choose a whole number of tokens from 1 to 20.';
  if (pool.length === 0) return 'Select at least one token to build your pool.';
  if (!allowDuplicates && count > pool.length) return `Choose ${pool.length} or fewer tokens, select more types, or allow duplicates.`;
  return '';
}

export function rollTokens(pool, count, allowDuplicates, random = Math.random) {
  const uniquePool = [...new Set(pool)];
  const error = validateRoll(uniquePool, count, allowDuplicates);
  if (error) throw new RangeError(error);
  const available = [...uniquePool];
  const result = [];
  for (let i = 0; i < count; i++) {
    const value = random();
    if (!Number.isFinite(value) || value < 0 || value >= 1) throw new RangeError('Random source must return a number in [0, 1).');
    const index = Math.floor(value * available.length);
    result.push(available[index]);
    if (!allowDuplicates) available.splice(index, 1);
  }
  return result;
}
