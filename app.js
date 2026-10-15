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
  VOTE_HANDOFF: "vote-handoff",
  VOTE_SELECT: "vote-select",
  RESULT: "result",
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
  timerDuration: 3,
  soundEnabled: false
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
  settingsStatus: document.querySelector("#settings-status"),
  errorSummary: document.querySelector("#form-error-summary"),
  errorSummaryList: document.querySelector("#error-summary-list"),
  gameAnnouncer: document.querySelector("#game-announcer"),
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
  voteHandoffPanel: document.querySelector("#vote-handoff-panel"),
  voteHandoffProgress: document.querySelector("#vote-handoff-progress"),
  voteHandoffTitle: document.querySelector("#vote-handoff-title"),
  voterReady: document.querySelector("#voter-ready"),
  votePanel: document.querySelector("#vote-panel"),
  voteProgress: document.querySelector("#vote-progress"),
  voteTitle: document.querySelector("#vote-title"),
  voteOptions: document.querySelector("#vote-options"),
  voteConfirmation: document.querySelector("#vote-confirmation"),
  voteChoiceName: document.querySelector("#vote-choice-name"),
  changeVote: document.querySelector("#change-vote"),
  confirmVote: document.querySelector("#confirm-vote"),
  voteStatus: document.querySelector("#vote-status"),
  resultsPanel: document.querySelector("#results-panel"),
  resultSymbol: document.querySelector("#result-symbol"),
  resultTitle: document.querySelector("#result-title"),
  resultExplanation: document.querySelector("#result-explanation"),
  resultImposter: document.querySelector("#result-imposter"),
  resultWord: document.querySelector("#result-word"),
  resultCategory: document.querySelector("#result-category"),
  resultVoteTotals: document.querySelector("#result-vote-totals"),
  playAgain: document.querySelector("#play-again"),
  newSetup: document.querySelector("#new-setup"),
  restartRound: document.querySelector("#restart-round"),
  restartDialog: document.querySelector("#restart-dialog"),
  confirmRestart: document.querySelector("#confirm-restart"),
  menuTrigger: document.querySelector("#menu-trigger"),
  menuPanel: document.querySelector("#header-menu-panel"),
  menuSettings: document.querySelector("#menu-settings"),
  menuHowToPlay: document.querySelector("#menu-how-to-play"),
  menuSound: document.querySelector("#menu-sound"),
  menuRestart: document.querySelector("#menu-restart"),
  settingsDialog: document.querySelector("#settings-dialog"),
  menuSettingsForm: document.querySelector("#menu-settings-form"),
  menuTimerEnabled: document.querySelector("#menu-timer-enabled"),
  menuTimerOptions: document.querySelector("#menu-timer-options"),
  menuTimerDuration: document.querySelector("#menu-timer-duration"),
  menuSoundEnabled: document.querySelector("#menu-sound-enabled"),
  saveMenuSettings: document.querySelector("#save-menu-settings")
};

let settings = loadSettings();
let appState = APP_STATES.SETUP;
let round = null;
let holdActive = false;
let timerInterval = null;
let timerEndTime = null;
let timerRemainingMs = 0;
let audioContext = null;
let restartReturnFocus = null;

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
    return isValidStoredSettings(parsed)
      ? { ...parsed, soundEnabled: parsed.soundEnabled === true }
      : structuredClone(defaultSettings);
  } catch {
    return structuredClone(defaultSettings);
  }
}

function saveSettings() {
  safeStorageWrite(STORAGE_KEY, JSON.stringify(settings));
}

function updateMenuState() {
  elements.menuSound.textContent = settings.soundEnabled ? "Sound On" : "Sound Off";
  elements.menuSound.setAttribute("aria-pressed", String(settings.soundEnabled));
  elements.menuRestart.disabled = appState === APP_STATES.SETUP;
}

function closeMenu({ returnFocus = false } = {}) {
  if (elements.menuPanel.hidden) return;
  elements.menuPanel.hidden = true;
  elements.menuTrigger.setAttribute("aria-expanded", "false");
  if (returnFocus) elements.menuTrigger.focus();
}

function openMenu() {
  elements.menuPanel.hidden = false;
  elements.menuTrigger.setAttribute("aria-expanded", "true");
  updateMenuState();
}

