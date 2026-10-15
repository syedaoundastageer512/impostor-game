"use strict";

const STORAGE_KEY = "imposter-game:setup:v1";
const ROUND_MARKER_KEY = "imposter-game:round-active:v1";
const MIN_PLAYERS = 3;
const MAX_PLAYERS = 12;
const MAX_NAME_LENGTH = 20;
const VALID_NAME = /^[\p{L}\p{N}][\p{L}\p{N} '\-]*$/u;
const WORDS = globalThis.IMPOSTER_WORDS;

const APP_STATES = Object.freeze({
  SETUP: "setup",
  HANDOFF: "handoff",
  REVEAL: "reveal",
  DISCUSSION: "discussion",
  INTERRUPTED: "interrupted"
});

const categories = [
  { id: "all", name: "All Categories", icon: "✦" },
  { id: "everyday", name: "Everyday Things", icon: "⌂" },
  { id: "food", name: "Food & Drinks", icon: "◒" },
  { id: "animals", name: "Animals", icon: "◇" },
  { id: "places", name: "Places", icon: "⌖" },
  { id: "movies", name: "Movies & TV", icon: "▷" },
  { id: "sports", name: "Sports", icon: "●" },
  { id: "jobs", name: "Jobs", icon: "□" },
  { id: "nature", name: "Nature", icon: "⌁" }
];

const defaultSettings = Object.freeze({
  version: 1,
  players: ["Player 1", "Player 2", "Player 3"],
  categories: ["everyday"],
  timerEnabled: false,
  timerDuration: 3
});

const elements = {
  form: document.querySelector("#setup-form"),
  playerList: document.querySelector("#player-list"),
  playerCount: document.querySelector("#player-count"),
  addPlayer: document.querySelector("#add-player"),
  categoryList: document.querySelector("#category-list"),
  categoryError: document.querySelector("#category-error"),
  timerEnabled: document.querySelector("#timer-enabled"),
  timerOptions: document.querySelector("#timer-options"),
  timerDuration: document.querySelector("#timer-duration"),
  clearSettings: document.querySelector("#clear-settings"),
  errorSummary: document.querySelector("#form-error-summary"),
  errorSummaryList: document.querySelector("#error-summary-list"),
  interruptedPanel: document.querySelector("#interrupted-panel"),
  restartInterrupted: document.querySelector("#restart-interrupted"),
  handoffPanel: document.querySelector("#handoff-panel"),
  handoffProgress: document.querySelector("#handoff-progress"),
  handoffTitle: document.querySelector("#handoff-title"),
  playerReady: document.querySelector("#player-ready"),
  revealPanel: document.querySelector("#reveal-panel"),
  revealProgress: document.querySelector("#reveal-progress"),
  revealTitle: document.querySelector("#reveal-title"),
  revealInstruction: document.querySelector("#reveal-instruction"),
  roleCard: document.querySelector("#role-card"),
  roleCardCover: document.querySelector("#role-card-cover"),
  roleCardContent: document.querySelector("#role-card-content"),
  roleLabel: document.querySelector("#role-label"),
  roleValue: document.querySelector("#role-value"),
  roleNote: document.querySelector("#role-note"),
  holdReveal: document.querySelector("#hold-reveal"),
  tapReveal: document.querySelector("#tap-reveal"),
  hideRole: document.querySelector("#hide-role"),
  passPhone: document.querySelector("#pass-phone"),
  revealStatus: document.querySelector("#reveal-status"),
  discussionPanel: document.querySelector("#discussion-panel"),
  firstSpeakerName: document.querySelector("#first-speaker-name"),
  discussionTimer: document.querySelector("#discussion-timer"),
  timerDisplay: document.querySelector("#timer-display"),
  timerStart: document.querySelector("#timer-start"),
  timerPause: document.querySelector("#timer-pause"),
  timerResume: document.querySelector("#timer-resume"),
  timerStatus: document.querySelector("#timer-status"),
  untimedNote: document.querySelector("#untimed-note"),
  startVoting: document.querySelector("#start-voting"),
  votingPlaceholder: document.querySelector("#voting-placeholder")
};

let settings = loadSettings();
let appState = APP_STATES.SETUP;
let round = null;
let holdActive = false;
let timerInterval = null;
let timerEndTime = null;
let timerRemainingMs = 0;

function safeStorageRead(key, storage = localStorage) {
  try { return storage.getItem(key); } catch { return null; }
}

function safeStorageWrite(key, value, storage = localStorage) {
  try { storage.setItem(key, value); return true; } catch { return false; }
}

function safeStorageRemove(key, storage = localStorage) {
  try { storage.removeItem(key); } catch { /* Storage may be unavailable. */ }
}

function secureRandomIndex(length) {
  if (!Number.isSafeInteger(length) || length < 1) throw new RangeError("Length must be a positive integer.");
  if (!globalThis.crypto?.getRandomValues) return Math.floor(Math.random() * length);
  const range = 0x100000000;
  const limit = range - (range % length);
  const values = new Uint32Array(1);
  do { globalThis.crypto.getRandomValues(values); } while (values[0] >= limit);
  return values[0] % length;
}

function isValidStoredSettings(value) {
  if (!value || value.version !== 1 || !Array.isArray(value.players) || !Array.isArray(value.categories)) return false;
  if (value.players.length < MIN_PLAYERS || value.players.length > MAX_PLAYERS) return false;
  if (!value.players.every(name => typeof name === "string" && name.length <= MAX_NAME_LENGTH)) return false;
  const validCategoryIds = new Set(categories.map(category => category.id));
  if (!value.categories.length || !value.categories.every(id => validCategoryIds.has(id))) return false;
  return typeof value.timerEnabled === "boolean" && [1, 2, 3, 5].includes(Number(value.timerDuration));
}

function loadSettings() {
  const raw = safeStorageRead(STORAGE_KEY);
  if (!raw) return structuredClone(defaultSettings);
  try {
    const parsed = JSON.parse(raw);
    return isValidStoredSettings(parsed) ? parsed : structuredClone(defaultSettings);
  } catch {
    return structuredClone(defaultSettings);
  }
}

function saveSettings() {
  safeStorageWrite(STORAGE_KEY, JSON.stringify(settings));
}

function makePlayerRow(name, index) {
  const row = document.createElement("div");
  row.className = "player-row";
  row.dataset.index = String(index);

  const number = document.createElement("span");
  number.className = "player-index";
  number.textContent = String(index + 1).padStart(2, "0");
  number.setAttribute("aria-hidden", "true");

  const inputWrap = document.createElement("div");
  inputWrap.className = "input-wrap";
  const label = document.createElement("label");
  label.className = "sr-only";
  label.htmlFor = `player-${index}`;
  label.textContent = `Player ${index + 1} name`;
  const input = document.createElement("input");
  input.id = `player-${index}`;
  input.name = "playerName";
  input.type = "text";
  input.value = name;
  input.maxLength = MAX_NAME_LENGTH;
  input.autocomplete = "off";
  input.spellcheck = false;
  input.setAttribute("aria-describedby", `player-error-${index}`);
  const error = document.createElement("p");
  error.className = "field-error";
  error.id = `player-error-${index}`;
  error.hidden = true;
  inputWrap.append(label, input, error);

  const remove = document.createElement("button");
  remove.className = "remove-player";
  remove.type = "button";
  remove.dataset.removePlayer = String(index);
  remove.setAttribute("aria-label", `Remove player ${index + 1}`);
  remove.textContent = "×";
  remove.disabled = settings.players.length <= MIN_PLAYERS;

  row.append(number, inputWrap, remove);
  return row;
}

function renderPlayers(focusIndex = null) {
  elements.playerList.replaceChildren(...settings.players.map(makePlayerRow));
  elements.playerCount.textContent = `${settings.players.length} / ${MAX_PLAYERS}`;
  elements.addPlayer.disabled = settings.players.length >= MAX_PLAYERS;
  if (focusIndex !== null) document.querySelector(`#player-${focusIndex}`)?.focus();
}

function makeCategoryOption(category) {
  const wrap = document.createElement("div");
  wrap.className = "category-option";
  const input = document.createElement("input");
  input.type = "checkbox";
  input.id = `category-${category.id}`;
  input.value = category.id;
  input.name = "category";
  input.checked = settings.categories.includes(category.id);
  const label = document.createElement("label");
  label.htmlFor = input.id;
  const icon = document.createElement("span");
  icon.className = "category-icon";
  icon.setAttribute("aria-hidden", "true");
  icon.textContent = category.icon;
  const name = document.createElement("span");
  name.textContent = category.name;
  label.append(icon, name);
  wrap.append(input, label);
  return wrap;
}

function renderCategories() {
  elements.categoryList.replaceChildren(...categories.map(makeCategoryOption));
}

function renderTimer() {
  elements.timerEnabled.checked = settings.timerEnabled;
  elements.timerDuration.value = String(settings.timerDuration);
  elements.timerOptions.hidden = !settings.timerEnabled;
}

function syncPlayersFromInputs() {
  settings.players = [...elements.playerList.querySelectorAll("input")].map(input => input.value);
}

function normalizedName(name) {
  return name.trim().replace(/\s+/g, " ");
}

function getPlayerErrors() {
  const names = settings.players.map(normalizedName);
  const counts = names.reduce((map, name) => map.set(name.toLocaleLowerCase("en-US"), (map.get(name.toLocaleLowerCase("en-US")) || 0) + 1), new Map());
  return names.map(name => {
    if (!name) return "Enter a player name.";
    if (name.length > MAX_NAME_LENGTH) return `Use ${MAX_NAME_LENGTH} characters or fewer.`;
    if (!VALID_NAME.test(name)) return "Use letters, numbers, spaces, apostrophes, or hyphens.";
    if (counts.get(name.toLocaleLowerCase("en-US")) > 1) return "Each player needs a unique name.";
    return "";
  });
}

function clearErrors() {
  elements.errorSummary.hidden = true;
  elements.errorSummaryList.replaceChildren();
  elements.categoryError.hidden = true;
  elements.categoryError.textContent = "";
  elements.playerList.querySelectorAll("input").forEach(input => input.removeAttribute("aria-invalid"));
  elements.playerList.querySelectorAll(".field-error").forEach(error => { error.hidden = true; error.textContent = ""; });
}

function addSummaryLink(text, targetId) {
  const item = document.createElement("li");
  const link = document.createElement("a");
  link.href = `#${targetId}`;
  link.textContent = text;
  item.append(link);
  elements.errorSummaryList.append(item);
}

function validateSetup() {
  clearErrors();
  syncPlayersFromInputs();
  const playerErrors = getPlayerErrors();
  let hasErrors = false;

  playerErrors.forEach((message, index) => {
    if (!message) return;
    hasErrors = true;
    const input = document.querySelector(`#player-${index}`);
    const error = document.querySelector(`#player-error-${index}`);
    input.setAttribute("aria-invalid", "true");
    error.textContent = message;
    error.hidden = false;
    addSummaryLink(`Player ${index + 1}: ${message}`, input.id);
  });

  if (!settings.categories.length) {
    hasErrors = true;
    elements.categoryError.textContent = "Choose at least one category.";
    elements.categoryError.hidden = false;
    addSummaryLink("Choose at least one category.", "category-all");
  }

  if (hasErrors) {
    elements.errorSummary.hidden = false;
    elements.errorSummary.focus();
    return false;
  }

  settings.players = settings.players.map(normalizedName);
  return true;
}

function handleCategoryChange(event) {
  const changed = event.target.closest('input[name="category"]');
  if (!changed) return;
  const inputs = [...elements.categoryList.querySelectorAll("input")];
  if (changed.value === "all" && changed.checked) {
    inputs.forEach(input => { input.checked = input.value === "all"; });
  } else if (changed.value !== "all" && changed.checked) {
    document.querySelector("#category-all").checked = false;
  }
  settings.categories = inputs.filter(input => input.checked).map(input => input.value);
  if (settings.categories.length) elements.categoryError.hidden = true;
  saveSettings();
}

function hideAllGamePanels() {
  elements.form.hidden = true;
  elements.interruptedPanel.hidden = true;
  elements.handoffPanel.hidden = true;
  elements.revealPanel.hidden = true;
  elements.discussionPanel.hidden = true;
}

function createRound() {
  const playableCategories = categories.filter(category => category.id !== "all").map(category => category.id);
  const eligibleCategories = settings.categories.includes("all") ? playableCategories : settings.categories;
  const categoryId = eligibleCategories[secureRandomIndex(eligibleCategories.length)];
  const wordPool = WORDS[categoryId];
  round = {
    imposterIndex: secureRandomIndex(settings.players.length),
    categoryId,
    secretWord: wordPool[secureRandomIndex(wordPool.length)],
    firstSpeakerIndex: secureRandomIndex(settings.players.length),
    playerIndex: 0,
    viewed: false
  };
}

function showSetup() {
  appState = APP_STATES.SETUP;
  round = null;
  holdActive = false;
  stopTimerInterval();
  hideAllGamePanels();
  elements.form.hidden = false;
  safeStorageRemove(ROUND_MARKER_KEY, sessionStorage);
  elements.playerList.querySelector("input")?.focus();
}

function showInterrupted() {
  appState = APP_STATES.INTERRUPTED;
  round = null;
  hideAllGamePanels();
  elements.interruptedPanel.hidden = false;
  elements.interruptedPanel.focus();
}

function showHandoff() {
  appState = APP_STATES.HANDOFF;
  holdActive = false;
  hideAllGamePanels();
  elements.handoffPanel.hidden = false;
  const current = round.playerIndex + 1;
  elements.handoffProgress.textContent = `Player ${current} of ${settings.players.length}`;
  elements.handoffTitle.textContent = `${settings.players[round.playerIndex]}, take the phone`;
  elements.handoffPanel.focus();
}

function resetRevealView() {
  round.viewed = false;
  elements.roleCard.classList.remove("is-revealed", "is-imposter");
  elements.roleCardCover.hidden = false;
  elements.roleCardContent.hidden = true;
  elements.holdReveal.hidden = false;
  elements.tapReveal.hidden = false;
  elements.hideRole.hidden = true;
  elements.passPhone.disabled = true;
  elements.passPhone.textContent = "Hide your role first";
  elements.revealInstruction.textContent = "Press and hold the card to reveal your role. Release to hide it.";
  elements.revealStatus.textContent = "";
}

function showReveal() {
  appState = APP_STATES.REVEAL;
  hideAllGamePanels();
  resetRevealView();
  elements.revealPanel.hidden = false;
  const current = round.playerIndex + 1;
  elements.revealProgress.textContent = `Player ${current} of ${settings.players.length}`;
  elements.revealTitle.textContent = `${settings.players[round.playerIndex]}'s role`;
  elements.revealPanel.focus();
  elements.holdReveal.focus();
}

function revealRole(useAccessibleFocus = false) {
  if (appState !== APP_STATES.REVEAL || elements.roleCard.classList.contains("is-revealed")) return;
  const isImposter = round.playerIndex === round.imposterIndex;
  elements.roleLabel.textContent = isImposter ? "Stay calm and blend in" : "Your secret word";
  elements.roleValue.textContent = isImposter ? "You are the Imposter!" : round.secretWord;
  elements.roleNote.textContent = isImposter ? "You do not know the secret word." : "Keep it hidden from the imposter.";
  elements.roleCard.classList.toggle("is-imposter", isImposter);
  elements.roleCard.classList.add("is-revealed");
  elements.roleCardCover.hidden = true;
  elements.roleCardContent.hidden = false;
  elements.revealStatus.textContent = "Role revealed. Hide it before passing the phone.";
  if (useAccessibleFocus) elements.roleCardContent.focus();
}

function hideRole() {
  if (appState !== APP_STATES.REVEAL || elements.roleCardContent.hidden) return;
  elements.roleCard.classList.remove("is-revealed", "is-imposter");
  elements.roleCardCover.hidden = false;
  elements.roleCardContent.hidden = true;
  elements.hideRole.hidden = true;
  elements.holdReveal.hidden = false;
  elements.tapReveal.hidden = false;
  round.viewed = true;
  elements.passPhone.disabled = false;
  const isLastPlayer = round.playerIndex === settings.players.length - 1;
  elements.passPhone.textContent = isLastPlayer ? "Finish Role Check" : `Pass to ${settings.players[round.playerIndex + 1]}`;
  elements.revealInstruction.textContent = "Your role is hidden. Pass the phone before continuing.";
  elements.revealStatus.textContent = "Role hidden. It is safe to pass the phone.";
  elements.passPhone.focus();
}

function formatTime(milliseconds) {
  const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));
  return `${String(Math.floor(totalSeconds / 60)).padStart(2, "0")}:${String(totalSeconds % 60).padStart(2, "0")}`;
}

