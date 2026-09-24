---
layout: course
---

Anthropic \| [Claude Academy](https://academy.claude.com) \| Course [AI capabilities and limitations](https://academy.claude.com/courses/ai-capabilities-and-limitations/)

[Оглавление](index.md) \| [Глоссарий](glossary.md)
  
# Перевод расшифровки видео
## Урок 1. Intro to AI Capabilities and Limitations (Введение в возможности и ограничения ИИ)
 ​ 

| ​ | ​ |
|---|---|
| **Summary** | **Резюме** |
| ​ | ​ |
| The 4D Framework teaches YOU how to collaborate with AI. | Рамочная модель 4D учит ВАС тому, как сотрудничать с ИИ. |
| This course teaches you how AI is able to work with you. | Этот курс учит вас тому, как ИИ способен работать с вами. |
| Together they're one system: human competencies on one side and machine properties on the other. | Вместе они представляют собой одну систему: человеческие компетенции с одной стороны и свойства машины — с другой. |
| ​ | ​ |
| **Transcript** | **Расшифровка** |
| ​ | ​ |
| Hi there, my name is Kristen, and I'm on the education team at Anthropic. | Привет, меня зовут Кристен, и я работаю в образовательной команде Anthropic. |
| Welcome to AI Capabilities and Limitations. | Добро пожаловать на курс «Возможности и ограничения ИИ». |
| If you've taken our AI Fluency Framework and Foundations course, you already know the 4Ds: Delegation, Description, Discernment, and Diligence. | Если вы проходили наш курс «Рамочная модель и основы свободного владения ИИ», вы уже знаете 4D: делегирование, описание, различение и добросовестность. |
| Those are human competencies. | Это человеческие компетенции. |
| They're what you do when you collaborate with AI. | Это то, что вы делаете, когда сотрудничаете с ИИ. |
| ​ | ​ |
| This course is the companion piece. | Этот курс — дополняющая часть. |
| It's about what the machine does when a human prompts it, and why. | Он о том, что делает машина, когда человек даёт ей запрос, и почему. |
| We're going to help you build a working mental model of where AI outputs actually come from. | Мы поможем вам построить рабочую ментальную модель того, откуда на самом деле берутся результаты работы ИИ. |
| Importantly, this course centers on how AI is created, so it will remain useful and relevant even as AI models and products change. | Важно, что этот курс сосредоточен на том, как создаётся ИИ, поэтому он останется полезным и актуальным даже по мере изменения моделей и продуктов ИИ. |
| ​ | ​ |
| You can't delegate a task to AI without knowing where the model is strong and where it's weak. | Вы не можете делегировать задачу ИИ, не зная, в чём модель сильна, а в чём слаба. |
| You can't discern the quality of an output from AI without some picture of how that output was produced, and what to look out for. | Вы не можете оценить качество результата от ИИ без некоторого представления о том, как этот результат был получен и на что следует обращать внимание. |
| Everything you learn in this course is actionable through the 4Ds. | Всё, чему вы научитесь в этом курсе, можно применять на практике через 4D. |
| Understanding that AI is a prediction engine changes how you describe tasks to it. | Понимание того, что ИИ — это механизм предсказания, меняет то, как вы описываете ему задачи. |
| Understanding the context window changes how you delegate long tasks. | Понимание контекстного окна меняет то, как вы делегируете длинные задачи. |
| The two frameworks fit together. | Эти две рамочные модели сочетаются друг с другом. |
| ​ | ​ |
| Here's the roadmap for the course. | Вот план курса. |
| First, we'll look at the two training stages that give an AI its character, and the fingerprints each one leaves on the finished system, pre-training and fine-tuning. | Сначала мы рассмотрим два этапа обучения, которые придают ИИ его характер, и отпечатки, которые каждый из них оставляет на конечной системе: предварительное обучение и дообучение. |
| Pre-training builds a document completer, while fine-tuning shapes AI into an assistant. | Предварительное обучение создаёт систему, дополняющую документы, тогда как дообучение формирует ИИ как помощника. |
| Both stages matter for understanding why the model behaves the way it does. | Оба этапа важны для понимания того, почему модель ведёт себя именно так. |
| ​ | ​ |
| And then we'll cover four core properties of generative AI: next token prediction, knowledge, working memory, and steerability. | А затем мы рассмотрим четыре основных свойства генеративного ИИ: предсказание следующего токена, знания, рабочую память и управляемость. |
| Each property is a continuum. | Каждое свойство представляет собой континуум. |
| You'll learn to evaluate where your task falls along the continuum for each property, whether it's in the capability zone or drifting towards the edge. | Вы научитесь оценивать, где ваша задача находится на континууме по каждому свойству: находится ли она в зоне возможностей или смещается к границе. |
| ​ | ​ |
| Finally, we'll look at how everything interconnects. | Наконец, мы рассмотрим, как всё взаимосвязано. |
| Most real-world failures with AI are two properties meeting. | Большинство сбоев ИИ в реальном мире — это столкновение двух свойств. |
| A hallucinated citation is next token prediction meeting a knowledge gap. | Выдуманная ссылка — это предсказание следующего токена, встречающееся с пробелом в знаниях. |
| Drift over a long conversation is working memory meeting steerability. | Дрейф в ходе длинного разговора — это рабочая память, встречающаяся с управляемостью. |
| When you can name the combination, you know why it's happening and what to do about it. | Когда вы можете назвать эту комбинацию, вы понимаете, почему это происходит и что с этим делать. |
| ​ | ​ |
| Models will keep changing. | Модели будут продолжать меняться. |
| Context windows grow. | Контекстные окна растут. |
| Hallucination rates drop. | Частота галлюцинаций снижается. |
| New features ship every month. | Новые функции выпускаются каждый месяц. |
| The specifics shift constantly. | Конкретные детали постоянно меняются. |
| But the shape of these properties stays useful. | Но структура этих свойств остаётся полезной. |
| Next token prediction will still be next token prediction a year from now. | Через год предсказание следующего токена всё ещё будет предсказанием следующего токена. |
| The knowledge cutoff might move, but there will still be one. | Граница знаний может сдвинуться, но она всё равно будет существовать. |
| The context window might get bigger, but it'll still be an edge. | Контекстное окно может стать больше, но у него всё равно будет граница. |
| What you're building here is a durable mental model, one that survives daily product updates and model releases. | То, что вы здесь строите, — это долговечная ментальная модель, которая переживает ежедневные обновления продуктов и выпуски моделей. |
| ​ | ​ |
| As with all courses, the person doing the work is doing the learning. | Как и во всех курсах, учится тот, кто выполняет работу. |
| To get the most out of this course, spend time doing the exercises. | Чтобы получить от этого курса максимум, уделяйте время выполнению упражнений. |
| The exercises are where the learning happens. | Именно в упражнениях происходит обучение. |
| We've designed them so you're testing each property against your own work in a domain where you're the expert. | Мы разработали их так, чтобы вы проверяли каждое свойство на своей собственной работе в области, в которой вы являетесь экспертом. |
| That's deliberate. | Это сделано намеренно. |
| You need to explore situations where you can actually tell if something's off. | Вам нужно исследовать ситуации, в которых вы действительно можете определить, что что-то не так. |
| ​ | ​ |
| So bring real tasks. | Поэтому приносите реальные задачи. |
| Run real prompts. | Используйте реальные запросы. |
| When we cover working memory, load in your actual long documents. | Когда мы будем рассматривать рабочую память, загрузите свои реальные длинные документы. |
| When we cover next token prediction, ask about your actual niche topics. | Когда мы будем рассматривать предсказание следующего токена, спрашивайте о своих реальных узкоспециализированных темах. |
| The goal is a calibration you can feel, not a list of terms you memorize. | Цель — калибровка, которую вы можете почувствовать, а не список терминов, которые вы заучиваете. |
| ​ | ​ |
| Alright, I'm glad you're on this learning journey with me and the rest of our team. | Итак, я рада, что вы проходите этот путь обучения вместе со мной и остальной нашей командой. |
| Together, we'll demystify how AI works and how you can use it to augment your thinking and your work. | Вместе мы развеем таинственность вокруг того, как работает ИИ и как вы можете использовать его, чтобы расширять возможности своего мышления и своей работы. |
| ​ | ​ |

 ​ 

[Оглавление](index.md) \| [Глоссарий](glossary.md)

Перевод и глоссарий — ChatGPT 5.6 Sol.

​

Anthropic \| [Claude Academy](https://academy.claude.com) \| Course [AI capabilities and limitations](https://academy.claude.com/courses/ai-capabilities-and-limitations/)

2026
