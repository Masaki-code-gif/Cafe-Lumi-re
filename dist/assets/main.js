// 折りたたみはJavaScriptが有効な場合のみ使用する。
const toggle = document.querySelector('.nav-toggle');
const navigation = document.querySelector('#navigation');
if (toggle && navigation) {
  document.documentElement.classList.add('js');
  function closeMenu(restoreFocus = false) {
    toggle.setAttribute('aria-expanded', 'false');
    toggle.textContent = 'メニュー';
    navigation.classList.remove('open');
    if (restoreFocus) toggle.focus();
  }
  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') !== 'true';
    toggle.setAttribute('aria-expanded', String(open));
    navigation.classList.toggle('open', open);
    toggle.textContent = open ? '閉じる' : 'メニュー';
  });
  navigation.addEventListener('click', event => {
    if (event.target.closest('a')) closeMenu();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') closeMenu(true);
  });
  window.matchMedia('(max-width: 760px)').addEventListener('change', () => closeMenu());
}
document.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>{document.querySelectorAll('[data-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));document.querySelectorAll('[data-category]').forEach(item=>{item.hidden=button.dataset.filter!=='all'&&item.dataset.category!==button.dataset.filter;});document.querySelector('#filter-status').textContent=button.textContent+'を表示しています。';}));
document.querySelector('#load-map')?.addEventListener('click',()=>{const frame=document.createElement('iframe');frame.title='参考エリア：東京都・清澄白河（架空店舗の所在地ではありません）';frame.src='https://www.google.com/maps?q=%E6%B8%85%E6%BE%84%E7%99%BD%E6%B2%B3%E9%A7%85&output=embed';frame.loading='lazy';frame.referrerPolicy='no-referrer-when-downgrade';document.querySelector('#map-container').replaceChildren(frame);});
document.querySelector('#contact-form')?.addEventListener('submit',event=>{event.preventDefault();if(!event.currentTarget.reportValidity())return;document.querySelector('#form-status').textContent='入力内容を確認しました。このフォームはデモのため送信されていません。入力した情報は保存・送信されません。';document.querySelector('#form-status').focus();});
// ハンドラーの登録完了後にのみ有効化し、JS無効時の通常送信を防ぐ。
const submitButton = document.querySelector('#contact-form [type="submit"]');
if (submitButton) submitButton.disabled = false;
