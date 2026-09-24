Anthropic | [Claude Academy](https://academy.claude.com) | Course [AI capabilities and limitations](https://academy.claude.com/courses/ai-capabilities-and-limitations/)

[Оглавление](index.md) | [Глоссарий](glossary.md)
  
# Перевод расшифровки видео
## Урок 12. When Properties Collide (Когда свойства сталкиваются)
 ​ 
| ​ | ​ |
|---|---|
| **Summary** | **Резюме** |
| ​ | ​ |
| The four properties don't operate in isolation. | Четыре свойства не действуют изолированно. |
| Most real failures are two of them intersecting. | Большинство реальных сбоев — это пересечение двух из них. |
| Once you can name which two, you know which fix to reach for. | Как только вы можете назвать, какие именно два свойства пересекаются, вы понимаете, к какому исправлению обратиться. |
| ​ | ​ |
| **Transcript** | **Расшифровка** |
| ​ | ​ |
| Over the last few lessons, we've covered four properties that shape how AI systems behave. | За последние несколько уроков мы рассмотрели четыре свойства, которые формируют поведение систем ИИ. |
| Next token prediction, knowledge, working memory, and steerability. | Предсказание следующего токена, знания, рабочая память и управляемость. |
| Now you have four lenses, but they don't exist in isolation. | Теперь у вас есть четыре линзы, но они не существуют изолированно. |
| They're interconnected. | Они взаимосвязаны. |
| Most real-world AI surprises aren't single-property failures. | Большинство неожиданных ситуаций с ИИ в реальном мире — это не сбои одного свойства. |
| They're two properties meeting at the same time. | Это одновременное столкновение двух свойств. |
| And when you can name which two, the fix becomes obvious. | И когда вы можете назвать эти два свойства, исправление становится очевидным. |
| ​ | ​ |
| You asked Claude about a niche topic, and it gave you a paper title, author names, sounds great. | Вы спросили Claude об узкой теме, и он дал вам название статьи, имена авторов — звучит отлично. |
| Then you go to look it up, and it doesn't exist. | Затем вы идёте искать её и обнаруживаете, что её не существует. |
| This is next token prediction meeting knowledge. | Это предсказание следующего токена, сталкивающееся со знаниями. |
| Next token prediction is doing what it always does, generating what a plausible answer looks like. | Предсказание следующего токена делает то, что делает всегда: генерирует то, как выглядит правдоподобный ответ. |
| A good citation has a title in the right cadence, a journal that sounds real, names that fit the field. | Хорошая ссылка имеет название с подходящим ритмом, журнал, который звучит правдоподобно, и имена, соответствующие области. |
| Meanwhile, there's a knowledge gap underneath, and the model doesn't know the gap is there. | Тем временем в основе есть пробел в знаниях, и модель не знает, что этот пробел существует. |
| It can't tell the difference between what it knows and what it's generating. | Она не может отличить то, что знает, от того, что генерирует. |
| ​ | ​ |
| When you observe this, verify specifics independently. | Когда вы наблюдаете такое, проверяйте конкретные сведения независимо. |
| Or better, use a tool with source grounding so the model is retrieving real documents rather than generating citation-shaped text. | Или, что лучше, используйте инструмент с привязкой к источникам, чтобы модель извлекала реальные документы, а не генерировала текст, похожий на ссылку. |
| ​ | ​ |
| You set up careful constraints at the start of a long conversation. | Вы задаёте тщательно сформулированные ограничения в начале длинного разговора. |
| 20 messages later, Claude is ignoring half of them. | Через 20 сообщений Claude игнорирует половину из них. |
| This is working memory meeting steerability. | Это рабочая память, сталкивающаяся с управляемостью. |
| Your early context has faded, either pushed out of the window or just receiving less attention than what you said recently. | Ваш ранний контекст ослаб, либо был вытеснен из окна, либо просто получает меньше внимания, чем то, что вы сказали недавно. |
| And because steerability works by following whatever instructions are most salient right now, your later messages are quietly overwriting the earlier ones. | И поскольку управляемость работает за счёт следования тем инструкциям, которые наиболее заметны прямо сейчас, ваши более поздние сообщения незаметно переписывают более ранние. |
| Resupply critical context. | Повторно предоставьте критически важный контекст. |
| Or if the conversation has gotten unwieldy, start a fresh one and put the essentials up front. | Или, если разговор стал громоздким, начните новый и поместите самое важное в начало. |
| ​ | ​ |
| Even before starting your conversation with AI, ask, "Which properties am I looking at with the task I'm trying to accomplish?" | Ещё до начала разговора с ИИ спросите себя: «С какими свойствами я имею дело в задаче, которую пытаюсь выполнить?» |
| That question comes first because the diagnosis determines the fix. | Этот вопрос идёт первым, потому что диагноз определяет исправление. |
| A knowledge problem and a working memory problem can produce outputs that look similar on the surface, but they need completely different responses. | Проблема знаний и проблема рабочей памяти могут давать результаты, которые внешне выглядят похоже, но требуют совершенно разных действий. |
| If you jump straight to, "How do I fix my prompt?" you're guessing. | Если вы сразу переходите к вопросу «Как мне исправить мой промпт?», вы просто гадаете. |
| If you name the properties first, you're operating strategically. | Если вы сначала называете свойства, вы действуете стратегически. |
| ​ | ​ |
| This diagnostic step is Discernment in action. | Этот диагностический шаг — Различение в действии. |
| Naming the property level failure is exactly what turns vague dissatisfaction into a targeted iteration. | Именно называние сбоя на уровне свойства превращает расплывчатое недовольство в целенаправленную итерацию. |
| You move from, "That wasn't quite right," to, "I need to reground this in a source," or "I need to invite pushback." | Вы переходите от «Это было не совсем правильно» к «Мне нужно снова привязать это к источнику» или «Мне нужно предложить возразить мне». |
| ​ | ​ |
| And it feeds back into Delegation. | И это, в свою очередь, влияет на Делегирование. |
| If you keep seeing the same compound failure on the same kind of task, that's signal. | Если вы снова и снова видите один и тот же составной сбой в одном и том же типе задач, это сигнал. |
| It tells you which task types to restructure, which to break into smaller pieces, which to keep for yourself. | Он показывает вам, какие типы задач нужно переструктурировать, какие разбить на более мелкие части, а какие оставить себе. |
| The patterns you diagnose today shape how you delegate tomorrow. | Закономерности, которые вы диагностируете сегодня, формируют то, как вы будете делегировать завтра. |
| ​ | ​ |

 ​ 

[Оглавление](index.md) | [Глоссарий](glossary.md)

Перевод и глоссарий — ChatGPT 5.6 Sol.

​

Anthropic | [Claude Academy](https://academy.claude.com) | Course [AI capabilities and limitations](https://academy.claude.com/courses/ai-capabilities-and-limitations/)

2026
