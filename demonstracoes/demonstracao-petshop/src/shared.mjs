export function openRequestedGuide(openGuide) {
  const url = new URL(location.href);
  if (url.searchParams.get('roteiro') !== '1') return;
  url.searchParams.delete('roteiro');
  history.replaceState(history.state, '', url);
  openGuide();
}
export const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const formatMoney = cents => new Intl.NumberFormat('pt-BR', {style:'currency',currency:'BRL'}).format((cents || 0)/100);
export const formatUnitCost = cents => new Intl.NumberFormat('pt-BR', {style:'currency',currency:'BRL',minimumFractionDigits:2,maximumFractionDigits:5}).format((cents || 0)/100);
export function parseMoney(value) {
  const raw=String(value).trim().replace(',','.');
  if(!/^\d+(\.\d{1,2})?$/.test(raw))throw new Error('Informe um valor com até duas casas decimais.');
  const [whole,fraction='']=raw.split('.');
  const result=Number(whole)*100+Number(fraction.padEnd(2,'0'));
  if(!Number.isSafeInteger(result))throw new Error('Valor fora do limite.');
  return result;
}
export function parseUnitCost(value) {
  const raw=String(value).trim().replace(',','.');
  if(!/^\d+(\.\d{1,5})?$/.test(raw))throw new Error('Custo unitário: use até cinco casas decimais em reais.');
  const [whole,fraction='']=raw.split('.');
  const mills=Number(whole)*100000+Number(fraction.padEnd(5,'0'));
  if(!Number.isSafeInteger(mills))throw new Error('Custo fora do limite.');
  return mills/1000;
}
