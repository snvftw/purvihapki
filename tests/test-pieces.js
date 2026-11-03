// Тест на „На парчета“: насоки за всеки продукт, чинии с хапки, превключвател Пюрета/Парчета
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
// 1) насоки на парчета за всеки тип и всеки продукт
if(!BLW_RULE)fail('BLW_RULE empty');
Object.keys(SERVE_T).forEach(k=>{const b=SERVE_B[k];if(!b||!b.p||!b.t)fail('SERVE_B '+k)});
Object.keys(SERVE_BX).forEach(id=>{if(!P[id])fail('SERVE_BX id '+id)});
const miss=PLIST.filter(p=>!serveOf(p.id).b.p).map(p=>p.id);if(miss.length)fail('no pieces text '+miss.join(' '));
const texts=[BLW_RULE].concat(...Object.values(SERVE_B).map(Object.values),...Object.values(SERVE_BX).map(Object.values));
if(texts.some(s=>/плешк|натискан|удар/i.test(s)))fail('first-aid technique in pieces text');
const long=texts.filter(s=>typeof s==='string'&&s.length>200);if(long.length)fail('too long '+long.length);
console.log('pieces: types',Object.keys(SERVE_B).length,'overrides',Object.keys(SERVE_BX).length,'| grape:',piecesText('grape',7));
// 2) чинии с хапки
const bad=[];PLATES.forEach(c=>c.ids.forEach(i=>{if(!P[i])bad.push(c.n+'->'+i)}));if(bad.length)fail('plate ids '+bad.join(' '));
const six=PLATES.filter(c=>c.ids.every(i=>P[i]&&P[i].a<=6)).length;
console.log('plates',PLATES.length,'6-month',six);
if(PLATES.length<20||six<8)fail('plates count');if(PLATES.some(c=>!c.plate||!c.w))fail('plate flag/how');
if(new Set(PLATES.map(c=>c.n)).size!==PLATES.length)fail('plate names dup');
// 3) „Поднасяне“: блок „На парчета“; при „Парчета“ е най-отгоре
S.profile.birth='2026-04-24';bump();
productSheet('broccoli','serve');let B=els['sheet-body'].innerHTML;
if(!B.includes('На парчета')||!B.includes('Готово ли е?'))fail('serve pieces block');
if(B.indexOf('На парчета')<B.indexOf('6–8 м</b><span>'+h(serveOf('broccoli').s[0])))fail('pieces should be after stages in puree mode');
S.profile.style='pieces';bump();productSheet('broccoli','serve');B=els['sheet-body'].innerHTML;
if(B.indexOf('На парчета')>B.indexOf('Пюре и храна по възраст'))fail('pieces first in pieces mode');closeSheet();
// 4) комбинации: превключвател и чинии
['zucchini','carrot','potato','sweetpotato','broccoli','beef','chicken','egg_yolk','egg','avocado','banana','oats','lentil_red','apple','pear','turkey','salmon','fish_white','pumpkin','yogurt'].forEach(i=>S.prod.st[i]={s:'ok'});bump();
UI.tab='combos';UI.csub='ideas';UI.cm='all';render();let V=els.view.innerHTML;
if(!V.includes('Чинии с хапки')||V.includes('<h2>Моите пюрета</h2>')||!V.includes('data-act="style"'))fail('pieces combos view');
if(!V.includes('Как да нарежеш')||!V.includes('<b>Как:</b>'))fail('plate card pieces/how');
UI.cm='ready';render();console.log('ready plates:',rankedCombos('ready',ideaSrc()).length);
UI.tab='home';render();V=els.view.innerHTML;if(rankedCombos('ready',PLATES).length&&!V.includes('Как да нарежеш'))fail('home idea from plates');
S.profile.style='puree';bump();UI.tab='combos';render();V=els.view.innerHTML;
if(V.includes('Чинии с хапки')||!V.includes('Моите пюрета'))fail('puree combos view');
// 5) нова храна и форма за хранене при „Парчета“
S.profile.style='pieces';bump();const fq=foodQueue();
if(fq.q[0]){UI.tab='home';render();const want=piecesText(fq.q[0].id,ageM());if(want&&!els.view.innerHTML.includes(h(want))&&els.view.innerHTML.includes('Нова храна днес'))fail('new food pieces text')}
const days=S.days;S.days={};bump();if(lastTex()!=='finger')fail('default tex finger');S.days=days;bump();
mealSheet(T,null,[],'lunch');if(!els['sheet-body'].innerHTML.includes('Ястие от няколко продукта'))fail('meal form dish label');closeSheet();
S.profile.style='puree';bump();
for(const t of ['home','products','combos','calendar','more']){UI.tab=t;render()}
console.log(process.exitCode?'SOME FAILED':'PIECES OK');
})();`);
