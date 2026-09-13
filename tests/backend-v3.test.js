import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import {readFileSync} from 'node:fs';
function backend(){
 const tables={'班級名冊':[['座號','姓名','在籍'],[1,'學生甲',true],[2,'學生乙',true]],'過關紀錄':[['時間','座號']],'今日任務':[['ㄅ'],['ㄆ']]};
 function sheet(name){if(!tables[name])return null;return {getLastRow:()=>tables[name].length,appendRow:r=>tables[name].push(r),setFrozenRows(){},getRange:(row,col,count=1,width=1)=>({getValues:()=>typeof row==='string'?tables[name].slice(1):tables[name].slice(row-1,row-1+count).map(r=>Array.from({length:width},(_,i)=>r[col-1+i]??'')),createTextFinder:id=>({matchEntireCell:()=>({findNext:()=>tables[name].some(r=>r[5]===id)?{}:null})})})};}
 let locked=false;const ctx=vm.createContext({Math:Object.assign(Object.create(Math),{random:()=>0}),SpreadsheetApp:{getActiveSpreadsheet:()=>({getSheetByName:sheet,insertSheet:n=>{tables[n]=[];return sheet(n);}}),flush(){}},ContentService:{MimeType:{JSON:'json'},createTextOutput:text=>({text,setMimeType(){return this;}})},Utilities:{getUuid:()=>crypto.randomUUID()},LockService:{getScriptLock:()=>({waitLock(){assert.equal(locked,false);locked=true;},hasLock:()=>locked,releaseLock(){locked=false;}})}});
 vm.runInContext(readFileSync(new URL('../backend/game-api.gs',import.meta.url),'utf8'),ctx);
 ctx.requireRequestAuth_=()=>{}; // Business-rule tests; real auth is tested in auth.test.js.
 return {tables,get:p=>p.api==='wallet'?ctx.wallet_(String(p.seat).padStart(2,'0')):p.api==='status'?{saved:ctx.findRound_(sheet('過關紀錄'),p.id)||ctx.findRound_(sheet('測試紀錄'),p.id)}:p.api==='draw-status'?{character:tables['角色交易'].find(r=>r[5]===p.id)?.[3]}:JSON.parse(ctx.doGet({parameter:p}).text),post:d=>JSON.parse(ctx.doPost({postData:{contents:JSON.stringify(d)}}).text)};
}
const practice=(seat='01')=>({roundId:crypto.randomUUID(),seat,total:10,mistakes:0,mode:'single',results:Array.from({length:10},()=>({target:'ㄅ',firstCorrect:true,errors:0,seconds:1}))});
test('15 號成績隔離、去重；學生及老師星星各自計算',()=>{const b=backend(),p=practice('15');assert.equal(b.post(p).saved,true);assert.equal(b.post(p).duplicate,true);assert.equal(b.tables['過關紀錄'].length,1);assert.equal(b.tables['測試紀錄'].length,2);assert.equal(b.get({api:'wallet',seat:'15'}).stars,2);assert.equal(b.get({api:'wallet',seat:'01'}).stars,0);assert.equal(b.get({api:'status',id:p.roundId}).saved,true);});
test('搶答分数及獎勵獨立，未搶到不算答錯，不污染練習表',()=>{const b=backend(),p={kind:'race',roundId:crypto.randomUUID(),seats:['01','15'],mode:'single',total:10,results:Array.from({length:10},()=>({target:'ㄅ',winner:0,attempts:[{value:'ㄅ',correct:true},null]}))};assert.equal(b.post(p).saved,true);assert.equal(b.post(p).duplicate,true);assert.equal(b.tables['過關紀錄'].length,1);assert.equal(b.get({api:'wallet',seat:'01'}).stars,2);assert.equal(b.get({api:'wallet',seat:'15'}).stars,1);assert.equal(b.post({...p,roundId:crypto.randomUUID(),results:[{...p.results[0],winner:1}]}).saved,false);});
test('轉蛋重送不重扣，重複加一糖果；不能透支',()=>{const b=backend();for(let i=0;i<3;i++)b.post(practice());const p={kind:'gacha',roundId:crypto.randomUUID(),seat:'01',category:'animal'};assert.equal(b.post(p).duplicate,true);assert.equal(b.post(p).duplicateRequest,true);const w=b.get({api:'wallet',seat:'01'});assert.equal(w.stars,2);assert.equal(w.candies,1);assert.equal(b.get({api:'draw-status',id:p.roundId}).character,'rabbit');assert.equal(b.post({...p,roundId:crypto.randomUUID()}).saved,false);assert.equal(b.tables['角色交易'].length,2);});
test('50 糖果兌換指定角色，49 不可換；重送同一交易不重扣',()=>{const b=backend();b.tables['角色交易']=[['時間','座號'],[new Date(),1,'fixture','rabbit',0,'fixture',49,true,'']];const p={kind:'redeem',roundId:crypto.randomUUID(),seat:'01',character:'moon'};assert.equal(b.post(p).saved,false);b.tables['角色交易'][1][6]=50;assert.equal(b.post(p).saved,true);assert.equal(b.post(p).duplicateRequest,true);const w=b.get({api:'wallet',seat:'01'});assert.equal(w.candies,0);assert.ok(w.owned.includes('moon'));});
const imperfect=(mode='single',seat='01')=>{const p=practice(seat);p.mode=mode;p.mistakes=1;p.results[0]={...p.results[0],firstCorrect:false,errors:1};return p;};
test('答錯回合 0 星，第三回合 1 星；重送不增加毅力次數',()=>{
 const b=backend();for(let i=0;i<3;i++){const p=imperfect();assert.equal(b.post(p).saved,true);assert.equal(b.post(p).duplicate,true);}
 const w=b.get({api:'wallet',seat:'01'});assert.equal(w.stars,1);assert.equal(w.practiceRounds,3);
});
test('拼音全對 3 星；拼音兩回合 1 毅力星，與其他關卡分開',()=>{
 const b=backend();b.post(imperfect());b.post(imperfect('spelling'));assert.equal(b.get({api:'wallet',seat:'01'}).stars,0);
 b.post(imperfect('spelling'));assert.equal(b.get({api:'wallet',seat:'01'}).stars,1);
 const p=practice();p.mode='spelling';b.post(p);const w=b.get({api:'wallet',seat:'01'});assert.equal(w.stars,4);assert.equal(w.practiceRounds,1);assert.equal(w.spellingRounds,3);
});
test('轮流比賽勝方 2 星、負方 1 星，平手各 1，不疊單人全對',()=>{
 for(const tie of [false,true]){
 const b=backend(),a=practice('01'),z=tie?practice('15'):imperfect('single','15');
 const c={kind:'turn',seats:['01','15'],rounds:[a,z].map(({total,mistakes,results})=>({total,mistakes,results}))};
 a.competition=c;z.competition=c;assert.equal(b.post(a).saved,true);assert.equal(b.post(z).saved,true);
 assert.equal(b.get({api:'wallet',seat:'01'}).stars,tie?1:2);assert.equal(b.get({api:'wallet',seat:'15'}).stars,1);
 assert.equal(b.post({...a,roundId:crypto.randomUUID(),mistakes:2}).saved,false);
 }
});
test('舊版短回合仍能補存但不領新獎勵；新設定固定 10 題',()=>{
 const b=backend(),p=practice();p.total=5;p.results=p.results.slice(0,5);assert.equal(b.post(p).saved,true);
 assert.equal(b.get({api:'wallet',seat:'01'}).stars,0);assert.equal(b.get({api:'wallet',seat:'01'}).practiceRounds,0);assert.equal(b.get({api:'config'}).questions,10);
});
