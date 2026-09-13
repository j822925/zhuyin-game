// Production tokens live only in memory. PINs never enter URLs or score payloads.
export function createStudentAuth({demo,getConfig,post}){
 const sessions=new Map();let busy=false,active=null,buffer='',resolvePrompt=null;
 const dialog=document.createElement('dialog');dialog.id='pin-dialog';dialog.innerHTML='<div class="pin-top"><strong id="pin-seat"></strong><button type="button" id="pin-cancel" class="icon-button" aria-label="取消登入">✕</button></div><div class="pin-lock" aria-hidden="true">🔒</div><output id="pin-dots" aria-label="已輸入零位密碼">○ ○ ○ ○</output><p id="pin-status" role="status"></p><div class="pin-pad">'+[1,2,3,4,5,6,7,8,9,'clear',0,'back'].map(n=>`<button type="button" data-pin="${n}" aria-label="${n==='clear'?'全部清除':n==='back'?'刪除一位':n}">${n==='clear'?'↺':n==='back'?'⌫':n}</button>`).join('')+'</div>';
 document.body.append(dialog);
 const $=id=>document.getElementById(id);
 function display(){ $('pin-dots').textContent=Array.from({length:4},(_,i)=>i<buffer.length?'●':'○').join(' ');$('pin-dots').setAttribute('aria-label','已輸入 '+buffer.length+' 位密碼');dialog.querySelectorAll('[data-pin]').forEach(b=>b.disabled=busy);$('pin-cancel').disabled=busy;}
 function finish(ok){buffer='';active=null;dialog.close();const resolve=resolvePrompt;resolvePrompt=null;resolve?.(ok);}
 async function submit(){
  if(busy||buffer.length!==4)return;busy=true;display();$('pin-status').textContent='…';
  try{
   let out;
   if(demo){
    let pins={},fail={};try{pins=JSON.parse(localStorage.getItem('zhuyin.demo.pins.v1')||'{}');fail=JSON.parse(sessionStorage.getItem('zhuyin.demo.pin-fails.'+active)||'{}');}catch{}
    if(fail.until>Date.now())out={ok:false,error:'locked'};
    else if(buffer===(pins[active]||'1234')){out={ok:true,token:'demo-'+active,expires:Date.now()+7200000};sessionStorage.removeItem('zhuyin.demo.pin-fails.'+active);}
    else{const count=(fail.until?0:fail.count||0)+1;sessionStorage.setItem('zhuyin.demo.pin-fails.'+active,JSON.stringify({count,until:count>=5?Date.now()+300000:0}));out={ok:false,error:count>=5?'locked':'invalid_pin'};}
   }else out=await post({kind:'login',seat:active,pin:buffer});
   buffer='';if(out.ok&&out.token){sessions.set(active,{token:out.token,expires:out.expires});finish(true);}
   else{$('pin-status').textContent=out.error==='locked'?'⏳ 5:00':'🔁 🔒';$('pin-status').setAttribute('aria-label',out.error==='locked'?'連續輸錯，請等五分鐘或請老師重設':'密碼不正確，請再試一次');}
  }catch{buffer='';$('pin-status').textContent='📶 ⚠';$('pin-status').setAttribute('aria-label','無法連線驗證，請老師確認網路與後台部署');}
  finally{busy=false;display();}
 }
 function key(value){if(busy)return;if(value==='clear')buffer='';else if(value==='back')buffer=buffer.slice(0,-1);else if(/^\d$/.test(value)&&buffer.length<4)buffer+=value;display();if(buffer.length===4)submit();}
 dialog.querySelectorAll('[data-pin]').forEach(b=>b.onclick=()=>key(b.dataset.pin));$('pin-cancel').onclick=()=>finish(false);
 dialog.addEventListener('cancel',e=>{e.preventDefault();if(!busy)finish(false);});
 dialog.addEventListener('keydown',e=>{if(/^\d$/.test(e.key)){e.preventDefault();key(e.key);}else if(e.key==='Backspace'){e.preventDefault();key('back');}});
 function verified(seat){const s=sessions.get(seat);return !!s&&s.expires>Date.now();}
 return {
  verified,
  forget(seat){sessions.delete(seat);},
  async ensure(seat){if(!seat)return false;if(verified(seat))return true;if(active)return false;
   if(!demo&&!getConfig()?.authRequired){document.getElementById('home-message').textContent='請老師先部署密碼後台，才能登入。';return false;}
   active=seat;buffer='';$('pin-seat').textContent='🔢 '+seat;$('pin-status').textContent='';display();dialog.showModal();return new Promise(resolve=>resolvePrompt=resolve);
  },
  decorate(payload){
   const list=payload.kind==='race'?payload.seats:payload.competition?.seats;
   const seats=list||[payload.seat];for(const seat of seats)if(!verified(seat))throw new Error('authentication_required');
   return list?{...payload,authTokens:Object.fromEntries(seats.map(s=>[s,sessions.get(s).token]))}:{...payload,token:sessions.get(payload.seat).token};
  },
  async request(payload){const out=await post(this.decorate(payload));if(out.error==='authentication_required'){for(const seat of payload.seats||payload.competition?.seats||[payload.seat])sessions.delete(seat);throw new Error(out.error);}return out;}
 };
}
