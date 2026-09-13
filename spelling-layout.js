// Keep every symbol upright and every compound final in one draggable tile.
export function setVerticalSymbols(element,value){
 element.replaceChildren();
 for(const symbol of value){const glyph=document.createElement('span');glyph.className='zhuyin-glyph';glyph.textContent=symbol;glyph.setAttribute('aria-hidden','true');element.append(glyph);}
 element.classList.add('vertical-symbols');
}
export function showSpellingTone(container,question){
 const tone=container.querySelector('.spelling-tone');
 tone.textContent=question.toneMark||'';
 tone.hidden=!question.toneMark;
 tone.setAttribute('aria-label',({2:'第二聲',3:'第三聲',4:'第四聲'})[question.tone]||'第一聲，不標調號');
 container.dataset.finalLength=String(question.final.length);
}
