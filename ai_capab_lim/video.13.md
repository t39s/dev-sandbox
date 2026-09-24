Anthropic | [Claude Academy](https://academy.claude.com) | Course [AI capabilities and limitations](https://academy.claude.com/courses/ai-capabilities-and-limitations/)

[Lessons list](index.md)

 ​  
| Original text | Перевод на русский язык |
|---|---|
| ​  | ​  |
| Lesson 13 | Урок 13 |
| **Next Steps** | **Следующие шаги** |
| ​  | ​  |
| **Summary** | **Резюме** |
| ​  | ​  |
| Fluent AI use isn't about memorizing every failure mode. | Свободное владение ИИ — это не запоминание каждого возможного сбоя. |
| It's about holding a small, clear model of the machine in your head, so that when something goes wrong you can recognize which kind of wrong it is and respond accordingly. | Речь о том, чтобы держать в голове небольшую и ясную модель того, как устроена система, чтобы, когда что-то идёт не так, вы могли распознать, что именно пошло не так, и отреагировать соответствующим образом. |
| ​  | ​  |
| **Transcript** | **Транскрипт** |
|  |  |
| Hi again, it's Kristen from the education team at Anthropic. | Снова здравствуйте, это Кристен из образовательной команды Anthropic. |
| When you started this series, you probably had some version of one question: Why does AI do that? | Когда вы начинали эту серию, у вас, вероятно, была та или иная версия одного вопроса: почему ИИ делает это? |
| But you're leaving with something better than a list of answers. | Но вы уходите с чем-то более ценным, чем список ответов. |
| You're leaving with a structure that lets you answer the next, "Why does it do that?" yourself. | Вы уходите со структурой, которая позволяет вам самостоятельно ответить на следующий вопрос: «Почему он делает это?» |
| Models change, features ship, edge cases surprise people. | Модели меняются, выпускаются новые функции, пограничные случаи удивляют людей. |
| These properties remain. | Эти свойства остаются. |
| What you've built in this course is the ability to stop being surprised. | То, что вы сформировали в этом курсе, — это способность перестать удивляться. |
|  |  |
| Let's take a quick tour back through what you're taking with you. | Давайте быстро ещё раз пройдёмся по тому, что вы уносите с собой. |
| First, models are trained in two stages. | Во-первых, модели обучаются в два этапа. |
| Pretraining builds a document completer. | Предварительное обучение создаёт систему дополнения документов. |
| Fine-tuning layers an assistant on top. | Дообучение добавляет поверх неё слой помощника. |
| Every behavior you see, helpful or strange, traces back to one of those two fingerprints. | Любое поведение, которое вы наблюдаете — полезное или странное, — восходит к одному из этих двух отпечатков. |
|  |  |
| Once models are created, they exhibit four properties: next token prediction, knowledge, working memory, and steerability. | После создания модели проявляют четыре свойства: предсказание следующего токена, знания, рабочую память и управляемость. |
| Each one is a continuum with a capability zone, a limitation zone, and product features that push the edge further out. | Каждое из них представляет собой континуум с зоной возможностей, зоной ограничений и продуктовыми функциями, которые отодвигают границу дальше. |
| The same mechanism is always running. | Всегда работает один и тот же механизм. |
| The only thing that changes is where your task lands on the line. | Меняется только то, где на этой линии оказывается ваша задача. |
|  |  |
| And when something goes wrong, it's almost always two of these properties meeting. | И когда что-то идёт не так, почти всегда это столкновение двух из этих свойств. |
| A fabricated citation is next token prediction meeting a knowledge gap. | Вымышленная ссылка — это предсказание следующего токена, сталкивающееся с пробелом в знаниях. |
| Drift over a long conversation is working memory fading while steerability takes new instructions too literally. | Дрейф в ходе длинного разговора — это ослабление рабочей памяти в сочетании с тем, что управляемость слишком буквально воспринимает новые инструкции. |
| That's how you diagnose and adjust. | Именно так вы диагностируете проблему и корректируете работу. |
| It's not "What broke?" but "Which two things collided?" | Вопрос не в том: «Что сломалось?», а в том: «Какие две вещи столкнулись?» |
|  |  |
| Now here's what ties all of this together with the 4D Framework you may already know. | Теперь вот что связывает всё это с рамочной моделью 4D, которую вы, возможно, уже знаете. |
| These two frameworks aren't separate things you have to juggle. | Эти две рамочные модели — не отдельные вещи, между которыми вам приходится жонглировать. |
| The 4Ds are what you do: Delegation, Description, Discernment, and Diligence. | 4D — это то, что вы делаете: Делегирование, Описание, Различение и Добросовестность. |
| The four properties we discussed in this course are what you're responding to when you do them. | Четыре свойства, которые мы обсуждали в этом курсе, — это то, на что вы реагируете, когда применяете эти четыре компетенции. |
|  |  |
| Understanding next token prediction makes you better at Discernment because you know that fluency and accuracy are independent variables. | Понимание предсказания следующего токена делает вас лучше в Различении, потому что вы знаете, что беглость и точность — независимые переменные. |
| Understanding working memory makes you better at Description, because you know context is leverage, and you stop assuming the model remembers everything. | Понимание рабочей памяти делает вас лучше в Описании, потому что вы знаете, что контекст даёт преимущество, и перестаёте предполагать, что модель помнит всё. |
| Understanding steerability makes you better at Delegation, because you know where control is high, and where it's less precise. | Понимание управляемости делает вас лучше в Делегировании, потому что вы знаете, где контроль высок, а где он менее точен. |
| The machine layer sharpens the human layer. | Машинный уровень усиливает человеческий уровень. |
| It's not two different systems. | Это не две разные системы. |
| It's just opposite sides of the same coin. | Это просто две стороны одной медали. |
|  |  |
| Calibrated trust with AI gets talked about like it's an attitude, but it's actually a habit. | О калиброванном доверии к ИИ часто говорят как об установке, но на самом деле это привычка. |
| It means that before you hand something to an AI, you run a quick internal check. | Это означает, что прежде чем передать что-либо ИИ, вы проводите быструю внутреннюю проверку. |
| Is this well-worn territory or sparse? | Это хорошо проторенная территория или разреженная? |
| Is this topic recent or stable? | Эта тема недавняя или стабильная? |
| Is my context window comfortably inside the window? | Мой контекст комфортно помещается в контекстном окне? |
| Are my instructions concrete, or is there room between my words and my intent? | Мои инструкции конкретны или между моими словами и моим намерением остаётся пространство? |
|  |  |
| And then you adjust. | А затем вы корректируете подход. |
| More verification, where fabrication can concentrate. | Больше проверки там, где могут концентрироваться выдумки. |
| More context, where the model can't guess what you mean. | Больше контекста там, где модель не может угадать, что вы имеете в виду. |
| More checkpoints, when reasoning chains run too long. | Больше контрольных точек, когда цепочки рассуждений становятся слишком длинными. |
| You look for features that can help you extend the capabilities of the models. | Вы ищете функции, которые могут помочь вам расширить возможности моделей. |
|  |  |
| You don't trust the AI, but you don't distrust it either. | Вы не доверяете ИИ безусловно, но и не относитесь к нему с недоверием. |
| You locate the task, and you set your habits accordingly. | Вы определяете, где находится задача, и соответственно настраиваете свои привычки. |
| That's the true essence of AI Fluency. | В этом и состоит подлинная сущность свободного владения ИИ. |
|  |  |
| So where do you go from here? | Итак, куда двигаться дальше? |
| Practice on real work. | Практикуйтесь на реальной работе. |
| The model in your head gets sharper the more you test it against actual output. | Модель в вашей голове становится точнее, чем больше вы проверяете её на реальных результатах. |
| Pay attention to where your predictions about AI behavior are right and where they're off. | Обращайте внимание на то, где ваши прогнозы о поведении ИИ оказываются верными, а где — нет. |
| Revisit the 4D Framework with fresh eyes if you've already taken that course. | Если вы уже проходили этот курс, взгляните на рамочную модель 4D свежим взглядом. |
| The four properties give you a new lens on it. | Четыре свойства дают вам новый взгляд на неё. |
| If you haven't, it's the natural next step. | Если вы ещё не проходили его, это естественный следующий шаг. |
|  |  |
| Keep testing the edges. | Продолжайте проверять границы. |
| The models get better. | Модели становятся лучше. |
| The context windows get bigger. | Контекстные окна становятся больше. |
| Features close gaps that used to be open. | Функции закрывают пробелы, которые раньше оставались открытыми. |
| The edges move and you find them by pushing on them. | Границы смещаются, и вы находите их, проверяя их на прочность. |
|  |  |
| The specific numbers will change. | Конкретные числа будут меняться. |
| The exact location of each edge will shift as models improve, but the shape of these properties hold. | Точное положение каждой границы будет смещаться по мере улучшения моделей, но форма этих свойств сохраняется. |
| AI will keep being a predictor whose fluency may run ahead of its accuracy. | ИИ по-прежнему будет оставаться предсказателем, чья беглость может опережать его точность. |
| It will keep having uneven knowledge with a cutoff. | У него по-прежнему будут неравномерные знания с границей. |
| It will keep working inside a finite window. | Он по-прежнему будет работать внутри конечного окна. |
| It will keep following your instructions despite a gap between words and intent. | Он по-прежнему будет следовать вашим инструкциям, несмотря на разрыв между словами и намерением. |
| Those facts don't expire when the number version goes up. | Эти факты не перестают быть актуальными, когда увеличивается номер версии. |
|  |  |
| You've built a mental model that's durable on purpose. | Вы сформировали ментальную модель, которая специально рассчитана на долговечность. |
| The target keeps moving, and now you know how to track it. | Цель продолжает двигаться, и теперь вы знаете, как за ней следить. |

 ​  
[Lessons list](index.md)

Anthropic | [Claude Academy](https://academy.claude.com) | Course [AI capabilities and limitations](https://academy.claude.com/courses/ai-capabilities-and-limitations/)
