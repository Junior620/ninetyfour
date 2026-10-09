import test from 'node:test';
import assert from 'node:assert/strict';
import { matchSummary, matchDateLabel, ticketStatusLabel, scoreLabel, filterNews, dateLabel, matches, publicPlayers, type ClubMatch } from '../src/lib/club';
import { newsArticles } from '../src/lib/data/news';
import { persistRecruitment } from '../src/lib/recruitment/persist';
import type { SupabaseClient } from '@supabase/supabase-js';

const fixture = (id: string, date: string, extra: Partial<ClubMatch> = {}): ClubMatch => ({id,date,teamId:'u18',season:'test',competition:'Test only',home:{name:'Home'},away:{name:'Away'},isHome:true,kickoff:null,timezone:'Africa/Douala',confirmed:true,status:'scheduled',homeScore:null,awayScore:null,updatedAt:'2026-10-07',source:'Test fixture',...extra});
test('next fixture differs from next home and excludes cancelled or postponed events', () => {
  const list=[fixture('postponed','2026-10-08',{status:'postponed'}),fixture('cancelled','2026-10-08',{status:'cancelled'}),fixture('away','2026-10-09',{isHome:false}),fixture('home','2026-10-10'),fixture('old','2026-10-01',{status:'finished',homeScore:2,awayScore:1})];
  const result=matchSummary(list,new Date('2026-10-07T12:00:00Z'));
  assert.equal(result.next?.id,'away'); assert.equal(result.nextHome?.id,'home'); assert.equal(result.last?.id,'old');
});
test('unknown scores never become 0–0 and real 0–0 is retained', () => {
  assert.equal(scoreLabel(fixture('a','2026-10-01',{status:'finished'})),'—');
  assert.equal(scoreLabel(fixture('a','2026-10-01',{status:'finished',homeScore:0,awayScore:0})),'0 – 0');
  assert.equal(scoreLabel(fixture('a','2026-10-01')),'VS');
});
test('empty and unknown-date fixtures remain honest',()=>{
  assert.equal(matches.length,0); assert.equal(publicPlayers.length,0);
  assert.equal(matchSummary([]).next,undefined);
  assert.equal(matchSummary([fixture('a','2026-10-07',{date:null})]).next,undefined);
});
test('dates respect the club timezone at midnight',()=>assert.match(dateLabel('2026-10-06T23:30:00Z','fr'),/7 octobre 2026/));

test('provisional dates are explicit and never become the next confirmed fixture', () => {
  const provisional = fixture('provisional', '2026-10-08', { confirmed: false });
  const confirmed = fixture('confirmed', '2026-10-10');
  assert.equal(matchDateLabel(provisional, 'fr'), 'Date à confirmer');
  assert.equal(matchDateLabel(provisional, 'en'), 'Date to be confirmed');
  assert.equal(matchSummary([provisional, confirmed], new Date('2026-10-07T12:00:00Z')).next?.id, 'confirmed');
  assert.equal(matchSummary([provisional], new Date('2026-10-07T12:00:00Z')).nextHome, undefined);
});

test('date-only fixtures expire at local midnight while known kickoff times expire exactly', () => {
  const douala = fixture('douala', '2026-10-08');
  assert.equal(matchSummary([douala], new Date('2026-10-08T22:59:59.999Z')).next?.id, 'douala');
  assert.equal(matchSummary([douala], new Date('2026-10-08T23:00:00Z')).next, undefined);
  const newYork = fixture('new-york', '2026-07-01', { timezone: 'America/New_York' });
  assert.equal(matchSummary([newYork], new Date('2026-07-02T03:59:59.999Z')).next?.id, 'new-york');
  assert.equal(matchSummary([newYork], new Date('2026-07-02T04:00:00Z')).next, undefined);
  const kickoff = fixture('kickoff', '2026-10-08', { kickoff: '2026-10-08T15:00:00+01:00' });
  assert.equal(matchSummary([kickoff], new Date('2026-10-08T14:00:00Z')).next?.id, 'kickoff');
  assert.equal(matchSummary([kickoff], new Date('2026-10-08T14:00:00.001Z')).next, undefined);
});

test('calendar dates retain their day and ticket states have distinct labels', () => {
  assert.equal(dateLabel('2026-10-08', 'en', 'America/New_York'), '8 October 2026');
  assert.equal(ticketStatusLabel('coming_soon', 'fr'), 'Billetterie bientôt ouverte');
  assert.equal(ticketStatusLabel('closed', 'en'), 'Ticket sales closed');
  assert.equal(new Set(['on_sale', 'sold_out', 'closed', 'coming_soon'].map(status => ticketStatusLabel(status as NonNullable<ClubMatch['ticket']>['status'], 'fr'))).size, 4);
});
test('news search ignores accents, combines archive/category and sorts chronologically',()=>{
  assert.ok(filterNews(newsArticles,'fr','education').some(a=>a.slug==='seminaire-education-leadership'));
  assert.equal(filterNews(newsArticles,'fr','','matches','2026').length,1);
  assert.equal(filterNews(newsArticles,'fr','introuvable-xyz').length,0);
  assert.equal(filterNews(newsArticles,'fr','','','1999').length,0);
  assert.equal(filterNews(newsArticles,'fr')[0].slug,'seminaire-education-leadership');
});

const uploads=[{bucket:'photos',path:'request/photo.png',body:Buffer.from('test'),contentType:'image/png'},{bucket:'pdfs',path:'request/form.pdf',body:Buffer.from('test'),contentType:'application/pdf'}];
function fakeClient(fail: 'upload'|'insert'|null) {
  const removed:string[]=[]; let inserted=false;
  const client={storage:{from:(bucket:string)=>({upload:async()=>({error:fail==='upload'&&bucket==='pdfs'?new Error('test'):null}),remove:async(paths:string[])=>{removed.push(...paths);return {error:null};}})},from:()=>({insert:()=>{inserted=true;return {select:()=>({single:async()=>({data:fail==='insert'?null:{id:'saved-id'},error:fail==='insert'?new Error('test'):null})})};}})} as unknown as SupabaseClient;
  return {client,removed,inserted:()=>inserted};
}
test('recruitment success requires durable storage and row',async()=>{
 const fake=fakeClient(null); assert.equal(await persistRecruitment(fake.client,uploads,{test:true}),'saved-id'); assert.deepEqual(fake.removed,[]); assert.ok(fake.inserted());
});
test('upload failure cleans only completed request uploads; no row inserted',async()=>{
 const fake=fakeClient('upload'); await assert.rejects(persistRecruitment(fake.client,uploads,{}),/upload_failed/); assert.deepEqual(fake.removed,['request/photo.png']); assert.equal(fake.inserted(),false);
});
test('database failure cannot report success and cleans this request files',async()=>{
 const fake=fakeClient('insert'); await assert.rejects(persistRecruitment(fake.client,uploads,{}),/storage_failed/); assert.deepEqual(fake.removed,['request/photo.png','request/form.pdf']);
});
