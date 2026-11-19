export const storageKey = 'mtg-pack-battle.settings.v1';
export function defaultSettings(ids) {
  return { tokenIds: [...ids], count: 1, allowDuplicates: false };
}
export function restoreSettings(raw, ids) {
  const fallback = defaultSettings(ids);
  try {
    const value = JSON.parse(raw);
    if (!value || !Array.isArray(value.tokenIds) || !value.tokenIds.every(id => typeof id === 'string')) return fallback;
    return {
      tokenIds: [...new Set(value.tokenIds.filter(id => ids.includes(id)))],
      count: Number.isInteger(value.count) && value.count >= 1 && value.count <= 20 ? value.count : 1,
      allowDuplicates: value.allowDuplicates === true,
    };
  } catch { return fallback; }
}
