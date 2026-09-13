import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import {readFileSync} from 'node:fs';
function backend(){const rows=[['時間','座號','挑戰次數','總題數','答錯題數']];let locked=false;
 const record={getLastRow:()=>rows.length,appendRow:r=>rows.push(r),getRange:()=>({createTextFinder:id=>({matchEntireCell:()=>({findNext:()=>rows.some(r=>r[5]===id)?{}:null})})})};
 const sheets={'過關紀錄':record,'班級名冊':{getRange:()=>({getValues:()=>[[1,'測試學生',true],[2,'停用學生',false]]})},'今日任務':{getLastRow:()=>6,getRange:()=>({getValues:()=>['ㄅ','ㄆ','ㄇ','ㄉ','ㄧ','ㄠ'].map(x=>[x])})}};
 const ctx=vm.createContext({SpreadsheetApp:{getActiveSpreadsheet:()=>({getSheetByName:n=>sheets[n]}),flush(){}},ContentService:{MimeType:{JSON:'json'},createTextOutput:text=>({text,setMimeType(){return this;}})},Utilities:{getUuid:()=> 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'},LockService:{getScriptLock:()=>({waitLock(){locked=true;},hasLock:()=>locked,releaseLock(){locked=false;}})}});
 vm.runInContext(readFileSync(new URL('../backend/game-api.gs',import.meta.url),'utf8'),ctx);
 ctx.requireRequestAuth_=()=>{}; // Business-rule tests; real auth is tested separately.
 return {rows,get:p=>p.api==='status'?{saved:rows.some(r=>r[5]===p.id)}:JSON.parse(ctx.doGet({parameter:p}).text),post:d=>JSON.parse(ctx.doPost({postData:{contents:JSON.stringify(d)}}).text)};
}
const payload=()=>({roundId:'11111111-2222-4333-8444-555555555555',seat:'01',total:2,mistakes:1,mode:'single',results:[{target:'ㄅ',firstCorrect:true,errors:0,seconds:2},{target:'ㄆ',firstCorrect:false,errors:1,seconds:3}]});
test('完整回合寫入一次，重送同一回合不重複',()=>{const b=backend();assert.equal(b.post(payload()).saved,true);assert.equal(b.post(payload()).duplicate,true);assert.equal(b.rows.length,2);assert.equal(b.rows[1][1],'01 測試學生');assert.equal(b.rows[1][4],1);assert.equal(b.get({api:'status',id:payload().roundId}).saved,true);});
test('未完成回合、假座號、不合理成績不写入',()=>{const b=backend();for(const p of [{...payload(),seat:'99'},{...payload(),mistakes:-1},{...payload(),results:[]},{...payload(),seat:'02'}])assert.equal(b.post(p).saved,false);assert.equal(b.rows.length,1);});
test('新設定只公開座號、不公開姓名，舊題庫與舊遊戲仍相容',()=>{const b=backend(),c=b.get({api:'config'});assert.deepEqual(c.seats,['01','15']);assert.ok(!JSON.stringify(c).includes('測試學生'));assert.equal(c.spellingApproved,false);assert.equal(b.get({}).length,6);assert.equal(b.post({seat:'01 測試學生',total:10,mistakes:0,attempt:1}).saved,true);});