function stopTimerInterval() {
  if (timerInterval !== null) clearInterval(timerInterval);
  timerInterval = null;
}

function updateTimer() {
  if (timerEndTime !== null) timerRemainingMs = Math.max(0, timerEndTime - Date.now());
  elements.timerDisplay.textContent = formatTime(timerRemainingMs);
  if (timerRemainingMs > 0) return;
  stopTimerInterval();
  timerEndTime = null;
  elements.timerPause.hidden = true;
  elements.timerResume.hidden = true;
  elements.timerStatus.textContent = "Time’s up! Finish your thought, then start voting when everyone is ready.";
  elements.discussionTimer.classList.add("is-finished");
}

function showDiscussion() {
  appState = APP_STATES.DISCUSSION;
  holdActive = false;
  hideAllGamePanels();
  elements.discussionPanel.hidden = false;
  elements.firstSpeakerName.textContent = settings.players[round.firstSpeakerIndex];
  timerRemainingMs = settings.timerDuration * 60 * 1000;
  timerEndTime = null;
  elements.timerDisplay.textContent = formatTime(timerRemainingMs);
  elements.discussionTimer.hidden = !settings.timerEnabled;
  elements.untimedNote.hidden = settings.timerEnabled;
  elements.timerStart.hidden = false;
  elements.timerPause.hidden = true;
  elements.timerResume.hidden = true;
  elements.timerStatus.textContent = settings.timerEnabled ? `Timer ready for ${settings.timerDuration} minute${settings.timerDuration === 1 ? "" : "s"}.` : "";
  elements.discussionTimer.classList.remove("is-finished");
  elements.startVoting.hidden = false;
  elements.votingPlaceholder.hidden = true;
  elements.discussionPanel.focus();
}

