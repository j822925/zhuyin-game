import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {BASE,COMPOUNDS,normalizeConfig,poolFor} from '../core.js';
const data=JSON.parse(readFileSync(new URL('../data/spelling-combinations.json',import.meta.url)));
test('參考表組合清單去重、符號合法且分類計數一致（不宣稱已產音）',()=>{
 const rows=data.combinations;assert.equal(rows.length,365);assert.equal(new Set(rows.map(r=>r.label)).size,365);
 assert.equal(rows.filter(r=>r.final.length===1).length,201);assert.equal(rows.filter(r=>r.final.length>1).length,164);
 for(const r of rows){assert.ok(BASE.slice(0,21).includes(r.initial));assert.ok(BASE.slice(21).includes(r.final)||COMPOUNDS.includes(r.final));assert.equal(r.label,r.initial+r.final);}
});
test('擴充清單符合老師四音範例，且結合韻必須明確教過',()=>{
 const cfg=normalizeConfig({symbols:['ㄈ','ㄌ','ㄧ','ㄨ']});
 assert.deepEqual(poolFor('spelling',cfg,data.combinations).map(r=>r.label).sort(),['ㄈㄨ','ㄌㄧ','ㄌㄨ'].sort());
 const old=normalizeConfig({symbols:['ㄅ','ㄧ','ㄠ']}),next=normalizeConfig({symbols:['ㄅ','ㄧ','ㄠ','ㄧㄠ']});
 assert.equal(poolFor('spelling',old,data.combinations).some(r=>r.label==='ㄅㄧㄠ'),false);
 assert.equal(poolFor('spelling',next,data.combinations).some(r=>r.label==='ㄅㄧㄠ'),true);
});
