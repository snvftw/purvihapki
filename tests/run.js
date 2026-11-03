// Пуска всички тестове върху приложението: node tests/run.js
const {execFileSync}=require('child_process');const fs=require('fs');const path=require('path');
const app=path.join(__dirname,'..','parvi-hapki.html');let bad=0;
for(const f of fs.readdirSync(__dirname).filter(x=>x.startsWith('test-')&&x.endsWith('.js'))){
  try{const out=execFileSync(process.execPath,[path.join(__dirname,f),app],{encoding:'utf8',timeout:60000});
    const last=out.trim().split('\n').pop();const ok=!/FAIL/.test(out);if(!ok)bad++;console.log((ok?'OK   ':'FAIL ')+f+' – '+last);if(!ok)console.log(out)}
  catch(e){bad++;console.log('FAIL '+f+'\n'+(e.stdout||'')+(e.stderr||e.message))}
}
process.exit(bad?1:0);
