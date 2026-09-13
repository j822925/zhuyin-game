// Private, server-side student PINs. Deploy together with game-api.gs.
const PIN_SESSION_SECONDS_=7200;
function studentAuthRoster_(){return getRoster_().filter(r=>r.id!=='15').concat([{id:'15',name:'老師測試',test:true}]);}
const PIN_LOCK_MS_=5*60*1000;
function pinSeat_(value){return /^\d{1,3}$/.test(String(value||''))?String(value).padStart(2,'0'):'';}
function pinRecord_(seat){const raw=PropertiesService.getScriptProperties().getProperty('student.pin.'+seat);return raw?JSON.parse(raw):null;}
function pinHash_(pin,salt){return Utilities.base64EncodeWebSafe(Utilities.computeHmacSha256Signature(pin,salt));}
function pinEqual_(a,b){if(typeof a!=='string'||typeof b!=='string'||a.length!==b.length)return false;let diff=0;for(let i=0;i<a.length;i++)diff|=a.charCodeAt(i)^b.charCodeAt(i);return diff===0;}
function setStudentPin_(seat,pin){
 if(!/^\d{4}$/.test(pin)||!studentAuthRoster_().some(r=>r.id===seat))throw new Error('invalid_pin');
 const salt=Utilities.getUuid()+Utilities.getUuid(),record={salt,hash:pinHash_(pin,salt),version:Utilities.getUuid(),updated:new Date().toISOString()};
 const props=PropertiesService.getScriptProperties();props.setProperty('student.pin.'+seat,JSON.stringify(record));props.deleteProperty('student.pin.fail.'+seat);
}
function loginStudent_(d){
 const seat=pinSeat_(d.seat),pin=String(d.pin||'');
 if(!seat||!/^\d{4}$/.test(pin)||!studentAuthRoster_().some(r=>r.id===seat))return {ok:false,error:'invalid_pin'};
 const lock=LockService.getScriptLock();lock.waitLock(10000);
 try{
  const props=PropertiesService.getScriptProperties(),key='student.pin.fail.'+seat,now=Date.now();
  let failure=JSON.parse(props.getProperty(key)||'{"count":0,"until":0}');
  if(failure.until>now)return {ok:false,error:'locked',retryAfter:Math.ceil((failure.until-now)/1000)};
  if(failure.until)failure={count:0,until:0};
  const record=pinRecord_(seat);
  if(!record||!studentAuthRoster_().some(r=>r.id===seat)||!pinEqual_(record.hash,pinHash_(pin,record.salt))){
   failure.count++;if(failure.count>=5)failure.until=now+PIN_LOCK_MS_;
   props.setProperty(key,JSON.stringify(failure));return {ok:false,error:failure.until?'locked':'invalid_pin',retryAfter:failure.until?300:0};
  }
  props.deleteProperty(key);
  const token=Utilities.getUuid()+Utilities.getUuid(),expires=now+PIN_SESSION_SECONDS_*1000;
  CacheService.getScriptCache().put('student.session.'+token,JSON.stringify({seat,version:record.version,expires}),PIN_SESSION_SECONDS_);
  return {ok:true,seat,token,expires};
 }finally{lock.releaseLock();}
}
function requireStudentSession_(seat,token){
 seat=pinSeat_(seat);
 if(!seat||typeof token!=='string'||!/^[a-fA-F0-9-]{72}$/.test(token))throw new Error('authentication_required');
 const raw=CacheService.getScriptCache().get('student.session.'+token),session=raw&&JSON.parse(raw),record=pinRecord_(seat);
 if(!session||session.seat!==seat||session.expires<=Date.now()||!record||record.version!==session.version||!studentAuthRoster_().some(r=>r.id===seat))throw new Error('authentication_required');
 return seat;
}
function requireRequestAuth_(d){
 const seats=d.kind==='race'?d.seats:d.competition?.seats;
 if(seats){if(!Array.isArray(seats)||seats.length!==2||seats[0]===seats[1])throw new Error('authentication_required');seats.forEach(seat=>requireStudentSession_(seat,d.authTokens?.[seat]));}
 else requireStudentSession_(d.seat,d.token);
}
function authenticatedQuery_(d){
 const seat=requireStudentSession_(d.seat,d.token);
 if(d.api==='wallet')return wallet_(seat);
 if(!validId_(d.id))return {saved:false};
 if(d.api==='status')return {saved:['過關紀錄','測試紀錄'].some(name=>dataRows_(name,6).some(r=>r[5]===d.id&&String(r[1]).split(' ')[0].padStart(2,'0')===seat))};
 if(d.api==='race-status')return {saved:dataRows_('搶答紀錄',6).some(r=>r[5]===d.id&&[r[1],r[2]].map(String).includes(seat))};
 if(d.api==='draw-status'){const r=dataRows_('角色交易',9).find(r=>r[5]===d.id&&String(r[1]).padStart(2,'0')===seat);return r?{saved:true,character:r[3],duplicate:r[7]===true}:{saved:false};}
 return {error:'unknown_query'};
}
// Teacher-only setup: no public API route invokes this or the reset function.
function setupStudentPasswords(){
 const ss=SpreadsheetApp.getActiveSpreadsheet();let sheet=ss.getSheetByName('學生密碼');
 if(!sheet){sheet=ss.insertSheet('學生密碼');sheet.appendRow(['座號','學生','輸入新4位密碼','狀態','更新時間']);sheet.setFrozenRows(1);sheet.getRange('C:C').setNumberFormat('@');sheet.setColumnWidths(1,3,150);sheet.setColumnWidth(4,330);sheet.setColumnWidth(5,180);}
 sheet.getRange('A:A').setNumberFormat('@');
 const ids=sheet.getLastRow()>1?sheet.getRange(2,1,sheet.getLastRow()-1,1).getDisplayValues().flat().map(pinSeat_):[];
 for(const student of studentAuthRoster_())if(!ids.includes(student.id))sheet.appendRow([student.id,student.name,'',pinRecord_(student.id)?'已設定':'待老師設定','']);
 sheet.getRange('C1').setNote('輸入四位數字（可含開頭的 0），離開儲存格後套用。成功後輸入欄清空，不顯示原密碼。忘記時輸入新密碼即可重設。試算表的修訂紀錄仍可能保留輸入內容，請勿公開分享此檔。');
 if(!ScriptApp.getProjectTriggers().some(t=>t.getHandlerFunction()==='studentPasswordEdit'))ScriptApp.newTrigger('studentPasswordEdit').forSpreadsheet(ss).onEdit().create();
}
function studentPasswordEdit(e){
 if(!e?.range||e.range.getSheet().getName()!=='學生密碼'||e.range.getColumn()>3||e.range.getLastColumn()<3)return;
 const sheet=e.range.getSheet(),first=Math.max(2,e.range.getRow()),last=e.range.getLastRow(),lock=LockService.getScriptLock();lock.waitLock(10000);
 try{for(let row=first;row<=last;row++){
  const pin=sheet.getRange(row,3).getDisplayValue();if(!pin)continue;
  const seat=pinSeat_(sheet.getRange(row,1).getDisplayValue());
  if(!/^\d{4}$/.test(pin)||!studentAuthRoster_().some(r=>r.id===seat)){sheet.getRange(row,4).setValue('未更新：請輸入四位數字，並確認座號');continue;}
  setStudentPin_(seat,pin);sheet.getRange(row,3).clearContent();sheet.getRange(row,4).setValue('已設定；舊登入已失效，連錯鎖定已解除');sheet.getRange(row,5).setValue(new Date());
 }}finally{lock.releaseLock();}
}
