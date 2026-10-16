import fs from 'node:fs';
import assert from 'node:assert/strict';
const env=JSON.parse(fs.readFileSync('.matchlab-local/env.json','utf8'));
assert.equal(env.MATCHLAB_SUPABASE_URL,'http://127.0.0.1:55321');
const base='http://127.0.0.1:3100';const admin=JSON.parse(fs.readFileSync('.matchlab-local/admin.json','utf8'));
const result=await fetch(base+'/api/matchlab/auth/login',{method:'POST',headers:{origin:base,'content-type':'application/json'},body:JSON.stringify({email:admin.email,password:admin.password})});
if(!result.ok) throw new Error('Login '+result.status);
const cookie=result.headers.getSetCookie().map(c=>c.split(';')[0]).join('; ');
const checks=[];
for(const locale of ['fr','en']) for(const path of ['', '/accueil','/actualites','/actualites/lancement-programme-2026','/equipes','/saison','/galerie','/partenaires','/contact','/rejoindre']) {
 const url=`/${locale}${path}`; const t=performance.now();const r=await fetch(base+url);const html=await r.text();
 if(r.status!==200||!html.includes(`<html lang="${locale}"`))throw new Error(url+' '+r.status);
 checks.push({url,status:r.status,ms:Math.round(performance.now()-t),title:html.match(/<title>([^<]+)/)?.[1]});
}
for(const section of ['overview','matches','players','analyze','reports','analytics','video','alerts','exports','site','admin','ai']) {
 const url='/matchlab/'+section;const t=performance.now();const r=await fetch(base+url,{headers:{cookie}});await r.text();
 if(r.status!==200||!r.headers.get('x-robots-tag')?.includes('noindex'))throw new Error(url+' '+r.status);
 checks.push({url,status:r.status,ms:Math.round(performance.now()-t),noindex:true});
}
const dataTimes=[];
for(let i=0;i<5;i++){const t=performance.now();const r=await fetch(base+'/api/matchlab/data',{headers:{cookie}});const j=await r.json();if(!r.ok)throw new Error('data');dataTimes.push(Math.round(performance.now()-t));if(i===0)checks.push({url:'/api/matchlab/data',rows:Object.fromEntries(Object.entries(j.graph).map(([key,rows])=>[key,rows.length]))});}
const sitemap=await fetch(base+'/sitemap.xml').then(r=>r.text());if(sitemap.includes('/matchlab'))throw new Error('Private sitemap leak');
const output={date:new Date().toISOString(),environment:'Next 16.4.2 compiled Webpack, local Windows Chromium/HTTP, no network throttling',checks,dataTimes};
fs.writeFileSync('docs/matchlab/routes-results.json',JSON.stringify(output,null,2));console.log('Public/private route checks:',checks.length,'Data response ms:',dataTimes.join(','));
