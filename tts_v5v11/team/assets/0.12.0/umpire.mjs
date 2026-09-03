import {
  observeFirebaseAuth,
  readFirebaseTeamMatch,
  signInFirebaseEditor,
  signOutFirebaseEditor,
  subscribeFirebaseTeamMatch
} from "./firebase-source.mjs";
import { teamAssignment } from "./team-integration-contract.mjs";

const TEAM_MATCH_ID_PATTERN = /^[a-z0-9][a-z0-9-]{0,79}$/;

export function parseUmpireRequest(search) {
  const parameters = new URLSearchParams(search);
  const ids = parameters.getAll("teamMatch");
  if (ids.length !== 1 || !ids[0]) throw new Error("Umpire URL должен содержать ровно один непустой параметр teamMatch.");
  if (!TEAM_MATCH_ID_PATTERN.test(ids[0])) throw new Error("Некорректный идентификатор командной встречи.");
  return { teamMatchId: ids[0] };
}

export function umpireTtScoreUrl(teamMatchId, pageUrl) {
  if (!TEAM_MATCH_ID_PATTERN.test(teamMatchId || "")) throw new Error("Некорректный идентификатор командной встречи.");
  const url = new URL("../ttScore_0.6.0.html", pageUrl);
  url.search = "";
  url.hash = "";
  url.searchParams.set("teamMatch", teamMatchId);
  url.searchParams.set("role", "umpire");
  return url.toString();
}

export function umpireAssignmentView(raw) {
  const assignment = teamAssignment(raw);
  if (assignment.status === "closed") {
    return { status:"closed", teamMatchId:assignment.teamMatchId, label:"Командная встреча завершена", players:"—", matchDate:"—", bestOf:"—" };
  }
  return {
    status: assignment.status,
    teamMatchId: assignment.teamMatchId,
    individualMatchId: assignment.individualMatchId,
    label: assignment.status === "current" ? `Идёт · № ${assignment.order}` : `Следующая · № ${assignment.order}`,
    players: `${assignment.playerA.name} — ${assignment.playerB.name}`,
    matchDate: assignment.matchDate,
    bestOf: `Из ${assignment.bestOf} партий`
  };
}

function authMessage(error) {
  const messages = {
    "auth/invalid-credential":"Неверный email или пароль Firebase.",
    "auth/invalid-email":"Некорректный email Firebase.",
    "auth/too-many-requests":"Слишком много попыток входа. Повторите позже.",
    "auth/network-request-failed":"Не удалось связаться с Firebase Authentication.",
    "auth/unauthorized-domain":"Текущий домен не разрешён в Firebase Authentication."
  };
  return messages[error?.code ?? ""] ?? (error instanceof Error ? error.message : String(error));
}