function playSound(kind = "soft") {
  if (!settings.soundEnabled) return;
  const AudioContext = globalThis.AudioContext || globalThis.webkitAudioContext;
  if (!AudioContext) return;
  try {
    audioContext ||= new AudioContext();
    if (audioContext.state === "suspended") audioContext.resume().catch(() => {});
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const now = audioContext.currentTime;
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(kind === "complete" ? 660 : kind === "alert" ? 330 : 440, now);
    if (kind === "complete") oscillator.frequency.exponentialRampToValueAtTime(880, now + .12);
    gain.gain.setValueAtTime(.0001, now);
    gain.gain.exponentialRampToValueAtTime(.07, now + .015);
    gain.gain.exponentialRampToValueAtTime(.0001, now + .18);
    oscillator.connect(gain).connect(audioContext.destination);
    oscillator.start(now);
    oscillator.stop(now + .2);
  } catch { /* Audio is optional and may be blocked by the browser. */ }
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
  input.setAttribute("aria-describedby", "categories-hint category-error");
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
  elements.categoryList.querySelectorAll("input").forEach(input => input.removeAttribute("aria-invalid"));
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
  let firstInvalidInput = null;

  playerErrors.forEach((message, index) => {
    if (!message) return;
    hasErrors = true;
    const input = document.querySelector(`#player-${index}`);
    const error = document.querySelector(`#player-error-${index}`);
    input.setAttribute("aria-invalid", "true");
    if (!firstInvalidInput) firstInvalidInput = input;
    error.textContent = message;
    error.hidden = false;
    addSummaryLink(`Player ${index + 1}: ${message}`, input.id);
  });

  if (!settings.categories.length) {
    hasErrors = true;
    elements.categoryError.textContent = "Choose at least one category.";
    elements.categoryError.hidden = false;
    elements.categoryList.querySelectorAll("input").forEach(input => input.setAttribute("aria-invalid", "true"));
    if (!firstInvalidInput) firstInvalidInput = document.querySelector("#category-all");
    addSummaryLink("Choose at least one category.", "category-all");
  }

  if (hasErrors) {
    elements.errorSummary.hidden = false;
    firstInvalidInput.focus();
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
  if (settings.categories.length) {
    elements.categoryError.hidden = true;
    elements.categoryList.querySelectorAll("input").forEach(input => input.removeAttribute("aria-invalid"));
  }
  saveSettings();
}

function hideAllGamePanels() {
  elements.form.hidden = true;
  elements.interruptedPanel.hidden = true;
  elements.handoffPanel.hidden = true;
  elements.revealPanel.hidden = true;
  elements.discussionPanel.hidden = true;
  elements.voteHandoffPanel.hidden = true;
  elements.votePanel.hidden = true;
  elements.resultsPanel.hidden = true;
}

function announceGameState(message) {
  elements.gameAnnouncer.textContent = "";
  requestAnimationFrame(() => { elements.gameAnnouncer.textContent = message; });
}

function createRound(previousRound = null) {
  const playableCategories = categories.filter(category => category.id !== "all").map(category => category.id);
  const eligibleCategories = settings.categories.includes("all") ? playableCategories : settings.categories;
  const eligibleWords = eligibleCategories.flatMap(categoryId => WORDS[categoryId].map(word => ({ categoryId, word })));
  const differentWords = previousRound ? eligibleWords.filter(choice => choice.word !== previousRound.secretWord) : eligibleWords;
  const wordChoices = differentWords.length ? differentWords : eligibleWords;
  const wordChoice = wordChoices[secureRandomIndex(wordChoices.length)];
  const imposterChoices = settings.players.map((_, index) => index);
  const eligibleImposters = previousRound && imposterChoices.length > 1
    ? imposterChoices.filter(index => index !== previousRound.imposterIndex)
    : imposterChoices;
  round = {
    imposterIndex: eligibleImposters[secureRandomIndex(eligibleImposters.length)],
    categoryId: wordChoice.categoryId,
    secretWord: wordChoice.word,
    firstSpeakerIndex: secureRandomIndex(settings.players.length),
    playerIndex: 0,
    viewed: false,
    votes: [],
    voterIndex: 0,
    selectedVoteIndex: null
  };
}

function startRound(previousRound = null) {
  createRound(previousRound);
  safeStorageWrite(ROUND_MARKER_KEY, "role-reveal", sessionStorage);
  playSound("soft");
  showHandoff();
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
  announceGameState("Game setup ready.");
}

function showInterrupted() {
  appState = APP_STATES.INTERRUPTED;
  round = null;
  hideAllGamePanels();
  elements.interruptedPanel.hidden = false;
  elements.interruptedPanel.focus();
  announceGameState("The round was interrupted. Restart from setup to continue safely.");
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
  announceGameState(`Private role handoff. Player ${current} of ${settings.players.length}.`);
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
  playSound("alert");
}

function showDiscussion() {
  appState = APP_STATES.DISCUSSION;
  holdActive = false;
  stopTimerInterval();
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
  elements.discussionPanel.focus();
  announceGameState("All private roles are ready. Discussion can begin.");
}

function showVoteHandoff() {
  appState = APP_STATES.VOTE_HANDOFF;
  round.selectedVoteIndex = null;
  hideAllGamePanels();
  elements.voteHandoffPanel.hidden = false;
  const current = round.voterIndex + 1;
  elements.voteHandoffProgress.textContent = `Voter ${current} of ${settings.players.length}`;
  elements.voteHandoffTitle.textContent = `${settings.players[round.voterIndex]}, take the phone`;
  elements.voteHandoffPanel.focus();
  announceGameState(`Private voting handoff. Voter ${current} of ${settings.players.length}.`);
}

function makeVoteOption(name, index) {
  const button = document.createElement("button");
  button.className = "vote-option";
  button.type = "button";
  button.dataset.voteIndex = String(index);
  button.textContent = name;
  return button;
}

function showVoteSelection() {
  if (appState !== APP_STATES.VOTE_HANDOFF) return;
  appState = APP_STATES.VOTE_SELECT;
  hideAllGamePanels();
  elements.votePanel.hidden = false;
  const current = round.voterIndex + 1;
  elements.voteProgress.textContent = `Voter ${current} of ${settings.players.length}`;
  elements.voteTitle.textContent = `${settings.players[round.voterIndex]}, cast your vote`;
  elements.voteOptions.replaceChildren(...settings.players.map(makeVoteOption));
  elements.voteOptions.hidden = false;
  elements.voteConfirmation.hidden = true;
  elements.voteStatus.textContent = "";
  elements.votePanel.focus();
  elements.voteOptions.querySelector("button")?.focus();
  announceGameState("Private vote selection ready.");
}

function selectVote(index) {
  if (appState !== APP_STATES.VOTE_SELECT || round.votes.length !== round.voterIndex) return;
  if (!Number.isInteger(index) || index < 0 || index >= settings.players.length) return;
  round.selectedVoteIndex = index;
  elements.voteOptions.hidden = true;
  elements.voteChoiceName.textContent = settings.players[index];
  elements.voteConfirmation.hidden = false;
  elements.voteStatus.textContent = "Review your choice before submitting.";
  elements.confirmVote.focus();
}

function changeVote() {
  if (appState !== APP_STATES.VOTE_SELECT || round.selectedVoteIndex === null) return;
  const previousChoice = round.selectedVoteIndex;
  round.selectedVoteIndex = null;
  elements.voteConfirmation.hidden = true;
  elements.voteOptions.hidden = false;
  elements.voteStatus.textContent = "Vote not submitted. Choose a player.";
  elements.voteOptions.querySelector(`[data-vote-index="${previousChoice}"]`)?.focus();
}

function makeVoteTotal(name, total, isImposter) {
  const item = document.createElement("li");
  const player = document.createElement("span");
  player.textContent = name;
  if (isImposter) {
    const badge = document.createElement("small");
    badge.textContent = "Imposter";
    player.append(" ", badge);
  }
  const count = document.createElement("strong");
  count.textContent = `${total} vote${total === 1 ? "" : "s"}`;
  item.append(player, count);
  return item;
}

function showResults() {
  if (appState !== APP_STATES.VOTE_SELECT || round.votes.length !== settings.players.length) return;
  appState = APP_STATES.RESULT;
  const totals = Array(settings.players.length).fill(0);
  round.votes.forEach(voteIndex => { totals[voteIndex] += 1; });
  const highestTotal = Math.max(...totals);
  const leaders = totals.map((total, index) => ({ total, index })).filter(player => player.total === highestTotal);
  const crewWins = leaders.length === 1 && leaders[0].index === round.imposterIndex;
  const categoryName = categories.find(category => category.id === round.categoryId)?.name || round.categoryId;

  hideAllGamePanels();
  elements.resultsPanel.hidden = false;
  elements.resultsPanel.classList.toggle("crew-wins", crewWins);
  elements.resultsPanel.classList.toggle("imposter-wins", !crewWins);
  elements.resultSymbol.textContent = crewWins ? "✓" : "!";
  elements.resultTitle.textContent = crewWins ? "Crew Wins" : "Imposter Wins";
  if (crewWins) {
    elements.resultExplanation.textContent = `${settings.players[round.imposterIndex]} was the only player with the most votes, so the crew found the imposter.`;
  } else if (leaders.length > 1) {
    const tiedNames = leaders.map(player => settings.players[player.index]).join(", ");
    elements.resultExplanation.textContent = `${tiedNames} tied with ${highestTotal} vote${highestTotal === 1 ? "" : "s"} each. A tie means no player is eliminated, so the imposter wins.`;
  } else {
    elements.resultExplanation.textContent = `${settings.players[leaders[0].index]} received the most votes but was innocent, so the imposter escaped.`;
  }
  elements.resultImposter.textContent = settings.players[round.imposterIndex];
  elements.resultWord.textContent = round.secretWord;
  elements.resultCategory.textContent = categoryName;
  elements.resultVoteTotals.replaceChildren(...settings.players.map((name, index) => makeVoteTotal(name, totals[index], index === round.imposterIndex)));
  safeStorageRemove(ROUND_MARKER_KEY, sessionStorage);
  elements.resultsPanel.focus();
  playSound("complete");
  announceGameState(`Round complete. ${crewWins ? "Crew wins" : "Imposter wins"}. Results are displayed.`);
}

function openRestartDialog() {
  if (appState === APP_STATES.SETUP || elements.restartDialog.open) return;
  restartReturnFocus = document.activeElement;
  closeMenu();
  elements.restartDialog.showModal();
  elements.confirmRestart.focus();
}

function confirmVote() {
  if (appState !== APP_STATES.VOTE_SELECT || round.selectedVoteIndex === null) return;
  if (round.votes.length !== round.voterIndex) return;
  round.votes.push(round.selectedVoteIndex);
  round.selectedVoteIndex = null;
  elements.voteChoiceName.textContent = "";
  elements.voteConfirmation.hidden = true;
  elements.voteOptions.replaceChildren();
  if (round.voterIndex >= settings.players.length - 1) {
    showResults();
    return;
  }
  round.voterIndex += 1;
  showVoteHandoff();
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
  startRound();
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
  elements.settingsStatus.textContent = "Saved settings cleared. Default settings restored.";
  elements.playerList.querySelector("input")?.focus();
});

