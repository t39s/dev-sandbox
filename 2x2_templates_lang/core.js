(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.TwoByTwoCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const LIMIT = 1000000;
  const ID_RE = /^[a-z][a-z0-9-]{0,63}$/;
  const NAME_RE = /^[a-z][a-z0-9_]{0,31}$/;
  const RESERVED = new Set(['__proto__', 'prototype', 'constructor']);

  class ValidationError extends Error {
    constructor(message, path = '') {
      super(path ? `${path}: ${message}` : message);
      this.name = 'ValidationError';
      this.path = path;
    }
  }
  class MathReject extends Error {}

  function assert(cond, msg, path) { if (!cond) throw new ValidationError(msg, path); }
  function isInt(n) { return Number.isInteger(n); }
  function assertRange(n) { if (!isInt(n) || n < -LIMIT || n > LIMIT) throw new MathReject('Число вне допустимого диапазона'); return n; }

  function checkKeys(obj, allowed, path) {
    assert(obj && typeof obj === 'object' && !Array.isArray(obj), 'ожидался объект', path);
    for (const k of Object.keys(obj)) assert(allowed.has(k), `неизвестное поле ${k}`, path);
  }

  function tokenize(source) {
    assert(typeof source === 'string' && source.length <= 256, 'формула должна быть строкой длиной до 256 символов');
    const tokens = [];
    let i = 0;
    while (i < source.length) {
      const c = source[i];
      if (/\s/.test(c)) { i++; continue; }
      const two = source.slice(i, i + 2);
      if (['==','!=','<=','>='].includes(two)) { tokens.push({t:'rel', v:two}); i += 2; continue; }
      if (['<','>'].includes(c)) { tokens.push({t:'rel', v:c}); i++; continue; }
      if ('+-*/%()'.includes(c)) { tokens.push({t:c, v:c}); i++; continue; }
      if (/[0-9]/.test(c)) {
        let j = i + 1; while (j < source.length && /[0-9]/.test(source[j])) j++;
        const raw = source.slice(i, j);
        if (raw.length > 1 && raw[0] === '0') throw new ValidationError('целое не может иметь ведущий ноль');
        const value = Number(raw); if (value > LIMIT) throw new ValidationError(`целое ${raw} вне диапазона 0…${LIMIT}`);
        tokens.push({t:'int', v:value, raw}); i = j; continue;
      }
      if (/[a-z]/.test(c)) {
        let j = i + 1; while (j < source.length && /[a-z0-9_]/.test(source[j])) j++;
        const name = source.slice(i, j); tokens.push({t:'name', v:name}); i = j; continue;
      }
      throw new ValidationError(`недопустимый символ «${c}»`);
    }
    return tokens;
  }

  function parseExpression(source) {
    const tokens = tokenize(source);
    if (tokens.some(x => x.t === 'rel')) throw new ValidationError('сравнение недопустимо внутри арифметического выражения');
    let pos = 0;
    function primary(depth) {
      const tok = tokens[pos];
      if (!tok) throw new ValidationError('ожидалось число, имя или скобка');
      if (tok.t === 'int') { pos++; return {type:'int', value:tok.v}; }
      if (tok.t === 'name') { pos++; return {type:'name', name:tok.v}; }
      if (tok.t === '(') { pos++; const node = expr(depth + 1); if (!tokens[pos] || tokens[pos].t !== ')') throw new ValidationError('не закрыта скобка'); pos++; return {type:'paren', child:node}; }
      throw new ValidationError(`неожиданный токен ${tok.v}`);
    }
    function unary(depth) {
      const tok = tokens[pos];
      if (tok && (tok.t === '+' || tok.t === '-')) { pos++; return {type:'unary', op:tok.t, child:primary(depth + 1)}; }
      return primary(depth + 1);
    }
    function term(depth) {
      let node = unary(depth + 1);
      while (tokens[pos] && ['*','/','%'].includes(tokens[pos].t)) { const op = tokens[pos++].t; node = {type:'binary', op, left:node, right:unary(depth + 1)}; }
      return node;
    }
    function expr(depth) {
      let node = term(depth + 1);
      while (tokens[pos] && ['+','-'].includes(tokens[pos].t)) { const op = tokens[pos++].t; node = {type:'binary', op, left:node, right:term(depth + 1)}; }
      return node;
    }
    if (!tokens.length) throw new ValidationError('пустое выражение');
    const ast = expr(0);
    if (pos !== tokens.length) throw new ValidationError(`лишний токен ${tokens[pos].v}`);
    function astDepth(n) {
      if (n.type === 'int' || n.type === 'name') return 1;
      if (n.type === 'unary' || n.type === 'paren') return 1 + astDepth(n.child);
      return 1 + Math.max(astDepth(n.left), astDepth(n.right));
    }
    if (astDepth(ast) > 16) throw new ValidationError('глубина выражения больше 16');
    return ast;
  }

  function parseConstraint(source) {
    const tokens = tokenize(source);
    let depth = 0, relAt = -1;
    for (let i=0;i<tokens.length;i++) {
      if (tokens[i].t === '(') depth++;
      else if (tokens[i].t === ')') depth--;
      else if (tokens[i].t === 'rel' && depth === 0) { if (relAt !== -1) throw new ValidationError('цепочки сравнений не поддерживаются'); relAt = i; }
    }
    if (relAt <= 0 || relAt >= tokens.length - 1) throw new ValidationError('ограничение должно содержать одно сравнение');
    if (tokens.slice(relAt+1).some(t => t.t === 'rel')) throw new ValidationError('цепочки сравнений не поддерживаются');
    const leftSource = sourceFromTokens(tokens.slice(0, relAt));
    const rightSource = sourceFromTokens(tokens.slice(relAt + 1));
    return {type:'constraint', op:tokens[relAt].v, left:parseExpression(leftSource), right:parseExpression(rightSource)};
  }

  function sourceFromTokens(ts) { return ts.map(t => t.t === 'int' ? t.raw : t.v).join(' '); }

  function refs(ast, set = new Set()) {
    if (ast.type === 'name') set.add(ast.name);
    else if (ast.type === 'unary' || ast.type === 'paren') refs(ast.child, set);
    else if (ast.type === 'binary') { refs(ast.left, set); refs(ast.right, set); }
    else if (ast.type === 'constraint') { refs(ast.left, set); refs(ast.right, set); }
    return set;
  }

  function evalAst(ast, env) {
    switch (ast.type) {
      case 'int': return ast.value;
      case 'name': if (!env.has(ast.name)) throw new MathReject(`Неизвестное имя ${ast.name}`); return env.get(ast.name);
      case 'paren': return evalAst(ast.child, env);
      case 'unary': return assertRange(ast.op === '-' ? -evalAst(ast.child, env) : evalAst(ast.child, env));
      case 'binary': {
        const a = evalAst(ast.left, env), b = evalAst(ast.right, env); let r;
        if (ast.op === '+') r = a + b;
        else if (ast.op === '-') r = a - b;
        else if (ast.op === '*') r = a * b;
        else if (ast.op === '/') { if (b === 0 || a % b !== 0) throw new MathReject('Деление должно быть точным'); r = a / b; }
        else { if (b === 0) throw new MathReject('Деление на ноль'); r = a % b; }
        return assertRange(Object.is(r, -0) ? 0 : r);
      }
      default: throw new Error('Unknown AST node');
    }
  }

  function evalConstraint(ast, env) {
    const a = evalAst(ast.left, env), b = evalAst(ast.right, env);
    return ast.op === '==' ? a === b : ast.op === '!=' ? a !== b : ast.op === '<' ? a < b : ast.op === '<=' ? a <= b : ast.op === '>' ? a > b : a >= b;
  }

  function precedence(node) {
    if (node.type === 'binary') return ['+','-'].includes(node.op) ? 1 : 2;
    if (node.type === 'unary') return 3;
    return 4;
  }

  function displayAst(ast, env, parentPrec = 0, operand = false) {
    if (ast.type === 'int') return String(ast.value);
    if (ast.type === 'name') {
      const n = env.get(ast.name); if (n === undefined) return ast.name;
      return n < 0 && operand ? `(${String(n).replace('-', '−')})` : String(n).replace('-', '−');
    }
    if (ast.type === 'paren') return `(${displayAst(ast.child, env, 0, false)})`;
    if (ast.type === 'unary') {
      const op = ast.op === '-' ? '−' : '+';
      return op + displayAst(ast.child, env, 3, true);
    }
    const p = precedence(ast);
    const op = ast.op === '*' ? '×' : ast.op === '/' ? '÷' : ast.op === '-' ? '−' : ast.op;
    const s = `${displayAst(ast.left, env, p, true)} ${op} ${displayAst(ast.right, env, p + (ast.op === '-' || ast.op === '/' ? 1 : 0), true)}`;
    return p < parentPrec ? `(${s})` : s;
  }

  function expandPrompt(prompt, env) {
    let out = '', i = 0;
    while (i < prompt.length) {
      if (prompt[i] === '{') {
        const j = prompt.indexOf('}', i + 1); if (j < 0) throw new ValidationError('несогласованные фигурные скобки');
        const name = prompt.slice(i + 1, j); if (!NAME_RE.test(name) || !env.has(name)) throw new ValidationError(`неизвестная подстановка ${name}`);
        out += String(env.get(name)).replace('-', '−'); i = j + 1;
      } else if (prompt[i] === '}') throw new ValidationError('несогласованные фигурные скобки');
      else { out += prompt[i++]; }
    }
    return out;
  }

  function compileTemplate(t, path='template') {
    const vars = Object.keys(t.variables || {});
    const derivedNames = Object.keys(t.derived || {});
    const all = new Set([...vars, ...derivedNames]);
    const derivedAsts = new Map();
    for (const name of derivedNames) derivedAsts.set(name, parseExpression(t.derived[name]));
    const mainAst = t.expression ? parseExpression(t.expression) : parseExpression(t.answer);
    const constraints = (t.constraints || []).map(parseConstraint);
    for (const [name, ast] of derivedAsts) for (const r of refs(ast)) assert(all.has(r), `derived ${name}: неизвестное имя ${r}`, path);
    for (const r of refs(mainAst)) assert(all.has(r), `неизвестное имя ${r}`, path);
    for (const c of constraints) for (const r of refs(c)) assert(all.has(r), `constraint: неизвестное имя ${r}`, path);
    if (t.prompt) {
      const re = /\{([^{}]*)\}/g; let m; const seen = [];
      let stripped = t.prompt.replace(re, (_, n) => { seen.push(n); return ''; });
      assert(!/[{}]/.test(stripped), 'несогласованные фигурные скобки', path);
      for (const n of seen) assert(NAME_RE.test(n) && all.has(n), `prompt: неизвестная подстановка ${n}`, path);
    }
    const indegree = new Map(derivedNames.map(n => [n, 0]));
    const edges = new Map(derivedNames.map(n => [n, []]));
    for (const name of derivedNames) for (const r of refs(derivedAsts.get(name))) if (indegree.has(r)) { indegree.set(name, indegree.get(name)+1); edges.get(r).push(name); }
    const q = derivedNames.filter(n => indegree.get(n) === 0), order = [];
    while (q.length) { const n = q.shift(); order.push(n); for (const to of edges.get(n)) { indegree.set(to, indegree.get(to)-1); if (indegree.get(to)===0) q.push(to); } }
    assert(order.length === derivedNames.length, 'цикл зависимостей в derived', path);
    return {mainAst, constraints, derivedAsts, derivedOrder:order};
  }

  function validateSet(data) {
    const errors = [];
    try {
      checkKeys(data, new Set(['format','version','id','revision','title','templates','levels']), 'root');
      assert(data.format === '2x2-templates', 'format должен быть 2x2-templates', 'root.format');
      assert(data.version === 1, 'поддерживается только version=1', 'root.version');
      assert(ID_RE.test(data.id), 'некорректный id', 'root.id');
      assert(isInt(data.revision) && data.revision > 0, 'revision должен быть положительным целым', 'root.revision');
      assert(typeof data.title === 'string' && data.title.length>0 && data.title.length<=120, 'некорректное название', 'root.title');
      assert(Array.isArray(data.templates) && data.templates.length>0 && data.templates.length<=100, 'templates: 1..100 элементов', 'root.templates');
      assert(Array.isArray(data.levels) && data.levels.length>0 && data.levels.length<=100, 'levels: 1..100 элементов', 'root.levels');
      const tids = new Set();
      for (let i=0;i<data.templates.length;i++) {
        const t=data.templates[i], p=`templates[${i}]`;
        checkKeys(t,new Set(['id','title','variables','derived','expression','constraints','prompt','answer']),p);
        assert(ID_RE.test(t.id),'некорректный id',`${p}.id`); assert(!tids.has(t.id),'повтор id',`${p}.id`); tids.add(t.id);
        assert(typeof t.title==='string'&&t.title.length>0&&t.title.length<=120,'некорректное название',`${p}.title`);
        const expressionMode = typeof t.expression === 'string';
        const promptMode = typeof t.prompt === 'string' || typeof t.answer === 'string';
        assert(expressionMode !== promptMode, 'нужен ровно один режим: expression или prompt+answer',p);
        if (promptMode) { assert(typeof t.prompt==='string'&&typeof t.answer==='string','prompt и answer обязательны вместе',p); assert(t.prompt.length<=500,'prompt длиннее 500',`${p}.prompt`); }
        const variables=t.variables||{}; checkKeys(variables,new Set(Object.keys(variables)),`${p}.variables`); assert(Object.keys(variables).length<=8,'не более 8 variables',`${p}.variables`);
        for (const [name,dom] of Object.entries(variables)) {
          assert(NAME_RE.test(name)&&!RESERVED.has(name),'некорректное имя переменной',`${p}.variables.${name}`);
          checkKeys(dom,new Set(['min','max','values']),`${p}.variables.${name}`);
          const range = Object.hasOwn(dom,'min') || Object.hasOwn(dom,'max'); const values = Object.hasOwn(dom,'values'); assert(range !== values,'ровно min/max или values',`${p}.variables.${name}`);
          if (range) { assert(isInt(dom.min)&&isInt(dom.max)&&dom.min<=dom.max&&dom.min>=-LIMIT&&dom.max<=LIMIT,'некорректный диапазон',`${p}.variables.${name}`); }
          else { assert(Array.isArray(dom.values)&&dom.values.length>0,'values должен быть непустым',`${p}.variables.${name}.values`); const s=new Set(); for(const v of dom.values){assert(isInt(v)&&v>=-LIMIT&&v<=LIMIT,'values: только целые в диапазоне',`${p}.variables.${name}`);assert(!s.has(v),'повтор значения в values',`${p}.variables.${name}`);s.add(v);} }
        }
        const derived=t.derived||{}; assert(Object.keys(derived).length<=8,'не более 8 derived',`${p}.derived`);
        for(const [name,val] of Object.entries(derived)){assert(NAME_RE.test(name)&&!RESERVED.has(name),'некорректное имя derived',`${p}.derived.${name}`);assert(!Object.hasOwn(variables,name),'имя пересекается с variables',`${p}.derived.${name}`);assert(typeof val==='string', 'derived должен быть формулой',`${p}.derived.${name}`);}
        assert(Array.isArray(t.constraints||[])&&(t.constraints||[]).length<=16,'constraints: до 16',`${p}.constraints`);
        compileTemplate(t,p);
      }
      const lids=new Set();
      for(let i=0;i<data.levels.length;i++){
        const l=data.levels[i],p=`levels[${i}]`; checkKeys(l,new Set(['id','title','maxErrors','maxSeconds','items','shuffle']),p);
        assert(ID_RE.test(l.id)&&!lids.has(l.id),'некорректный или повторяющийся id',`${p}.id`);lids.add(l.id);
        assert(typeof l.title==='string'&&l.title.length>0&&l.title.length<=120,'некорректное название',`${p}.title`);
        assert(isInt(l.maxErrors)&&l.maxErrors>=0,'maxErrors должен быть неотрицательным целым',`${p}.maxErrors`);
        assert(isInt(l.maxSeconds)&&l.maxSeconds>0,'maxSeconds должен быть положительным целым',`${p}.maxSeconds`);
        assert(typeof l.shuffle==='boolean','shuffle должен быть boolean',`${p}.shuffle`);
        assert(Array.isArray(l.items)&&l.items.length>0,'items должен быть непустым',`${p}.items`); let count=0; const seen=new Set();
        for(let j=0;j<l.items.length;j++){const it=l.items[j];checkKeys(it,new Set(['templateId','count']),`${p}.items[${j}]`);assert(tids.has(it.templateId),'неизвестный templateId',`${p}.items[${j}]`);assert(!seen.has(it.templateId),'templateId должен быть уникален внутри уровня',`${p}.items[${j}]`);seen.add(it.templateId);assert(isInt(it.count)&&it.count>0,'count должен быть положительным целым',`${p}.items[${j}].count`);count+=it.count;}
        assert(count<=100,'в уровне не более 100 заданий',p); assert(l.maxErrors<=count,'maxErrors больше числа заданий',`${p}.maxErrors`);
      }
    } catch(e){ errors.push(e.message); }
    return {ok:errors.length===0, errors};
  }

  function domainSize(dom){ return dom.values ? dom.values.length : (dom.max - dom.min + 1); }
  function domainValues(dom){ if (dom.values) return dom.values.slice(); const a=[]; for(let x=dom.min;x<=dom.max;x++)a.push(x); return a; }
  function assignmentCount(t){ let n=1; for(const d of Object.values(t.variables||{})){n*=domainSize(d);if(n>100000)return n;} return n; }

  function makeAssignmentIterator(t){
    const names=Object.keys(t.variables||{}).sort(); const vals=names.map(n=>domainValues(t.variables[n]));
    if(!names.length){let done=false;return {next(){if(done)return{done:true};done=true;return{done:false,value:new Map()};}};}
    const idx=new Array(names.length).fill(0);let finished=false;
    return {next(){if(finished)return{done:true}; const env=new Map(names.map((n,i)=>[n,vals[i][idx[i]]])); for(let k=idx.length-1;k>=0;k--){idx[k]++;if(idx[k]<vals[k].length)break;idx[k]=0;if(k===0)finished=true;} return{done:false,value:env};}};
  }

  function instantiate(t, compiled, baseEnv){
    const env=new Map(baseEnv);
    try{
      for(const name of compiled.derivedOrder) env.set(name,evalAst(compiled.derivedAsts.get(name),env));
      for(const c of compiled.constraints) if(!evalConstraint(c,env)) return null;
      const answer=evalAst(compiled.mainAst,env);
      const prompt=t.expression ? displayAst(compiled.mainAst,env) : expandPrompt(t.prompt,env);
      return {templateId:t.id,prompt,answer,values:Object.fromEntries(env)};
    }catch(e){ if(e instanceof MathReject)return null; throw e; }
  }

  async function buildPoolAsync(t, options={}){
    const total=assignmentCount(t); if(total>100000) throw new ValidationError(`Шаблон ${t.id}: ${total} сочетаний, максимум 100000`);
    const compiled=compileTemplate(t,`template ${t.id}`);const it=makeAssignmentIterator(t);const byPrompt=new Map();let processed=0;
    while(true){if(options.signal&&options.signal.aborted)throw new DOMException('Отменено','AbortError');const n=it.next();if(n.done)break;const item=instantiate(t,compiled,n.value);if(item){if(byPrompt.has(item.prompt)&&byPrompt.get(item.prompt).answer!==item.answer)throw new ValidationError(`Шаблон ${t.id}: одинаковое условие даёт разные ответы`);byPrompt.set(item.prompt,item);}processed++;if(processed%1000===0){if(options.onProgress)options.onProgress(processed,total);await new Promise(r=>setTimeout(r,0));}}
    return Array.from(byPrompt.values());
  }

  function sampleWithoutReplacement(items,count,rng=Math.random){ if(count>items.length)throw new ValidationError(`Найдено ${items.length} различных заданий, запрошено ${count}`);const a=items.slice();for(let i=0;i<count;i++){const j=i+Math.floor(rng()*(a.length-i));[a[i],a[j]]=[a[j],a[i]];}return a.slice(0,count); }
  function shuffle(a,rng=Math.random){for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}

  async function generateLevel(set, level, options={}){
    const templateMap=new Map(set.templates.map(t=>[t.id,t]));let combos=0;for(const it of level.items)combos+=assignmentCount(templateMap.get(it.templateId));if(combos>500000)throw new ValidationError(`Уровень требует ${combos} исходных сочетаний, максимум 500000`);
    const sequence=[]; const promptOwner=new Map(); const crossTemplateDuplicates=new Set();
    for(const it of level.items){
      const t=templateMap.get(it.templateId);const pool=await buildPoolAsync(t,options);if(pool.length===0)throw new ValidationError(`Шаблон ${t.id}: условию не соответствует ни одно сочетание чисел`);
      for(const item of pool){const owner=promptOwner.get(item.prompt);if(owner&&owner!==t.id)crossTemplateDuplicates.add(item.prompt);else if(!owner)promptOwner.set(item.prompt,t.id);}
      sequence.push(...sampleWithoutReplacement(pool,it.count,options.rng||Math.random));
    }
    if(crossTemplateDuplicates.size&&options.onWarning){const examples=Array.from(crossTemplateDuplicates).slice(0,3).join('; ');options.onWarning(`Разные шаблоны дают одинаковые условия: ${crossTemplateDuplicates.size}${examples?` (например: ${examples})`:''}`);}
    return level.shuffle?shuffle(sequence,options.rng||Math.random):sequence;
  }

  return {ValidationError,MathReject,parseExpression,parseConstraint,evalAst,evalConstraint,displayAst,compileTemplate,validateSet,assignmentCount,instantiate,buildPoolAsync,generateLevel,sampleWithoutReplacement,expandPrompt,LIMIT};
});
