// A race records wins separately from individual mastery. No answer is not an error.
export class Race {
  constructor(deck) { this.deck=deck; this.index=0; this.scores=[0,0]; this.rows=[]; this.open=false; this.attempts=[null,null]; }
  get current(){return this.deck[this.index];}
  get finished(){return this.index>=this.deck.length;}
  get resolved(){return this.rows.length>this.index;}
  listenFinished(){if(!this.finished&&!this.resolved)this.open=true;}
  answer(player,value){
    if(![0,1].includes(player)||!this.open||this.resolved||this.attempts[player]!==null)return {ignored:true};
    const correct=value===this.current.label;
    this.attempts[player]={value,correct};
    if(correct||this.attempts.every(Boolean)){
      const winner=correct?player:null;
      if(correct)this.scores[player]++;
      this.rows.push({target:this.current.label,winner,attempts:this.attempts.map(x=>x?{...x}:null)});
      this.open=false;
      return {correct,resolved:true,winner};
    }
    return {correct:false,resolved:false};
  }
  next(){if(!this.resolved)return false;this.index++;this.attempts=[null,null];this.open=false;return true;}
}