elements.restartInterrupted.addEventListener("click", showSetup);
elements.playerReady.addEventListener("click", showReveal);

elements.timerStart.addEventListener("click", () => {
  if (appState !== APP_STATES.DISCUSSION || timerEndTime !== null || timerInterval !== null) return;
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
  if (appState !== APP_STATES.DISCUSSION || timerRemainingMs <= 0 || timerEndTime !== null || timerInterval !== null) return;
  timerEndTime = Date.now() + timerRemainingMs;
  elements.timerResume.hidden = true;
  elements.timerPause.hidden = false;
  elements.timerStatus.textContent = "Timer resumed.";
  timerInterval = setInterval(updateTimer, 250);
});

elements.startVoting.addEventListener("click", () => {
  if (appState !== APP_STATES.DISCUSSION) return;
  stopTimerInterval();
  timerEndTime = null;
  round.votes = [];
  round.voterIndex = 0;
  round.selectedVoteIndex = null;
  showVoteHandoff();
});

elements.voterReady.addEventListener("click", showVoteSelection);
elements.voteOptions.addEventListener("click", event => {
  const option = event.target.closest("[data-vote-index]");
  if (!option) return;
  selectVote(Number(option.dataset.voteIndex));
});
elements.changeVote.addEventListener("click", changeVote);
elements.confirmVote.addEventListener("click", confirmVote);

