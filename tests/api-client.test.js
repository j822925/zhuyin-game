import test from 'node:test';
import assert from 'node:assert/strict';
import {createApiClient} from '../api-client.js';
import {loginFeedback} from '../student-auth.js';
test('登入與查詢不快取、每次網址不同；密碼只在 POST 本文',async()=>{
 const calls=[];const client=createApiClient('https://example.test/exec',{fetchImpl:async(url,options)=>{calls.push({url,options});return {ok:true,json:async()=>({ok:true})};}});
 await client.post({kind:'login',seat:'15',pin:'0042'});await client.post({kind:'login',seat:'15',pin:'0042'});await client.get({api:'config'});
 assert.notEqual(calls[0].url,calls[1].url);for(const c of calls){assert.equal(c.options.cache,'no-store');assert.equal(c.options.credentials,'omit');assert.ok(!c.url.includes('0042'));assert.ok(!c.url.includes('pin='));assert.ok(c.options.signal);}
 assert.equal(calls[0].options.method,'POST');assert.equal(JSON.parse(calls[0].options.body).pin,'0042');assert.equal(calls[2].options.method,'GET');assert.equal(new URL(calls[2].url).searchParams.get('api'),'config');
});
test('網路失敗不自動重送密碼，錯誤不包含敏感內容',async()=>{
 let count=0;const client=createApiClient('https://example.test/',{fetchImpl:async()=>{count++;throw new Error('private-details');}});
 await assert.rejects(client.post({kind:'login'}),{message:'network_error'});assert.equal(count,1);
});
test('逾時可終止請求，不依賴新式 AbortSignal.timeout',async()=>{
 const client=createApiClient('https://example.test/',{timeoutMs:5,fetchImpl:async(_,options)=>new Promise((resolve,reject)=>options.signal.addEventListener('abort',()=>reject(new Error('aborted'))))});
 await assert.rejects(client.post({kind:'login'}),{message:'request_timeout'});
});
test('HTML、HTTP 錯誤與空回應不當成密碼錯誤',async()=>{
 for(const [response,code] of [[{ok:false},'http_error'],[{ok:true,json:async()=>{throw new Error('html');}},'invalid_response'],[{ok:true,json:async()=>null},'invalid_response']]){
  const client=createApiClient('https://example.test/',{fetchImpl:async()=>response});await assert.rejects(client.get(),{message:code});assert.notEqual(loginFeedback(code).icon,'🔁 🔒');
 }
});
test('只有 invalid_pin 顯示錯密碼，鎖定時間使用後台回覆',()=>{
 assert.equal(loginFeedback('invalid_pin').icon,'🔁 🔒');assert.equal(loginFeedback('locked',71).icon,'⏳ 1:11');
 for(const error of ['request_timeout','network_error','ReferenceError','invalid_payload',undefined])assert.notEqual(loginFeedback(error).icon,'🔁 🔒');
});