export async function startUmpireApp(environment = globalThis) {
  const locationObject = environment.location;
  const documentObject = environment.document;
  if (!locationObject || !documentObject) return null;
  const get = id => {
    const value = documentObject.getElementById(id);
    if (!value) throw new Error(`Umpire UI: отсутствует элемент #${id}.`);
    return value;
  };
  const ids = ["umpire-loading","umpire-error","umpire-error-text","umpire-auth","umpire-auth-status","umpire-auth-form","umpire-auth-email","umpire-auth-password","umpire-sign-in","umpire-sign-out","umpire-auth-error","umpire-assignment","umpire-assignment-state","umpire-team-match","umpire-players","umpire-date","umpire-best-of","umpire-open","umpire-open-note"];
  const elements = Object.fromEntries(ids.map(id => [id.replaceAll("-","_"), get(id)]));

  let request, currentUser = null, currentAssignment = null, authReady = false;
  let authUnsubscribe = null, teamUnsubscribe = null;

  function renderAuth() {
    elements.umpire_auth.hidden = false;
    elements.umpire_auth_form.hidden = !!currentUser;
    elements.umpire_sign_out.hidden = !currentUser;
    elements.umpire_auth_status.textContent = currentUser
      ? `Вход выполнен: ${currentUser.email ?? "Umpire account"}.`
      : authReady ? "Войдите общей учётной записью Umpire." : "Проверка авторизации Firebase…";
  }
  function renderAssignment() {
    if (!currentAssignment) return;
    elements.umpire_assignment.hidden = false;
    elements.umpire_team_match.textContent = currentAssignment.teamMatchId;
    elements.umpire_assignment_state.textContent = currentAssignment.label;
    elements.umpire_players.textContent = currentAssignment.players;
    elements.umpire_date.textContent = currentAssignment.matchDate;
    elements.umpire_best_of.textContent = currentAssignment.bestOf;
    const canOpen = !!currentUser && ["planned","current"].includes(currentAssignment.status);
    elements.umpire_open.disabled = !canOpen;
    elements.umpire_open_note.textContent = currentAssignment.status === "closed"
      ? "Командная встреча завершена."
      : currentUser
        ? currentAssignment.status === "planned"
          ? "Проверьте фамилии участников. Открытие ttScore не запускает встречу; старт подтверждается в «Начальной расстановке»."
          : "Проверьте фамилии участников и продолжите текущую встречу в ttScore."
        : "Для запуска требуется вход общей учётной записью Umpire с существующим editor-доступом Firebase.";
  }
  function showError(error) {
    elements.umpire_loading.hidden = true;
    elements.umpire_error_text.textContent = error instanceof Error ? error.message : String(error);
    elements.umpire_error.hidden = false;
  }

  try { request = parseUmpireRequest(locationObject.search); }
  catch (error) { showError(error); return { dispose(){}, request:null }; }

  elements.umpire_auth_form.addEventListener("submit", async event => {
    event.preventDefault(); elements.umpire_auth_error.hidden = true; elements.umpire_sign_in.disabled = true;
    try {
      await signInFirebaseEditor(elements.umpire_auth_email.value, elements.umpire_auth_password.value);
      elements.umpire_auth_password.value = "";
    } catch (error) {
      elements.umpire_auth_error.textContent = authMessage(error); elements.umpire_auth_error.hidden = false;
    } finally { elements.umpire_sign_in.disabled = false; }
  });
  elements.umpire_sign_out.addEventListener("click", async () => {
    elements.umpire_auth_error.hidden = true;
    try { await signOutFirebaseEditor(); }
    catch (error) { elements.umpire_auth_error.textContent = authMessage(error); elements.umpire_auth_error.hidden = false; }
  });
  elements.umpire_open.addEventListener("click", () => {
    if (!currentUser || !["planned","current"].includes(currentAssignment?.status)) return;
    locationObject.assign(umpireTtScoreUrl(request.teamMatchId, locationObject.href));
  });

  try {
    authUnsubscribe = await observeFirebaseAuth(user => { currentUser=user; authReady=true; renderAuth(); renderAssignment(); });
    const initial = await readFirebaseTeamMatch(request.teamMatchId);
    if (!initial) throw new Error("Командная встреча не найдена в Firebase.");
    currentAssignment = umpireAssignmentView(initial);
    elements.umpire_loading.hidden = true; renderAssignment();
    teamUnsubscribe = await subscribeFirebaseTeamMatch(request.teamMatchId, raw => {
      if (!raw) return showError(new Error("Командная встреча больше не существует в Firebase."));
      try { currentAssignment=umpireAssignmentView(raw); elements.umpire_error.hidden=true; renderAssignment(); }
      catch (error) { showError(error); }
    }, showError);
  } catch (error) { showError(error); }

  const dispose = () => { authUnsubscribe?.(); teamUnsubscribe?.(); };
  environment.addEventListener?.("pagehide", dispose, { once:true });
  return { dispose, request };
}

if (typeof window !== "undefined" && typeof document !== "undefined") void startUmpireApp();
