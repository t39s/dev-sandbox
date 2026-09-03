import {
  observeFirebaseAuth,
  readFirebaseTeamMatch,
  signInFirebaseEditor,
  signOutFirebaseEditor,
  subscribeFirebaseTeamMatch
} from "./firebase-source.mjs";
import { teamAssignment } from "./team-integration-contract.mjs";

const TEAM_MATCH_ID_PATTERN = /^[a-z0-9][a-z0-9-]{0,79}$/;
const JUDGE_ACCOUNT_CONFIRMATION_KEY = "ttscore_team:0.12.0:judgeConfirmedUid";

export function parseJudgeRequest(search) {
  const parameters = new URLSearchParams(search);
  const ids = parameters.getAll("teamMatch");
  if (ids.length !== 1 || !ids[0]) throw new Error("Judge URL должен содержать ровно один непустой параметр teamMatch.");
  if (!TEAM_MATCH_ID_PATTERN.test(ids[0])) throw new Error("Некорректный идентификатор командной встречи.");
  return { teamMatchId: ids[0] };
}

export function judgeTtScoreUrl(teamMatchId, pageUrl) {
  if (!TEAM_MATCH_ID_PATTERN.test(teamMatchId || "")) throw new Error("Некорректный идентификатор командной встречи.");
  const url = new URL("../ttScore_0.6.0.html", pageUrl);
  url.search = "";
  url.hash = "";
  url.searchParams.set("teamMatch", teamMatchId);
  url.searchParams.set("role", "judge");
  return url.toString();
}

export function judgeAssignmentView(raw) {
  const assignment = teamAssignment(raw);
  if (assignment.status === "closed") {
    return {
      status: "closed",
      teamMatchId: assignment.teamMatchId,
      label: "Командная встреча завершена",
      players: "—",
      matchDate: "—",
      bestOf: "—"
    };
  }
  return {
    status: "current",
    teamMatchId: assignment.teamMatchId,
    individualMatchId: assignment.individualMatchId,
    label: `№ ${assignment.order}`,
    players: `${assignment.playerA.name} — ${assignment.playerB.name}`,
    matchDate: assignment.matchDate,
    bestOf: `Из ${assignment.bestOf} партий`
  };
}

function authMessage(error) {
  const code = error?.code ?? "";
  const messages = {
    "auth/invalid-credential": "Неверный email или пароль Firebase.",
    "auth/invalid-email": "Некорректный email Firebase.",
    "auth/too-many-requests": "Слишком много попыток входа. Повторите позже.",
    "auth/network-request-failed": "Не удалось связаться с Firebase Authentication.",
    "auth/unauthorized-domain": "Текущий домен не разрешён в Firebase Authentication."
  };
  return messages[code] ?? (error instanceof Error ? error.message : String(error));
}

