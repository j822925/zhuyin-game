import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {BASE,COMPOUNDS,normalizeConfig,poolFor,optionsFor,questionDeck} from '../core.js';
test('今日任務同時放聲符、韻符與結合韻，讀入同一聽音題庫且音檔正確',()=>{
 const cfg=normalizeConfig({symbols:['ㄅ','ㄠ','一ㄠ','ㄧㄠ'],compounds:[]});const pool=poolFor('single',cfg,[]);
 assert.deepEqual(pool.map(q=>q.label),['ㄅ','ㄠ','ㄧㄠ']);assert.equal(pool[0].audio,'audio/audio_F1.WAV');assert.equal(pool[2].audio,'audio/compound/c05.mp3');
 assert.equal(questionDeck(pool,10).length,10);
});
test('舊結合韻分頁繼續合併讀取並去重，只有結合韻也可玩',()=>{
 const cfg=normalizeConfig({symbols:['ㄠ','ㄧㄠ'],compounds:['ㄧㄠ','ㄨㄚ']});assert.deepEqual(poolFor('single',cfg,[]).map(x=>x.label),['ㄠ','ㄧㄠ','ㄨㄚ']);
 assert.equal(poolFor('single',normalizeConfig({symbols:[],compounds:['ㄧㄠ']}),[]).length,1);
});
test('已教 ㄠ / ㄧㄠ 優先同場辨音，未教結合韻不自動出現',()=>{
 const cfg=normalizeConfig({symbols:['ㄅ','ㄆ','ㄠ','ㄧ','ㄧㄠ']});const pool=poolFor('single',cfg,[]);
 for(const label of ['ㄠ','ㄧㄠ'])for(let i=0;i<30;i++)assert.deepEqual(new Set(optionsFor(pool.find(q=>q.label===label),pool,2).map(q=>q.label)),new Set(['ㄠ','ㄧㄠ']));
 const taught=poolFor('single',normalizeConfig({symbols:['ㄠ','ㄧ']}),[]);assert.ok(!taught.some(q=>q.label==='ㄧㄠ'));assert.equal(optionsFor(taught[0],taught,4).length,2);
});
test('全部教完可納入 37 單音與 22 結合韻；拼音仍需已教範圍',()=>{
 const cfg=normalizeConfig({symbols:[...BASE,...COMPOUNDS]});assert.equal(poolFor('single',cfg,[]).length,59);
 const examples=[{initial:'ㄅ',final:'ㄠ',word:'包'},{initial:'ㄅ',final:'ㄧㄠ',word:'標'}];
 assert.deepEqual(poolFor('spelling',normalizeConfig({symbols:['ㄅ','ㄠ','ㄧ']}),examples).map(q=>q.word),['包']);
 assert.deepEqual(poolFor('spelling',normalizeConfig({symbols:['ㄅ','ㄠ','ㄧㄠ']}),examples).map(q=>q.word),['包','標']);
});
test('學生首頁只保留聽音與拼音兩張卡，保留 single 紀錄識別',()=>{
 const app=readFileSync(new URL('../app.js',import.meta.url),'utf8');assert.ok(!app.includes("['compound','river'"));assert.ok(app.includes("['single','forest'"));assert.ok(app.includes("['spelling','workshop'"));
});
