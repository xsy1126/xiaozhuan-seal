'use strict';
const stamp = document.getElementById('sealGrid');
const freedom = document.getElementById('freedom');
let stampSeed = 21;
function arrangeStamp() {
  let seed = stampSeed;
  const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  const amount = Number(freedom.value) / 100;
  document.getElementById('freedomValue').textContent = amount < .25 ? '规整' : amount > .75 ? '自在' : '适中';
  document.querySelectorAll('.cell').forEach(cell => {
    cell.style.setProperty('--dx', `${(random() - .5) * 1.2 * amount}%`);
    cell.style.setProperty('--dy', `${(random() - .5) * 1.2 * amount}%`);
    cell.style.setProperty('--angle', `${(random() - .5) * 1.8 * amount}deg`);
    cell.style.setProperty('--sx', 1 + (random() - .5) * .018 * amount);
    cell.style.setProperty('--sy', 1 + (random() - .5) * .018 * amount);
  });
  const wear = document.getElementById('wear');
  wear.replaceChildren();
  function fleck(x,y,rx,ry) {
    const ellipse = document.createElementNS('http://www.w3.org/2000/svg','ellipse');
    Object.entries({cx:x,cy:y,rx,ry,transform:`rotate(${random()*180} ${x} ${y})`}).forEach(([key,value])=>ellipse.setAttribute(key,value));
    wear.appendChild(ellipse);
  }
  for(let i=0;i<210;i++) fleck(random()*400,random()*400,.25+random()*1.2,.3+random()*1.8);
  // Worn edge chips stay shallow enough to preserve a readable stamp boundary.
  for(let i=0;i<44;i++) {
    const side=i%4, p=random()*400, edge=random()*4;
    fleck(side===0?edge:side===1?400-edge:p,side===2?edge:side===3?400-edge:p,1+random()*3,1+random()*4);
  }
}
function chooseStyle(white) {
  stamp.classList.toggle('white-style',white);
  document.getElementById('whiteStyle').setAttribute('aria-pressed',String(white));
  document.getElementById('redStyle').setAttribute('aria-pressed',String(!white));
}
document.getElementById('whiteStyle').addEventListener('click',()=>chooseStyle(true));
document.getElementById('redStyle').addEventListener('click',()=>chooseStyle(false));
document.getElementById('texture').addEventListener('change',event=>stamp.classList.toggle('clean',!event.target.checked));
freedom.addEventListener('input',arrangeStamp);
document.getElementById('shuffleStamp').addEventListener('click',()=>{stampSeed++;arrangeStamp();});
arrangeStamp();

// Fit the ink bounds, not the font's invisible side bearings, to each quadrant.
function fitStampGlyphs() {
  const context = document.createElement('canvas').getContext('2d');
  context.font = '100px "峄山碑篆体"';
  document.querySelectorAll('.cell').forEach(cell => {
    const char = cell.textContent;
    if (!char) return;
    const metrics = context.measureText(char);
    const width = metrics.actualBoundingBoxLeft + metrics.actualBoundingBoxRight;
    const height = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
    if (!(width > 0 && height > 0)) return;
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('viewBox', `${-metrics.actualBoundingBoxLeft} ${-metrics.actualBoundingBoxAscent} ${width} ${height}`);
    svg.setAttribute('preserveAspectRatio', 'none');
    svg.setAttribute('aria-hidden', 'true');
    const text = document.createElementNS(ns, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', '0');
    text.setAttribute('font-family', '峄山碑篆体');
    text.setAttribute('font-size', '100');
    text.setAttribute('fill', 'currentColor');
    text.textContent = char;
    svg.appendChild(text);
    cell.replaceChildren(svg);
  });
}
document.addEventListener('seal-rendered', fitStampGlyphs);
document.fonts.ready.then(fitStampGlyphs);
