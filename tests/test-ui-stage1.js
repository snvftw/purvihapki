const fs=require('fs');const html=fs.readFileSync(process.argv[2],'utf8');
const src=html.slice(html.lastIndexOf('<script>')+8,html.lastIndexOf('</script>')).replace(/\ninit\(\);\s*$/,'\nMODE="local";');
const els={};function el(id){return els[id]||(els[id]={id,innerHTML:'',textContent:'',hidden:id==='sheet',value:'',checked:false,scrollTop:0,offsetHeight:66,dataset:{},style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},querySelector(){return null},querySelectorAll(){return []},focus(){},setSelectionRange(){}})}
global.window=global;global.localStorage={getItem(){return null},setItem(){}};
global.document={documentElement:{style:{setProperty(){}}},querySelector:s=>el(s.replace(/^[#.]/,'')),querySelectorAll:()=>[],getElementById:id=>els[id]||null,addEventListener(){},body:{classList:{add(){},remove(){},toggle(){}}}};
global.scrollTo=()=>{};global.setInterval=()=>0;global.addEventListener=()=>{};const fail=m=>{console.log('FAIL',m);process.exitCode=1};
eval(src+`;(function(){const T=today();
S.profile.birth='2026-04-24';
['zucchini','carrot','potato','pumpkin','apple','turkey'].forEach(p=>S.prod.st[p]={s:'ok'});bump();
const ready=rankedCombos('ready').map(c=>c.n);console.log('ready combos with 6 foods:',ready.length,ready.slice(0,4).join(' | '));if(!ready.length)fail('herbs still block');
// много напомняния → 2 видими + прибрани
S.days[addDays(T,-1)]={meals:[{id:'r1',slot:'lunch',items:[{p:'carrot',g:20}],react:['rash']}],stools:[]};
S.prod.st.broccoli={s:'trial',d0:T};S.prod.st.pear={s:'dislike'};S.prod.st.egg_yolk={s:'ok'};
S.days[addDays(T,-9)]={meals:[{id:'e1',slot:'lunch',items:[{p:'egg_yolk',g:10}],react:[]}],stools:[{id:'s',c:'hard'}]};bump();
UI.tab='home';render();const H=els.view.innerHTML;const vis=H.split('<details class="more-alerts"')[0];
console.log('visible alerts:',(vis.match(/class="alert /g)||[]).length,'| collapsed:',(H.match(/Още \d+ напомнян/)||['none'])[0]);
if(!H.includes('more-alerts'))fail('no collapse');
// форма: ред „кога“, грамове, реакция Да/Не
mealSheet(T,null,[{p:'apple',g:''}],'lunch');let B=els['sheet-body'].innerHTML;
console.log('when-row',B.includes('when-row'),'| date input hidden',!B.includes('id="m-date"'),'| gram chips',B.includes('data-act="m-g"'),'| symptoms hidden',!B.includes('data-act="m-react"'));
if(!B.includes('when-row')||B.includes('id="m-date"')||!B.includes('m-g')||B.includes('data-act="m-react"'))fail('meal form');
draft._rx=true;renderMealSheet();B=els['sheet-body'].innerHTML;if(!B.includes('data-act="m-react"'))fail('symptoms after yes');
draft._when=true;renderMealSheet();B=els['sheet-body'].innerHTML;if(!B.includes('id="m-date"'))fail('expand when');
draft.items[0].g=60;draft.items.push({p:'dill',g:''});draft._rx=false;saveMeal();console.log('dill status after meal:',st('dill'),'| apple grams',S.days[T].meals[0].items[0].g);if(st('dill')!=='ok')fail('herb trial');
// продукти: кратки редове, закрепена лента
UI.tab='products';UI.psub='list';render();const PV=els.view.innerHTML;
console.log('pbar',PV.includes('class="pbar"'),'| tags in list',(PV.match(/class="tag /g)||[]).length,'| rows',(PV.match(/class="prow/g)||[]).length);
if(!PV.includes('pbar'))fail('pbar');
console.log(process.exitCode?'SOME FAILED':'UI1 OK');})();`);
