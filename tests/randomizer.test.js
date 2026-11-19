import test from 'node:test';
import assert from 'node:assert/strict';
import { rollTokens, validateRoll } from '../js/randomizer.js';
import { restoreSettings, defaultSettings } from '../js/settings.js';
import { tokens } from '../data/tokens.js';
import { presets } from '../data/presets.js';
const ids = tokens.map(token => token.id);

test('catalog has unique stable IDs, real images, readable rules, and source credits', () => {
  assert.equal(new Set(ids).size, tokens.length);
  assert.deepEqual(ids, ['treasure', 'clue', 'map', 'lander']);
  for (const token of tokens) {
    for (const key of ['id', 'name', 'rulesText', 'artist', 'tagline']) assert.ok(token[key]?.trim());
    assert.equal(new URL(token.imageUrl).hostname, 'cards.scryfall.io');
    assert.equal(new URL(token.sourceUrl).hostname, 'scryfall.com');
  }
  assert.equal(new Set(presets.map(preset => preset.id)).size, presets.length);
  for (const preset of presets) {
    assert.ok(preset.name && preset.tokenIds.length);
    assert.equal(new Set(preset.tokenIds).size, preset.tokenIds.length);
    assert.ok(preset.tokenIds.every(id => ids.includes(id)));
  }
  assert.deepEqual(presets[0].tokenIds, ids);
});

test('rolls only pool members, uses exact counts, and leaves input unchanged', () => {
  const pool = ['clue', 'lander'];
  assert.deepEqual(rollTokens(pool, 2, false, () => 0), pool);
  assert.deepEqual(rollTokens(pool, 2, false, () => 0.999999), ['lander', 'clue']);
  assert.deepEqual(pool, ['clue', 'lander']);
  assert.deepEqual(rollTokens(pool, 20, true, () => 0), Array(20).fill('clue'));
  assert.deepEqual(rollTokens(['clue'], 1, false, () => 0), ['clue']);
});

test('without replacement, every permutation is reachable with equal probability', () => {
  const permutations = new Set();
  for (let a = 0; a < 4; a++) for (let b = 0; b < 3; b++) for (let c = 0; c < 2; c++) {
    const values = [(a + 0.5) / 4, (b + 0.5) / 3, (c + 0.5) / 2, 0.5];
    const result = rollTokens(ids, 4, false, () => values.shift());
    assert.equal(new Set(result).size, 4);
    permutations.add(result.join(','));
  }
  assert.equal(permutations.size, 24);
});

test('with replacement, each type occupies one equal interval on every draw', () => {
  const values = [0.125, 0.375, 0.625, 0.875, 0.125];
  assert.deepEqual(rollTokens(ids, 5, true, () => values.shift()), [...ids, ids[0]]);
});

test('invalid pools, counts, and random sources are rejected', () => {
  for (const count of [NaN, Infinity, 0, -1, 21, 1.5, '2']) {
    assert.ok(validateRoll(ids, count, false));
    assert.throws(() => rollTokens(ids, count, false), RangeError);
  }
  assert.throws(() => rollTokens([], 1, true), RangeError);
  assert.throws(() => rollTokens(['clue'], 2, false), RangeError);
  assert.throws(() => rollTokens(['clue', 'clue'], 2, false), RangeError);
  for (const value of [-1, 1, NaN, Infinity]) assert.throws(() => rollTokens(ids, 1, false, () => value), RangeError);
  assert.equal(validateRoll(ids, 4, false), '');
  assert.equal(validateRoll(ids, 20, true), '');
});

test('settings restore empty custom pools and all valid controls', () => {
  const settings = { tokenIds: ['map', 'clue'], count: 12, allowDuplicates: true };
  assert.deepEqual(restoreSettings(JSON.stringify(settings), ids), settings);
  assert.deepEqual(restoreSettings(JSON.stringify({ ...settings, tokenIds: [] }), ids).tokenIds, []);
});

test('damaged and outdated saved settings recover without invalid token references', () => {
  for (const value of [null, '{}', 'null', 'not json', '[]', '{"tokenIds":[1]}']) assert.deepEqual(restoreSettings(value, ids), defaultSettings(ids));
  const saved = restoreSettings(JSON.stringify({ tokenIds: ['clue', 'clue', 'removed'], count: 99, allowDuplicates: 'true' }), ids);
  assert.deepEqual(saved, { tokenIds: ['clue'], count: 1, allowDuplicates: false });
});