elements.playAgain.addEventListener("click", () => {
  if (appState !== APP_STATES.RESULT) return;
  elements.playAgain.disabled = true;
  const previousRound = round;
  startRound(previousRound);
  elements.playAgain.disabled = false;
});

elements.newSetup.addEventListener("click", () => {
  if (appState !== APP_STATES.RESULT) return;
  showSetup();
});

elements.restartRound.addEventListener("click", () => {
  if (appState !== APP_STATES.RESULT) return;
  openRestartDialog();
});

elements.confirmRestart.addEventListener("click", event => {
  if (appState === APP_STATES.SETUP) return;
  event.preventDefault();
  elements.restartDialog.close("confirm");
  showSetup();
});

elements.restartDialog.addEventListener("close", () => {
  if (elements.restartDialog.returnValue === "confirm") return;
  const target = restartReturnFocus?.closest?.("[hidden]") ? elements.menuTrigger : restartReturnFocus;
  target?.focus?.();
});

elements.menuTrigger.addEventListener("click", () => {
  if (elements.menuPanel.hidden) openMenu();
  else closeMenu({ returnFocus: true });
});

elements.menuTrigger.addEventListener("keydown", event => {
  if (!elements.menuPanel.hidden || !["ArrowDown", "Enter", " "].includes(event.key)) return;
  event.preventDefault();
  openMenu();
  elements.menuPanel.querySelector('[role="menuitem"]:not(:disabled)')?.focus();
});

