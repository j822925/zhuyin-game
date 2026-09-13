export const REWARD_RULE='ten-rounds-v1';
export function competitionStars(scores,index){return scores[0]===scores[1]?1:scores[index]>scores[1-index]?2:1;}
export function roundAward(completedRounds,baseStars,mode='single'){
 const next=(Number.isInteger(completedRounds)&&completedRounds>=0?completedRounds:0)+1;
 const threshold=mode==='spelling'?2:3,perseveranceStars=next%threshold===0?1:0;
 return {completedRounds:next,threshold,baseStars,perseveranceStars,stars:baseStars+perseveranceStars};
}
export function rewardParticipants(result){
 if(result.total!==10||!Array.isArray(result.results)||result.results.length!==10)return [];
 if(result.kind==='race'){
  const scores=[0,1].map(i=>result.results.filter(r=>r.winner===i).length);
  return result.seats.map((seat,i)=>({seat,baseStars:competitionStars(scores,i)}));
 }
 if(result.competition?.kind==='turn'){
  const i=result.competition.seats.indexOf(result.seat),scores=result.competition.rounds.map(r=>r.total-r.mistakes);
  return i>=0?[{seat:result.seat,baseStars:competitionStars(scores,i)}]:[];
 }
 const perfect=result.mistakes===0&&result.results.every(r=>r.firstCorrect===true);
 return [{seat:result.seat,baseStars:perfect?(result.mode==='spelling'?3:2):0}];
}
