// Тест на v4: нови продукти, азбучен ред, „нов“ в дневника, „Колко често“, иконки, „Полезно“
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
// 1) продукти: 180, всеки с поднасяне; новите алергени са в групите
console.log('products',RAW.length,'combos',COMBOS.length,'articles',ARTICLES.length);
if(RAW.length!==180)fail('products '+RAW.length);
['sheep_yogurt','creamcheese'].forEach(x=>{if(!ALLERGENS[0][2].includes(x))fail('milk '+x)});
if(!ALLERGENS.find(a=>a[0]==='gluten')[2].includes('rye'))fail('gluten rye');
// 2) азбучен ред в списъка по категории
S.profile.birth='2026-04-24';bump();UI.tab='products';UI.psub='list';UI.pc='fruit';render();
const names=[...els.view.innerHTML.matchAll(/<span class="nm">([^<]+)<\\/span>/g)].map(m=>m[1]);
const sorted=names.slice().sort((a,b)=>a.localeCompare(b,'bg'));
console.log('fruit list:',names.slice(0,5).join(', '),'…');
if(!names.length||names.join('|')!==sorted.join('|'))fail('not alphabetical');
// филтър по възраст: на 6 м – само продукти от 6 м; останалите с „Покажи и за по-късно“; търсенето търси във всички
const shown=html=>[...html.matchAll(/data-p="([^"]+)"/g)].map(m=>m[1]).filter(id=>P[id]);
let ids=shown(els.view.innerHTML);console.log('fruit at 6m:',ids.length,'| later btn',els.view.innerHTML.includes('data-act="pa"'));
if(ids.some(id=>P[id].a>6&&!st(id)))fail('age filter shows later products');
if(!els.view.innerHTML.includes('Покажи и за по-късно')||!els.view.innerHTML.includes('id="age-sel"'))fail('later button / age select');
UI.pa='all';render();const all=shown(els.view.innerHTML);if(all.length<=ids.length||!all.some(id=>P[id].a>6))fail('all ages');
UI.pa='8';render();if(shown(els.view.innerHTML).some(id=>P[id].a>8&&!st(id)))fail('age 8 filter');
UI.pa='auto';UI.q='смокини';render();if(!shown(els.view.innerHTML).includes('fig'))fail('search ignores age');UI.q='';
UI.psub='check';render();if(shown(els.view.innerHTML).some(id=>P[id].a>6&&!st(id)))fail('checklist age filter');UI.psub='list';
// свой продукт за 24 м, бебе на 14 м: изборът показва 14 м, бутонът – „от 24 м“
S.prod.custom=[{id:'c_t',n:'Тест продукт',c:'fruit',a:24,e:'n',g:8,f:''}];buildProducts();const bb=S.profile.birth;S.profile.birth=addDays(T,-14*30.5|0);bump();UI.pa='auto';render();
const AV=els.view.innerHTML;if(!/<option value="14" selected>/.test(AV)||!AV.includes('от 24 м нататък'))fail('custom age select/button');
S.prod.custom=[];buildProducts();S.profile.birth=bb;bump();
UI.pc='';
// 3) „нов“: отбелязан като въведен → първото хранене не е „нов“; изпитване → „нов“ в деня му
S.prod.st.carrot={s:'ok'};
mealSheet(T,null,[{p:'carrot',g:30}],'lunch');saveMeal();
mealSheet(T,null,[{p:'pumpkin',g:30}],'dinner');saveMeal();
console.log('carrot',st('carrot'),newDay('carrot'),'| pumpkin',st('pumpkin'),newDay('pumpkin'));
if(newDay('carrot')!==null)fail('marked product counted as new');
if(newDay('pumpkin')!==T)fail('trial product not new today');
UI.tab='calendar';UI.calsub='diary';UI.sel=T;render();let V=els.view.innerHTML;
const tl=V.slice(V.indexOf('class="tl"'));
const tagAfter=n=>{const i=tl.indexOf(n);return i>=0&&tl.slice(i,i+80).includes('t-trial">нов')};
console.log('timeline: carrot new',tagAfter('Морков'),'| pumpkin new',tagAfter('Тиква'));
if(tagAfter('Морков')||!tagAfter('Тиква'))fail('timeline new tags');
if(newByDay()[T]!==1)fail('calendar new dot count '+newByDay()[T]);
// 4) колко често: яйце през ден
S.prod.st.egg={s:'ok'};S.prod.freq={egg:2};
S.days[addDays(T,-1)]={meals:[{id:'e1',slot:'breakfast',items:[{p:'egg',g:20}],react:[]}],stools:[]};bump();
let f=freqInfo('egg');console.log('egg after yesterday:',JSON.stringify({next:f.next,due:f.due}));
if(f.due||f.next!==addDays(T,1))fail('egg not due today');
if(!freqOn(addDays(T,1)).some(x=>x.id==='egg')||freqOn(addDays(T,2)).some(x=>x.id==='egg')||!freqOn(addDays(T,3)).some(x=>x.id==='egg'))fail('egg schedule');
S.days[addDays(T,-1)].meals=[];S.days[addDays(T,-3)]={meals:[{id:'e2',slot:'breakfast',items:[{p:'egg',g:20}],react:[]}],stools:[]};bump();
f=freqInfo('egg');console.log('egg after 3 days ago:',JSON.stringify({due:f.due,late:f.late}));
if(!f.due||f.late!==1)fail('egg overdue');
UI.tab='home';render();V=els.view.innerHTML;if(!V.includes('закъснява с 1 ден'))fail('home due row');
const ics=freqIcs('egg');if(!ics.includes('RRULE:FREQ=DAILY;INTERVAL=2')||!ics.includes('BEGIN:VALARM')||!ics.endsWith('END:VCALENDAR\\r\\n'))fail('ics');
if(ics.split('\\r\\n').some(l=>Buffer.byteLength(l)>75))fail('ics line > 75 octets');
// реакция → редовното напомняне спира; изпитване без хранене → не е „нов“
S.prod.st.egg={s:'react'};bump();if(freqInfo('egg')||freqOn(T).some(x=>x.id==='egg'))fail('freq after reaction');S.prod.st.egg={s:'ok'};bump();
S.prod.st.kiwi={s:'trial',d0:T};bump();if(newDay('kiwi')!==null)fail('trial without meal counted as new');delete S.prod.st.kiwi;bump();
if(!freqGcal('egg').includes(encodeURIComponent('RRULE:FREQ=DAILY;INTERVAL=2')))fail('gcal recur');
productSheet('egg');let B=els['sheet-body'].innerHTML;if(!B.includes('Колко често')||!B.includes('data-act="freq-ics"'))fail('freq card in product');closeSheet();
productSheet('apple');B=els['sheet-body'].innerHTML;if(B.includes('Колко често'))fail('freq card on intro tab of new product');
productSheet('apple','hist');B=els['sheet-body'].innerHTML;if(!B.includes('Колко често'))fail('freq card in history');closeSheet();
// 5) иконки: белтък, желязо, фризер
let n=nutOf(['chicken','potato'].map(i=>P[i]));if(!n.prot||!n.fe||!n.fz)fail('chicken potato nut '+JSON.stringify(n));
n=nutOf(['avocado','banana'].map(i=>P[i]));if(n.prot||n.fz)fail('avocado banana nut '+JSON.stringify(n));
n=nutOf(['salmon','potato','broccoli'].map(i=>P[i]));if(!n.o3||!n.c||!n.alg.includes('риба')||n.choke.length)fail('salmon nut '+JSON.stringify(n));
n=nutOf(['oats','peanut','banana'].map(i=>P[i]));console.log('oats+peanut+banana:',JSON.stringify(n));
if(!n.alg.includes('фъстък')||!n.alg.includes('глутен')||!n.choke.includes('фъстъчено масло'))fail('allergen/choke list');
n=nutOf(['shrimp','fish_white','blueberry'].map(i=>P[i]));if(!n.alg.includes('ракообразни')||!n.choke.includes('боровинки')||n.choke.includes('бяла риба'))fail('shrimp/blueberry '+JSON.stringify(n));
UI.tab='combos';UI.csub='ideas';UI.cm='all';render();V=els.view.innerHTML;
for(const c of ['n-prot','n-fe','n-fz','n-nofz','n-c','n-o3','n-alg','n-choke'])if(!V.includes(c))fail('combo icon '+c);
if(V.includes('t-abs">Желязо + витамин C<'))fail('redundant iron+C tag');
UI.csub='menu';render();if(!els.view.innerHTML.includes('за фризер'))fail('menu legend');
// 5а) планиране: хранене с бъдеща дата отива в менюто; бутон „Планирай“ на комбинациите
const fd=addDays(T,3);mealSheet(fd,null,[{p:'carrot',g:''},{n:'Тест обяд',ps:['potato','zucchini'],g:''}],'lunch');
if(!els['sheet-body'].innerHTML.includes('Добави в менюто')||els['sheet-body'].innerHTML.includes('Хареса ли?'))fail('future meal form');
saveMeal();console.log('future meal → plan:',planFor(fd).map(dishName).join(' | '),'| week',UI.week);
if(S.days[fd]&&(S.days[fd].meals||[]).length)fail('future meal saved as eaten');
if(planFor(fd).length!==2||UI.week!==mondayOf(fd))fail('future meal not in plan');
UI.tab='combos';UI.csub='menu';render();if(!els.view.innerHTML.includes('Тест обяд')||!els.view.innerHTML.includes('>Морков<'))fail('plan not in menu');
UI.csub='ideas';render();if(!els.view.innerHTML.includes('data-act="combo-plan"'))fail('combo plan button');
delete S.plan.days[fd];UI.week=mondayOf(T);bump();
// стари хранения за бъдещи дни → бутон „Премести в менюто“
const fd2=addDays(T,2);S.days[fd2]={meals:[{id:'f1',slot:'dinner',items:[{n:'Фритата',ps:['egg','broccoli'],g:0}],react:[]}],stools:[]};bump();
UI.csub='menu';render();if(!els.view.innerHTML.includes('data-act="move-future"'))fail('future meals alert');
moveFutureMeals();if(S.days[fd2]||!planFor(fd2).some(e=>e.n==='Фритата'&&e.slot==='dinner'))fail('move future meals');
delete S.plan.days[fd2];UI.week=mondayOf(T);bump();
// търсачка в комбинациите: по продукт, във всички рецепти; без филтъра „От въведените“
UI.csub='ideas';UI.cm='ready';UI.cq='тиква';render();V=els.view.innerHTML;
const hits=[...V.matchAll(/<h3 style="flex:1;min-width:0">([^<]+)<\\/h3>/g)].map(m=>m[1]);console.log('search тиква:',hits.length,'|',hits.slice(0,3).join(' | '));
if(!V.includes('id="c-search"')||!V.includes('Резултати')||!hits.length)fail('combo search');
if(V.includes('data-act="cm"'))fail('filter chips shown during search');
const allHit=COMBOS.filter(c=>c.ids.some(i=>/тиква/i.test(P[i].n))||/тиква/i.test(c.n));if(hits.length<allHit.length)fail('search misses combos '+hits.length+'/'+allHit.length);
UI.cq='несъществуващо';render();if(!els.view.innerHTML.includes('Няма комбинации с'))fail('search empty state');
S.profile.style='pieces';UI.cq='яйце';bump();render();if(!els.view.innerHTML.includes('чинии с „яйце“'))fail('plate search');S.profile.style='puree';UI.cq='';bump();
// 5б) ежедневни отметки: витамин D и вода
UI.tab='home';render();V=els.view.innerHTML;
if(!V.includes('Всеки ден')||!V.includes('data-k="vitd"')||!V.includes('data-k="water"'))fail('daily card');
const dk=addDays(T,-5);S.days[dk]={meals:[],stools:[],daily:{vitd:1}};saveDay(dk);if(!S.days[dk])fail('day with only daily ticks deleted');
S.days[addDays(T,-1)].daily={vitd:1};ensureDay(T).daily={vitd:1,water:1};bump();
UI.tab='home';render();V=els.view.innerHTML;console.log('daily:',(V.match(/dly on/g)||[]).length,'on | streak',dailyStreak('vitd'));
if((V.match(/class="dly on"/g)||[]).length!==2||!V.includes('2 дни подред'))fail('daily ticks / streak');
if(!reportText().includes('Витамин D: отбелязан в 3 от последните 30 дни'))fail('report vitd');
const b0=S.profile.birth;S.profile.birth=addDays(T,-150);bump();if(dailyItems(T).some(x=>x[0]==='water'))fail('water before 6 m');S.profile.birth=b0;
S.profile.vitd=false;bump();if(dailyItems(T).some(x=>x[0]==='vitd'))fail('vitd off');S.profile.vitd=true;bump();
UI.tab='calendar';UI.calsub='diary';UI.sel=addDays(T,-1);render();if(!els.view.innerHTML.includes('Ежедневни отметки'))fail('diary daily');UI.sel=T;
// 6) „Полезно“
UI.tab='more';UI.msub='learn';render();V=els.view.innerHTML;
if(!V.includes('Прочети статията')||!V.includes('Бърза справка'))fail('learn view');
ARTICLES.forEach(a=>{
  if(!a.k||!a.t||!(a.sum||[]).length||!a.body||!(a.src||[]).length)fail('article fields '+a.k);
  const cites=[...a.body.matchAll(/\\[(\\d+)\\]/g)].map(m=>+m[1]);if(cites.some(c=>c<1||c>a.src.length))fail('article cites '+a.k);
  articleSheet(a.k);if(!els['sheet-body'].innerHTML.includes('Източници'))fail('article sheet '+a.k);closeSheet();
});
UI.tab='home';render();if(!els.view.innerHTML.includes('data-act="art" data-v="vitd"'))fail('daily card article link');UI.tab='more';
['start','allergens','onenew','rotation','reactions','iron','vitd'].forEach(k=>{if(!ARTICLES.find(a=>a.k===k))fail('missing article '+k)});
UI.msub='me';render();if(!els.view.innerHTML.includes('Профил')||!els.view.innerHTML.includes('Редовни храни'))fail('profile view');
UI.tab='home';render();if(!els.view.innerHTML.includes('class="card learn"'))fail('home learn card');
// 7) „Прогрес“: обобщение и графики
const pd=progressData();const ci=counts().intro;console.log('progress: start',pd.start,'days',pd.span+1,'pre',pd.pre,'last',pd.cum[pd.cum.length-1][1],'intro',ci,'| weeks',pd.weeks.map(w=>w.n).join(','));
if(pd.cum[pd.cum.length-1][1]!==ci)fail('cumulative end != introduced');
if(pd.cum.some((p,i)=>i&&p[1]<pd.cum[i-1][1]))fail('cumulative not monotonic');
if(pd.variety.length!==14)fail('variety days');
// продукт с първо хранене, записано за бъдеща дата, също влиза в линията
S.prod.st.mango={s:'ok'};S.days[addDays(T,4)]={meals:[{id:'fm',slot:'lunch',items:[{p:'mango',g:10}],react:[]}],stools:[]};bump();
let pd2=progressData();if(pd2.cum[pd2.cum.length-1][1]!==counts().intro)fail('future-dated intro not counted');delete S.days[addDays(T,4)];bump();
UI.tab='more';UI.msub='prog';render();V=els.view.innerHTML;
for(const s of ['Накратко','Въведени продукти във времето','Нови продукти по седмици','Разнообразие по дни','По категории','Таблица по седмици'])if(!V.includes(s))fail('progress section '+s);
if((V.match(/<svg class="chart"/g)||[]).length!==3)fail('progress charts');
if(/NaN|undefined/.test(V))fail('progress NaN/undefined');
const sv=S;S={profile:defProfile(),prod:{st:{},custom:[]},days:{},growth:{list:[]},plan:{days:{},shop:{}},freezer:{items:[]}};bump();render();if(!els.view.innerHTML.includes('Още няма какво да покажем'))fail('progress empty');S=sv;bump();
// без техники за първа помощ при задавяне (собственикът ги махна като рисковани)
if(/плешк|натискан|удар/i.test(CHOKE_HTML)||!CHOKE_HTML.includes('112'))fail('choke first-aid text');
const RX=ARTICLES.find(a=>a.k==='reactions').body;if(/адреналин|легнал/i.test(RX)||!RX.includes('112'))fail('anaphylaxis first-aid text');
// всички изгледи без грешки
for(const t of ['home','products','combos','calendar','more'])for(const s of ['list','check','plan']){UI.tab=t;UI.psub=s;for(const m of ['learn','me']){UI.msub=m;render()}}
console.log(process.exitCode?'SOME FAILED':'V4 OK');
})();`);
