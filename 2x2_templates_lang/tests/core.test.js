'use strict';
const fs=require('fs');
const path=require('path');
const C=require('../core.js');
const stock=JSON.parse(fs.readFileSync(path.join(__dirname,'../data/templates.json'),'utf8'));
const demo=JSON.parse(fs.readFileSync(path.join(__dirname,'../data/demo-templates.json'),'utf8'));
const tests=[];
function test(name,fn){tests.push({name,fn})}
function eq(a,b){if(a!==b)throw new Error(`${JSON.stringify(a)} !== ${JSON.stringify(b)}`)}
function env(obj={}){return new Map(Object.entries(obj))}
function evalExpr(s){return C.evalAst(C.parseExpression(s),env())}

test('stock set validates',()=>{const v=C.validateSet(stock);if(!v.ok)throw new Error(v.errors.join('\n'))});
test('demo set validates',()=>{const v=C.validateSet(demo);if(!v.ok)throw new Error(v.errors.join('\n'))});
test('operator precedence 2 + 3 * 4 = 14',()=>eq(evalExpr('2 + 3 * 4'),14));
test('parentheses (2 + 3) * 4 = 20',()=>eq(evalExpr('(2 + 3) * 4'),20));
test('nested subtraction = -9',()=>eq(evalExpr('7 - (9 + 7)'),-9));
test('division/multiplication left associative = 8',()=>eq(evalExpr('8 / 2 * 2'),8));
test('remainder sign matches JS = -1',()=>eq(evalExpr('-7 % 3'),-1));
test('leading zero rejected',()=>{let yes=false;try{C.parseExpression('01 + 2')}catch{yes=true}if(!yes)throw new Error('not rejected')});
test('JS injection rejected',()=>{let yes=false;try{C.parseExpression('window.alert(1)')}catch{yes=true}if(!yes)throw new Error('not rejected')});
test('unknown field rejected',()=>{const x=structuredClone(stock);x.templates[0].oops=1;if(C.validateSet(x).ok)throw new Error('unknown field accepted')});
test('cycle rejected',()=>{const x=structuredClone(stock);x.templates=[{id:'cycle',title:'cycle',derived:{a:'b + 1',b:'a + 1'},expression:'a'}];x.levels=[{id:'level-a',title:'x',maxErrors:0,maxSeconds:10,items:[{templateId:'cycle',count:1}],shuffle:false}];if(C.validateSet(x).ok)throw new Error('cycle accepted')});
test('duplicate values rejected',()=>{const x=structuredClone(stock);x.templates=[{id:'dup',title:'dup',variables:{a:{values:[2,2]}},expression:'a'}];x.levels=[{id:'level-a',title:'x',maxErrors:0,maxSeconds:10,items:[{templateId:'dup',count:1}],shuffle:false}];if(C.validateSet(x).ok)throw new Error('duplicate values accepted')});
test('addition-over-ten pool has exactly 36 ordered pairs',async()=>{const t=demo.templates.find(x=>x.id==='addition-over-ten');const p=await C.buildPoolAsync(t);eq(p.length,36);if(p.some(x=>x.answer<=10))throw new Error('bad sum')});
test('division pool is integer and divisor nonzero',async()=>{const t=demo.templates.find(x=>x.id==='division');const p=await C.buildPoolAsync(t);eq(p.length,64);for(const x of p){if(!Number.isInteger(x.answer)||x.values.d===0)throw new Error('bad division')}});
test('empty pool detected',async()=>{const t={id:'empty',title:'empty',variables:{a:{min:1,max:9}},expression:'a',constraints:['a > 10']};const x={format:'2x2-templates',version:1,id:'x',revision:1,title:'x',templates:[t],levels:[{id:'l',title:'l',maxErrors:0,maxSeconds:10,items:[{templateId:'empty',count:1}],shuffle:false}]};let yes=false;try{await C.generateLevel(x,x.levels[0])}catch(e){yes=/ни одно сочетание/.test(e.message)}if(!yes)throw new Error('empty pool not rejected')});
test('one variant count=2 rejected',async()=>{const t={id:'fixed',title:'fixed',expression:'2 + 2'};const x={format:'2x2-templates',version:1,id:'x',revision:1,title:'x',templates:[t],levels:[{id:'l',title:'l',maxErrors:0,maxSeconds:10,items:[{templateId:'fixed',count:2}],shuffle:false}]};let yes=false;try{await C.generateLevel(x,x.levels[0])}catch(e){yes=/Найдено 1/.test(e.message)}if(!yes)throw new Error('not rejected')});

const expectedExpressions=[
['2 + 2','9 - 4','3 + 8','5 - 9','7 + 9','-4 + 8','6 + 5','3 - 9'],
['3 + 5 + 9','4 - 7 + 5','3 + 8 - 9','-5 - 8 - 3','4 + 9 + 8','-2 + 9 - 2','3 + 7 - 3','8 + 9 + 7'],
['5 - (6 - 5)','3 + (4 - 7)','(-6 + 7) + 9','7 - (9 + 7)','1 - (7 - 9)','-7 - (3 - 6)','9 - (9 + 9)','-6 - (6 + 7)'],
['5 - (8 - 5) + 8','3 + (4 - 7) - 5','-6 + (7 + 9) - 6','-7 - (4 - 9) + 7','1 - (7 - 2) + 9','-7 - (3 - 9) + 6','8 - (9 + 9) - 9','6 - (6 + 9) + 9'],
['3 - 19','-6 + 18','8 + 27','19 - 7','7 - 38','41 - 7','-87 - 8','-5 + 99'],
['5 + 67 - 8','-78 + 5 - 9','2 - 56 + 4','32 - 8 + 3','8 - 40 + 8','-9 + 90 - 8','-76 - 9 - 8','58 + 6 + 7'],
['9 - (73 - 8)','6 + (9 - 32)','1 + (48 + 9)','-9 + (65 - 8)','-7 - (34 - 7)','5 + (-21 + 9)','4 - (-56 + 3)','7 - (17 - 2)'],
['72 - 32','75 - 49','18 + 29','92 - 57','16 - 73','27 + 78','-95 - 32','39 + 93']
];
const expectedAnswers=[[4,5,11,-4,16,4,11,-6],[17,2,2,-16,21,5,7,24],[4,0,10,-9,3,-4,-9,-19],[10,-5,4,5,5,5,-19,0],[-16,12,35,12,-31,34,-95,94],[64,-82,-50,27,-24,73,-93,71],[-56,-17,58,48,-34,-7,57,-8],[40,26,47,35,-57,105,-127,132]];
test('all 64 legacy expressions preserve order/parentheses and answers',()=>{eq(stock.levels.length,8);let n=0;for(let li=0;li<8;li++){const level=stock.levels[li];eq(level.items.length,8);for(let j=0;j<8;j++){const t=stock.templates.find(x=>x.id===level.items[j].templateId);eq(t.expression,expectedExpressions[li][j]);eq(evalExpr(t.expression),expectedAnswers[li][j]);n++;}}eq(n,64)});

(async()=>{let passed=0,failed=0;for(const t of tests){try{await t.fn();console.log('PASS',t.name);passed++}catch(e){console.error('FAIL',t.name,'\n ',e.stack||e);failed++}}console.log(`\n${passed} passed, ${failed} failed`);process.exitCode=failed?1:0})();
