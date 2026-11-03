const fs=require('fs');const html=fs.readFileSync(process.argv[2],'utf8');
const src=html.slice(html.lastIndexOf('<script>')+8,html.lastIndexOf('</script>')).replace(/\ninit\(\);\s*$/,'\nMODE="local";READY=true;');
const els={};function el(id){return els[id]||(els[id]={id,innerHTML:'',textContent:'',hidden:id==='sheet',value:'',checked:false,scrollTop:0,offsetHeight:66,dataset:{},style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},querySelector(){return null},querySelectorAll(){return []},focus(){},setSelectionRange(){}})}
global.window=global;global.localStorage={getItem(){return null},setItem(){}};
global.document={documentElement:{style:{setProperty(){}}},querySelector:s=>el(s.replace(/^[#.]/,'')),querySelectorAll:()=>[],getElementById:id=>els[id]||null,addEventListener(){},body:{classList:{add(){},remove(){},toggle(){}}}};
global.scrollTo=()=>{};global.setInterval=()=>0;global.addEventListener=()=>{};const fail=m=>{console.log('FAIL',m);process.exitCode=1};
eval(src+`;(function(){const T=today();
// онбординг при празно приложение
render();let V=els.view.innerHTML;if(!V.includes('Здравей'))fail('no onboarding');
els['o-name']={value:'Ния'};els['o-sex']={value:'f'};ONB.step=0;syncOnb();ONB.step=1;render();V=els.view.innerHTML;if(!V.includes('На колко е Ния'))fail('step2');
els['o-birth']={value:'2026-04-24'};els['o-start']={value:'2026-10-15'};els['o-bf']={checked:true};syncOnb();ONB.step=2;render();V=els.view.innerHTML;if(!V.includes('Какво вече яде'))fail('step3');
ONB.picked=['zucchini','carrot'];delete els['o-name'];delete els['o-birth'];delete els['o-start'];delete els['o-bf'];delete els['o-sex'];finishOnb();
console.log('after onb:',S.profile.name,S.profile.birth,S.profile.onb,st('zucchini'),st('carrot'),'| needsOnb',needsOnb());if(S.profile.name!=='Ния'||st('carrot')!=='ok'||needsOnb())fail('finish');
// времева линия: хранене, изхождане, план, бележка
S.days[T]={meals:[{id:'m1',slot:'lunch',time:'12:30',items:[{n:'',ps:['carrot','zucchini'],g:80}],like:3,react:[]},{id:'m0',slot:'breakfast',time:'08:40',items:[{p:'zucchini',g:30}],react:[]}],stools:[{id:'s1',time:'10:00',c:'normal',col:'yellow'}],note:{tags:['teeth'],text:''}};
S.plan.days[T]=[{id:'p1',slot:'snack2',n:'',ps:['carrot']}];bump();
UI.tab='home';render();V=els.view.innerHTML;
const order=['08:40','10:00','12:30'].map(t=>V.indexOf(t));console.log('timeline order ok',order.every((x,i)=>x>0&&(!i||x>order[i-1])),'| plan row',V.includes('по план'),'| note row',V.includes('Никнат зъбки'),'| fab',V.includes('fab-wrap'),'| summary',V.includes('sum-row'));
if(!V.includes('по план')||!V.includes('fab-wrap')||!V.includes(' + '))fail('timeline');
UI.sumOpen=true;render();V=els.view.innerHTML;if(!V.includes('Разнообразие днес')||!V.includes('Въведени продукти'))fail('summary open');
// календар: същата линия
UI.tab='calendar';UI.calsub='diary';UI.sel=T;render();if(!els.view.innerHTML.includes('tl-item'))fail('diary timeline');
// карта на продукта: три раздела
productSheet('apple');let B=els['sheet-body'].innerHTML;console.log('sheet tabs',B.includes('data-act="ps-tab"'),'| intro tab',B.includes('Как да го въведеш'),'| serve hidden',!B.includes('Как да го поднесеш'));
if(!B.includes('ps-tab')||!B.includes('Как да го въведеш'))fail('intro tab');
productSheet('apple','serve');B=els['sheet-body'].innerHTML;if(!B.includes('Как да го поднесеш'))fail('serve tab');
productSheet('apple','hist');B=els['sheet-body'].innerHTML;if(!B.includes('Започни изпитване'))fail('hist tab');
closeSheet();productSheet('carrot');B=els['sheet-body'].innerHTML;if(!B.includes('Съчетания'))fail('intro label for introduced');closeSheet();
// комбинации: избор за изхождане
UI.tab='combos';UI.csub='ideas';render();V=els.view.innerHTML;if(!V.includes('id="trend-sel"')||V.includes('data-act="trend"'))fail('trend select');
// всички изгледи без грешки
for(const t of ['home','products','combos','calendar','more'])for(const ps of ['list','check','plan']){UI.tab=t;UI.psub=ps;render()}
console.log(process.exitCode?'SOME FAILED':'UI2 OK');})();`);
