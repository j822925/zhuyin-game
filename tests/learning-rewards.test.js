import test from 'node:test';import assert from 'node:assert/strict';
import {roundAward,rewardParticipants,competitionStars} from '../learning-rewards.js';
import {normalizeConfig} from '../core.js';
const round=(mode,mistakes)=>({mode,total:10,mistakes,seat:'15',results:Array.from({length:10},(_,i)=>({firstCorrect:i>=mistakes}))});
test('不論舊設定是 5 或 20，進關卡一律 10 題',()=>{for(const questions of [5,20,undefined])assert.equal(normalizeConfig({questions}).questions,10);});
test('單音與結合韻全對 2，拼音全對 3，有錯均 0',()=>{for(const mode of ['single','compound','spelling']){assert.equal(rewardParticipants(round(mode,0))[0].baseStars,mode==='spelling'?3:2);assert.equal(rewardParticipants(round(mode,1))[0].baseStars,0);}});
test('一般三回合給 1，拼音兩回合給 1；不重複套用門檻',()=>{assert.equal(roundAward(0,0).stars,0);assert.equal(roundAward(2,0).stars,1);assert.equal(roundAward(1,0,'spelling').stars,1);assert.equal(roundAward(2,0,'spelling').stars,0);assert.equal(roundAward(1,3,'spelling').stars,4);});
test('比賽勝 2 負 1 平手各 1，未完成不領取',()=>{assert.equal(competitionStars([8,3],0),2);assert.equal(competitionStars([8,3],1),1);assert.equal(competitionStars([5,5],0),1);assert.deepEqual(rewardParticipants({...round('single',0),total:9}),[]);});
test('搶答 10 題的贏家與輸家都有回合獎勵，不按答題數發星',()=>{const r={kind:'race',total:10,seats:['01','15'],results:Array.from({length:10},()=>({winner:0,attempts:[{correct:true},null]}))};assert.deepEqual(rewardParticipants(r),[{seat:'01',baseStars:2},{seat:'15',baseStars:1}]);});
