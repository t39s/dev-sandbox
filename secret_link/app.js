"use strict";

const SAMPLE_KEY = "D6esKFoSz_w9sC_BwGhhHw";
const STORAGE_PREFIX = "ttscore-secret-link-demo:";
const FORMAT_MAGIC = new Uint8Array([0x54, 0x54, 0x53, 0x31]); // TTS1
const FORMAT_VERSION = 1;
const ALGORITHM_AES_128_GCM = 1;
const HEADER_BYTES = 18;
const MAX_JSON_BYTES = 1024 * 1024;
const MAX_BINARY_BYTES = MAX_JSON_BYTES + HEADER_BYTES + 16;
const REPORT_ID_CONTEXT = new TextEncoder().encode("ttscore-report-id-v1\0");

const elements = {
  createView: document.querySelector("#createView"),
  readerView: document.querySelector("#readerView"),
  jsonInput: document.querySelector("#jsonInput"),
  jsonSize: document.querySelector("#jsonSize"),
  restoreSampleButton: document.querySelector("#restoreSampleButton"),
  encryptButton: document.querySelector("#encryptButton"),
  createError: document.querySelector("#createError"),
  resultCard: document.querySelector("#resultCard"),
  resultTime: document.querySelector("#resultTime"),
  resultSize: document.querySelector("#resultSize"),
  resultLinkLength: document.querySelector("#resultLinkLength"),
  secretLink: document.querySelector("#secretLink"),
  copyLinkButton: document.querySelector("#copyLinkButton"),
  openLinkButton: document.querySelector("#openLinkButton"),
  downloadButton: document.querySelector("#downloadButton"),
  publishPath: document.querySelector("#publishPath"),
  openSampleButton: document.querySelector("#openSampleButton"),
  readerLoading: document.querySelector("#readerLoading"),
  readerProgress: document.querySelector("#readerProgress"),
  readerError: document.querySelector("#readerError"),
  readerErrorText: document.querySelector("#readerErrorText"),
  reportView: document.querySelector("#reportView"),
  reportSource: document.querySelector("#reportSource"),
  reportPlayers: document.querySelector("#reportPlayers"),
  reportDate: document.querySelector("#reportDate"),
  playerAName: document.querySelector("#playerAName"),
  playerBName: document.querySelector("#playerBName"),
  playerAScore: document.querySelector("#playerAScore"),
  playerBScore: document.querySelector("#playerBScore"),
  reportBestOf: document.querySelector("#reportBestOf"),
  reportStatusValue: document.querySelector("#reportStatusValue"),
  reportRallies: document.querySelector("#reportRallies"),
  rawJson: document.querySelector("#rawJson"),
  toast: document.querySelector("#toast"),
};

let generatedArtifact = null;
let toastTimer = null;

function createGameRallies(gameNumber, firstServer, firstScore, secondScore) {
  const winners = [];
  const shared = Math.min(firstScore, secondScore);
  for (let index = 0; index < shared; index += 1) winners.push("A", "B");
  const remainingA = firstScore - shared;
  const remainingB = secondScore - shared;
  winners.push(...Array(remainingA).fill("A"));
  winners.push(...Array(remainingB).fill("B"));

  let scoreA = 0;
  let scoreB = 0;
  return winners.map((winner, index) => {
    const totalBefore = scoreA + scoreB;
    const server = Math.floor(totalBefore / 2) % 2 === 0
      ? firstServer
      : (firstServer === "A" ? "B" : "A");
    if (winner === "A") scoreA += 1;
    else scoreB += 1;
    return {
      gameNumber,
      rallyNumber: index + 1,
      winner,
      verification: {
        server,
        scoreAfter: { A: scoreA, B: scoreB },
      },
    };
  });
}

function buildSampleReport() {
  return {
    format: "ttscore-match",
    schemaVersion: 1,
    record: {
      id: "2026-0712-da7a",
      status: "complete",
      revision: 1,
      createdAt: "2026-07-12T17:02:00.000Z",
      updatedAt: "2026-07-12T17:34:00.000Z",
    },
    createdBy: {
      application: "ttScore",
      version: "demo-1",
    },
    match: {
      date: "2026-07-12",
      players: {
        A: { name: "Анна Смирнова" },
        B: { name: "Елена Орлова" },
      },
      bestOf: 5,
      initialServer: "A",
      initialLeftPlayer: "A",
      handicap: { enabled: false, player: null, points: 0 },
    },
    dataQuality: { completeness: "complete" },
    rallies: [
      ...createGameRallies(1, "A", 11, 6),
      ...createGameRallies(2, "B", 8, 11),
      ...createGameRallies(3, "A", 11, 7),
      ...createGameRallies(4, "B", 11, 5),
    ],
  };
}

