// Тест на v3: данни, план, чеклист, хранене за минал ден
const fs=require('fs');
const html=fs.readFileSync(process.argv[2],'utf8');
const src=html.slice(html.lastIndexOf('<script>')+8,html.lastIndexOf('</script>')).replace(/\ninit\(\);\s*$/,'\nMODE="local";');
const els={};
function el(id){return els[id]||(els[id]={id,innerHTML:'',textContent:'',hidden:id==='sheet',value:'',checked:false,scrollTop:0,dataset:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},querySelector(){return el('x')},querySelectorAll(){return []},focus(){},setSelectionRange(){}})}
global.window=global;global.localStorage={getItem(){return null},setItem(){}};
global.document={documentElement:{style:{setProperty(){}}},querySelector:s=>el(s.replace('#','')),querySelectorAll:()=>[],getElementById:id=>els[id]||null,addEventListener(){},body:{classList:{add(){},remove(){},toggle(){}}}};
global.scrollTo=()=>{};global.setInterval=()=>0;global.addEventListener=()=>{};
const fail=m=>{console.log('FAIL',m);process.exitCode=1};
eval(src+`
;(function(){
const T=today();
// 1) цялост на данните
const ids=RAW.map(r=>r[0]);const dup=ids.filter((x,i)=>ids.indexOf(x)!==i);
console.log('products',ids.length,'dups',dup.join(',')||'none','combos',COMBOS.length);
if(dup.length)fail('dup ids');
const bad=[];RAW.forEach(r=>(r[7]?r[7].split(' '):[]).forEach(x=>{if(!P[x])bad.push(r[0]+'->'+x)}));if(bad.length)fail('bad pairs '+bad.join(' '));
COMBOS.forEach(c=>c.ids.forEach(x=>{if(!P[x])fail('combo '+c.n+' -> '+x)}));
Object.keys(SERVE_ID).forEach(x=>{if(!P[x])fail('serve id '+x)});
const noType=ids.filter(x=>!SERVE_ID[x]);if(noType.length)fail('no serve type '+noType.join(' '));
Object.keys(SERVE_X).forEach(x=>{if(!P[x])fail('serve x '+x)});
FIRST30.forEach(x=>{if(!P[x])fail('first30 '+x)});if(FIRST30.length!==30)fail('first30 len '+FIRST30.length);
if(new Set(FIRST30).size!==30)fail('first30 dup');
ALG_PLAN.forEach(a=>a[1].concat(a[2]||[]).forEach(x=>{if(!P[x])fail('alg '+x)}));
ALLERGENS.forEach(a=>a[2].forEach(x=>{if(!P[x])fail('allergen '+x)}));
const cats={};PLIST.forEach(p=>cats[p.c]=(cats[p.c]||0)+1);console.log('by cat',JSON.stringify(cats));
// 2) празно състояние: всички изгледи
const all=()=>{for(const t of ['home','products','combos','calendar','more']){UI.tab=t;for(const ps of ['list','check','plan']){UI.psub=ps;render()}}};
all();
// 3) бебе на 6 м 9 д, без въведени
S.profile.birth='2026-04-24';S.profile.start='2026-10-15';bump();
let fq=foodQueue();console.log('queue (empty):',fq.q.slice(0,8).map(x=>x.id+'@'+x.date).join(' '));
if(fq.q[0].id!=='zucchini')fail('first should be zucchini');
// 4) няколко въведени + изпитване днес
['zucchini','carrot','potato','pumpkin'].forEach(p=>S.prod.st[p]={s:'ok'});S.prod.st.turkey={s:'trial',d0:T};bump();
fq=foodQueue();console.log('wait',fq.wait&&fq.wait.id,'next',fq.q[0].id,'@',fq.q[0].date,'| q:',fq.q.slice(0,10).map(x=>x.id).join(' '));
if(!fq.wait||fq.q[0].date!==addDays(T,3))fail('trial wait');
const AP=allergenPlan(fq);console.log('allergens:',AP.map(a=>a.k+':'+a.state+'@'+(a.date||'-')).join(' '));
UI.tab='home';render();if(!els.view.innerHTML.includes('Следваща нова храна'))fail('home next card');
UI.tab='products';UI.psub='plan';render();const PV=els.view.innerHTML;
if(!PV.includes('Програма за алергените')||!PV.includes('Първите 30 храни'))fail('plan view');
// 5) без изпитване: Нова храна днес
S.prod.st.turkey={s:'ok'};bump();fq=foodQueue();console.log('today pick',fq.q[0].id,fq.q[0].why.join(' | '),'alts',fq.q[0].alts);
UI.tab='home';render();if(!els.view.innerHTML.includes('Нова храна днес'))fail('home today card');
// запек → не предлага запичащи
UI.trend='constip';bump();fq=foodQueue();console.log('constip pick',fq.q[0].id,P[fq.q[0].id].e);if(P[fq.q[0].id].e==='z')fail('constip picks z');UI.trend='auto';bump();
// 6) чеклист + търсене се чисти при смяна на категория
UI.tab='products';UI.psub='check';UI.q='тик';render();let CV=els.view.innerHTML;
if(!CV.includes('ck on')||!CV.includes('Копирай списъка'))fail('checklist');
UI.pc='';UI.q='abc';(function(){const v='fruit';UI.pc=UI.pc===v?'':v;UI.q='';})();if(UI.q!=='')fail('search not cleared');
const txt=checklistText();console.log(txt.split('\\n').slice(0,4).join(' / '));
// 7) карта на невъведен продукт: идеи за въвеждане и поднасяне
productSheet('apple');let SB=els['sheet-body'].innerHTML;
if(!SB.includes('Как да го въведеш')||!(productSheet('apple','serve'),els['sheet-body'].innerHTML).includes('Задавяне'))fail('product sheet intro/serve');
const ii=introIdeas('apple',4);console.log('apple ideas:',ii.list.map(c=>c.n).join(' | '));
productSheet('grape','serve');SB=els['sheet-body'].innerHTML;console.log('grape risk висок:',SB.includes('висок риск'));
closeSheet();
// 8) хранене за минал ден → въведен; днес → изпитване; минал с реакция → изпитване
mealSheet(addDays(T,-2),null,[{p:'apple',g:30},{n:'',ps:['pear','oats'],g:40}],'breakfast');saveMeal();
console.log('past meal st:',st('apple'),st('pear'),st('oats'));if(st('apple')!=='ok'||st('pear')!=='ok'||st('oats')!=='ok')fail('past meal not intro');
mealSheet(T,null,[{p:'broccoli',g:30}],'lunch');saveMeal();console.log('today meal st broccoli:',st('broccoli'));if(st('broccoli')!=='trial')fail('today trial');
mealSheet(addDays(T,-1),null,[{p:'peach',g:30}],'lunch');draft.react=['rash'];saveMeal();console.log('past+react st peach:',st('peach'));if(st('peach')!=='trial')fail('past react');
// изпитване започнало днес, хранене от вчера с него → въведен (ял го е и преди)
S.prod.st.mango={s:'trial',d0:T};mealSheet(addDays(T,-3),null,[{p:'mango',g:20}],'snack2');saveMeal();console.log('earlier trial mango:',st('mango'));if(st('mango')!=='ok')fail('earlier trial');
// изпитване от вчера, запис от днес-1 (същият ден) → остава изпитване
S.prod.st.kiwi={s:'trial',d0:addDays(T,-1)};mealSheet(addDays(T,-1),null,[{p:'kiwi',g:20}],'snack2');saveMeal();if(st('kiwi')!=='trial')fail('same-day trial kept');
all();
console.log('serve stages 9m:',stageIdx(9),'12m:',stageIdx(12),'| sample',JSON.stringify(serveOf('carrot').s[1]).slice(0,60));
console.log(process.exitCode?'SOME FAILED':'ALL OK');
})();`);
