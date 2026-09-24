Anthropic | [Claude Academy](https://academy.claude.com) | Course [AI capabilities and limitations](https://academy.claude.com/courses/ai-capabilities-and-limitations/)

[Оглавление](index.md) | [Глоссарий](glossary.md)
  
# Перевод расшифровки видео
## Урок 8. Working Memory (Рабочая память)
 ​ 
||| 
|---|---|
| **Summary** | **Резюме** |
| ​ ||
| Everything the AI is paying attention to lives inside a fixed-size workspace called the context window. | Всё, на что ИИ обращает внимание, находится внутри рабочего пространства фиксированного размера, называемого контекстным окном. |
| It can attend to what's in there. | Он может учитывать то, что находится внутри него. |
| It can't attend to anything outside it. | Он не может учитывать ничего за его пределами. |
| That constraint is hard-edged in a way the other properties aren't: things work until they don't. | У этого ограничения жёсткая граница, в отличие от других свойств: всё работает до тех пор, пока не перестаёт работать. |
| ​ ||
| **Transcript** | **Расшифровка** |
| ​ ||
| Hi there, my name's Matt and I'm on the user research team at Anthropic. | Привет, меня зовут Мэтт, и я работаю в команде пользовательских исследований в Anthropic. |
| Today I'm here to talk to you about the context window, which is how AI models manage what they're paying attention to right now. | Сегодня я здесь, чтобы поговорить с вами о контекстном окне — о том, как модели ИИ управляют тем, на что они обращают внимание прямо сейчас. |
| We'll look at what actually fits inside that window, what happens when it fills up or empties out, and how to structure your work so you stay on the good side of those limits. | Мы рассмотрим, что на самом деле помещается в это окно, что происходит, когда оно заполняется или опустошается, и как структурировать работу так, чтобы оставаться на благоприятной стороне этих ограничений. |
| It's a lot like how working memory functions in humans. | Это во многом похоже на то, как работает рабочая память у людей. |
| ​ ||
| When you're working with AI, everything sits inside one fixed-sized workspace called the context window. | Когда вы работаете с ИИ, всё находится внутри одного рабочего пространства фиксированного размера, называемого контекстным окном. |
| Your instructions, Claude's prior responses, the documents you uploaded, the back and forth conversation. | Ваши инструкции, предыдущие ответы Claude, загруженные вами документы, обмен сообщениями туда и обратно. |
| All of it lives in one finite container, and the model can only attend to what's inside. | Всё это находится в одном конечном контейнере, и модель может учитывать только то, что находится внутри. |
| Importantly, the context window has a hard size limit. | Важно, что у контекстного окна есть жёсткое ограничение размера. |
| Once a conversation or a set of documents exceeds what the window can hold, something falls off. | Как только разговор или набор документов превышает объём, который может вместить окно, что-то выпадает. |
| Usually it's the oldest material, and usually it happens silently. | Обычно это самый старый материал, и обычно это происходит незаметно. |
| The model doesn't stop and announce that it dropped your first three messages. | Модель не останавливается и не объявляет, что отбросила ваши первые три сообщения. |
| It just keeps going with whatever's left. | Она просто продолжает работу с тем, что осталось. |
| ​ ||
| By default, the window empties between sessions. | По умолчанию окно очищается между сеансами. |
| When you close a chat and open a new one tomorrow, you're starting from zero. | Когда вы закрываете чат и открываете новый на следующий день, вы начинаете с нуля. |
| Yesterday's conversation is gone unless a product feature, like memory or a CLAUDE.md file, has deliberately carried something forward. | Вчерашний разговор исчезает, если только функция продукта, такая как память или файл CLAUDE.md, намеренно не перенесла что-то дальше. |
| ​ ||
| Like the other core properties of AI systems, working memory runs as a continuum. | Как и другие основные свойства систем ИИ, рабочая память существует в виде континуума. |
| When your material fits comfortably in the window, and you're working inside the current session, you're in the capability zone. | Когда ваш материал свободно помещается в окне и вы работаете в рамках текущего сеанса, вы находитесь в зоне возможностей. |
| The model is working with your documents, your constraints, your context. | Модель работает с вашими документами, вашими ограничениями, вашим контекстом. |
| As documents get longer, as the conversation runs on, as you start expecting the model to remember things from last week, you slide toward the limitation zone. | По мере того как документы становятся длиннее, разговор продолжается, а вы начинаете ожидать, что модель будет помнить вещи с прошлой недели, вы смещаетесь к зоне ограничений. |
| ​ ||
| Unlike the other three properties though, this one has a cliff. | Однако, в отличие от трёх других свойств, у этого есть обрыв. |
| Next token prediction degrades gradually. | Предсказание следующего токена ухудшается постепенно. |
| Knowledge gets thinner gradually. | Знания постепенно становятся менее надёжными. |
| But working memory tends to work right up until it doesn't. | Но рабочая память, как правило, работает вплоть до того момента, когда перестаёт работать. |
| You won't always get a warning. | Вы не всегда получите предупреждение. |
| ​ ||
| And while you're in the capability zone, context is genuine leverage. | И пока вы находитесь в зоне возможностей, контекст даёт реальное преимущество. |
| Watch what happens when I upload a short style guide and ask Claude to draft something. | Посмотрите, что происходит, когда я загружаю короткое руководство по стилю и прошу Claude что-то написать. |
| No retraining, no setup. | Никакого переобучения, никакой настройки. |
| The model adapts to my material immediately inside this one session. | Модель немедленно адаптируется к моему материалу в рамках этого одного сеанса. |
| ​ ||
| So why is the window fixed at all? | Так почему окно вообще имеет фиксированный размер? |
| Because the model processes your entire context as a single block every time it generates a response. | Потому что модель обрабатывает весь ваш контекст как единый блок каждый раз, когда генерирует ответ. |
| It's reading all of it, start to finish, to decide what to write next. | Она читает всё целиком, от начала до конца, чтобы решить, что написать дальше. |
| There's a ceiling on how much it can hold and still produce a coherent reply. | Существует предел того, сколько она может удерживать и при этом всё ещё выдавать связный ответ. |
| And even inside that ceiling, attention isn't perfectly uniform. | И даже внутри этого предела внимание распределяется не совершенно равномерно. |
| Research on long context behavior has found a lost-in-the-middle effect. | Исследования поведения при длинном контексте выявили эффект «потерянного в середине». |
| Material buried deep in the middle of a very long input tends to carry less weight than material at the beginning or the end. | Материал, глубоко спрятанный в середине очень длинного входного текста, как правило, имеет меньший вес, чем материал в начале или в конце. |
| ​ ||
| What does this mean in practice? | Что это означает на практике? |
| You can have rapid in-session adaptation. | Вы можете получить быструю адаптацию в рамках сеанса. |
| Give a glossary, a voice sample, a set of constraints, and it applies them on the spot. | Дайте глоссарий, образец стиля, набор ограничений — и модель применит их сразу. |
| You get precision through specificity. | Вы получаете точность за счёт конкретики. |
| The more relevant context you supply, the more tailored the output. | Чем больше релевантного контекста вы предоставляете, тем более адаптированным будет результат. |
| But when the context window runs out, your experience degrades. | Но когда контекстное окно заканчивается, качество вашего взаимодействия ухудшается. |
| AI won't remember things from the beginning of the conversation, or things from the middle of your exchange might get fuzzy. | ИИ не будет помнить вещи из начала разговора, а детали из середины вашего обмена сообщениями могут стать нечёткими. |
| ​ ||
| Products layer features on top of the raw window to soften these edges. | Продукты накладывают дополнительные функции поверх исходного окна, чтобы смягчить эти границы. |
| Memory saves selected facts across sessions so you're not starting from zero every time. | Память сохраняет выбранные факты между сеансами, чтобы вам не приходилось каждый раз начинать с нуля. |
| Compaction or summarization condenses your conversation history to free up room when a conversation runs long. | Сжатие или суммаризация уплотняют историю разговора, чтобы освободить место, когда разговор становится длинным. |
| Projects and workspaces keep standing documents reliably in context without re-uploading. | Проекты и рабочие пространства позволяют надёжно держать постоянные документы в контексте без повторной загрузки. |
| Skills keep instructions minimal until a specific task actually needs them. | Навыки сохраняют инструкции минимальными до тех пор, пока конкретная задача действительно не потребует их. |
| Multi-agent workflows allow for multiple agents to have different specialties and their own context windows, expanding the total amount of context the workflow can have. | Мультиагентные рабочие процессы позволяют нескольким агентам иметь разные специализации и собственные контекстные окна, увеличивая общий объём контекста, доступный рабочему процессу. |
| Larger context windows push the cliff further out. | Более крупные контекстные окна отодвигают обрыв дальше. |
| ​ ||
| Here are some signs you're approaching the edge of the context window. | Вот некоторые признаки того, что вы приближаетесь к границе контекстного окна. |
| A very long conversation where quality has started to slip. | Очень длинный разговор, в котором качество начало снижаться. |
| A very long document where details from the middle aren't showing up in responses. | Очень длинный документ, в котором детали из середины не появляются в ответах. |
| And expecting the model to recall something from a prior session without a memory feature enabled. | И ожидание того, что модель вспомнит что-то из предыдущего сеанса без включённой функции памяти. |
| ​ ||
| Here are some techniques to stay on the good side of the cliff. | Вот несколько приёмов, позволяющих оставаться на благоприятной стороне обрыва. |
| Lead with what matters. | Начинайте с того, что важно. |
| For long documents, put the most important material near the top, rather than burying it on page 12. | В длинных документах помещайте самый важный материал ближе к началу, а не прячьте его на двенадцатой странице. |
| Chunk long work into passes. | Разбивайте большую работу на этапы. |
| Process a big document in sections, rather than one giant upload. | Обрабатывайте большой документ по разделам, а не одной гигантской загрузкой. |
| Use product features that save your context. | Используйте функции продукта, которые сохраняют ваш контекст. |
| Use things like projects or skills that save your context for common areas you want to work in. | Используйте такие вещи, как проекты или навыки, которые сохраняют ваш контекст для типичных областей, в которых вы хотите работать. |
| If quality degrades over a long conversation, start fresh. | Если качество ухудшается в ходе длинного разговора, начните заново. |
| That slippage is often a context limit rather than a capability limit. | Такое ухудшение часто связано с ограничением контекста, а не с ограничением возможностей. |
| A new chat with a short summary of where you were can outperform pushing through. | Новый чат с кратким резюме того, на чём вы остановились, может дать лучший результат, чем продолжение прежнего разговора. |
| ​ ||
| Working memory is the mechanism that makes description work. | Рабочая память — это механизм, благодаря которому работает Описание. |
| Everything you describe to an AI, your instructions, your constraints, your examples, has to live inside this window to have any effect. | Всё, что вы описываете ИИ, — ваши инструкции, ограничения, примеры — должно находиться внутри этого окна, чтобы иметь какое-либо влияние. |
| Understanding the window's size, its edges, and its reset behavior is what tells you how to structure a prompt, when to restate critical context, and what's actually worth uploading versus what you can leave out. | Понимание размера окна, его границ и поведения при сбросе подсказывает вам, как структурировать запрос, когда повторно указывать критически важный контекст и что действительно стоит загружать, а что можно оставить за пределами. |
| | |

 ​ 

[Оглавление](index.md) | [Глоссарий](glossary.md)

Перевод и глоссарий — ChatGPT 5.6 Sol.

​

Anthropic | [Claude Academy](https://academy.claude.com) | Course [AI capabilities and limitations](https://academy.claude.com/courses/ai-capabilities-and-limitations/)

2026