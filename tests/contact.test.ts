import test from 'node:test';
import assert from 'node:assert/strict';
import { POST } from '../src/app/api/contact/route';

const data={name:'Test User',email:'test@example.invalid',subject:'Test subject',message:'A complete message that must reach the academy.',locale:'fr'};
let requestId=0;
const request=(body:unknown)=>new Request('http://localhost/api/contact',{method:'POST',headers:{'Content-Type':'application/json','x-forwarded-for':`test-${++requestId}`},body:JSON.stringify(body)});
test('contact receipt and failure paths (all external requests mocked)', async(t)=>{
  const originalFetch=globalThis.fetch;
  const keys=['RESEND_API_KEY','EMAIL_FROM','ADMIN_EMAIL','ADMIN_NOTIFICATION_EMAIL','SENDER_EMAIL'];
  const original=keys.map(k=>process.env[k]);
  let calls:Record<string,unknown>[]=[];
  let failedCall=0;
  globalThis.fetch=async (_url,options)=>{
    const body=JSON.parse(String(options?.body));calls.push(body);
    return new Response(JSON.stringify(calls.length===failedCall?{name:'validation_error',message:'Test failure'}:{id:'mock-email-id'}),{status:calls.length===failedCall?422:200,headers:{'Content-Type':'application/json'}});
  };
  try {
    keys.forEach(k=>delete process.env[k]);
    await t.test('unconfigured delivery returns 503, never success',async()=>{const res=await POST(request(data));assert.equal(res.status,503);assert.equal((await res.json()).success,false);assert.equal(calls.length,0);});
    process.env.RESEND_API_KEY='re_test_only';process.env.EMAIL_FROM='academy@example.invalid';process.env.ADMIN_EMAIL='admin@example.invalid';
    await t.test('validation errors return 400 without sending',async()=>{assert.equal((await POST(request({...data,message:''}))).status,400);assert.equal(calls.length,0);});
    await t.test('failed admin delivery does not send a misleading acknowledgment',async()=>{calls=[];failedCall=1;const res=await POST(request(data));assert.equal(res.status,503);assert.equal(calls.length,1);});
    await t.test('complete message is sent; ack failure still reports confirmed receipt',async()=>{calls=[];failedCall=2;const res=await POST(request({...data,idempotencyKey:'ack-fails-unique'}));const json=await res.json();assert.equal(res.status,200);assert.equal(json.success,true);assert.equal(json.emailSent,false);assert.ok(String(calls[0].text).includes(data.message));});
    await t.test('retries reuse receipt without duplicate email',async()=>{calls=[];failedCall=0;const body={...data,idempotencyKey:'successful-request-unique'};const first=await (await POST(request(body))).json();const second=await (await POST(request(body))).json();assert.equal(first.reference,second.reference);assert.equal(calls.length,2);});
  } finally {globalThis.fetch=originalFetch; keys.forEach((k,i)=>{if(original[i]===undefined)delete process.env[k];else process.env[k]=original[i];});}
});
