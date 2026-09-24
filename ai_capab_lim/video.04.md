Anthropic | [Claude Academy](https://academy.claude.com) | Course [AI capabilities and limitations](https://academy.claude.com/courses/ai-capabilities-and-limitations/)

[Оглавление](index.md) | [Глоссарий](glossary.md)
  
# Перевод расшифровки видео
## Урок 4. Next Token Prediction (Предсказание следующего токена)
 ​ 
||| 
|---|---|
| **Summary** | **Резюме** |
| ​ ||
| Generative AI is closer to a vastly sophisticated autocomplete than to a search engine. | Генеративный ИИ ближе к чрезвычайно сложному автодополнению, чем к поисковой системе. |
| It writes answers word by word based on what tends to follow what. | Он пишет ответы слово за словом, основываясь на том, что обычно следует за чем. |
| That single property gives you both the fluency and the hallucination. | Это единственное свойство даёт вам и беглость, и галлюцинации. |
| ​ ||
| **Transcript** | **Расшифровка** |
| ​ ||
| Hi, my name is David and I'm on the safety team here at Anthropic. | Привет, меня зовут Дэвид, и я работаю в команде безопасности здесь, в Anthropic. |
| Today I'm here to talk to you about next token prediction, which is a core property that determines where AI answers actually come from. | Сегодня я здесь, чтобы поговорить с вами о предсказании следующего токена — ключевом свойстве, которое определяет, откуда на самом деле берутся ответы ИИ. |
| We'll look at what's really happening when AI responds to you and why the same mechanism that produces fluent writing can also produce fabricated facts, and how to tell which zone your task lands in. | Мы рассмотрим, что на самом деле происходит, когда ИИ отвечает вам, почему тот же механизм, который создаёт беглый текст, может также создавать вымышленные факты, и как определить, в какую зону попадает ваша задача. |
| ​ ||
| If you understand one thing about how generative AI works, let it be this: The operation at the heart of these systems is prediction. | Если вы поймёте одну вещь о том, как работает генеративный ИИ, пусть это будет следующее: операция, лежащая в основе этих систем, — это предсказание. |
| Given everything that's been written so far, predict what comes next, one fragment at a time. | Учитывая всё, что было написано до этого момента, предсказывать, что будет дальше, по одному фрагменту за раз. |
| Generative AI is generating an answer, composing it word by word based on what tends to follow what. | Генеративный ИИ генерирует ответ, составляя его слово за словом на основе того, что обычно следует за чем. |
| It's closer to an extraordinarily sophisticated autocomplete than to a search engine. | Он ближе к необычайно сложному автодополнению, чем к поисковой системе. |
| And that distinction matters, because a citation that looks like a real citation can satisfy a pattern just as well as one pointing to a paper that actually exists. | И это различие важно, потому что ссылка, которая выглядит как настоящая, может столь же хорошо соответствовать шаблону, как и ссылка на реально существующую статью. |
| ​ ||
| Let me show you this in action. | Позвольте показать вам это в действии. |
| I'll ask Claude to summarize an argument in a well-known essay. | Я попрошу Claude кратко изложить аргумент из хорошо известного эссе. |
| Notice how quickly it produces clean, coherent prose. | Обратите внимание, как быстро он создаёт чистый, связный текст. |
| This is a well-worn path. | Это хорошо проторенный путь. |
| The model has encountered this task thousands of times. | Модель сталкивалась с этой задачей тысячи раз. |
| ​ ||
| Now watch what happens when I ask for something at the edge. | Теперь посмотрите, что происходит, когда я прошу о чём-то на границе. |
| Let's say I ask it to list three research papers by a mid-level researcher in a niche subfield with publication years. | Допустим, я прошу её перечислить три исследовательские статьи исследователя среднего уровня в узкой подобласти с указанием годов публикации. |
| Same confident tone, same fluent prose, but the path is thin here, and the model's generating what looks like a good answer. | Тот же уверенный тон, тот же беглый текст, но здесь путь тонкий, и модель генерирует то, что выглядит как хороший ответ. |
| Some of these may be real, some may be fabrications. | Некоторые из них могут быть реальными, а некоторые — вымышленными. |
| You have to check the output. | Вы должны проверить результат. |
| ​ ||
| The same generative process is always running when you're working with AI. | Когда вы работаете с ИИ, всегда выполняется один и тот же генеративный процесс. |
| What changes is how well-worn the path is. | Меняется то, насколько проторен этот путь. |
| Tasks the model has seen in countless variations land in the capability zone. | Задачи, которые модель видела в бесчисленных вариациях, попадают в зону возможностей. |
| Summarizing, reformatting, explaining common concepts, drafting in a familiar style. | Суммирование, переформатирование, объяснение распространённых концепций, составление текста в знакомом стиле. |
| Next token prediction shines here because the patterns are dense and consistent. | Предсказание следующего токена здесь проявляет себя особенно хорошо, потому что шаблоны плотные и последовательные. |
| As you move towards the edge, the patterns thin out. | По мере приближения к границе шаблоны становятся более редкими. |
| Novel territory, obscure topics, those drift right. | Новая территория, малоизвестные темы — всё это смещается вправо. |
| The model keeps generating fluently, but the ground underneath gets shakier. | Модель продолжает генерировать бегло, но основание под ней становится менее надёжным. |
| ​ ||
| The strength and weakness are the same property. | Сила и слабость — это одно и то же свойство. |
| Broadly relevant concept fluency comes from next token prediction. | Беглое владение широко применимыми концепциями происходит из предсказания следующего токена. |
| The hallucination also comes from next token prediction. | Галлюцинации также происходят из предсказания следующего токена. |
| You experience one or the other depending on where your tasks fall in that line. | Вы сталкиваетесь либо с одним, либо с другим в зависимости от того, где на этой линии оказываются ваши задачи. |
| On the strength side, we see fluent text in any register, rapid synthesis across fields, strong performance on anything resembling what the model has seen before, and coherent continuation of any thread you hand it. | На стороне сильных сторон мы видим беглый текст в любом регистре, быстрое обобщение между областями, высокую результативность во всём, что похоже на то, что модель видела раньше, и связное продолжение любой нити, которую вы ей передаёте. |
| On the failure side, we see hallucinations, inconsistency, and misplaced confidence. | На стороне сбоев мы видим галлюцинации, непоследовательность и неуместную уверенность. |
| ​ ||
| Frontier labs have built product features to help here. | Передовые лаборатории создали продуктовые функции, чтобы помочь в этом. |
| Citations and source grounding let you trace what's backed, versus what's generated. | Цитаты и привязка к источникам позволяют вам проследить, что подтверждено, а что сгенерировано. |
| Trained uncertainty signaling, like when the model says, "I'm not sure about this," helps the model flag its own shakiness. | Обученное сигнализирование о неопределённости, например когда модель говорит: «Я не уверена в этом», помогает модели отмечать собственную ненадёжность. |
| Constrained generation and skills narrow the space where fabrication can sneak in. | Ограниченная генерация и навыки сужают пространство, в котором могут проскользнуть выдумки. |
| A generator verifier agent loop ensures output meets checks from an outside source. | Цикл агентов «генератор — проверяющий» обеспечивает соответствие результата проверкам по внешнему источнику. |
| These features exist precisely because the underlying behavior is always generative next token prediction. | Эти функции существуют именно потому, что лежащее в основе поведение всегда представляет собой генеративное предсказание следующего токена. |
| ​ ||
| When working with AI outputs, keep these in mind. | При работе с результатами ИИ держите в уме следующее. |
| A confident tone does not signal accuracy. | Уверенный тон не свидетельствует о точности. |
| Smoothness and correctness are independent variables. | Плавность и корректность — независимые переменные. |
| Specificity is where fabrication concentrates. | Именно в конкретике концентрируются выдумки. |
| Names, dates, statistics, citations, quotes, URLs. | Имена, даты, статистика, ссылки, цитаты, URL-адреса. |
| The more precise a claim, the more it warrants a check. | Чем точнее утверждение, тем больше оно требует проверки. |
| Treat outputs as drafts to verify, particularly when stakes are high or the domain's unfamiliar to you. | Относитесь к результатам как к черновикам, которые нужно проверять, особенно когда ставки высоки или область вам незнакома. |
| ​ ||
| Ask where on the continuum your task sits. | Спросите себя, где на континууме находится ваша задача. |
| Well-worn paths are safer handoffs. | Хорошо проторенные пути безопаснее для делегирования. |
| Thin paths need more scrutiny. | Тонкие пути требуют более тщательной проверки. |
| Lean on product surfaces. | Используйте возможности продукта. |
| If your tool offers citations or source grounding, use them. | Если ваш инструмент предлагает цитаты или привязку к источникам, используйте их. |
| The model can't reliably tell grounded from invented. | Модель не может надёжно отличать подтверждённое от выдуманного. |
| You have to do that part. | Эту часть должны делать вы. |
| ​ ||
| Understanding next token prediction sits at the heart of Discernment in the 4D Framework. | Понимание предсказания следующего токена лежит в основе Различения в рамочной модели 4D. |
| You can't evaluate an output well without understanding that it was generated or composed to fit a shape. | Вы не сможете хорошо оценить результат, не понимая, что он был сгенерирован или составлен так, чтобы соответствовать определённой форме. |
| It also informs Delegation. | Это также влияет на Делегирование. |
| Tasks deep in the capability zone are safer handoffs. | Задачи глубоко в зоне возможностей безопаснее для делегирования. |
| Tasks near the edge deserve more of your attention on the back end. | Задачи вблизи границы требуют больше вашего внимания на этапе последующей проверки. |
| With this knowledge at hand, AI becomes predictable rather than surprising. | Имея это знание, ИИ становится скорее предсказуемым, чем неожиданным. |
| | |

 ​ 

[Оглавление](index.md) | [Глоссарий](glossary.md)

Перевод и глоссарий — ChatGPT 5.6 Sol.

​

Anthropic | [Claude Academy](https://academy.claude.com) | Course [AI capabilities and limitations](https://academy.claude.com/courses/ai-capabilities-and-limitations/)

2026