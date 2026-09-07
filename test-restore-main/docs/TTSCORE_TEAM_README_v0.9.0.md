# ttScore Team v0.9.0

## Статус

- Version: `v0.9.0` release candidate.
- Baseline: принятая владельцем `v0.8.12`.
- Парная версия: `ttScore 0.4.0` release candidate.
- `schemaVersion: 4` командной встречи не изменён.
- Нового server-side runtime или build dependency нет.
- До отдельного принятия владельцем v0.9.0 не заменяет baseline v0.8.12.

## Главное изменение

v0.9.0 устраняет runtime-зависимость operational-пути от открытого Team editor.

Firebase editor теперь даёт действие «Открыть в ttScore». Ссылка явно запускает парный `../ttScore_0.4.0.html?teamMatch=<id>`. В Team mode ttScore самостоятельно:

1. читает текущий Team assignment;
2. предзаполняет дату, пару и `bestOf`;
3. сохраняет binding конкретного `individualMatchId` с operational revision;
4. ведёт обычный локальный scoring/Undo;
5. синхронизирует Live-ссылки;
6. после подтверждённого выхода из завершённой встречи атомарно применяет `current → finished → next current`;
7. получает следующую пару без повторного ручного ввода.

Первый подающий, сторона и фора не приходят из Team и остаются локальными решениями судьи.

## Общий integration contract

Новый `team/assets/0.9.0/team-integration-contract.mjs` является versioned operational-domain contract v1. Он используется:

- Team editor через wrappers в `editor.mjs`;
- прямым Team adapter `ttScore` через `ttscore-team-adapter.mjs`.

Контракт отвечает за assignment, binding, operational revision, проверку ttScore state, Live update, transition и reconciliation повторной доставки уже применённого результата.

## Concurrency / fail-closed

RC6 сохраняет архитектуру RC5: `runTransaction()` не используется для existing-node writes. Firebase node содержит transport-only `_writeRevision`, который удаляется адаптером до передачи JSON в domain model.

Existing-node write выполняется как `get() → domain transform → set(candidate)`; атомарность compare-and-swap обеспечивается серверными Realtime Database Security Rules: новая `_writeRevision` должна быть ровно на единицу больше фактической server revision. Поэтому два клиента, подготовившие изменение из одного snapshot, не могут оба успешно записать состояние: после первого commit второй candidate отклоняется Rules.

Legacy node без `_writeRevision` считается transport revision 0 и при первом успешном RC6 write мигрирует в revision 1. Domain `schemaVersion: 4`, `sourceRevision` и operational contract не включают transport metadata.

Create нового Team node остаётся на `runTransaction()` create-if-absent: там `null` означает именно отсутствие создаваемого узла и не имеет неоднозначности existing-node update.

RC3 realtime `onValue()` остаётся неизменным. SDK `set()` может генерировать optimistic local event; editor уже блокирует применение realtime state во время публикации, а при server rejection authoritative rollback обрабатывается после завершения write attempt. Это отдельно покрыто browser regression.

## Совместимость

Локальный protocol namespace ttScore сохранён как `ttScore:0.3.5:*`. Поэтому `ttScore 0.4.0` не теряет незавершённую локальную встречу v0.3.5 и сохраняет резервный localStorage/BroadcastChannel bridge Team editor.

Автономный запуск ttScore без `teamMatch` не загружает Team adapter/Firebase Team runtime.

## Security boundary

Firebase Rules сохраняют существующую модель: публичное чтение Team match и запись только allowlisted editor UID. Team mode использует ту же доверенную editor identity.

Принятое ограничение: один и тот же административный credential нельзя одновременно сделать «ограниченным только operational-полями» на уровне Rules без отдельной роли/custom claim/credential. В текущей цели не вводится новый auth-role или backend. Автоматический код ограничен общим contract и transaction validation; компрометация административного editor credential остаётся вне этой границы доверия.

## Evidence

- `ttscore_team`: **211/211 automated tests PASS**.
- `ttScore 0.4.0`: **10/10 integration/regression checks PASS**.
- 9 критических scoring/Undo функций byte-identical с принятой v0.3.5.
- Team DOM E2E в Chromium: **19/19 PASS** (`prefill → start → scoring → Undo-window → release → next assignment`).
- Autonomous Chromium smoke: **6/6 PASS**.
- JavaScript syntax checks: PASS.
- Реальный credentialed Firebase E2E в среде исполнителя не выполнялся: editor credentials не предоставлялись. Firebase transport проверен структурно и через contract/browser tests; RC6 дополнительно исправляет production Rules-regression; это limitation evidence, а не заявленный live-production test.

Подробности находятся в release bundle: `CYCLE_RESEARCH.md`, `CYCLE_PLAN.md`, `GENERAL_REVIEW.md`, `EVIDENCE.md`, `NEXT_CYCLE_BRIEF.md`.
