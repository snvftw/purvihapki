// Тест на няколко деца в режим база данни (Claude): пътища, абонаменти и смяна – с изкуствена база в паметта
const fs=require('fs');
const html=fs.readFileSync(process.argv[2],'utf8');
const src=html.slice(html.lastIndexOf('<script>')+8,html.lastIndexOf('</script>')).replace(/\ninit\(\);\s*$/,'\n');
const els={};
function el(id){return els[id]||(els[id]={id,innerHTML:'',textContent:'',hidden:id==='sheet',value:'',checked:false,scrollTop:0,dataset:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},querySelector(){return el('x')},querySelectorAll(){return []},focus(){},setSelectionRange(){}})}
global.window=global;global.localStorage={getItem(){return null},setItem(){},removeItem(){}};
global.document={documentElement:{style:{setProperty(){}}},querySelector:s=>el(s.replace('#','')),querySelectorAll:()=>[],getElementById:id=>els[id]||null,addEventListener(){},body:{classList:{add(){},remove(){},toggle(){}}}};
global.scrollTo=()=>{};global.setInterval=()=>0;global.addEventListener=()=>{};global.navigator={};
// изкуствена база: документи по път, абонаменти с отписване
const docs={'app/profile':{name:'Ния',birth:'2026-04-24',onb:1},'app/products':{st:{carrot:{s:'ok'}},custom:[]}};const subs=[];
const tick=()=>new Promise(r=>setTimeout(r,5));
const snapDoc=p=>({exists:!!docs[p],data:()=>JSON.parse(JSON.stringify(docs[p]))});
const snapCol=p=>({docs:Object.keys(docs).filter(k=>k.startsWith(p+'/')&&k.split('/').length===p.split('/').length+1).map(k=>({id:k.split('/').pop(),data:()=>JSON.parse(JSON.stringify(docs[k]))})),metadata:{fromCache:false}});
const fire=p=>subs.filter(s=>s.on).forEach(s=>{if(s.col?p.startsWith(s.p+'/')&&p.split('/').length===s.p.split('/').length+1:s.p===p)s.cb(s.col?snapCol(s.p):snapDoc(s.p))});
const fakeDb={
  doc:p=>({onSnapshot:(cb)=>{const s={p,cb,on:true};subs.push(s);setTimeout(()=>s.on&&cb(snapDoc(p)),0);return ()=>{s.on=false}},
    set:async d=>{docs[p]=JSON.parse(JSON.stringify(d));fire(p)},delete:async()=>{delete docs[p];fire(p)}}),
  collection:p=>({onSnapshot:(cb)=>{const s={p,cb,on:true,col:true};subs.push(s);setTimeout(()=>s.on&&cb(snapCol(p)),0);return ()=>{s.on=false}}})};
global.claude={use:async n=>n==='db'?fakeDb:null};
const fail=m=>{console.log('FAIL',m);process.exitCode=1};
eval(src+`
;(async function(){
const T=today();
await init();await tick();
const live=()=>subs.filter(s=>s.on).map(s=>s.p).sort().join(' ');
console.log('db mode',MODE,'| live:',live());
if(MODE!=='db'||S.profile.name!=='Ния'||st('carrot')!=='ok')fail('main kid loaded from old paths');
if(live()!=='app/freezer app/growth app/kids app/plan app/products app/profile days')fail('main subscriptions');
// записите на първото дете отиват на старите пътища
ensureDay(T).meals.push({id:'m1',slot:'lunch',items:[{p:'carrot',g:30}],react:[]});saveDay(T);await tick();
if(!docs['days/'+T])fail('main day path');
// добавяне на близнак → нови пътища, старите абонаменти спрени
const id=addKid({name:'Мая',birth:'2026-04-24',sex:'f',twin:true,copy:true});await tick();await tick();
console.log('after add: KID',KID,'| name',S.profile.name,'| live:',live());
if(!docs['kids/'+id+'/app/profile']||docs['kids/'+id+'/app/profile'].name!=='Мая')fail('twin profile path');
if(!docs['app/kids']||docs['app/kids'].list.length!==2)fail('kids registry doc');
if(S.profile.name!=='Мая'||st('carrot')!=='ok'||Object.keys(S.days).length)fail('twin data');
if(!live().includes('kids/'+id+'/days')||live().includes(' days')||live().split(' ').includes('app/profile'))fail('twin subscriptions');
ensureDay(T).meals.push({id:'m2',slot:'dinner',items:[{p:'zucchini',g:30}],react:[]});saveDay(T);await tick();
if(!docs['kids/'+id+'/days/'+T]||docs['days/'+T].meals.length!==1)fail('twin day path / main untouched');
// обратно към първото
switchKid('main');await tick();await tick();
if(S.profile.name!=='Ния'||S.days[T].meals.length!==1||!live().split(' ').includes('app/profile'))fail('switch back');
// премахване на близнака изтрива само неговите документи
switchKid(id);await tick();await tick();removeKid();await tick();await tick();
const left=Object.keys(docs).filter(k=>k.startsWith('kids/'));console.log('after remove: KID',KID,'| kids docs left',left.length,'| registry',JSON.stringify(docs['app/kids']));
if(KID!=='main'||left.length||!docs['app/profile']||!docs['days/'+T]||docs['app/kids'].list.length!==1)fail('remove twin');
console.log(process.exitCode?'SOME FAILED':'KIDS DB OK');
})();`);
