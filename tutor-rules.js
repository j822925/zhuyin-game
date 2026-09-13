// Shared by demo rewards and the server (the server copy is parity-tested).
export function validLearningRound(d){
 if(!Array.isArray(d.results)||d.results.length!==d.total)return false;
 const rows=d.results,hasTutor=rows.some(r=>r.tutorUsed||r.tutorReviewOf||r.tutorSpacer);
 if(!hasTutor)return d.total===10;
 if(d.mode!=='spelling'||d.kind==='race'||d.total<11||d.total>80)return false;
 let uses=0,reviews=0,spacers=0;
 for(let i=0;i<rows.length;i++){
  const r=rows[i];
  if(r.tutorUsed!==undefined&&r.tutorUsed!==true)return false;
  if(r.tutorSpacer!==undefined&&r.tutorSpacer!==true)return false;
  if(r.tutorUsed){uses++;if(rows.filter(x=>x.tutorReviewOf===i+1).length!==1)return false;}
  if(r.tutorReviewOf!==undefined){
   reviews++;const source=r.tutorReviewOf-1;
   if(!Number.isInteger(source)||source<0||![2,3].includes(i-source)||!rows[source]?.tutorUsed||rows[source].target!==r.target||r.tutorSpacer)return false;
  }
  if(r.tutorSpacer){spacers++;if(!rows[i-1]?.tutorUsed||rows[i+1]?.tutorReviewOf!==i)return false;}
 }
 return uses===reviews&&d.total===10+reviews+spacers;
}
