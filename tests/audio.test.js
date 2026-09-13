import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
function duration(path){const b=readFileSync(new URL('../'+path,import.meta.url));let rate=0,bytes=0;for(let i=12;i+8<=b.length;){const type=b.toString('ascii',i,i+4),len=b.readUInt32LE(i+4);if(type==='fmt ')rate=b.readUInt32LE(i+16);if(type==='data')bytes=len;i+=8+len+(len%2);}assert.ok(rate&&bytes);return bytes/rate;}
test('44 個慢速拼音均較原版長，保留原音檔；四個操作語音存在',()=>{
 for(let i=1;i<=44;i++){const name='s'+String(i).padStart(2,'0')+'.wav';assert.ok(duration('audio/syllable-clear/'+name)>duration('audio/syllable/'+name)+0.5,name);}
 for(const name of ['home','listen','spelling','race'])assert.ok(duration('audio/help/'+name+'.wav')>1);
});
