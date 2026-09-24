Anthropic | [Claude Academy](https://academy.claude.com) | Course [AI capabilities and limitations](https://academy.claude.com/courses/ai-capabilities-and-limitations/)

[Оглавление](index.md) | [Глоссарий](glossary.md)
  
# Перевод расшифровки видео
## Урок 2. What We Mean by AI (Что мы подразумеваем под ИИ)
 ​ 
||| 
|---|---|
| **Summary** | **Резюме** |
| ​ ||
| Most AI in the world (spam filters, recommendations, fraud detection) isn't generative. | Большая часть ИИ в мире (спам-фильтры, рекомендации, обнаружение мошенничества) не является генеративной. |
| This course is about the kind that is: transformer-based text models that produce new content one token at a time. | Этот курс посвящён тому виду ИИ, который является генеративным: текстовым моделям на основе трансформеров, которые создают новый контент по одному токену за раз. |
| ​ ||
| **Transcript** | **Расшифровка** |
| ​ ||
| Before we go anywhere, let's be clear about what we mean by AI, because it's actually a broad term that means many different things. | Прежде чем мы двинемся дальше, давайте проясним, что мы имеем в виду под ИИ, потому что на самом деле это широкий термин, который означает много разных вещей. |
| The recommendation engine picking your next video, the spam filter in your inbox, the fraud model flagging a suspicious charge on your card, the system routing your customer service call, all of that is AI. | Система рекомендаций, выбирающая ваше следующее видео, спам-фильтр в вашей почте, модель обнаружения мошенничества, отмечающая подозрительное списание с вашей карты, система, направляющая ваш звонок в службу поддержки клиентов, — всё это ИИ. |
| None of it, however, is generative. | Однако ничто из этого не является генеративным. |
| These systems sort, rank, classify, and predict. | Эти системы сортируют, ранжируют, классифицируют и предсказывают. |
| They're enormously useful, and they're running in the background of your life constantly. | Они чрезвычайно полезны и постоянно работают в фоновом режиме вашей жизни. |
| They're also not what this series is about. | И это также не то, чему посвящена эта серия. |
| ​ ||
| What's changed recently is the rise of generative AI. | То, что изменилось в последнее время, — это подъём генеративного ИИ. |
| These are systems that produce new content rather than categorizing existing content: text, images, code, audio, video. | Это системы, которые создают новый контент, а не категоризируют существующий: текст, изображения, код, аудио, видео. |
| Generative AI is created through two stages. | Генеративный ИИ создаётся в два этапа. |
| First, it's trained on massive amounts of data to learn patterns, that's pre-training. | Сначала его обучают на огромных объёмах данных, чтобы он изучил закономерности, — это предварительное обучение. |
| Then it's refined to be broadly safe, ethical, and helpful. | Затем его дорабатывают, чтобы он в целом был безопасным, этичным и полезным. |
| That's fine tuning. | Это дообучение. |
| You'll learn more about these in the next lesson. | Вы узнаете больше об этих этапах в следующем уроке. |
| ​ ||
| Generative AI at its core is a prediction system. | В своей основе генеративный ИИ — это система предсказания. |
| AI isn't uniformly capable or uniformly unreliable. | ИИ не является одинаково способным или одинаково ненадёжным во всём. |
| It's strong and weak along specific, predictable axes. | Он силён и слаб вдоль определённых, предсказуемых осей. |
| And most of the time, the strength and weakness come from the same underlying property of the machine. | И в большинстве случаев сила и слабость происходят из одного и того же лежащего в основе свойства машины. |
| An AI can write compellingly because it's a prediction engine. | ИИ может писать убедительно, потому что он является механизмом предсказания. |
| It also hallucinates because it's a prediction engine. | Он также галлюцинирует, потому что является механизмом предсказания. |
| On one end, a capability zone. | На одном конце — зона возможностей. |
| On the other, a limitation zone. | На другом — зона ограничений. |
| The mechanism itself is always operating the same way. | Сам механизм всегда работает одним и тем же образом. |
| What varies is where your specific task lands on that line. | Меняется то, где именно на этой линии оказывается ваша конкретная задача. |
| The skill you're building in this series is learning to feel out where those edges are. | Навык, который вы развиваете в этой серии, — это умение чувствовать, где находятся эти границы. |
| ​ ||
| Let's do a quick overview of the four properties of generative AI you'll learn in this course. | Давайте сделаем краткий обзор четырёх свойств генеративного ИИ, которые вы изучите в этом курсе. |
| "Next token prediction." | «Предсказание следующего токена». |
| Where do the answers actually come from? | Откуда на самом деле берутся ответы? |
| Unless you've enabled or directed it to use an external source, the model isn't looking things up. | Если вы не включили использование внешнего источника или не указали модели использовать его, модель ничего не ищет. |
| It's writing what comes next based on the content it's been trained on, one fragment at a time. | Она пишет то, что идёт дальше, основываясь на контенте, на котором была обучена, по одному фрагменту за раз. |
| ​ ||
| "Knowledge." | «Знания». |
| What does the model actually know? | Что модель на самом деле знает? |
| Its knowledge is broad but uneven, frozen at a training cutoff, and shaped by whatever was in the data it learned from. | Её знания широки, но неравномерны, зафиксированы на границе обучения и сформированы тем, что содержалось в данных, на которых она обучалась. |
| ​ ||
| "Working memory." | «Рабочая память». |
| What is the model paying attention to right now? | На что модель обращает внимание прямо сейчас? |
| Just like humans, models don't have unlimited memories. | Как и у людей, у моделей нет неограниченной памяти. |
| What's in the context window is what's available to the AI. | То, что находится в контекстном окне, — это то, что доступно ИИ. |
| ​ ||
| "Steerability." | «Управляемость». |
| How much are you in control? | Насколько вы контролируете происходящее? |
| These systems are remarkably directable. | Эти системы удивительно хорошо поддаются направлению. |
| But there can be a gap between what you intended and what actually landed. | Но между тем, что вы намеревались передать, и тем, что фактически дошло до модели, может быть разрыв. |
| ​ ||
| We'll deep dive into each of these properties and how knowing about them can empower you to make good decisions when using AI. | Мы подробно рассмотрим каждое из этих свойств и то, как знание о них может дать вам возможность принимать хорошие решения при использовании ИИ. |
| The goal here isn't to make you distrust AI. | Цель здесь не в том, чтобы заставить вас не доверять ИИ. |
| It's also not to make you fully delegate all your tasks. | И не в том, чтобы заставить вас полностью делегировать все свои задачи. |
| It's calibrated trust, neither granting it nor withholding it wholesale. | Речь идёт о калиброванном доверии: не предоставлять его целиком и не отказывать в нём целиком. |
| ​ ||
| By the end of the course, you'll be able to ask, "Where does my task sit on the continuum for each property of generative AI?" | К концу курса вы сможете спросить: «Где находится моя задача на континууме для каждого свойства генеративного ИИ?» |
| "Is this well-trodden territory, or am I out near an edge?" | «Это хорошо освоенная территория или я нахожусь где-то у границы?» |
| "What are the stakes if I'm wrong?" | «Каковы последствия, если я ошибаюсь?» |
| With this model, the behavior of generative AI starts feeling predictable, and that puts you in control. | С этой моделью поведение генеративного ИИ начинает ощущаться предсказуемым, и это даёт вам контроль. |
| | |

 ​ 

[Оглавление](index.md) | [Глоссарий](glossary.md)

Перевод и глоссарий — ChatGPT 5.6 Sol.

​

Anthropic | [Claude Academy](https://academy.claude.com) | Course [AI capabilities and limitations](https://academy.claude.com/courses/ai-capabilities-and-limitations/)

2026
