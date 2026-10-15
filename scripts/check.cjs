const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '../dist');
let references = 0;
for (const file of ['index.html', 'menu.html', 'information.html']) {
  const html = fs.readFileSync(path.join(root, file), 'utf8');
  assert(html.includes('lang="ja"'));
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
  assert.equal(new Set(ids).size, ids.length, `${file}: duplicate IDs`);
  for (const match of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    if (/^https?:/.test(match[1])) {
      assert(match[1].startsWith('https://'));
      continue;
    }
    const [relative, anchor] = match[1].split('#');
    assert(!relative.startsWith('/'), 'Project Pages requires relative paths');
    const target = path.resolve(root, relative || file);
    assert(fs.existsSync(target), `${file}: missing ${relative}`);
    if (anchor) assert(fs.readFileSync(target, 'utf8').includes(`id="${anchor}"`));
    references++;
  }
  for (const match of html.matchAll(/assets\/cafe-hero-\d+\.webp/g)) assert(fs.existsSync(path.join(root, match[0])));
}
const formHtml = fs.readFileSync(path.join(root, 'information.html'), 'utf8');
assert(/type="submit" disabled/.test(formHtml), 'No-JS submit must remain disabled');
assert(!/<form[^>]+action=/.test(formHtml));

// DOMの小さな代替を使い、通信なしでインタラクションの分岐を検証する。
function element(dataset = {}) {
  const classes = new Set();
  return { dataset, handlers: {}, attrs: {}, hidden: false, textContent: '', disabled: true,
    classList: {add: v => classes.add(v),remove: v => classes.delete(v),toggle: (v,on) => on ? classes.add(v) : classes.delete(v), contains: v => classes.has(v)},
    addEventListener(type, fn) {this.handlers[type] = fn;},
    setAttribute(k,v) {this.attrs[k] = v;}, getAttribute(k) {return this.attrs[k];},
    focus() {this.focused = true;}, replaceChildren(child) {this.child = child;}
  };
}
const toggle=element(),nav=element(),form=element(),submit=element(),status=element(),map=element(),loadMap=element(),filterStatus=element();
let valid=true; form.reportValidity=()=>valid;
const filters=['all','coffee','sweets','food','other'].map(value=>element({filter:value}));
const items=['coffee','sweets','food','other'].map(value=>element({category:value}));
const selectors={'.nav-toggle':toggle,'#navigation':nav,'#contact-form':form,'#contact-form [type="submit"]':submit,'#form-status':status,'#map-container':map,'#load-map':loadMap,'#filter-status':filterStatus};
const document={documentElement:element(),handlers:{},querySelector:s=>selectors[s]||null,querySelectorAll:s=>s==='[data-filter]'?filters:s==='[data-category]'?items:[],createElement:()=>element(),addEventListener(type,fn){this.handlers[type]=fn;}};
let resize;const window={matchMedia:()=>({addEventListener:(_,fn)=>{resize=fn;}})};
const code=fs.readFileSync(path.join(root,'assets/main.js'),'utf8');
vm.runInNewContext(code,{document,window});
toggle.handlers.click();assert.equal(toggle.attrs['aria-expanded'],'true');assert(nav.classList.contains('open'));
document.handlers.keydown({key:'Escape'});assert.equal(toggle.attrs['aria-expanded'],'false');assert(toggle.focused);
toggle.handlers.click();nav.handlers.click({target:{closest:()=>true}});assert.equal(toggle.attrs['aria-expanded'],'false');
toggle.handlers.click();resize();assert.equal(toggle.attrs['aria-expanded'],'false');
filters.forEach(button=>{button.handlers.click();items.forEach(item=>assert.equal(item.hidden,button.dataset.filter!=='all'&&item.dataset.category!==button.dataset.filter));assert.equal(button.attrs['aria-pressed'],'true');});
assert.equal(map.child,undefined);loadMap.handlers.click();assert(map.child.src.startsWith('https://www.google.com/maps?'));
let prevented=false;const event={preventDefault(){prevented=true;},currentTarget:form};
valid=false;form.handlers.submit(event);assert(prevented);assert.equal(status.textContent,'');
valid=true;form.handlers.submit(event);assert(status.textContent.includes('送信されていません'));assert(status.focused);assert.equal(submit.disabled,false);
// ナビゲーションやフォームがないページでも例外を起こさない。
vm.runInNewContext(code,{document:{querySelector:()=>null,querySelectorAll:()=>[]},window:{}});
console.log(`PASS: 3 pages, ${references} local links/assets, anchors, image candidates, navigation, filters, deferred map, demo form.`);