elements.addPlayer.addEventListener("click", () => {
  syncPlayersFromInputs();
  if (settings.players.length >= MAX_PLAYERS) return;
  settings.players.push(`Player ${settings.players.length + 1}`);
  renderPlayers(settings.players.length - 1);
  saveSettings();
});

elements.playerList.addEventListener("click", event => {
  const button = event.target.closest("[data-remove-player]");
  if (!button || settings.players.length <= MIN_PLAYERS) return;
  syncPlayersFromInputs();
  const index = Number(button.dataset.removePlayer);
  settings.players.splice(index, 1);
  renderPlayers(Math.min(index, settings.players.length - 1));
  saveSettings();
});

elements.playerList.addEventListener("input", event => {
  if (!event.target.matches('input[name="playerName"]')) return;
  syncPlayersFromInputs();
  saveSettings();
  if (event.target.hasAttribute("aria-invalid")) validateSetup();
});

elements.categoryList.addEventListener("change", handleCategoryChange);

elements.timerEnabled.addEventListener("change", () => {
  settings.timerEnabled = elements.timerEnabled.checked;
  elements.timerOptions.hidden = !settings.timerEnabled;
  saveSettings();
});

elements.timerDuration.addEventListener("change", () => {
  settings.timerDuration = Number(elements.timerDuration.value);
  saveSettings();
});

