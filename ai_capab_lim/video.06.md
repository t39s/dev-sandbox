---
layout: course
---

Anthropic \| [Claude Academy](https://academy.claude.com) \| Course [AI capabilities and limitations](https://academy.claude.com/courses/ai-capabilities-and-limitations/)

[Оглавление](index.md) \| [Глоссарий](glossary.md)
  
# Перевод расшифровки видео
## Урок 6. Knowledge (Знания)
 ​ 

| ​ | ​ |
|---|---|
| **Summary** | **Резюме** |
| ​ | ​ |
| The model knows what it was exposed to during training, and only that. | Модель знает то, с чем она была ознакомлена во время обучения, и только это. |
| No real-time browsing by default, no lived experience, and a hard stop at the knowledge cutoff. | По умолчанию нет просмотра информации в реальном времени, нет личного опыта и есть жёсткая граница знаний. |
| The practical question isn't "does the AI know this?" but "how well-represented was this in what it read?" | Практический вопрос не в том, «знает ли ИИ это?», а в том, «насколько хорошо это было представлено в том, что он прочитал?» |
| ​ | ​ |
| **Transcript** | **Расшифровка** |
| ​ | ​ |
| Hi, my name is David and I'm on the safety team here at Anthropic. | Привет, меня зовут Дэвид, и я работаю в команде безопасности здесь, в Anthropic. |
| Today I'm going to talk to you about what AI models actually know, and just as importantly, what they don't. | Сегодня я собираюсь поговорить с вами о том, что модели ИИ на самом деле знают, и, что не менее важно, о том, чего они не знают. |
| We'll explore where AI's knowledge comes from, why it has sharp edges, and how you can predict which topics are going to be reliable for you, and which ones aren't. | Мы рассмотрим, откуда берутся знания ИИ, почему у них есть чёткие границы и как вы можете предсказать, какие темы будут для вас надёжными, а какие — нет. |
| ​ | ​ |
| A model like Claude has been exposed to more data than any human could digest in many lifetimes. | Модель вроде Claude была ознакомлена с большим объёмом данных, чем любой человек смог бы усвоить за множество жизней. |
| That makes it feel like it knows everything, but it doesn't. | Из-за этого кажется, что она знает всё, но это не так. |
| Generative AI models have predictable knowledge gaps. | У моделей генеративного ИИ есть предсказуемые пробелы в знаниях. |
| ​ | ​ |
| AI models learn by reading enormous quantities of text, mostly drawn from the internet, public data sets, and other written sources. | Модели ИИ обучаются, читая огромные объёмы текста, в основном взятого из интернета, общедоступных наборов данных и других письменных источников. |
| Through billions of rounds of, 'Given everything so far, what comes next?' the model builds internal representations of concepts, relationships, and facts. | Через миллиарды повторений вопроса «Учитывая всё, что было до сих пор, что идёт дальше?» модель строит внутренние представления понятий, связей и фактов. |
| That's how it knows things. | Именно так она узнаёт вещи. |
| It's also the only way it knows things. | И это также единственный способ, которым она что-либо знает. |
| ​ | ​ |
| The model doesn't have experiences. | У модели нет собственного опыта. |
| It doesn't browse the web in real time unless a product explicitly gives it a search tool. | Она не просматривает интернет в реальном времени, если только продукт явно не предоставляет ей инструмент поиска. |
| And critically, training ends on a specific date. | И, что критически важно, обучение заканчивается в определённую дату. |
| That date's called the 'knowledge cutoff.' | Эта дата называется «границей знаний». |
| Everything that happened after that moment simply isn't there. | Всего, что произошло после этого момента, там просто нет. |
| ​ | ​ |
| Let me show you why that matters in practice. | Позвольте показать вам, почему это важно на практике. |
| I'm going to ask Claude two questions. | Я задам Claude два вопроса. |
| First, "Explain how photosynthesis works." | Первый: «Объясни, как работает фотосинтез». |
| Watch the response. | Посмотрите на ответ. |
| Detailed, accurate, confident. | Подробный, точный, уверенный. |
| This is a topic that has appeared thousands of times in the training data, described consistently, and hasn't changed. | Это тема, которая тысячи раз встречалась в обучающих данных, описывалась последовательно и не изменилась. |
| ​ | ​ |
| Now a second question. | Теперь второй вопрос. |
| "Who's the current mayor of Toledo?" | «Кто сейчас мэр Толидо?» |
| The model might give me a name. | Модель может назвать мне имя. |
| It might be right. | Она может оказаться права. |
| It might be the person who held that job two years ago. | Это может быть человек, который занимал эту должность два года назад. |
| The model has no way to know the difference. | У модели нет способа узнать разницу. |
| ​ | ​ |
| Think of the model's knowledge as a continuum. | Представьте знания модели как континуум. |
| On one end, the capability zone: mainstream science, popular programming languages, well-documented history, topics that showed up frequently, consistently, and before the cutoff. | На одном конце — зона возможностей: основная наука, популярные языки программирования, хорошо документированная история, темы, которые встречались часто, последовательно и до границы знаний. |
| Here, the model is extraordinarily deep. | Здесь знания модели чрезвычайно глубоки. |
| On the other end: rare topics, post-cutoff events, niche domains, local knowledge. | На другом конце — редкие темы, события после границы знаний, узкие области, локальные знания. |
| The further you drift towards this edge, the less you should trust the answer. | Чем дальше вы смещаетесь к этой границе, тем меньше вам следует доверять ответу. |
| The question to ask isn't, "Does the AI know this?" | Следует задавать не вопрос: «Знает ли ИИ это?» |
| It's, "How well-represented was this in what it read?" | А вопрос: «Насколько хорошо это было представлено в том, что он прочитал?» |
| ​ | ​ |
| This training process produces some genuine strengths. | Этот процесс обучения создаёт некоторые реальные сильные стороны. |
| The model's general knowledge is extraordinarily broad. | Общие знания модели чрезвычайно широки. |
| It's deeply competent in the domains that are well represented in the training data. | Она обладает глубокой компетентностью в областях, хорошо представленных в обучающих данных. |
| And it makes connections across fields because concepts that appear together in text end up near each other in the model's internal representation. | И она устанавливает связи между областями, потому что понятия, которые встречаются вместе в тексте, оказываются рядом друг с другом во внутреннем представлении модели. |
| That's what embeddings are, words and ideas mapped as points in a vast mathematical space where similar meanings cluster. | Именно это и представляют собой эмбеддинги: слова и идеи, отображённые как точки в огромном математическом пространстве, где сходные значения группируются вместе. |
| Ask about a biology concept and the model can pull in relevant chemistry and history and economics without being told to. | Спросите о биологическом понятии, и модель может привлечь релевантные сведения из химии, истории и экономики без отдельного указания. |
| ​ | ​ |
| But the same process creates characteristic limitations. | Но тот же процесс создаёт характерные ограничения. |
| Knowledge cut off. | Граница знаний. |
| Anything after the training simply doesn't exist for the model. | Всё, что произошло после обучения, для модели просто не существует. |
| Staleness. | Устаревание. |
| Information that was true at the time of training may have changed. | Информация, которая была верной во время обучения, могла измениться. |
| The model has no mechanism to know this. | У модели нет механизма, позволяющего узнать об этом. |
| Uneven coverage. | Неравномерное покрытие. |
| Frequent topics are handled well. | Часто встречающиеся темы обрабатываются хорошо. |
| Rare topics are handled poorly. | Редкие темы обрабатываются плохо. |
| Minority languages, niche domains, recent developments all suffer. | Языки меньшинств, узкие области и недавние события — всё это страдает. |
| ​ | ​ |
| Inherited bias. | Унаследованная предвзятость. |
| The model's sense of what's normal or default reflects its training data's blind spots. | Представление модели о том, что является нормальным или стандартным, отражает слепые зоны её обучающих данных. |
| That shows up in assumptions about what a doctor looks like, what a family looks like, or what counts as a professional. | Это проявляется в предположениях о том, как выглядит врач, как выглядит семья или что считается профессиональным. |
| Source amnesia. | Амнезия источника. |
| The model usually can't tell you where a piece of knowledge came from. | Модель обычно не может сказать вам, откуда взялся конкретный фрагмент знания. |
| I read this somewhere isn't a citation. | «Я где-то это прочитал» — не ссылка на источник. |
| ​ | ​ |
| This is why modern AI products ship with features designed to work around these limits. | Именно поэтому современные продукты ИИ выпускаются с функциями, предназначенными для обхода этих ограничений. |
| Web search pulls current information at response time, routing around the cutoff. | Веб-поиск получает актуальную информацию во время формирования ответа, обходя границу знаний. |
| MCPs connect the model to documents it never trained on, like your company's wiki or a specialized database. | MCP подключают модель к документам, на которых она никогда не обучалась, например к внутренней wiki вашей компании или специализированной базе данных. |
| Tools let the model call real-time calculators or databases instead of relying on absorbed patterns. | Инструменты позволяют модели обращаться к калькуляторам или базам данных в реальном времени вместо того, чтобы полагаться на усвоенные шаблоны. |
| Explicit cutoff disclosure just tells you when the training ended, so you can know to double-check. | Явное указание границы знаний просто сообщает вам, когда закончилось обучение, чтобы вы знали, когда нужно перепроверить. |
| If you're using these features, you're extending the model's knowledge at runtime. | Если вы используете эти функции, вы расширяете знания модели во время выполнения. |
| If you're not, you're relying entirely on what it absorbed during training. | Если нет, вы полностью полагаетесь на то, что она усвоила во время обучения. |
| ​ | ​ |
| Knowledge gaps are most likely to show up when the topic is time sensitive: current events, recent research, who holds a position, what something costs. | Пробелы в знаниях наиболее вероятно проявятся, когда тема чувствительна ко времени: текущие события, недавние исследования, кто занимает должность, сколько что-либо стоит. |
| The domain is niche, local, or in a less-represented language. | Область является узкой, локальной или представлена на менее распространённом языке. |
| The question postdates the cutoff. | Вопрос относится к периоду после границы знаний. |
| You're relying on the model's sense of typical or normal, or web search is turned off. | Вы полагаетесь на представление модели о типичном или нормальном либо веб-поиск отключён. |
| ​ | ​ |
| Here's how to protect yourself. | Вот как защитить себя. |
| Verify anything time-sensitive. | Проверяйте всё, что чувствительно ко времени. |
| Assume the model may be out of date. | Предполагайте, что информация модели может быть устаревшей. |
| Test before you trust in a new domain. | Проверяйте, прежде чем доверять модели в новой области. |
| Brilliance in one area doesn't transfer to the one next door. | Блестящие результаты в одной области не переносятся автоматически на соседнюю. |
| Watch for default assumptions that reflect training data rather than reality. | Следите за стандартными предположениями, которые отражают обучающие данные, а не реальность. |
| When the tools exist, search, retrieval, use them. | Когда доступны инструменты поиска и извлечения информации, используйте их. |
| They're there specifically to patch these gaps. | Они существуют специально для того, чтобы закрывать эти пробелы. |
| ​ | ​ |
| Understanding the knowledge property directly shapes two of the four AI Fluency competencies. | Понимание свойства знаний напрямую формирует две из четырёх компетенций свободного владения ИИ. |
| Delegation — before you hand a task to the model, ask yourself, is this a domain the model knows well, or one where you need to bring the knowledge yourself through context, documents, or search? | Делегирование — прежде чем передать задачу модели, спросите себя: это область, которую модель хорошо знает, или область, где вам нужно самостоятельно предоставить знания через контекст, документы или поиск? |
| Discernment — when you get an answer back, you now know which of these claims need independent verification. | Различение — когда вы получаете ответ, вы теперь знаете, какие из этих утверждений требуют независимой проверки. |
| Anything in the model's weak zone, recent, rare, or local, warrants a second look. | Всё, что находится в слабой зоне модели — недавнее, редкое или локальное, — заслуживает повторной проверки. |
| ​ | ​ |
| The model's knowledge is broad, deep, frozen, and imperfect all at once. | Знания модели одновременно широки, глубоки, зафиксированы и несовершенны. |
| Once you can see where the edges are, you stop being surprised by them. | Как только вы начинаете видеть, где находятся границы, они перестают вас удивлять. |
| ​ | ​ |

 ​ 

[Оглавление](index.md) \| [Глоссарий](glossary.md)

Перевод и глоссарий — ChatGPT 5.6 Sol.

​

Anthropic \| [Claude Academy](https://academy.claude.com) \| Course [AI capabilities and limitations](https://academy.claude.com/courses/ai-capabilities-and-limitations/)

2026