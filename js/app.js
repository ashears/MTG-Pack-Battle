import { tokens } from '../data/tokens.js';
import { presets } from '../data/presets.js';
import { rollTokens, validateRoll } from './randomizer.js';
import { restoreSettings, defaultSettings, storageKey } from './settings.js';

const $ = selector => document.querySelector(selector);
const ids = tokens.map(token => token.id);
const byId = new Map(tokens.map(token => [token.id, token]));
let settings = defaultSettings(ids);
let storageAvailable = true;
try { settings = restoreSettings(localStorage.getItem(storageKey), ids); }
catch { storageAvailable = false; }
let rollNumber = 0;

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function image(token, className = '', detailedFallback = false) {
  const img = element('img', className);
  img.alt = `${token.name} token card. Artwork by ${token.artist}.`;
  img.loading = 'lazy';
  img.width = 488;
  img.height = 680;
  img.addEventListener('error', () => {
    const fallback = element('div', 'image-fallback');
    fallback.append(element('span', '', '✧'), element('strong', '', token.name));
    if (detailedFallback) fallback.append(element('span', 'fallback-rules', token.rulesText));
    fallback.append(element('small', '', 'Card image unavailable'));
    img.replaceWith(fallback);
  }, { once: true });
  img.src = token.imageUrl;
  return img;
}

function showCard(token) {
  $('#dialog-title').textContent = token.name;
  const content = $('#dialog-content');
  content.replaceChildren(image(token, 'dialog-image', true), element('p', '', token.rulesText), credit(token));
  $('#card-dialog').showModal();
}

function credit(token) {
  const p = element('p', 'token-credit', `Art: ${token.artist} · `);
  const link = element('a', '', 'Scryfall');
  link.href = token.sourceUrl;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  p.append(link);
  return p;
}

function tokenCard(token, reference = false) {
  const article = element('article', 'token-card');
  const button = element('button', 'card-image-button');
  button.type = 'button';
  button.setAttribute('aria-label', `Enlarge ${token.name} token card`);
  button.append(image(token));
  button.addEventListener('click', () => showCard(token));
  const heading = element('h3', '', token.name);
  if (reference) heading.append(element('span', '', 'ARTIFACT'));
  article.append(button, heading);
  if (reference) article.append(element('p', 'token-tagline', token.tagline));
  article.append(element('p', 'token-rules', token.rulesText), credit(token));
  return article;
}

for (const id of ['treasure', 'clue', 'lander']) {
  const token = byId.get(id);
  const card = element('div', 'fan-card');
  const img = image(token);
  img.loading = 'eager';
  card.append(img);
  $('#hero-cards').append(card);
}
for (const token of tokens) {
  $('#token-reference').append(tokenCard(token, true));
  const label = element('label', 'pool-choice');
  const checkbox = element('input');
  checkbox.type = 'checkbox';
  checkbox.value = token.id;
  checkbox.name = 'pool';
  checkbox.checked = settings.tokenIds.includes(token.id);
  checkbox.addEventListener('change', () => {
    settings.tokenIds = [...document.querySelectorAll('input[name=pool]:checked')].map(input => input.value);
    update();
  });
  label.append(checkbox, element('span', '', token.name));
  $('#pool-options').append(label);
}

$('#preset').replaceChildren(...presets.map(preset => {
  const option = element('option', '', preset.name);
  option.value = preset.id;
  return option;
}), Object.assign(element('option', '', 'Custom'), { value: 'custom' }));
$('#token-count').value = settings.count;
$('#allow-duplicates').checked = settings.allowDuplicates;

function update() {
  const matchingPreset = presets.find(preset => preset.tokenIds.length === settings.tokenIds.length && preset.tokenIds.every(id => settings.tokenIds.includes(id)));
  $('#preset').value = matchingPreset?.id ?? 'custom';
  $('#pool-count').textContent = `${settings.tokenIds.length} selected`;
  const error = validateRoll(settings.tokenIds, settings.count, settings.allowDuplicates);
  $('#roll-validation').textContent = error;
  $('#roll-button').disabled = !!error;
  $('#token-count').setAttribute('aria-invalid', String(!Number.isInteger(settings.count) || settings.count < 1 || settings.count > 20));
  // Don't overwrite a valid saved count while the user clears or edits the input.
  if (Number.isInteger(settings.count) && settings.count >= 1 && settings.count <= 20) {
    try { localStorage.setItem(storageKey, JSON.stringify(settings)); }
    catch { storageAvailable = false; }
  }
  if (!storageAvailable) $('#saved-note').textContent = 'Browser storage is unavailable. You can still roll tokens.';
}
function setPool(selectedIds) {
  settings.tokenIds = [...selectedIds];
  for (const checkbox of document.querySelectorAll('input[name=pool]')) checkbox.checked = selectedIds.includes(checkbox.value);
  update();
}
$('#preset').addEventListener('change', event => {
  const preset = presets.find(item => item.id === event.target.value);
  if (preset) setPool(preset.tokenIds);
});
$('#select-all').addEventListener('click', () => setPool(ids));
$('#clear-all').addEventListener('click', () => setPool([]));
$('#token-count').addEventListener('input', event => { settings.count = event.target.valueAsNumber; update(); });
$('#allow-duplicates').addEventListener('change', event => { settings.allowDuplicates = event.target.checked; update(); });
$('#roll-form').addEventListener('submit', event => {
  event.preventDefault();
  if (validateRoll(settings.tokenIds, settings.count, settings.allowDuplicates)) return;
  const result = rollTokens(settings.tokenIds, settings.count, settings.allowDuplicates);
  $('#results').replaceChildren(...result.map(id => tokenCard(byId.get(id))));
  rollNumber++;
  $('#result-meta').textContent = `Roll ${rollNumber} · ${result.length} ${result.length === 1 ? 'token' : 'tokens'}`;
  $('#roll-status').textContent = `Roll ${rollNumber}: ${result.map(id => byId.get(id).name).join(', ')}. Create these tokens at the beginning of your first upkeep.`;
  $('#roll-button').firstChild.textContent = 'Roll again ';
});
$('#close-dialog').addEventListener('click', () => $('#card-dialog').close());
$('#card-dialog').addEventListener('click', event => { if (event.target === event.currentTarget) {
  const rect = event.currentTarget.getBoundingClientRect();
  if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) event.currentTarget.close();
} });
update();
