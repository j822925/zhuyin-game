import test from 'node:test';
import assert from 'node:assert/strict';
import {Race} from '../race-core.js';
const deck=[{label:'ㄅ'},{label:'ㄆ'}];
test('播音完成前不可搶答；先答對者只有一分',()=>{
 const r=new Race(deck);assert.ok(r.answer(0,'ㄅ').ignored);r.listenFinished();
 assert.equal(r.answer(1,'ㄅ').winner,1);assert.ok(r.answer(0,'ㄅ').ignored);
 assert.deepEqual(r.scores,[0,1]);assert.equal(r.rows[0].attempts[0],null);
});
test('答錯鎖定自己，不影響對方；不能亂按重試',()=>{
 const r=new Race(deck);r.listenFinished();assert.equal(r.answer(0,'ㄆ').resolved,false);
 assert.ok(r.answer(0,'ㄅ').ignored);assert.equal(r.answer(1,'ㄅ').winner,1);
 assert.deepEqual(r.scores,[0,1]);assert.equal(r.rows[0].attempts[0].correct,false);
});
test('兩方答錯本題無得分，可進入下一題；連點不跳題',()=>{
 const r=new Race(deck);assert.equal(r.next(),false);r.listenFinished();r.answer(0,'ㄆ');
 assert.equal(r.answer(1,'ㄆ').winner,null);assert.deepEqual(r.scores,[0,0]);
 assert.equal(r.next(),true);assert.equal(r.next(),false);assert.equal(r.open,false);
 r.listenFinished();r.answer(0,'ㄆ');r.next();assert.equal(r.finished,true);
 assert.ok(r.answer(0,'ㄆ').ignored);assert.equal(r.rows.length,2);
});