function resetSample() {
  elements.jsonInput.value = `${JSON.stringify(buildSampleReport(), null, 2)}\n`;
  updateJsonSize();
  hideCreateError();
}

function updateJsonSize() {
  const size = new TextEncoder().encode(elements.jsonInput.value).byteLength;
  elements.jsonSize.textContent = formatBytes(size);
}

function concatBytes(...arrays) {
  const length = arrays.reduce((sum, array) => sum + array.byteLength, 0);
  const result = new Uint8Array(length);
  let offset = 0;
  arrays.forEach((array) => {
    result.set(array, offset);
    offset += array.byteLength;
  });
  return result;
}

function bytesToBase64Url(bytes) {
  let binary = "";
  for (let offset = 0; offset < bytes.byteLength; offset += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlToBytes(value) {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) throw new Error("invalid-key");
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function bytesToBase64(bytes) {
  let binary = "";
  for (let offset = 0; offset < bytes.byteLength; offset += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
  }
  return btoa(binary);
}

function base64ToBytes(value) {
  const binary = atob(value);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function deriveReportId(keyBytes) {
  const digest = await crypto.subtle.digest("SHA-256", concatBytes(REPORT_ID_CONTEXT, keyBytes));
  return bytesToBase64Url(new Uint8Array(digest).subarray(0, 12));
}

function buildHeader(iv) {
  const header = new Uint8Array(HEADER_BYTES);
  header.set(FORMAT_MAGIC, 0);
  header[4] = FORMAT_VERSION;
  header[5] = ALGORITHM_AES_128_GCM;
  header.set(iv, 6);
  return header;
}

async function encryptReport(jsonText) {
  const plaintext = new TextEncoder().encode(jsonText);
  if (plaintext.byteLength > MAX_JSON_BYTES) throw new Error("too-large");

  const keyBytes = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const header = buildHeader(iv);
  const key = await crypto.subtle.importKey("raw", keyBytes, { name: "AES-GCM" }, false, ["encrypt"]);
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv, additionalData: header, tagLength: 128 },
    key,
    plaintext,
  );
  const bytes = concatBytes(header, new Uint8Array(ciphertext));
  const reportId = await deriveReportId(keyBytes);
  return { keyBytes, bytes, reportId };
}

function parseHeader(bytes) {
  if (bytes.byteLength < HEADER_BYTES + 16 || bytes.byteLength > MAX_BINARY_BYTES) throw new Error("invalid-file");
  if (!FORMAT_MAGIC.every((byte, index) => bytes[index] === byte)) throw new Error("invalid-file");
  if (bytes[4] !== FORMAT_VERSION || bytes[5] !== ALGORITHM_AES_128_GCM) throw new Error("unsupported-file");
  return {
    header: bytes.subarray(0, HEADER_BYTES),
    iv: bytes.subarray(6, 18),
    ciphertext: bytes.subarray(HEADER_BYTES),
  };
}

async function decryptReport(bytes, keyBytes) {
  const { header, iv, ciphertext } = parseHeader(bytes);
  const key = await crypto.subtle.importKey("raw", keyBytes, { name: "AES-GCM" }, false, ["decrypt"]);
  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv, additionalData: header, tagLength: 128 },
    key,
    ciphertext,
  );
  const jsonText = new TextDecoder("utf-8", { fatal: true }).decode(plaintext);
  const data = JSON.parse(jsonText);
  validateReport(data);
  return { data, jsonText };
}

function validateReport(data) {
  if (!data || data.format !== "ttscore-match" || data.schemaVersion !== 1) throw new Error("invalid-json");
  if (!data.record || typeof data.record.id !== "string" || typeof data.record.status !== "string") throw new Error("invalid-json");
  if (!data.match || typeof data.match.date !== "string") throw new Error("invalid-json");
  if (typeof data.match.players?.A?.name !== "string" || typeof data.match.players?.B?.name !== "string") throw new Error("invalid-json");
  if (!Array.isArray(data.rallies)) throw new Error("invalid-json");
}

function createSecretLink(keyBytes) {
  const url = new URL(window.location.href);
  url.search = "";
  url.hash = bytesToBase64Url(keyBytes);
  return url.toString();
}

