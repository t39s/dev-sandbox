Anthropic | [Claude Academy](https://academy.claude.com) | Course [AI capabilities and limitations](https://academy.claude.com/courses/ai-capabilities-and-limitations/)

[Оглавление](index.md) | [Глоссарий](glossary.md)
  
# Перевод расшифровки видео
## Урок 3. How AI Gets Its Character (Как ИИ приобретает свой характер)
 ​ 
||| 
|---|---|
| **Summary** | **Резюме** |
| ​ ||
| An AI's politeness, helpfulness, and caution aren't emergent magic. | Вежливость, полезность и осторожность ИИ — не возникающая сама собой магия. |
| They're trained in, layer by layer, and each training stage leaves specific, predictable fingerprints on how the system interacts with you. | Они закладываются обучением, слой за слоем, и каждый этап обучения оставляет конкретные, предсказуемые отпечатки на том, как система взаимодействует с вами. |
| ​ ||
| **Transcript** | **Расшифровка** |
| ​ ||
| Hi there, my name is Maggie, and I lead the education team at Anthropic. | Привет, меня зовут Мэгги, и я руковожу образовательной командой Anthropic. |
| Today I'm here to talk to you about how AI assistants end up with a disposition. | Сегодня я здесь, чтобы поговорить с вами о том, как у ИИ-помощников в итоге появляется определённый характер. |
| We'll look at the two training stages that turn raw prediction into something useful, the fingerprints those stages leave behind, and how knowing those fingerprints helps you get better results. | Мы рассмотрим два этапа обучения, которые превращают необработанное предсказание во что-то полезное, отпечатки, которые оставляют эти этапы, и то, как знание этих отпечатков помогает вам получать лучшие результаты. |
| ​ ||
| Why does an AI try to be helpful in the first place? | Почему ИИ вообще старается быть полезным? |
| Why is it polite? | Почему он вежлив? |
| Why does it refuse certain things? | Почему он отказывается делать определённые вещи? |
| Knowing that an AI predicts the next word doesn't really answer any of that. | Знание того, что ИИ предсказывает следующее слово, на самом деле не отвечает ни на один из этих вопросов. |
| Helpfulness is built deliberately in layers, and each layer influences your experiences with AI each day. | Полезность намеренно выстраивается слоями, и каждый слой влияет на ваш повседневный опыт взаимодействия с ИИ. |
| ​ ||
| Modern AI assistants are built in two stages. | Современные ИИ-помощники создаются в два этапа. |
| Stage one is pre-training. | Первый этап — предварительное обучение. |
| The model sees enormous amounts of data and learns one thing. | Модель видит огромные объёмы данных и учится одной вещи. |
| Given everything so far, guess what comes next? | Учитывая всё, что было до сих пор, угадай, что идёт дальше? |
| That's it, repeated billions of times. | Вот и всё, повторённое миллиарды раз. |
| Stage two is fine tuning. | Второй этап — дообучение. |
| The document completer from stage one gets trained again, this time on curated examples of helpful behavior and reward signals shaped by human preferences. | Система дополнения документов с первого этапа обучается снова, на этот раз на отобранных примерах полезного поведения и сигналах вознаграждения, сформированных человеческими предпочтениями. |
| This is the layer that turns the AI model into an assistant. | Это тот слой, который превращает модель ИИ в помощника. |
| ​ ||
| Imagine you could talk to a model that had only been through stage one. | Представьте, что вы могли бы поговорить с моделью, которая прошла только первый этап. |
| No fine-tuning at all. | Никакого дообучения вообще. |
| You type, "What is the capital of France?" | Вы вводите: «Какова столица Франции?» |
| A raw, pre-trained model doesn't answer your question. | Необработанная предварительно обученная модель не отвечает на ваш вопрос. |
| It continues your document. | Она продолжает ваш документ. |
| Maybe it outputs: Paris. | Возможно, она выводит: Париж. |
| What's the capital of Germany? | Какова столица Германии? |
| Berlin. | Берлин. |
| What's the capital of Spain? | Какова столица Испании? |
| And so on, because it's seen that pattern in quizzes. | И так далее, потому что она видела такой шаблон в викторинах. |
| ​ ||
| Maybe it writes a paragraph from a geography textbook. | Возможно, она пишет абзац из учебника географии. |
| Maybe it generates more questions. | Возможно, она генерирует больше вопросов. |
| It has no concept of you, no concept of helping. | У неё нет представления о вас, нет представления о помощи. |
| It's purely continuing a document in whatever direction seems statistically likely. | Она просто продолжает документ в том направлении, которое кажется статистически вероятным. |
| ​ ||
| The assistant behavior you actually experience with AI tools today is a trained overlay on top of that. | Поведение помощника, которое вы фактически наблюдаете сегодня в инструментах ИИ, — это обученная надстройка поверх этого. |
| Fine-tuning is what makes generative AI systems usable and useful. | Дообучение — это то, что делает системы генеративного ИИ пригодными к использованию и полезными. |
| But because it relies on human judgments about what good looks like, the texture of those judgments shows up in these models' personalities. | Но поскольку оно опирается на человеческие суждения о том, как выглядит хорошее поведение, характер этих суждений проявляется в личностях этих моделей. |
| Often these personality traits are what make generative AI so effective, but there can be a shadow side to AI's helpfulness. | Часто именно эти черты личности делают генеративный ИИ настолько эффективным, но у полезности ИИ может быть и теневая сторона. |
| ​ ||
| Four shadow areas are: 1. Sycophancy | Четыре теневые области: 1. Угодничество |
| ​ ||
| When people prefer agreeable responses, the model learns to validate readily and back down under light pushback, even when it was right the first time. | Когда люди предпочитают согласные с ними ответы, модель учится охотно подтверждать их позицию и отступать при лёгком возражении, даже когда изначально была права. |
| ​ ||
| 2. Verbosity | 2. Многословие |
| ​ ||
| When thoroughness scores better during training, the model defaults to longer answers, even when brevity could serve you better for a specific situation. | Когда обстоятельность получает более высокую оценку во время обучения, модель по умолчанию даёт более длинные ответы, даже когда в конкретной ситуации вам лучше подошла бы краткость. |
| ​ ||
| 3. Overcaution | 3. Чрезмерная осторожность |
| ​ ||
| When safety training leans conservative, the model can hedge heavily or refuse requests that are actually safe. | Когда обучение безопасности склоняется к консервативному подходу, модель может чрезмерно оговариваться или отказываться от запросов, которые на самом деле безопасны. |
| ​ ||
| And 4. Loose confidence calibration | И 4. Неточная калибровка уверенности |
| ​ ||
| The model's stated confidence is only loosely tied to its actual reliability. | Заявленная моделью уверенность лишь слабо связана с её фактической надёжностью. |
| Confidence is genuinely hard to train, so it's particularly important to be vigilant here. | Уверенность действительно трудно обучать, поэтому здесь особенно важно сохранять бдительность. |
| ​ ||
| These aren't bugs in one particular model. | Это не ошибки какой-то одной конкретной модели. |
| They're things that show up in all AI models. | Это явления, которые проявляются во всех моделях ИИ. |
| However, the quality and type of fine tuning done on a model directly shapes how these things manifest, and it will likely be different from model to model. | Однако качество и тип дообучения, проведённого для модели, напрямую определяют, как эти явления проявляются, и, вероятно, это будет различаться от модели к модели. |
| At Anthropic, we train Claude to be broadly safe, ethical, and helpful. | В Anthropic мы обучаем Claude быть в целом безопасным, этичным и полезным. |
| You can even read Claude's entire constitution to see how we train Claude, and how we intentionally shape Claude's personality. | Вы даже можете прочитать всю конституцию Claude, чтобы увидеть, как мы обучаем Claude и как намеренно формируем личность Claude. |
| ​ ||
| Why does this matter to you? | Почему это важно для вас? |
| Understanding how AI is made and why it behaves the way it does puts you in control when it comes to AI. | Понимание того, как создаётся ИИ и почему он ведёт себя именно так, даёт вам контроль при работе с ИИ. |
| If your AI assistant caves the moment you push back, that's sycophancy, and you should factor that in when assessing responses. | Если ваш ИИ-помощник сдаётся в тот момент, когда вы возражаете, это угодничество, и вам следует учитывать это при оценке ответов. |
| If you're getting essays when you want bullets, that's the verbosity default kicking in. | Если вы получаете эссе, когда хотите маркированные пункты, это срабатывает настройка многословия по умолчанию. |
| If you're getting heavy caveats on a harmless question, that's over-caution. | Если вы получаете множество серьёзных оговорок в ответ на безобидный вопрос, это чрезмерная осторожность. |
| We'll address what to do about this in the upcoming lessons. | В следующих уроках мы разберём, что с этим делать. |
| ​ ||
| The assistant you talked to wasn't born helpful. | Помощник, с которым вы разговаривали, не родился полезным. |
| That behavior was built layer by layer, and sometimes the seams show. | Это поведение было выстроено слой за слоем, и иногда становятся видны швы. |
| Learning to spot these seams is part of using AI well. | Умение замечать эти швы — часть грамотного использования ИИ. |
| | |

 ​ 

[Оглавление](index.md) | [Глоссарий](glossary.md)

Перевод и глоссарий — ChatGPT 5.6 Sol.

​

Anthropic | [Claude Academy](https://academy.claude.com) | Course [AI capabilities and limitations](https://academy.claude.com/courses/ai-capabilities-and-limitations/)

2026
