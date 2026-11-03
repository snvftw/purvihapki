// Тест на няколко деца (близнаци): отделни данни, смяна, добавяне, премахване, резервно копие
const fs=require('fs');
const html=fs.readFileSync(process.argv[2],'utf8');
const src=html.slice(html.lastIndexOf('<script>')+8,html.lastIndexOf('</script>')).replace(/\ninit\(\);\s*$/,'\nMODE="local";');
const els={};
function el(id){return els[id]||(els[id]={id,innerHTML:'',textContent:'',hidden:id==='sheet',value:'',checked:false,scrollTop:0,dataset:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},querySelector(){return el('x')},querySelectorAll(){return []},focus(){},setSelectionRange(){}})}
const mem=new Map();
global.window=global;global.localStorage={getItem:k=>mem.has(k)?mem.get(k):null,setItem:(k,v)=>mem.set(k,String(v)),removeItem:k=>mem.delete(k)};
global.document={documentElement:{style:{setProperty(){}}},querySelector:s=>el(s.replace('#','')),querySelectorAll:()=>[],getElementById:id=>els[id]||null,addEventListener(){},body:{classList:{add(){},remove(){},toggle(){}}}};
global.scrollTo=()=>{};global.setInterval=()=>0;global.addEventListener=()=>{};
const fail=m=>{console.log('FAIL',m);process.exitCode=1};
eval(src+`
;(function(){
const T=today();READY=true;
// пътища в базата: първото дете – старите, останалите – под kids/<id>/
if(nsFor('main','app/profile')!=='app/profile'||nsFor('main','days')!=='days'||nsFor('k1','app/profile')!=='kids/k1/app/profile'||nsFor('k1','days/'+T)!=='kids/k1/days/'+T)fail('db paths');
if(lsKeyFor('main')!=='purvi-hapki-v1'||lsKeyFor('k1')!=='purvi-hapki-v1:k1')fail('ls keys');
// първо дете
S.profile.name='Ния';S.profile.birth='2026-04-24';S.profile.start='2026-10-15';S.profile.onb=1;
['carrot','zucchini','potato'].forEach(p=>S.prod.st[p]={s:'ok'});S.prod.st.pear={s:'dislike'};S.prod.st.apple={s:'trial',d0:T};
S.days[T]={meals:[{id:'m1',slot:'lunch',items:[{p:'carrot',g:40}],react:[]}],stools:[]};bump();lsSave();
UI.tab='home';render();if(!els['hdr-name'].innerHTML.includes('Ния')||!els['hdr-name'].innerHTML.includes('▾'))fail('header name/caret');
// добавяне на близнак: същата рождена дата и начало, копирани само въведените
const id=addKid({name:'Мая',birth:S.profile.birth,sex:'f',twin:true,copy:true});
console.log('after add: KID',KID,'| name',S.profile.name,'| start',S.profile.start,'| st',Object.keys(S.prod.st).join(','),'| days',Object.keys(S.days).length,'| kids',kidsList().map(k=>k.name).join(','));
if(KID!==id||S.profile.name!=='Мая'||S.profile.start!=='2026-10-15'||S.profile.onb!==1)fail('new kid profile');
if(st('carrot')!=='ok'||st('pear')||st('apple')||Object.keys(S.days).length)fail('copied statuses / empty diary');
if(kidsList().length!==2||!JSON.parse(mem.get('purvi-hapki-kids')).some(k=>k.name==='Мая'))fail('registry');
// записите на второто дете не пипат първото
mealSheet(T,null,[{p:'zucchini',g:30}],'dinner');saveMeal();
if(!JSON.parse(mem.get(lsKeyFor(id))).days[T])fail('twin meal not saved to her key');
if(JSON.parse(mem.get('purvi-hapki-v1')).days[T].meals.length!==1)fail('first kid data changed');
// смяна обратно
switchKid('main');if(S.profile.name!=='Ния'||S.days[T].meals.length!==1||st('apple')!=='trial')fail('switch back');
UI.tab='more';UI.msub='me';render();const V=els.view.innerHTML;if(!V.includes('Деца')||!V.includes('>Мая<')||!V.includes('>Ния<')||V.includes('data-act="kid-rm"'))fail('profile kids card');
kidsSheet();const B=els['sheet-body'].innerHTML;if(!B.includes('data-act="kid-sel"')||!B.includes('Близнак на Ния')||!B.includes('Копирай въведените храни (3)'))fail('kids sheet');closeSheet();
// резервно копие с две деца → възстановяване
const file={app:'parvi-hapki',v:2,kid:'main',kids:kidsList().map(k=>({id:k.id,name:k.name,birth:k.birth,data:k.id===KID?{profile:S.profile,prod:S.prod,days:S.days}:lsLoadFor(k.id)}))};
mem.clear();KIDS=[];S=emptyS();pendingImport=file;applyImport();
console.log('after import: kids',kidsList().map(k=>k.name).join(','),'| KID',KID,'| name',S.profile.name);
if(kidsList().length!==2||S.profile.name!=='Ния'||!lsLoadFor(id)||lsLoadFor(id).profile.name!=='Мая')fail('multi-kid import');
// премахване на второто дете
switchKid(id);UI.tab='more';UI.msub='me';render();if(!els.view.innerHTML.includes('data-act="kid-rm"'))fail('remove button');
removeKid();if(KID!=='main'||kidsList().length!==1||mem.has(lsKeyFor(id))||S.profile.name!=='Ния')fail('remove kid');
// изчезнало дете при зареждане → първото
console.log(process.exitCode?'SOME FAILED':'KIDS OK');
})();`);