function storeCiphertext(reportId, bytes) {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${reportId}`, bytesToBase64(bytes));
    return true;
  } catch {
    return false;
  }
}

async function loadCiphertext(reportId) {
  try {
    const stored = localStorage.getItem(`${STORAGE_PREFIX}${reportId}`);
    if (stored) {
      const bytes = base64ToBytes(stored);
      if (bytes.byteLength <= MAX_BINARY_BYTES) return { bytes, source: "локальный ciphertext" };
    }
  } catch {}

  const response = await fetch(`./reports/${encodeURIComponent(reportId)}.ttscore`, {
    cache: "no-store",
    credentials: "same-origin",
  });
  if (!response.ok) throw new Error("not-found");
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.byteLength > MAX_BINARY_BYTES) throw new Error("invalid-file");
  return { bytes, source: "файл из reports/" };
}

function showCreateError(message) {
  elements.createError.textContent = message;
  elements.createError.hidden = false;
}

function hideCreateError() {
  elements.createError.hidden = true;
  elements.createError.textContent = "";
}

function describeCreateError(error) {
  if (error instanceof SyntaxError) return "JSON содержит синтаксическую ошибку.";
  if (error?.message === "too-large") return "JSON превышает лимит демонстратора: 1 МиБ.";
  if (error?.message === "invalid-json") return "JSON не соответствует минимальному профилю ttScore Schema v1.";
  return "Не удалось создать защищённый файл. Проверьте поддержку Web Crypto.";
}

async function handleEncrypt() {
  hideCreateError();
  elements.encryptButton.disabled = true;
  const buttonLabel = elements.encryptButton.firstElementChild;
  const originalLabel = buttonLabel.textContent;
  buttonLabel.textContent = "Шифруем…";

  try {
    if (!window.isSecureContext || !crypto?.subtle) throw new Error("unsupported");
    const source = elements.jsonInput.value.replace(/^\uFEFF/, "");
    const parsed = JSON.parse(source);
    validateReport(parsed);
    const canonicalText = `${JSON.stringify(parsed, null, 2)}\n`;

    const startedAt = performance.now();
    const artifact = await encryptReport(canonicalText);
    const elapsed = performance.now() - startedAt;
    const secretLink = createSecretLink(artifact.keyBytes);
    const storageAvailable = storeCiphertext(artifact.reportId, artifact.bytes);
    const filename = `${artifact.reportId}.ttscore`;

    generatedArtifact = { ...artifact, secretLink, filename, storageAvailable };
    elements.resultTime.textContent = elapsed < 1 ? "< 1 мс" : `${Math.round(elapsed)} мс`;
    elements.resultSize.textContent = formatBytes(artifact.bytes.byteLength);
    elements.resultLinkLength.textContent = `${secretLink.length} симв.`;
    elements.secretLink.value = secretLink;
    elements.publishPath.textContent = `reports/${filename}`;
    elements.resultCard.hidden = false;
    elements.resultCard.scrollIntoView({ behavior: "smooth", block: "start" });

    if (!storageAvailable) showToast("Файл создан, но локальная проверка в новой вкладке недоступна");
  } catch (error) {
    showCreateError(describeCreateError(error));
  } finally {
    buttonLabel.textContent = originalLabel;
    elements.encryptButton.disabled = false;
  }
}

function handleDownload() {
  if (!generatedArtifact) return;
  const blob = new Blob([generatedArtifact.bytes], { type: "application/octet-stream" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = generatedArtifact.filename;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function copyText(value) {
  try {
    await navigator.clipboard.writeText(value);
  } catch {
    elements.secretLink.focus();
    elements.secretLink.select();
    if (!document.execCommand("copy")) throw new Error("copy-failed");
  }
}

async function handleCopyLink() {
  if (!generatedArtifact) return;
  try {
    await copyText(generatedArtifact.secretLink);
    showToast("Ссылка скопирована");
  } catch {
    showToast("Выделите и скопируйте ссылку вручную");
  }
}

function openSecretLink(link) {
  const opened = window.open(link, "_blank", "noopener,noreferrer");
  if (!opened) window.location.href = link;
}

async function unlockFromFragment() {
  const fragment = window.location.hash.slice(1);
  if (!fragment) {
    showCreateView();
    return;
  }

  showReaderLoading();
  try {
    if (!window.isSecureContext || !crypto?.subtle) throw new Error("unsupported");
    const keyBytes = base64UrlToBytes(fragment);
    if (keyBytes.byteLength !== 16) throw new Error("invalid-key");

    elements.readerProgress.textContent = "Вычисляем идентификатор файла";
    const reportId = await deriveReportId(keyBytes);
    elements.readerProgress.textContent = "Загружаем бинарный ciphertext";
    const loaded = await loadCiphertext(reportId);
    elements.readerProgress.textContent = "Проверяем целостность и расшифровываем";
    const decrypted = await decryptReport(loaded.bytes, keyBytes);
    renderReport(decrypted.data, decrypted.jsonText, loaded.source);
  } catch (error) {
    let message = "Ключ неверен, файл отсутствует или данные повреждены.";
    if (error?.message === "unsupported") message = "Для демонстратора требуется HTTPS или localhost с поддержкой Web Crypto.";
    if (error?.message === "unsupported-file") message = "Версия или алгоритм бинарного файла не поддерживается.";
    showReaderError(message);
  }
}

function showCreateView() {
  elements.createView.hidden = false;
  elements.readerView.hidden = true;
}

function showReaderLoading() {
  elements.createView.hidden = true;
  elements.readerView.hidden = false;
  elements.readerLoading.hidden = false;
  elements.readerError.hidden = true;
  elements.reportView.hidden = true;
}

function showReaderError(message) {
  elements.readerLoading.hidden = true;
  elements.readerError.hidden = false;
  elements.reportView.hidden = true;
  elements.readerErrorText.textContent = message;
}

function completedGameScores(rallies) {
  const games = new Map();
  rallies.forEach((rally) => {
    const gameNumber = Number(rally?.gameNumber);
    const score = rally?.verification?.scoreAfter;
    if (Number.isInteger(gameNumber) && score && Number.isFinite(score.A) && Number.isFinite(score.B)) {
      games.set(gameNumber, { A: Number(score.A), B: Number(score.B) });
    }
  });
  return [...games.values()].filter((score) => Math.max(score.A, score.B) >= 11 && Math.abs(score.A - score.B) >= 2);
}

function formatDate(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return value;
  return new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", year: "numeric" })
    .format(new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
}

function renderReport(data, jsonText, source) {
  const games = completedGameScores(data.rallies);
  const gamesA = games.filter((score) => score.A > score.B).length;
  const gamesB = games.filter((score) => score.B > score.A).length;
  const nameA = data.match.players.A.name;
  const nameB = data.match.players.B.name;

  elements.reportPlayers.textContent = `${nameA} — ${nameB}`;
  elements.reportDate.textContent = formatDate(data.match.date);
  elements.playerAName.textContent = nameA;
  elements.playerBName.textContent = nameB;
  elements.playerAScore.textContent = String(gamesA);
  elements.playerBScore.textContent = String(gamesB);
  elements.reportBestOf.textContent = `из ${data.match.bestOf} партий`;
  elements.reportStatusValue.textContent = data.record.status === "complete" ? "завершена" : "черновик";
  elements.reportRallies.textContent = String(data.rallies.length);
  elements.rawJson.textContent = jsonText;
  elements.reportSource.textContent = source;

  elements.readerLoading.hidden = true;
  elements.readerError.hidden = true;
  elements.reportView.hidden = false;
  document.title = `Отчёт «${nameA} — ${nameB}»`;
}

function resetApplication() {
  history.replaceState(null, "", `${location.pathname}${location.search}`);
  document.title = "ttScore — демонстратор секретной ссылки";
  elements.readerView.hidden = true;
  elements.createView.hidden = false;
  elements.resultCard.hidden = true;
  generatedArtifact = null;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function showToast(message) {
  clearTimeout(toastTimer);
  elements.toast.textContent = message;
  elements.toast.hidden = false;
  toastTimer = setTimeout(() => { elements.toast.hidden = true; }, 2600);
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} байт`;
  return `${new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 1 }).format(bytes / 1024)} КиБ`;
}

elements.jsonInput.addEventListener("input", updateJsonSize);
elements.restoreSampleButton.addEventListener("click", resetSample);
elements.encryptButton.addEventListener("click", handleEncrypt);
elements.copyLinkButton.addEventListener("click", handleCopyLink);
elements.downloadButton.addEventListener("click", handleDownload);
elements.openLinkButton.addEventListener("click", () => {
  if (!generatedArtifact) return;
  if (!generatedArtifact.storageAvailable) {
    showToast("Сначала опубликуйте скачанный файл в reports/");
    return;
  }
  openSecretLink(generatedArtifact.secretLink);
});
elements.openSampleButton.addEventListener("click", () => openSecretLink(`${location.href.split("#")[0]}#${SAMPLE_KEY}`));
document.querySelectorAll(".reset-button").forEach((button) => button.addEventListener("click", resetApplication));
window.addEventListener("hashchange", unlockFromFragment);

resetSample();
unlockFromFragment();