elements.menuPanel.addEventListener("keydown", event => {
  const items = [...elements.menuPanel.querySelectorAll('[role="menuitem"]:not(:disabled)')];
  const index = items.indexOf(document.activeElement);
  if (event.key === "Escape") {
    event.preventDefault();
    closeMenu({ returnFocus: true });
  } else if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
    event.preventDefault();
    const nextIndex = event.key === "Home" ? 0
      : event.key === "End" ? items.length - 1
      : event.key === "ArrowDown" ? (index + 1) % items.length
      : (index - 1 + items.length) % items.length;
    items[nextIndex]?.focus();
  }
});

elements.menuSettings.addEventListener("click", () => {
  closeMenu();
  elements.menuTimerEnabled.checked = settings.timerEnabled;
  elements.menuTimerDuration.value = String(settings.timerDuration);
  elements.menuTimerOptions.hidden = !settings.timerEnabled;
  elements.menuSoundEnabled.checked = settings.soundEnabled;
  elements.settingsDialog.showModal();
  elements.menuTimerEnabled.focus();
});

elements.menuHowToPlay.addEventListener("click", () => closeMenu());

elements.menuSound.addEventListener("click", () => {
  settings.soundEnabled = !settings.soundEnabled;
  saveSettings();
  updateMenuState();
  if (settings.soundEnabled) playSound("soft");
});

elements.menuRestart.addEventListener("click", openRestartDialog);

elements.menuTimerEnabled.addEventListener("change", () => {
  elements.menuTimerOptions.hidden = !elements.menuTimerEnabled.checked;
});

elements.menuSettingsForm.addEventListener("submit", event => {
  if (event.submitter?.value !== "save") return;
  settings.timerEnabled = elements.menuTimerEnabled.checked;
  settings.timerDuration = Number(elements.menuTimerDuration.value);
  settings.soundEnabled = elements.menuSoundEnabled.checked;
  saveSettings();
  renderTimer();
  updateMenuState();
  if (settings.soundEnabled) playSound("soft");
  announceGameState("Settings saved. Timer changes apply next round.");
});

elements.settingsDialog.addEventListener("close", () => elements.menuTrigger.focus());

document.addEventListener("pointerdown", event => {
  if (!elements.menuPanel.hidden && !event.target.closest(".header-menu")) closeMenu();
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape" && !elements.menuPanel.hidden) closeMenu({ returnFocus: true });
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
  if (appState !== APP_STATES.REVEAL || !round?.viewed || !elements.roleCardContent.hidden) return;
  appState = APP_STATES.HANDOFF;
  round.viewed = false;
  elements.passPhone.disabled = true;
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
updateMenuState();

if (!WORDS || categories.some(category => category.id !== "all" && (!Array.isArray(WORDS[category.id]) || WORDS[category.id].length < 25))) {
  throw new Error("The word dataset is missing or incomplete.");
}

if (safeStorageRead(ROUND_MARKER_KEY, sessionStorage)) showInterrupted();
