(() => {
  'use strict';
  const M=window.IntervalModel;
  const PENDING='sidesteps:migration:pending:v1',DONE='sidesteps:migration:done:v1';
  const LEGACY=M.STORAGE_KEY,TARGET='interval-lab:data:v5';
  const URL='https://t39s.github.io/sidesteps/';
  const view=document.getElementById('migration');
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const next='<a class="button" href="'+URL+'">Перейти в sidesteps</a>';
  function summary(data,a){
    const sessions=data.sessions.filter(s=>s.athleteId===a.id);
    const archive=data.archived.filter(x=>x.athleteId===a.id);
    const incomplete=data.incomplete.filter(x=>x.athleteId===a.id);
    const dates=sessions.map(s=>s.createdAt).concat(archive.map(x=>x.date),incomplete.map(x=>x.startedAt)).filter(x=>!Number.isNaN(Date.parse(x))).sort();
    const results=sessions.filter(x=>x.status==='closed').map(M.bestTotal).filter(x=>Number.isFinite(x)&&x>0).concat(archive.map(x=>x.bestMs));
    const best=results.length?Math.min(...results):null;
    const date=x=>x?new Date(x).toLocaleDateString('ru-RU'):'—';
    return '<label class="profile"><input type="radio" name="athlete" value="'+esc(a.id)+'"> <strong>'+esc(a.name)+'</strong>'
      +'<small>Завершённых серий: '+sessions.filter(x=>x.status==='closed').length+
      ' · Незавершённых серий: '+sessions.filter(x=>x.status==='pending').length+
      ' · Архивных результатов: '+archive.length+' · Неполных попыток: '+incomplete.length+'</small>'
      +'<small>Первое измерение: '+date(dates[0])+' · Последнее: '+date(dates.at(-1))+'</small>'
      +'<small>Личный рекорд: '+(best===null?'нет':(best/1000).toFixed(3).replace('.',',')+' с')+'</small></label>';
  }
  try{
    if(localStorage.getItem(DONE)&&localStorage.getItem(TARGET)){view.innerHTML=next;return;}
    const text=localStorage.getItem(LEGACY);
    if(!text){view.innerHTML='<h1>История Interval Lab не найдена</h1><p>Убедитесь, что открыт прежний браузер и данные сайта не были очищены.</p>'+next;return;}
    const data=M.validateStore(JSON.parse(text));
    view.innerHTML='<h1>Перенос истории в sidesteps</h1>'
      +'<p>Interval Lab больше не используется для измерений. Выберите один профиль для переноса на этом устройстве.</p>'
      +'<section><h2>Профиль спортсмена</h2>'
      +data.athletes.map(a=>summary(data,a)).join('')
      +'<p class="note">Переносится только выбранный профиль. Источник останется без изменений. После переноса старое приложение будет закрыто для повторного выбора.</p>'
      +'<button type="button" id="begin">Перенести и перейти</button></section>';
    const options=[...view.querySelectorAll('input[name="athlete"]')];
    if(options.length===1)options[0].checked=true;
    const start=document.getElementById('begin');
    start.addEventListener('click',()=>{
      const checked=view.querySelector('input[name="athlete"]:checked');
      if(!checked){window.alert('Выберите спортсмена.');return;}
      const a=data.athletes.find(x=>x.id===checked.value);
      if(!a)return;
      if(!window.confirm('Перенести историю спортсмена «'+a.name+'» в sidesteps? Другие профили перенесены не будут.'))return;
      try{
        localStorage.setItem(PENDING,JSON.stringify({version:1,athleteId:a.id}));
        window.location.assign(URL);
      }catch(err){window.alert('Не удалось подготовить перенос: '+err.message);}
    });
    if('serviceWorker' in navigator)navigator.serviceWorker.register('./sw.js').catch(()=>{});
  }catch(err){
    view.innerHTML='<h1>Не удалось подготовить перенос</h1><p class="error">'+esc(err.message)+'</p><p>Исходные измерения не удалены. Не очищайте данные сайта.</p>';
  }
})();
