// Локален сървър за преглед на изградения сайт: node tools/serve.js parvi-hapki-site [порт]
const http=require('http'),fs=require('fs'),path=require('path');
const root=path.resolve(process.argv[2]||'parvi-hapki-site');const port=+process.argv[3]||8771;
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript','.json':'application/json','.webmanifest':'application/manifest+json','.png':'image/png','.svg':'image/svg+xml','.css':'text/css; charset=utf-8','.woff2':'font/woff2','.txt':'text/plain','.xml':'application/xml'};
http.createServer((q,s)=>{let p=decodeURIComponent(q.url.split('?')[0]);if(p.endsWith('/'))p+='index.html';const f=path.join(root,p);
  if(!f.startsWith(root)){s.writeHead(403);s.end();return}
  fs.readFile(f,(e,d)=>{if(e){s.writeHead(404);s.end('not found');return}s.writeHead(200,{'Content-Type':types[path.extname(f)]||'application/octet-stream'});s.end(d)})
}).listen(port,'127.0.0.1',()=>console.log('http://127.0.0.1:'+port+'/'));
