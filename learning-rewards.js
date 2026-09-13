import {validLearningRound} from './tutor-rules.js?v=20260913-tutor1';
export const REWARD_RULE='daily-caps-v2';
export const dailyLimits=mode=>({perfectStars:mode==='spelling'?12:4,perseveranceStars:mode==='spelling'?5:4});
export const taipeiDay=(date=new Date())=>new Date(new Date(date).getTime()+8*3600000).toISOString().slice(0,10);
export function cappedRoundAward(completedRounds,baseStars,mode='single',usage={},competition=false){
 const award=roundAward(completedRounds,baseStars,mode),limits=dailyLimits(mode);
 const perfectStars=competition?0:Math.min(baseStars,Math.max(0,limits.perfectStars-(usage.perfectStars||0)));
 const perseveranceStars=Math.min(award.perseveranceStars,Math.max(0,limits.perseveranceStars-(usage.perseveranceStars||0)));
 const competitionStars=competition?baseStars:0;
 return {...award,baseStars:perfectStars+competitionStars,perfectStars,perseveranceStars,competitionStars,stars:perfectStars+competitionStars+perseveranceStars,limits};
}
export function competitionStars(scores,index){return scores[0]===scores[1]?1:scores[index]>scores[1-index]?2:1;}
export function roundAward(completedRounds,baseStars,mode='single'){
 const next=(Number.isInteger(completedRounds)&&completedRounds>=0?completedRounds:0)+1;
 const threshold=mode==='spelling'?2:3,perseveranceStars=next%threshold===0?1:0;
 return {completedRounds:next,threshold,baseStars,perseveranceStars,stars:baseStars+perseveranceStars};
}
export function rewardParticipants(result){
 if(result.kind==='race'?(result.total!==10||!Array.isArray(result.results)||result.results.length!==10):!validLearningRound(result))return [];
 if(result.kind==='race'){
  const scores=[0,1].map(i=>result.results.filter(r=>r.winner===i).length);
  return result.seats.map((seat,i)=>({seat,baseStars:competitionStars(scores,i)}));
 }
 if(result.competition?.kind==='turn'){
  const i=result.competition.seats.indexOf(result.seat),scores=result.competition.rounds.map(r=>-r.mistakes);
  return i>=0?[{seat:result.seat,baseStars:competitionStars(scores,i)}]:[];
 }
 const perfect=result.mistakes===0&&result.results.every(r=>r.firstCorrect===true);
 return [{seat:result.seat,baseStars:perfect?(result.mode==='spelling'?3:2):0}];
}
