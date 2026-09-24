Anthropic | [Claude Academy](https://academy.claude.com) | Course [AI capabilities and limitations](https://academy.claude.com/courses/ai-capabilities-and-limitations/)

[Оглавление](index.md) | [Глоссарий](glossary.md)
  
# Перевод расшифровки видео
## Урок 10. Steerability (Управляемость)
 ​ 
||| 
|---|---|
| **Summary** | **Резюме** |
| ​ ||
| The model follows your instructions the same way it does everything else: by continuing a pattern. | Модель следует вашим инструкциям так же, как делает всё остальное: продолжая шаблон. |
| That makes it remarkably steerable. | Это делает её удивительно управляемой. |
| It also means there's always a gap between what you intended and what landed, and most of the interesting failures live in that gap. | Это также означает, что всегда существует разрыв между тем, что вы намеревались передать, и тем, что фактически дошло до модели, и большинство интересных сбоев находится именно в этом разрыве. |
| ​ ||
| **Transcript** | **Расшифровка** |
| ​ ||
| Hi there, my name's Matt and I'm on the user research team at Anthropic. | Привет, меня зовут Мэтт, и я работаю в команде пользовательских исследований в Anthropic. |
| Today I'm here to talk to you about steerability in AI models. | Сегодня я здесь, чтобы поговорить с вами об управляемости моделей ИИ. |
| We'll look at why instructions work so well most of the time, why they sometimes land in a way that's technically correct but totally useless, and what you can do to keep the model pointed at what you actually want. | Мы рассмотрим, почему инструкции большую часть времени работают так хорошо, почему иногда они воспринимаются способом, который технически правильный, но совершенно бесполезный, и что вы можете сделать, чтобы модель оставалась направленной на то, чего вы на самом деле хотите. |
| If you've ever told an AI, "Be concise," and it dutifully trimmed the response but cut the one part you cared about, you've already encountered this topic. | Если вы когда-либо говорили ИИ: «Будь кратким», и он послушно сокращал ответ, но вырезал единственную часть, которая была вам важна, вы уже сталкивались с этой темой. |
| ​ ||
| Steerability is the model's ability to follow your directions. | Управляемость — это способность модели следовать вашим указаниям. |
| You say, "Respond with a table," and you get a table. | Вы говорите: «Ответь в виде таблицы», — и получаете таблицу. |
| You say, "Write this from a skeptic's point of view," and it shifts perspective. | Вы говорите: «Напиши это с точки зрения скептика», — и модель меняет перспективу. |
| Specify a role, a tone, a format, a word limit, a set of rules, and the model applies them, often on the first try. | Укажите роль, тон, формат, ограничение по количеству слов, набор правил — и модель применяет их, часто с первой попытки. |
| ​ ||
| This didn't happen automatically. | Это произошло не автоматически. |
| Out of the box, a pre-trained model is a document completer with no concept of helping. | В исходном виде предварительно обученная модель — это система дополнения документов без какого-либо представления о помощи. |
| Fine-tuning is a second round of training where the model learns from curated examples of good assistant behavior. | Дообучение — это второй этап обучения, на котором модель учится на отобранных примерах хорошего поведения помощника. |
| That's where it picks up the habit of treating your text as a request, breaking tasks into steps, and following the rules you set. | Именно там она приобретает привычку воспринимать ваш текст как запрос, разбивать задачи на этапы и следовать установленным вами правилам. |
| ​ ||
| But steerability isn't the same thing as understanding. | Но управляемость — это не то же самое, что понимание. |
| The model follows your instructions through the same pattern completion engine it uses for everything else. | Модель следует вашим инструкциям с помощью того же механизма продолжения шаблонов, который она использует для всего остального. |
| There's always some gap between the words you typed and the intent you had in mind, and many interesting AI limitations live in that gap. | Всегда существует некоторый разрыв между словами, которые вы ввели, и намерением, которое вы имели в виду, и многие интересные ограничения ИИ находятся именно в этом разрыве. |
| ​ ||
| Let me show you what that gap looks like. | Позвольте показать вам, как выглядит этот разрыв. |
| I'll ask Claude, "Summarize this report in under 100 words. | Я попрошу Claude: «Суммируй этот отчёт менее чем в 100 словах. |
| And make it punchy." | И сделай его энергичным». |
| So that's 100 words. | Итак, это 100 слов. |
| It's punchy. | Он энергичный. |
| The instruction was followed to the letter. | Инструкция была выполнена буквально. |
| But the one qualified finding I actually needed made the summary less punchy, so it got cut. | Но единственный вывод с оговорками, который мне действительно был нужен, делал резюме менее энергичным, поэтому его вырезали. |
| The model honored what I said and missed what I meant. | Модель выполнила то, что я сказал, и упустила то, что я имел в виду. |
| ​ ||
| It helps to picture your instructions on a spectrum. | Полезно представить ваши инструкции на спектре. |
| On one end, you've got directions that are short, concrete, and easy to check. | На одном конце находятся указания, которые коротки, конкретны и легко проверяются. |
| "Respond as a table." | «Ответь в виде таблицы». |
| "Under 100 words." | «Менее 100 слов». |
| "Use this exact schema." | «Используй именно эту схему». |
| These sit firmly in the capability zone. | Они прочно находятся в зоне возможностей. |
| The pattern is simple to match, and you can verify it at a glance. | Шаблон прост для воспроизведения, и вы можете проверить его с первого взгляда. |
| Slide toward the other end, and control starts to thin out. | Смещайтесь к другому концу — и контроль начинает ослабевать. |
| Long chains of reasoning where a small mistake in step two quietly carries through steps three, four, and five. | Длинные цепочки рассуждений, где небольшая ошибка на втором шаге незаметно переносится на третий, четвёртый и пятый шаги. |
| Abstract directions like, "Be insightful" where the model has to guess what you mean. | Абстрактные указания вроде «Будь проницательным», где модели приходится угадывать, что вы имеете в виду. |
| ​ ||
| So the question to ask yourself isn't, "Did I write a good prompt?" | Поэтому вопрос, который стоит задавать себе, — не «Хороший ли запрос я написал?» |
| It's more like, "How much room is there between what I typed and what I actually want?" | Скорее это вопрос: «Насколько велик разрыв между тем, что я ввёл, и тем, чего я на самом деле хочу?» |
| When you're in the capability zone, steerability gives you a lot. | Когда вы находитесь в зоне возможностей, управляемость даёт вам многое. |
| Tight control over format and style, the ability to set a persona and have the model hold it across a whole conversation, multi-step task execution where you lay out a process and it works through it, and iterative refinement where shorter, more formal, try the opposite angle, all land. | Точный контроль над форматом и стилем, возможность задать роль и заставить модель сохранять её на протяжении всего разговора, выполнение многоэтапных задач, где вы задаёте процесс, а модель проходит по нему, и итеративное уточнение, где указания «короче», «формальнее», «попробуй противоположный ракурс» — всё это срабатывает. |
| ​ ||
| Drift toward the edge and you'll see reasoning drift. | Сместитесь к границе — и вы увидите дрейф рассуждений. |
| Small errors compound over long chains and the model doesn't notice. | Небольшие ошибки накапливаются в длинных цепочках, и модель этого не замечает. |
| Letter over spirit. | Буква вместо духа. |
| Like we just saw, the instruction is honored literally but uselessly. | Как мы только что видели, инструкция выполняется буквально, но бесполезно. |
| Instructions as an attack surface. | Инструкции как поверхность атаки. |
| Because the model follows instructions embedded in text, a malicious instruction hidden inside a document or web page can be followed too. | Поскольку модель следует инструкциям, встроенным в текст, она может также выполнить вредоносную инструкцию, скрытую внутри документа или веб-страницы. |
| This is called prompt injection. | Это называется инъекцией промпта. |
| More of a security concern than a daily one, but worth knowing exists. | Это скорее проблема безопасности, чем повседневная проблема, но о её существовании стоит знать. |
| ​ ||
| A few product features are built specifically to narrow these gaps. | Некоторые продуктовые функции созданы специально для того, чтобы сокращать эти разрывы. |
| System prompts and custom instructions give you standing directions that don't dilute as the conversation gets longer. | Системные промпты и пользовательские инструкции дают вам постоянные указания, которые не размываются по мере удлинения разговора. |
| Visible reasoning lets you catch drift at step two rather than discovering it in the final answer. | Видимое рассуждение позволяет заметить дрейф на втором шаге, а не обнаружить его только в окончательном ответе. |
| And structured output modes, JSON schemas, function calling, narrow the room for letter over spirit wandering. | А режимы структурированного вывода, схемы JSON и вызов функций сокращают пространство для отклонений, при которых буква инструкции преобладает над её смыслом. |
| ​ ||
| State the goal alongside the steps. | Формулируйте цель вместе с шагами. |
| "I'm trying to persuade a skeptical audience," gives the model more to work with than a format spec alone. | «Я пытаюсь убедить скептически настроенную аудиторию» даёт модели больше материала для работы, чем одно лишь описание формата. |
| Break long chains with checkpoints. | Разбивайте длинные цепочки контрольными точками. |
| Ask for an intermediate result you can verify before the model keeps going. | Просите промежуточный результат, который вы можете проверить, прежде чем модель продолжит. |
| When an instruction lands literally but uselessly, restate the goal rather than the instruction. | Когда инструкция воспринимается буквально, но бесполезно, переформулируйте цель, а не саму инструкцию. |
| Repeating, "Be concise" louder doesn't fix a concision problem that was really an intent problem. | Более настойчивое повторение «Будь кратким» не исправляет проблему краткости, если на самом деле проблема была в намерении. |
| Keep concrete, verifiable instructions near the task. | Держите конкретные, проверяемые инструкции рядом с задачей. |
| Short and checkable beats long and ambiguous. | Короткое и проверяемое лучше длинного и неоднозначного. |
| ​ ||
| In the 4D Framework, steerability is both the thing Description exploits and the constraint it operates inside. | В рамочной модели 4D управляемость — это одновременно то, что использует Описание, и ограничение, внутри которого оно действует. |
| Good Description narrows the gap between your words and your intent, and it shapes Delegation too. | Хорошее Описание сокращает разрыв между вашими словами и вашим намерением и также формирует Делегирование. |
| Tasks that need long reasoning chains or native numeric precision need either tighter human checkpoints or a different tool entirely. | Задачи, которым нужны длинные цепочки рассуждений или встроенная числовая точность, требуют либо более строгих человеческих контрольных точек, либо совершенно другого инструмента. |
| ​ ||
| The model will follow you. | Модель будет следовать за вами. |
| Your job is to make sure 'following you' and 'doing what you actually need' point in the same direction. | Ваша задача — убедиться, что «следовать за вами» и «делать то, что вам действительно нужно» указывают в одном направлении. |
| | |

 ​ 

[Оглавление](index.md) | [Глоссарий](glossary.md)

Перевод и глоссарий — ChatGPT 5.6 Sol.

​

Anthropic | [Claude Academy](https://academy.claude.com) | Course [AI capabilities and limitations](https://academy.claude.com/courses/ai-capabilities-and-limitations/)

2026