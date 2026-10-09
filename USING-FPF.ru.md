# USING-FPF.md — оригинал и перевод на русский язык

Источник: [USING-FPF.md](https://github.com/ailev/FPF/blob/0c6ade275e9360f0c5ab9715d8f05c0dbaa13cf8/USING-FPF.md?plain=1#L1-L100). Автор: Anatoly Levenchuk (Анатолий Левенчук). Лицензия: [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).

Редакция FPF Library: `20261007T222953Z-a9741b4ecd6fb49a`; коммит: `0c6ade275e9360f0c5ab9715d8f05c0dbaa13cf8`.

Изменения относительно источника: перевод на русский язык, представление по предложениям в двух столбцах; исходные блоки команд и исходная таблица исключены. Заголовки и вводные фразы сохранены отдельными строками. Между абзацами — пустые строки таблицы.

| Оригинальный текст | Перевод на русский язык |
| --- | --- |
| **Using FPF and its DPF Suites** | **Использование FPF и его наборов DPF** |
|  |  |
| This is the common working instruction for people and AI agents using FPF or its DPFs, including work that develops or reviews the frameworks themselves. | Это общая рабочая инструкция для людей и ИИ-агентов, использующих FPF или его DPF, включая работу по разработке или рецензированию самих фреймворков. |
| Apply it whenever the work relies on their methods, not only when processing an intake. | Применяйте её всякий раз, когда работа опирается на их методы, а не только при обработке входящего обращения. |
| Paths below are relative to the folder containing this file. | Указанные ниже пути заданы относительно папки, содержащей этот файл. |
|  |  |
| For an assisting agent, make this instruction part of the project's ordinary instructions: attach the file or link it from `AGENTS.md` or the environment's equivalent. | Для помогающего агента включите эту инструкцию в обычные инструкции проекта: прикрепите файл или добавьте ссылку на него в `AGENTS.md` либо в его эквивалент в данной среде. |
| A link in a past conversation does not establish that the current performer can retrieve and apply it. | Ссылка в прошлом разговоре не подтверждает, что текущий исполнитель может получить и применить её. |
| Reuse a current reading while the instruction and access conditions remain unchanged; return to the relevant section when they change or the instruction is no longer available in working context. | Повторно используйте текущее прочтение, пока инструкция и условия доступа остаются неизменными; возвращайтесь к соответствующему разделу, когда они меняются или инструкция больше недоступна в рабочем контексте. |
|  |  |
| When a referenced publication is present in this folder, resolve its pattern references in that copy, including references written as GitHub links. | Когда публикация, на которую дана ссылка, присутствует в этой папке, находите паттерны, на которые она ссылается, в этой копии, включая ссылки, записанные как ссылки GitHub. |
| Use another edition when the task calls for an update or a comparison. | Используйте другую редакцию, когда задача требует обновления или сравнения. |
|  |  |
| **Make the publications available** | **Обеспечьте доступность публикаций** |
|  |  |
| Check what the present environment can actually read and search. | Проверьте, что текущая среда действительно может читать и искать. |
| A GitHub link, a listed filename or a truncated preview is not access to the publication's full text. | Ссылка GitHub, указанное в списке имя файла или усечённый предварительный просмотр не являются доступом к полному тексту публикации. |
| Some interfaces cannot retrieve a large publication through an attachment or connector. | Некоторые интерфейсы не могут получить большую публикацию через вложение или коннектор. |
| Do not assume that one interface's access limits apply to another. | Не предполагайте, что ограничения доступа одного интерфейса распространяются на другой. |
|  |  |
| Where the environment supports local files, obtain the publication files through an available download or repository checkout and use content search on those files. | Там, где среда поддерживает локальные файлы, получите файлы публикаций посредством доступной загрузки или извлечения репозитория и используйте поиск по содержимому этих файлов. |
| Keep this instruction with them. | Храните эту инструкцию вместе с ними. |
| Where only excerpts can be supplied, obtain the complete relevant patterns or sections, including the conditions and dependencies needed for the question, and retain their publication names and pattern IDs. | Там, где могут быть предоставлены только выдержки, получите полные относящиеся к вопросу паттерны или разделы, включая условия и зависимости, необходимые для вопроса, и сохраните названия их публикаций и идентификаторы паттернов. |
| Use an accessible README, contents entry or search result to locate the needed material; the locator does not replace it. | Используйте доступный README, запись оглавления или результат поиска, чтобы найти нужный материал; указатель не заменяет его. |
| If the necessary passage cannot be obtained, state the missing access and keep the dependent conclusion open. | Если необходимый фрагмент получить невозможно, укажите отсутствие доступа и оставьте зависящий от него вывод открытым. |
| You can continue work whose basis is available. | Вы можете продолжать работу, основание которой доступно. |
|  |  |
| Establish the available publication set once, and update it when files or access change. | Один раз установите доступный набор публикаций и обновляйте его при изменении файлов или доступа. |
| The full distribution includes FPF, both DPF Suites and their References, and the independent Narrativization DPF; a downloaded subset or one attached document offers less. | Полный дистрибутив включает FPF, оба набора DPF и их справочники, а также самостоятельный DPF нарративизации; загруженное подмножество или один прикреплённый документ предоставляют меньше. |
| The public `Readme.md` and Suite `README.md` files identify the publications. | Публичный файл `Readme.md` и файлы `README.md` наборов обозначают публикации. |
| Search the available set together when the question might need contributions from more than one practice. | Выполняйте поиск по доступному набору совместно, когда вопрос может требовать вкладов более чем одной практики. |
| A missing search result means that this search has not found an answer in those sources, not that the ecosystem lacks the method. | Отсутствие результата поиска означает, что этот поиск не нашёл ответа в этих источниках, а не то, что в экосистеме отсутствует метод. |
|  |  |
| For development or review, use the edition and candidate selected by the assignment. | Для разработки или рецензирования используйте редакцию и кандидат, выбранные заданием. |
| Distinguish a proposed contribution from published guidance when reporting what the framework already supplies. | Отличайте предлагаемый вклад от опубликованных указаний, сообщая о том, что фреймворк уже предоставляет. |
|  |  |
| **Keep the receiving work in view** | **Держите в поле зрения работу, принимающую результат** |
|  |  |
| Start with the actual situation, the object being worked on, and the result the answer needs to support. | Начните с фактической ситуации, объекта, над которым ведётся работа, и результата, который ответ должен поддержать. |
| Apply [C.39:4.1](FPF-Spec.md#c39---find-and-develop-a-way-to-obtain-a-result) to establish what would make the contribution sufficient for the next receiving action or judgement. | Примените [C.39:4.1](FPF-Spec.md#c39---find-and-develop-a-way-to-obtain-a-result), чтобы установить, что сделало бы вклад достаточным для следующего принимающего действия или суждения. |
| Keep that use in view when the task already names a pattern, a source, a correction or a check. | Держите это использование в поле зрения, когда в задаче уже названы паттерн, источник, исправление или проверка. |
| The named operation can supply only part of the needed result. | Названная операция может предоставить лишь часть необходимого результата. |
|  |  |
| Use an adequate known answer directly. | Используйте подходящий известный ответ напрямую. |
| If the available text leaves you inventing a consequential distinction or connection, follow that gap through C.39:4.2–4.5. | Если доступный текст оставляет вам необходимость изобретать существенное различение или связь, проследите этот пробел через C.39:4.2–4.5. |
| This is where conceptual and methodological synthesis enters ordinary work: construct what is missing, retain what already works, and explain enough for the intended use. | Именно здесь концептуальный и методологический синтез входят в обычную работу: сконструируйте недостающее, сохраните то, что уже работает, и объясните достаточно для предполагаемого использования. |
| E.4.CM applies that construction to a maintained framework contribution. | E.4.CM применяет это конструирование к поддерживаемому вкладу во фреймворк. |
| Do not turn every lookup into framework development; a task-local answer, a usable supplier or a sufficient partial result may finish the present work. | Не превращайте каждый поиск в разработку фреймворка; ответ в рамках задачи, пригодный поставщик или достаточный частичный результат могут завершить текущую работу. |
|  |  |
| On a return from local work, decide what the recipient can now obtain or do using that result. | При возврате из локальной работы решите, что получатель теперь может получить или сделать, используя этот результат. |
| A checked extraction establishes what the source supplies; an explained general way may still require construction. | Проверенное извлечение устанавливает, что предоставляет источник; объяснённый общий способ всё ещё может требовать конструирования. |
| A reader's private invention can reveal that need without establishing that the publication already supplies it. | Личное изобретение читателя может выявить эту потребность, не устанавливая, что публикация уже предоставляет это. |
| Follow the source or dependency only as far as the receiving decision requires. | Прослеживайте источник или зависимость лишь настолько далеко, насколько требует принимающее решение. |
| State the supported useful answer and the condition that changes its use; [C.11.DUA](FPF-Spec.md#c11dua---make-advice-and-evidence-demands-worth-their-burden) keeps a catalogue of unknowns from becoming an automatic research assignment. | Сформулируйте обоснованный полезный ответ и условие, изменяющее его использование; [C.11.DUA](FPF-Spec.md#c11dua---make-advice-and-evidence-demands-worth-their-burden) не даёт каталогу неизвестного превратиться в автоматическое исследовательское задание. |
|  |  |
| These moves belong to the work itself, not a separate report for each response. | Эти действия относятся к самой работе, а не к отдельному отчёту для каждого ответа. |
| Reuse the established receiving use and sound results while their conditions hold. | Повторно используйте установленное принимающее использование и обоснованные результаты, пока действуют их условия. |
| After an interruption or a changed assignment, recover that connection before choosing the next local move. | После прерывания или изменения задания восстановите эту связь, прежде чем выбирать следующее локальное действие. |
|  |  |
| **Choose what to read** | **Выберите, что читать** |
|  |  |
| If a pattern is already named, find its body directly. | Если паттерн уже назван, найдите его основной текст напрямую. |
| Otherwise search the available publications together, using terms for the difficulty and needed result. | В противном случае выполняйте поиск по доступным публикациям совместно, используя термины для затруднения и необходимого результата. |
| Include English technical terms when the user's language differs from the sources. | Включайте английские технические термины, когда язык пользователя отличается от языка источников. |
| You can find an individual method or a connected application without first choosing a Suite, Reference or pattern file. | Вы можете найти отдельный метод или связанное применение, не выбирая предварительно набор, справочник или файл паттернов. |
|  |  |
| When sources or terminology are uncertain, [F.1:4.4](FPF-Spec.md#f1---find-and-select-sources-for-a-current-question) explains how to construct and adapt a search from the available access, preserve the original question, inspect candidates and return consequential limits. | Когда источники или терминология неопределённы, [F.1:4.4](FPF-Spec.md#f1---find-and-select-sources-for-a-current-question) объясняет, как построить и адаптировать поиск исходя из имеющегося доступа, сохранить исходный вопрос, изучить кандидатов и вернуть существенные ограничения. |
| Finding alone requires no SourceCutNote; use F.1's source-selection branch only when a justified basis over several sources is needed. | Один лишь поиск не требует SourceCutNote; используйте ветвь выбора источников F.1 только тогда, когда необходимо обоснованное основание по нескольким источникам. |
| A sufficient known source can be used directly. | Достаточный известный источник можно использовать напрямую. |
|  |  |
| Inspect a promising passage with its enclosing heading. | Изучите многообещающий фрагмент вместе с охватывающим его заголовком. |
| A pattern body supplies its method; a Reference answer can explain how several contributions work together; a README or contents row helps locate that explanation. | Основной текст паттерна предоставляет его метод; ответ справочника может объяснить, как несколько вкладов работают вместе; README или строка оглавления помогают найти это объяснение. |
| Open the substantive source and the conditions needed for the present use. | Откройте содержательный источник и условия, необходимые для текущего использования. |
| When exploring the repertoire without a useful search phrase, start with FPF Part headings or the corresponding Suite overview, then retrieve selected entries. | При изучении репертуара без полезной поисковой фразы начните с заголовков частей FPF или обзора соответствующего набора, затем получите выбранные записи. |
| Search a large Table of Contents as text and read the matching rows; do not load it in full merely to begin a lookup. | Выполняйте поиск в большом оглавлении как в тексте и читайте соответствующие строки; не загружайте его полностью лишь для начала поиска. |
| Its technical terms, practical questions and dependencies can help reformulate the search. | Его технические термины, практические вопросы и зависимости могут помочь переформулировать поиск. |
|  |  |
| To perform a selected method, read its description, applicability conditions, and the related patterns needed for that use. | Чтобы выполнить выбранный метод, прочитайте его описание, условия применимости и связанные паттерны, необходимые для этого использования. |
| To use a particular technique, read its section together with the conditions it depends on. | Чтобы использовать конкретную технику, прочитайте её раздел вместе с условиями, от которых она зависит. |
| Apply it to the facts and constraints of the task. | Примените её к фактам и ограничениям задачи. |
| If a candidate method presupposes a result you still need to obtain, search for that earlier result or operation rather than silently treating it as given. | Если метод-кандидат предполагает результат, который вам ещё нужно получить, ищите этот более ранний результат или операцию, вместо того чтобы молча считать его данным. |
| For example, resolving a known conflict does not by itself explain how to notice a difficulty in ordinary work. | Например, разрешение известного конфликта само по себе не объясняет, как заметить затруднение в обычной работе. |
| A later method's scope limit is not evidence that the earlier contribution is absent from the framework. | Ограничение области действия более позднего метода не является свидетельством того, что более ранний вклад отсутствует во фреймворке. |
|  |  |
| Explain results and give feedback in the language of the project's work. | Объясняйте результаты и давайте обратную связь на языке работы проекта. |
| Preserve the source distinctions that affect the answer. | Сохраняйте различения источника, которые влияют на ответ. |
| Cite the patterns and locations used. | Ссылайтесь на использованные паттерны и места в тексте. |
| State assumptions, missing evidence, use limits, and the need for human judgement where they affect the decision. | Указывайте предположения, недостающие свидетельства, ограничения использования и необходимость человеческого суждения там, где они влияют на решение. |
| Let the current question determine the next step. | Пусть текущий вопрос определяет следующий шаг. |
|  |  |
| When a question needs several methods, use a relevant connected example or Practical-Use Card. | Когда вопрос требует нескольких методов, используйте относящийся к нему связанный пример или карточку практического использования. |
| Follow the intermediate results: what each method returns, which operation uses it, and what changed condition sends the work back. | Прослеживайте промежуточные результаты: что возвращает каждый метод, какая операция использует это и какое изменившееся условие отправляет работу назад. |
| A mantra helps retain that connection. | Мантра помогает сохранить эту связь. |
| Read the supplying patterns and start at the contribution whose inputs are available. | Прочитайте предоставляющие паттерны и начните с вклада, входные данные которого доступны. |
| If one method's result leaves the larger work unresolved, search the same publications for that larger result together with the method's ID or useful terms. | Если результат одного метода оставляет более крупную работу нерешённой, ищите в тех же публикациях этот более крупный результат вместе с идентификатором метода или полезными терминами. |
| Continue through the connected account only where it supplies a contribution the work still needs. | Продолжайте следовать связанному изложению только там, где оно предоставляет вклад, который работе всё ещё нужен. |
| An adequate earlier result or a sufficient individual method can end the lookup. | Подходящий более ранний результат или достаточный отдельный метод могут завершить поиск. |
|  |  |
| Also recover the constituent–whole connections in the relevant Method and Work structures: what larger work is being performed through this action now, what constituent performances it needs, and which conditions must hold together. | Также восстановите связи «составляющая — целое» в соответствующих структурах Метода и Работы: какая более крупная работа выполняется сейчас посредством этого действия, какие исполнения составляющих ей нужны и какие условия должны выполняться совместно. |
| Use B.1.5.EW when this is unclear and B.1.5.RS for a proposed constituent replacement. | Используйте B.1.5.EW, когда это неясно, и B.1.5.RS для предлагаемой замены составляющей. |
| A DPF can describe only some of those connections. | DPF может описывать лишь некоторые из этих связей. |
| Retain already available capabilities, expose missing intermediate coordination or support, and check joint demands on shared resources. | Сохраняйте уже доступные способности, выявляйте недостающую промежуточную координацию или поддержку и проверяйте совместные требования к общим ресурсам. |
| Use CGUS conditions when these facts change which continuation is available. | Используйте условия CGUS, когда эти факты меняют то, какое продолжение доступно. |
| Explain the connection in the language of the work. | Объясняйте связь на языке работы. |
| C.30.ASV:4.5a helps distinguish the relevant structures when that affects the decision. | C.30.ASV:4.5a помогает различать соответствующие структуры, когда это влияет на решение. |
| If a drawing uses vertical or horizontal direction, name the represented structure and relation as A.22:4.3a explains; a diagram is optional. | Если рисунок использует вертикальное или горизонтальное направление, назовите представленную структуру и отношение, как объясняет A.22:4.3a; диаграмма необязательна. |
|  |  |
| **Learn the contribution the work needs** | **Научитесь вносить вклад, который нужен работе** |
|  |  |
| Using a method to obtain a result and learning to perform it are different purposes. | Использование метода для получения результата и обучение его выполнению — разные цели. |
| Decide which contribution you need to make yourself and which can be supplied by a source, tool, specialist or AI assistant. | Решите, какой вклад вам нужно внести самостоятельно, а какой может предоставить источник, инструмент, специалист или ИИ-помощник. |
| For example, interpreting a model's limits may be necessary even when another contributor constructs and computes it. | Например, интерпретация ограничений модели может быть необходима даже тогда, когда другой участник конструирует её и выполняет расчёты. |
| An available answer can be enough for the current work; it does not establish that you can produce or adapt it in a different situation. | Доступного ответа может быть достаточно для текущей работы; это не устанавливает, что вы можете получить или адаптировать его в другой ситуации. |
|  |  |
| When learning is the purpose, use the [Human Capability Development DPF](Engineering%20DPF%20Suite/HUMAN-CAPABILITY-DEVELOPMENT-PRINCIPLES-FRAMEWORK.md). | Когда целью является обучение, используйте [DPF развития человеческих способностей](Engineering%20DPF%20Suite/HUMAN-CAPABILITY-DEVELOPMENT-PRINCIPLES-FRAMEWORK.md). |
| HCD.1–.3 connect later work, current preparation and the choice of development or support. | HCD.1–.3 связывают последующую работу, текущую подготовку и выбор развития или поддержки. |
| HCD.9 guides practice with feedback and correction; HCD.10 helps vary it for the missing operation. | HCD.9 направляет практику с обратной связью и исправлением; HCD.10 помогает варьировать её для недостающей операции. |
| HCD.12 distinguishes evidence of applying an already learned method under a changed condition from evidence of learning a new method with a source. | HCD.12 отличает свидетельства применения уже изученного метода при изменившемся условии от свидетельств изучения нового метода с помощью источника. |
| HCD.15 reopens development when the work or its support changes. | HCD.15 вновь открывает развитие, когда меняется работа или её поддержка. |
| Read only the contributions needed for your question; the order of publications is not a requirement to learn every method first. | Читайте только вклады, необходимые для вашего вопроса; порядок публикаций не является требованием сначала изучить каждый метод. |
|  |  |
| **File structure** | **Структура файла** |
|  |  |
| A publication contains several patterns, located by their IDs. | Публикация содержит несколько паттернов, которые находятся по их идентификаторам. |
| For example: | Например: |
|  |  |
| IDs also occur in contents tables and cross-references. | Идентификаторы также встречаются в таблицах оглавления и перекрёстных ссылках. |
| Match a heading at the start of a line to locate the pattern itself. | Найдите соответствующий заголовок в начале строки, чтобы найти сам паттерн. |
| Line numbers help retrieve portions of a file; IDs locate a pattern after its line numbers change. | Номера строк помогают получать части файла; идентификаторы позволяют найти паттерн после изменения номеров его строк. |
| A reference such as `SYSE.24:4.1` points to a subsection; read it through to the next heading of the same or a higher level. | Ссылка, такая как `SYSE.24:4.1`, указывает на подраздел; прочитайте его до следующего заголовка того же или более высокого уровня. |
|  |  |
| **Search and read** | **Ищите и читайте** |
|  |  |
| Use `rg` (ripgrep), or the environment's equivalent search tool with regular expressions. | Используйте `rg` (ripgrep) или эквивалентный поисковый инструмент среды с регулярными выражениями. |
| Run these commands with the public distribution folder as the working directory, or prepend its actual path to the file arguments. | Выполняйте эти команды, используя папку публичного дистрибутива как рабочий каталог, либо добавляйте её фактический путь перед файловыми аргументами. |
| In a source repository, limit the search to the selected public publications; campaign notes and historical drafts are not the public corpus. | В репозитории исходников ограничьте поиск выбранными публичными публикациями; заметки кампаний и исторические черновики не являются публичным корпусом. |
|  |  |
| Inspect the available Markdown files once to establish the search scope. | Один раз изучите доступные файлы Markdown, чтобы установить область поиска. |
| This lists filenames; it does not search their contents: | Это перечисляет имена файлов; оно не выполняет поиск по их содержимому: |
|  |  |
| For the illustrative question “obtain a needed engineering result: build or buy”, search the text across that scope: | Для иллюстративного вопроса «получить необходимый инженерный результат: создать или купить» выполняйте поиск по тексту в пределах этой области: |
|  |  |
| This query can return a pattern, a contents row and a connected Reference case. | Этот запрос может вернуть паттерн, строку оглавления и связанный случай из справочника. |
| Compare the question each passage answers, open its enclosing section and retain the useful result or return condition. | Сравните вопросы, на которые отвечает каждый фрагмент, откройте охватывающий его раздел и сохраните полезный результат или условие возврата. |
| If the output is too large, use the same query with `-l` instead of `-n -C 2` to list matching files, then inspect promising passages. | Если вывод слишком велик, используйте тот же запрос с `-l` вместо `-n -C 2`, чтобы перечислить соответствующие файлы, затем изучите многообещающие фрагменты. |
| Reformulate an unsuccessful query; a lexical match alone does not establish fit, and no match does not establish that the method is absent. | Переформулируйте неудачный запрос; одно лишь лексическое совпадение не устанавливает пригодность, а отсутствие совпадения не устанавливает отсутствие метода. |
|  |  |
| A browser or retrieval system can serve the same search when it covers the declared publications, including Reference answers. | Браузер или система поиска информации могут обеспечивать тот же поиск, когда он охватывает заявленные публикации, включая ответы справочников. |
| If it exposes only one file or titles, state that limit and extend access when the question requires it. | Если он предоставляет только один файл или заголовки, укажите это ограничение и расширьте доступ, когда вопрос этого требует. |
|  |  |
| Locate the file and the start and end lines of the selected pattern: | Найдите файл, а также начальную и конечную строки выбранного паттерна: |
|  |  |
| Read that pattern in full: | Прочитайте этот паттерн полностью: |
|  |  |
| Here `-U` enables multiline search; `(?m)` makes `^` and `$` match line starts and ends, and `(?s)` lets a dot match a newline. | Здесь `-U` включает многострочный поиск; `(?m)` заставляет `^` и `$` соответствовать началам и концам строк, а `(?s)` позволяет точке соответствовать переводу строки. |
| `(?ms)` combines them. | `(?ms)` объединяет их. |
| `.*?` matches through to the nearest specified `:End` heading; `\r?\n` accepts Windows and Unix line endings. | `.*?` соответствует тексту вплоть до ближайшего указанного заголовка `:End`; `\r?\n` допускает окончания строк Windows и Unix. |
| Substitute another ID and file as needed; escape literal dots in IDs as `\.`. | При необходимости подставьте другой идентификатор и файл; экранируйте буквальные точки в идентификаторах как `\.`. |
|  |  |
| For other searches, `-F` treats the query as literal text, `-i` ignores case, and `-C 2` includes neighbouring lines. | Для других поисков `-F` трактует запрос как буквальный текст, `-i` игнорирует регистр, а `-C 2` включает соседние строки. |
| `--no-ignore` searches files even in a Git-ignored folder; `-g '*.md'` selects Markdown files. | `--no-ignore` выполняет поиск файлов даже в папке, игнорируемой Git; `-g '*.md'` выбирает файлы Markdown. |
|  |  |
| If the tool truncates a long result, read the selected text in successive line ranges with the available file reader. | Если инструмент обрезает длинный результат, читайте выбранный текст последовательными диапазонами строк с помощью доступного средства чтения файлов. |
| Folder search already covers separate publications; no combined file is needed. | Поиск по папке уже охватывает отдельные публикации; объединённый файл не нужен. |