elements.form.addEventListener("submit", event => {
  event.preventDefault();
  if (!validateSetup()) return;
  saveSettings();
  createRound();
  safeStorageWrite(ROUND_MARKER_KEY, "role-reveal", sessionStorage);
  showHandoff();
});

elements.clearSettings.addEventListener("click", () => {
  safeStorageRemove(STORAGE_KEY);
  safeStorageRemove(ROUND_MARKER_KEY, sessionStorage);
  settings = structuredClone(defaultSettings);
  round = null;
  clearErrors();
  renderPlayers();
  renderCategories();
  renderTimer();
  elements.playerList.querySelector("input")?.focus();
});

elements.restartInterrupted.addEventListener("click", showSetup);
elements.playerReady.addEventListener("click", showReveal);

elements.timerStart.addEventListener("click", () => {
  if (appState !== APP_STATES.DISCUSSION) return;
  timerEndTime = Date.now() + timerRemainingMs;
  elements.timerStart.hidden = true;
  elements.timerPause.hidden = false;
  elements.timerStatus.textContent = "Timer running.";
  updateTimer();
  timerInterval = setInterval(updateTimer, 250);
});

elements.timerPause.addEventListener("click", () => {
  if (timerEndTime === null) return;
  timerRemainingMs = Math.max(0, timerEndTime - Date.now());
  timerEndTime = null;
  stopTimerInterval();
  updateTimer();
  if (timerRemainingMs <= 0) return;
  elements.timerPause.hidden = true;
  elements.timerResume.hidden = false;
  elements.timerStatus.textContent = "Timer paused.";
});