export async function startJudgeApp(environment = globalThis) {
  const locationObject = environment.location;
  const documentObject = environment.document;
  if (!locationObject || !documentObject) return null;

  const getElement = id => {
    const value = documentObject.getElementById(id);
    if (!value) throw new Error(`Judge UI: отсутствует элемент #${id}.`);
    return value;
  };
  const elements = Object.fromEntries([
    "judge-loading", "judge-error", "judge-error-text", "judge-auth", "judge-auth-status", "judge-auth-form",
    "judge-auth-email", "judge-auth-password", "judge-sign-in", "judge-confirm-account", "judge-sign-out", "judge-auth-error",
    "judge-assignment", "judge-assignment-state", "judge-team-match", "judge-players", "judge-date",
    "judge-best-of", "judge-start", "judge-start-note"
  ].map(id => [id.replaceAll("-", "_"), getElement(id)]));

  let request = null;
  let currentUser = null;
  let currentAssignment = null;
  let authReady = false;
  let confirmedJudgeUid = null;
  let authUnsubscribe = null;
  let teamUnsubscribe = null;

  const storage = environment.sessionStorage;
  const readConfirmedUid = () => {
    try { return storage?.getItem(JUDGE_ACCOUNT_CONFIRMATION_KEY) || null; }
    catch { return null; }
  };
  const storeConfirmedUid = uid => {
    confirmedJudgeUid = uid || null;
    try {
      if (confirmedJudgeUid) storage?.setItem(JUDGE_ACCOUNT_CONFIRMATION_KEY, confirmedJudgeUid);
      else storage?.removeItem(JUDGE_ACCOUNT_CONFIRMATION_KEY);
    } catch {}
  };
  confirmedJudgeUid = readConfirmedUid();

  const judgeAccountConfirmed = () => !!currentUser && confirmedJudgeUid === currentUser.uid;

  function renderAuth() {
    elements.judge_auth.hidden = false;
    elements.judge_auth_form.hidden = !!currentUser;
    elements.judge_sign_out.hidden = !currentUser;
    elements.judge_confirm_account.hidden = !currentUser || judgeAccountConfirmed();
    elements.judge_auth_status.textContent = currentUser
      ? judgeAccountConfirmed()
        ? `Judge account подтверждён: ${currentUser.email ?? "без email"}. UID: ${currentUser.uid}.`
        : `Текущий Firebase account: ${currentUser.email ?? "без email"}. Подтвердите, что это отдельная учётная запись Judge, или смените аккаунт.`
      : authReady
        ? "Войдите отдельной учётной записью Judge. Право записи проверяется существующими Firebase Rules как editor-доступ."
        : "Проверка авторизации Firebase…";
  }

  function renderAssignment() {
    if (!currentAssignment) return;
    elements.judge_assignment.hidden = false;
    elements.judge_team_match.textContent = currentAssignment.teamMatchId;
    elements.judge_assignment_state.textContent = currentAssignment.label;
    elements.judge_players.textContent = currentAssignment.players;
    elements.judge_date.textContent = currentAssignment.matchDate;
    elements.judge_best_of.textContent = currentAssignment.bestOf;
    const canStart = currentAssignment.status === "current" && judgeAccountConfirmed();
    elements.judge_start.disabled = !canStart;
    elements.judge_start_note.textContent = currentAssignment.status === "closed"
      ? "Командная встреча завершена; активного Judge assignment нет."
      : judgeAccountConfirmed()
        ? `Готово к запуску под Judge account ${currentUser.email ?? currentUser.uid}.`
        : currentUser
          ? "Подтвердите текущий Firebase account как Judge или смените аккаунт."
          : "Для запуска требуется вход отдельной учётной записью Judge с существующим editor-доступом Firebase.";
  }

  function showError(error) {
    elements.judge_loading.hidden = true;
    elements.judge_error_text.textContent = error instanceof Error ? error.message : String(error);
    elements.judge_error.hidden = false;
  }

  try {
    request = parseJudgeRequest(locationObject.search);
  } catch (error) {
    showError(error);
    return { dispose() {}, request: null };
  }

  elements.judge_auth_form.addEventListener("submit", async event => {
    event.preventDefault();
    elements.judge_auth_error.hidden = true;
    elements.judge_sign_in.disabled = true;
    try {
      const credential = await signInFirebaseEditor(elements.judge_auth_email.value, elements.judge_auth_password.value);
      storeConfirmedUid(credential.user.uid);
      elements.judge_auth_password.value = "";
      renderAuth();
      renderAssignment();
    } catch (error) {
      elements.judge_auth_error.textContent = authMessage(error);
      elements.judge_auth_error.hidden = false;
    } finally {
      elements.judge_sign_in.disabled = false;
    }
  });

  elements.judge_confirm_account.addEventListener("click", () => {
    if (!currentUser) return;
    storeConfirmedUid(currentUser.uid);
    renderAuth();
    renderAssignment();
  });

  elements.judge_sign_out.addEventListener("click", async () => {
    elements.judge_auth_error.hidden = true;
    storeConfirmedUid(null);
    try {
      await signOutFirebaseEditor();
    } catch (error) {
      elements.judge_auth_error.textContent = authMessage(error);
      elements.judge_auth_error.hidden = false;
    }
  });

  elements.judge_start.addEventListener("click", () => {
    if (!judgeAccountConfirmed() || currentAssignment?.status !== "current") return;
    locationObject.assign(judgeTtScoreUrl(request.teamMatchId, locationObject.href));
  });

  try {
    authUnsubscribe = await observeFirebaseAuth(user => {
      currentUser = user;
      authReady = true;
      renderAuth();
      renderAssignment();
    });

    const initial = await readFirebaseTeamMatch(request.teamMatchId);
    if (!initial) throw new Error("Командная встреча не найдена в Firebase.");
    currentAssignment = judgeAssignmentView(initial);
    elements.judge_loading.hidden = true;
    renderAssignment();

    teamUnsubscribe = await subscribeFirebaseTeamMatch(request.teamMatchId, raw => {
      if (!raw) {
        showError(new Error("Командная встреча больше не существует в Firebase."));
        return;
      }
      try {
        currentAssignment = judgeAssignmentView(raw);
        elements.judge_error.hidden = true;
        renderAssignment();
      } catch (error) {
        showError(error);
      }
    }, showError);
  } catch (error) {
    showError(error);
  }

  const dispose = () => {
    authUnsubscribe?.();
    teamUnsubscribe?.();
  };
  environment.addEventListener?.("pagehide", dispose, { once: true });
  return { dispose, request };
}

if (typeof window !== "undefined" && typeof document !== "undefined") {
  void startJudgeApp();
}
