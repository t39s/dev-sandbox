
(function(){
  const key='ai-course-ru-progress-v1';
  const quizKey='ai-course-ru-quiz-v1';
  const read=()=>{try{return JSON.parse(localStorage.getItem(key)||'[]')}catch(e){return[]}};
  const write=(x)=>localStorage.setItem(key,JSON.stringify([...new Set(x)].sort((a,b)=>a-b)));
  function updateUI(){
    const done=read();
    document.querySelectorAll('[data-lesson-link]').forEach(a=>a.classList.toggle('done',done.includes(Number(a.dataset.lessonLink))));
    document.querySelectorAll('.progressline span').forEach(s=>s.style.width=(done.length/13*100)+'%');
    document.querySelectorAll('.progresstext').forEach(s=>s.textContent=`Пройдено ${done.length} из 13 уроков`);
    const cb=document.querySelector('[data-complete-lesson]');
    if(cb) cb.checked=done.includes(Number(cb.dataset.completeLesson));
    const resume=document.querySelector('[data-resume]');
    if(resume){const next=[1,2,3,4,5,6,7,8,9,10,11,12,13].find(n=>!done.includes(n))||13;const map=JSON.parse(resume.dataset.map);resume.href='lessons/'+map[next];resume.textContent=done.length?'Продолжить курс →':'Начать курс →';}
  }
  document.addEventListener('change',e=>{
    if(e.target.matches('[data-complete-lesson]')){
      const n=Number(e.target.dataset.completeLesson), done=read().filter(x=>x!==n); if(e.target.checked) done.push(n); write(done); updateUI();
    }
  });
  document.addEventListener('click',e=>{
    const b=e.target.closest('[data-mark-current]'); if(b){const n=Number(b.dataset.markCurrent),done=read();if(!done.includes(n))done.push(n);write(done);updateUI();}
    const reset=e.target.closest('[data-reset-progress]');if(reset&&confirm('Сбросить локальный прогресс курса?')){localStorage.removeItem(key);localStorage.removeItem(quizKey);location.reload();}
  });
  updateUI();

  const quiz=document.querySelector('[data-quiz]');
  if(quiz){
    quiz.addEventListener('submit',e=>{
      e.preventDefault();
      const answers=['b','c','b','a','c','b','a','c']; let score=0;
      answers.forEach((ans,i)=>{const v=new FormData(quiz).get('q'+(i+1)); if(v===ans)score++;});
      localStorage.setItem(quizKey,JSON.stringify({score,total:answers.length,date:new Date().toISOString()}));
      const result=document.querySelector('.quiz-result'); result.classList.add('show');
      result.innerHTML=`<div class="score">${score}/${answers.length}</div><p>${score>=6?'Результат показывает уверенное понимание базовой модели.':'Стоит вернуться к отмеченным темам и пройти тест ещё раз.'}</p><a class="btn primary" href="completion.html">К странице завершения →</a>`;
      result.scrollIntoView({behavior:'smooth',block:'center'});
    });
  }
  const scoreBox=document.querySelector('[data-score-box]');
  if(scoreBox){try{const q=JSON.parse(localStorage.getItem(quizKey)||'null');scoreBox.textContent=q?`${q.score}/${q.total}`:'тест ещё не пройден';}catch(e){scoreBox.textContent='тест ещё не пройден'}}
})();