elements.timerResume.addEventListener("click", () => {
  if (timerRemainingMs <= 0) return;
  timerEndTime = Date.now() + timerRemainingMs;
  elements.timerResume.hidden = true;
  elements.timerPause.hidden = false;
  elements.timerStatus.textContent = "Timer resumed.";
  timerInterval = setInterval(updateTimer, 250);
});

elements.startVoting.addEventListener("click", () => {
  stopTimerInterval();
  timerEndTime = null;
  elements.startVoting.hidden = true;
  elements.votingPlaceholder.hidden = false;
  elements.votingPlaceholder.focus();
});

elements.holdReveal.addEventListener("contextmenu", event => event.preventDefault());
elements.holdReveal.addEventListener("pointerdown", event => {
  if (event.button !== 0) return;
  event.preventDefault();
  holdActive = true;
  elements.holdReveal.setPointerCapture?.(event.pointerId);
  revealRole(false);
});
elements.holdReveal.addEventListener("pointerup", event => {
  if (!holdActive) return;
  holdActive = false;
  elements.holdReveal.releasePointerCapture?.(event.pointerId);
  hideRole();
});
elements.holdReveal.addEventListener("pointercancel", () => {
  if (!holdActive) return;
  holdActive = false;
  hideRole();
});
elements.holdReveal.addEventListener("keydown", event => {
  if ((event.key === " " || event.key === "Enter") && !holdActive) {
    event.preventDefault();
    holdActive = true;
    revealRole(false);
  }
});
elements.holdReveal.addEventListener("keyup", event => {
  if ((event.key === " " || event.key === "Enter") && holdActive) {
    event.preventDefault();
    holdActive = false;
    hideRole();
  }
});
elements.holdReveal.addEventListener("blur", () => {
  if (!holdActive) return;
  holdActive = false;
  hideRole();
});

elements.tapReveal.addEventListener("click", () => {
  elements.holdReveal.hidden = true;
  elements.tapReveal.hidden = true;
  elements.hideRole.hidden = false;
  elements.revealInstruction.textContent = "Your role is visible. Activate Hide Role before passing the phone.";
  revealRole(true);
});

elements.hideRole.addEventListener("click", hideRole);

elements.passPhone.addEventListener("click", () => {
  if (!round?.viewed || !elements.roleCardContent.hidden) return;
  if (round.playerIndex >= settings.players.length - 1) {
    showDiscussion();
    return;
  }
  round.playerIndex += 1;
  showHandoff();
});

document.addEventListener("visibilitychange", () => {
  if (document.hidden && appState === APP_STATES.REVEAL && !elements.roleCardContent.hidden) {
    holdActive = false;
    hideRole();
  }
});

renderPlayers();
renderCategories();
renderTimer();

if (!WORDS || categories.some(category => category.id !== "all" && (!Array.isArray(WORDS[category.id]) || WORDS[category.id].length < 25))) {
  throw new Error("The word dataset is missing or incomplete.");
}

if (safeStorageRead(ROUND_MARKER_KEY, sessionStorage)) showInterrupted();
