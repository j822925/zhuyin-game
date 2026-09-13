import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import {readFileSync} from 'node:fs';import {createHmac,randomUUID} from 'node:crypto';
function fixture(){
 const properties=new Map(),cache=new Map();let now=Date.now(),locked=false;
 class Clock extends Date{static now(){return now;}}
 const props={getProperty:k=>properties.get(k)||null,setProperty:(k,v)=>properties.set(k,v),deleteProperty:k=>properties.delete(k)};
 const ctx=vm.createContext({Date:Clock,getRoster_:()=>[{id:'01'},{id:'02'},{id:'15'}],PropertiesService:{getScriptProperties:()=>props},CacheService:{getScriptCache:()=>({put:(k,v)=>cache.set(k,v),get:k=>cache.get(k)||null})},Utilities:{getUuid:randomUUID,computeHmacSha256Signature:(v,k)=>createHmac('sha256',k).update(v).digest(),base64EncodeWebSafe:v=>Buffer.from(v).toString('base64url')},LockService:{getScriptLock:()=>({waitLock(){assert.equal(locked,false);locked=true;},releaseLock(){locked=false;}})}});
 vm.runInContext(readFileSync(new URL('../backend/student-auth.gs',import.meta.url),'utf8'),ctx);
 return {ctx,properties,cache,advance:ms=>now+=ms,login:(seat,pin)=>ctx.loginStudent_({seat,pin})};
}
test('四位密碼含前導零可登入，後台不保存原文，錯誤不簽發憑證',()=>{
 const f=fixture();f.ctx.setStudentPin_('01','0123');const rec=JSON.parse(f.properties.get('student.pin.01'));assert.ok(rec.hash);assert.ok(rec.salt);assert.equal(Object.hasOwn(rec,'pin'),false);
 assert.equal(f.login('01','123').ok,false);assert.equal(f.login('01','9999').ok,false);const out=f.login('01','0123');assert.equal(out.ok,true);assert.equal(f.ctx.requireStudentSession_('01',out.token),'01');
});
test('連錯五次鎖五分鐘，正確密碼也不能繞過；到期可重試',()=>{
 const f=fixture();f.ctx.setStudentPin_('01','0123');for(let i=0;i<5;i++)f.login('01','1111');assert.equal(f.login('01','0123').error,'locked');f.advance(300001);assert.equal(f.login('01','0123').ok,true);
});
test('登入憑證只屬於該座號，兩人比賽必須各自驗證',()=>{
 const f=fixture();f.ctx.setStudentPin_('01','0123');f.ctx.setStudentPin_('02','4567');const a=f.login('01','0123').token,b=f.login('02','4567').token;
 assert.throws(()=>f.ctx.requireStudentSession_('02',a),/authentication_required/);
 assert.throws(()=>f.ctx.requireRequestAuth_({kind:'race',seats:['01','02'],authTokens:{'01':a}}),/authentication_required/);
 assert.doesNotThrow(()=>f.ctx.requireRequestAuth_({kind:'race',seats:['01','02'],authTokens:{'01':a,'02':b}}));
 assert.throws(()=>f.ctx.requireRequestAuth_({seat:'01'}),/authentication_required/);
});
test('重設密碼立即撤銷舊登入，清除連錯鎖定；憑證兩小時到期',()=>{
 const f=fixture();f.ctx.setStudentPin_('15','1234');const token=f.login('15','1234').token;for(let i=0;i<5;i++)f.login('15','9999');f.ctx.setStudentPin_('15','5678');assert.throws(()=>f.ctx.requireStudentSession_('15',token),/authentication_required/);const next=f.login('15','5678');assert.equal(next.ok,true);f.advance(7200001);assert.throws(()=>f.ctx.requireStudentSession_('15',next.token),/authentication_required/);
});
test('公開 API 不提供錢包或交易查詢；寫入入口先要求驗證',()=>{
 const source=readFileSync(new URL('../backend/game-api.gs',import.meta.url),'utf8');
 assert.ok(source.indexOf('requireRequestAuth_(d)')<source.indexOf("if(d.kind==='race')return saveRace_(d)"));
 const get=source.slice(source.indexOf('function doGet'),source.indexOf('function doPost'));assert.ok(!get.includes('wallet_('));assert.ok(get.includes('authentication_required'));
});
test('實際後台入口拒絕未登入的成績、轉蛋、比賽與私人查詢',()=>{
 const f=fixture();f.ctx.SpreadsheetApp={getActiveSpreadsheet:()=>({})};f.ctx.ContentService={MimeType:{JSON:'json'},createTextOutput:text=>({text,setMimeType(){return this;}})};
 vm.runInContext(readFileSync(new URL('../backend/game-api.gs',import.meta.url),'utf8'),f.ctx);
 f.ctx.getRoster_=()=>[{id:'01'},{id:'02'}];
 for(const payload of [{seat:'01',total:10,mistakes:0},{kind:'gacha',seat:'01'},{kind:'race',seats:['01','02']},{kind:'query',api:'wallet',seat:'01'}])assert.equal(JSON.parse(f.ctx.doPost({postData:{contents:JSON.stringify(payload)}}).text).error,'authentication_required');
 assert.equal(JSON.parse(f.ctx.doGet({parameter:{api:'wallet',seat:'01'}}).text).error,'authentication_required');
});
