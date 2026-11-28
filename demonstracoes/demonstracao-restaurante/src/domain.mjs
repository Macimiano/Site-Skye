/** Restaurante SKYE: comandos atômicos, dinheiro em centavos e ledger imutável. */
export class DomainError extends Error {
  constructor(message, code = 'INVALID_OPERATION') { super(message); this.name = 'DomainError'; this.code = code; }
}
const fail = (message, code) => { throw new DomainError(message, code); };
const now = () => new Date().toISOString();
const roundQty = n => Math.round(n * 1000) / 1000;
const modes = ['salao', 'balcao', 'entrega'];
const methods = ['pix', 'dinheiro', 'debito', 'credito'];
const roles = ['gestao', 'caixa', 'cozinha', 'garcom'];
const integer = (n, label, min = 0) => { if (!Number.isSafeInteger(n) || n < min) fail(`${label} inválido.`); return n; };
const text = (v, max = 500) => String(v ?? '').trim().slice(0, max);
function required(v, label) { const value = text(v); if (!value) fail(`Informe ${label}.`); return value; }
function signature(value) {
  if (Array.isArray(value)) return `[${value.map(signature).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.keys(value).sort().map(k => `${JSON.stringify(k)}:${signature(value[k])}`).join(',')}}`;
  return JSON.stringify(value);
}
export function createDemoState() {
  return {
    schemaVersion: 1, revision: 0, settings: { modes: [...modes], defaultMode: 'salao' },
    inventory: [
      { id: 'pao', name: 'Pão de hambúrguer', unit: 'un', physical: 40, reserved: 0, min: 10, costCents: 180 },
      { id: 'carne', name: 'Carne para hambúrguer', unit: 'g', physical: 9000, reserved: 0, min: 1500, costCents: 3 },
      { id: 'batata', name: 'Batata congelada', unit: 'g', physical: 8000, reserved: 0, min: 1000, costCents: 1.2 },
      { id: 'queijo', name: 'Queijo fatiado', unit: 'un', physical: 60, reserved: 0, min: 10, costCents: 100 },
      { id: 'bebida', name: 'Bebida lata 350 ml', unit: 'un', physical: 48, reserved: 0, min: 12, costCents: 420 },
      { id: 'suco', name: 'Suco pronto 300 ml', unit: 'un', physical: 20, reserved: 0, min: 5, costCents: 400 },
    ],
    products: [
      { id: 'hamburguer', name: 'Hambúrguer da casa', category: 'Lanches', priceCents: 3000, description: 'Pão macio, hambúrguer de 150 g e salada.', recipe: [{ inventoryId: 'pao', qty: 1 }, { inventoryId: 'carne', qty: 150 }], removable: ['Cebola', 'Tomate', 'Alface'], addons: [{ id: 'queijo', name: 'Queijo extra', priceCents: 500, recipe: [{ inventoryId: 'queijo', qty: 1 }] }] },
      { id: 'batata', name: 'Batata crocante', category: 'Porções', priceCents: 2000, description: 'Porção de 200 g, preparada na hora.', recipe: [{ inventoryId: 'batata', qty: 200 }], removable: ['Sal'], addons: [{ id: 'queijo', name: 'Queijo extra', priceCents: 500, recipe: [{ inventoryId: 'queijo', qty: 1 }] }] },
      { id: 'bebida', name: 'Bebida lata', category: 'Bebidas', priceCents: 1000, description: 'Lata de 350 ml, produto pronto.', recipe: [{ inventoryId: 'bebida', qty: 1 }], removable: [], addons: [] },
      { id: 'suco', name: 'Suco de fruta', category: 'Bebidas', priceCents: 1200, description: 'Garrafa de 300 ml, produto pronto.', recipe: [{ inventoryId: 'suco', qty: 1 }], removable: [], addons: [] },
    ],
    orders: [], receipts: [], movements: [], history: [], processedCommands: {},
    shift: { id: 'turno-1', status: 'open', openedAt: now(), closedAt: null }, shifts: [],
  };
}
export const available = item => roundQty(item.physical - item.reserved);
export function orderTotals(state, order) {
  if (typeof order === 'string') order = state.orders.find(o => o.id === order);
  if (!order) fail('Pedido não encontrado.');
  const subtotalCents = order.items.reduce((sum, i) => sum + i.unitPriceCents * i.quantity, 0);
  const discountCents = order.discountCents || 0;
  const contractedCents = Math.max(0, subtotalCents + (order.deliveryFeeCents || 0) - discountCents);
  const totalCents = order.stage === 'cancelled' ? 0 : contractedCents;
  const receivedCents = state.receipts.filter(r => r.orderId === order.id).reduce((sum, r) => sum + r.amountCents, 0);
  return { subtotalCents, discountCents, totalCents, contractedCents, receivedCents,
    balanceCents: Math.max(0, totalCents - receivedCents), refundDueCents: Math.max(0, receivedCents - totalCents),
    costCents: order.items.reduce((sum, i) => sum + i.unitCostCents * i.quantity, 0) };
}
/** Centavos de desconto são distribuídos deterministicamente entre unidades e taxa. */
export function paymentUnits(state, order) {
  if (typeof order === 'string') order = state.orders.find(o => o.id === order);
  if (!order) fail('Pedido não encontrado.');
  const units = order.items.flatMap(i => Array.from({ length: i.quantity }, (_, index) => ({
    id: `${i.id}:${index}`, itemId: i.id, index, label: i.name, targetCents: i.unitPriceCents, paidCents: 0,
  })));
  if (order.deliveryFeeCents) units.push({ id: `${order.id}:delivery`, itemId: '__delivery', index: 0, label: 'Taxa de entrega', targetCents: order.deliveryFeeCents, paidCents: 0 });
  const base = units.reduce((sum, u) => sum + u.targetCents, 0);
  let accumulatedBase = 0, accumulatedDiscount = 0;
  units.forEach(u => {
    accumulatedBase += u.targetCents;
    const nextDiscount = base ? Number(BigInt(order.discountCents || 0) * BigInt(accumulatedBase) / BigInt(base)) : 0;
    const d = nextDiscount - accumulatedDiscount;
    u.targetCents -= d; accumulatedDiscount = nextDiscount;
  });
  for (const r of state.receipts.filter(r => r.orderId === order.id)) {
    for (const a of r.allocations || []) { const unit = units.find(u => u.id === a.unitId); if (unit) unit.paidCents += a.amountCents; }
  }
  return units.map(u => ({ ...u, balanceCents: Math.max(0, u.targetCents - u.paidCents), eligible: u.paidCents === 0 && u.targetCents > 0 }));
}
export function shiftTotals(state) {
  if (state.shift.status === 'closed' && state.shift.totals) return structuredClone(state.shift.totals);
  const orders = state.orders.filter(o => o.shiftId === state.shift.id);
  const receipts = state.receipts.filter(r => r.shiftId === state.shift.id);
  const outstanding = state.orders.filter(o => o.stage !== 'cancelled');
  const salesAdjustmentCents = state.orders.filter(o => o.shiftId !== state.shift.id && o.cancelledShiftId === state.shift.id).reduce((sum, o) => sum - (o.cancelledContractedCents || 0), 0);
  const byMethod = Object.fromEntries(methods.map(method => [method, receipts.filter(r => r.method === method).reduce((s, r) => s + r.amountCents, 0)]));
  return {
    orderCount: orders.length, openCount: outstanding.filter(o => o.stage !== 'delivered' || orderTotals(state, o).balanceCents > 0).length,
    soldCents: orders.filter(o => !['draft', 'cancelled'].includes(o.stage)).reduce((s, o) => s + orderTotals(state, o).totalCents, 0) + salesAdjustmentCents,
    salesAdjustmentCents,
    receivedCents: receipts.reduce((s, r) => s + r.amountCents, 0),
    pendingCents: outstanding.filter(o => o.stage !== 'draft').reduce((sum, o) => sum + orderTotals(state, o).balanceCents, 0),
    refundDueCents: state.orders.reduce((sum, o) => sum + orderTotals(state, o).refundDueCents, 0), byMethod,
    grossReceivedCents: receipts.filter(r => r.amountCents > 0).reduce((s, r) => s + r.amountCents, 0),
    refundedCents: -receipts.filter(r => r.amountCents < 0).reduce((s, r) => s + r.amountCents, 0),
  };
}
function manager(c) { if (c.actor !== 'gestao') fail('Esta ação exige o perfil de gestão.', 'FORBIDDEN'); }
function sales(c) { if (!['gestao', 'caixa'].includes(c.actor)) fail('Esta ação exige caixa ou gestão.', 'FORBIDDEN'); }
function open(s) { if (s.shift.status !== 'open') fail('Abra um novo turno antes desta operação.'); }
function orderFor(s, c) { const o = s.orders.find(o => o.id === c.orderId); if (!o) fail('Pedido não encontrado.'); return o; }
function addHistory(s, c, details = {}) {
  s.history.push({ id: `history-${c.id}`, commandId: c.id, type: c.type, actor: c.actor, orderId: c.orderId || null, shiftId: s.shift.id, at: now(), ...structuredClone(details) });
}
function requirements(order) {
  const result = new Map();
  for (const item of order.items) for (const r of item.recipe) result.set(r.inventoryId, roundQty((result.get(r.inventoryId) || 0) + r.qty * item.quantity));
  return [...result].map(([inventoryId, qty]) => ({ inventoryId, qty }));
}
function stockMove(s, c, order, kind) {
  const needs = order.stockRequirements || requirements(order);
  for (const { inventoryId, qty } of needs) {
    const stock = s.inventory.find(i => i.id === inventoryId); if (!stock) fail('Ingrediente não cadastrado.');
    if (kind === 'reserve' && available(stock) < qty) fail(`Estoque insuficiente: ${stock.name}.`, 'INSUFFICIENT_STOCK');
    if (kind === 'consume' && (stock.reserved < qty || stock.physical < qty)) fail(`Reserva de estoque inconsistente: ${stock.name}.`);
  }
  for (const { inventoryId, qty } of needs) {
    const stock = s.inventory.find(i => i.id === inventoryId);
    if (kind === 'reserve') stock.reserved = roundQty(stock.reserved + qty);
    if (kind === 'release') stock.reserved = roundQty(stock.reserved - qty);
    if (kind === 'consume') { stock.reserved = roundQty(stock.reserved - qty); stock.physical = roundQty(stock.physical - qty); }
    s.movements.push({ id: `${c.id}-${inventoryId}`, commandId: c.id, orderId: order.id, inventoryId, kind, quantity: qty, physicalDelta: kind === 'consume' ? -qty : 0, at: now(), actor: c.actor });
  }
}
function receive(s, c, o) {
  sales(c); open(s);
  if (o.stage === 'draft' || o.stage === 'cancelled') fail('Envie o pedido antes de receber; pedidos cancelados não podem receber.');
  if (!methods.includes(c.method)) fail('Escolha explicitamente a forma de pagamento.');
  if (!['value', 'items'].includes(c.allocation)) fail('Escolha pagamento por valor ou por itens.');
  integer(c.amountCents, 'Valor', 1);
  const totals = orderTotals(s, o);
  if (c.amountCents > totals.balanceCents) fail('O valor excede o saldo restante.');
  const units = paymentUnits(s, o); let allocations = [];
  if (c.allocation === 'items') {
    if (!Array.isArray(c.items) || !c.items.length) fail('Selecione os itens a receber.');
    const grouped = new Map();
    for (const row of c.items) {
      integer(row.quantity, 'Quantidade a receber', 1);
      grouped.set(row.itemId, (grouped.get(row.itemId) || 0) + row.quantity);
    }
    for (const [itemId, qty] of grouped) {
      const eligible = units.filter(u => u.itemId === itemId && u.eligible);
      if (eligible.length < qty) fail('Item já pago ou parcialmente alocado. Receba o saldo por valor.');
      allocations.push(...eligible.slice(0, qty).map(u => ({ unitId: u.id, amountCents: u.targetCents })));
    }
    if (allocations.reduce((sum, a) => sum + a.amountCents, 0) !== c.amountCents) fail('O valor deve corresponder exatamente às unidades selecionadas.');
  } else {
    let rest = c.amountCents;
    for (const unit of units) {
      const amountCents = Math.min(rest, unit.balanceCents);
      if (amountCents) allocations.push({ unitId: unit.id, amountCents });
      rest -= amountCents; if (!rest) break;
    }
    if (rest) fail('Não foi possível alocar o recebimento.');
  }
  const id = c.receiptId || `receipt-${c.id}`;
  if (s.receipts.some(r => r.id === id)) fail('Identificador de recebimento já utilizado.');
  s.receipts.push({ id, commandId: c.id, orderId: o.id, shiftId: s.shift.id, type: 'receipt', amountCents: c.amountCents, method: c.method, allocation: c.allocation, allocations, at: now(), actor: c.actor, simulated: true });
  addHistory(s, c, { amountCents: c.amountCents, method: c.method, receiptId: id });
}
export function dispatch(state, command) {
  if (!command || typeof command !== 'object') fail('Comando inválido.');
  const c = command;
  if (typeof c.id !== 'string' || !c.id.trim() || c.id.length > 150) fail('O comando exige uma chave de idempotência válida.');
  if (!roles.includes(c.actor)) fail('Perfil inválido.', 'FORBIDDEN');
  const sig = signature(c);
  if (Object.hasOwn(state.processedCommands, c.id)) {
    if (state.processedCommands[c.id] !== sig) fail('Chave de idempotência já usada por outra operação.', 'IDEMPOTENCY_CONFLICT');
    return state;
  }
  const s = structuredClone(state);
  if(c.actor==='garcom'&&!['CREATE_ORDER','ADD_ITEM','REMOVE_ITEM','SUBMIT_ORDER','SET_STAGE'].includes(c.type))fail('Ação indisponível no modo Garçom.','FORBIDDEN');
  switch (c.type) {
    case 'SAVE_CLIENT': {
      const name=String(c.name||'').trim(), recordId=String(c.clientId||'').trim();
      if(!["gestao","caixa"].includes(c.actor)||!name||!recordId||name.length>100)throw new Error('Informe o nome do cliente com um perfil autorizado.');
      const record={id:recordId,name,contact:String(c.contact||'').trim().slice(0,120)};
      s.clients=(s.clients||[]).filter(x=>x.id!==record.id).concat(record);
      break;
    }
    case 'CREATE_ORDER': {
      const client=(s.clients||[]).find(x=>x.id===c.clientId);
      if(c.clientId&&!client)throw new Error('Cliente não encontrado.');

      if(c.actor!=='garcom')sales(c); open(s);
      if (!s.settings.modes.includes(c.mode)) fail('Modo de atendimento desabilitado.');
      const id = required(c.orderId, 'o identificador do pedido');
      if (s.orders.some(o => o.id === id)) fail('Pedido já existente.');
      if (c.mode === 'salao' && !text(c.table)) fail('Informe a mesa ou comanda.');
      if (c.mode === 'salao' && s.orders.some(o => o.mode === 'salao' && o.table === text(c.table) && o.stage !== 'cancelled' && (o.stage !== 'delivered' || orderTotals(s, o).balanceCents > 0))) fail('A mesa já possui uma conta ativa.');
      if (c.mode === 'entrega') { required(client?.name||c.customer, 'o cliente fictício'); required(c.address, 'o endereço da entrega'); }
      integer(c.deliveryFeeCents || 0, 'Taxa de entrega');
      s.orders.push({ id, number: s.orders.length + 1, mode: c.mode, table: text(c.table, 40), clientId:client?.id||null,customer: text(client?.name||c.customer, 120), address: text(c.address, 250), deliveryFeeCents: c.mode === 'entrega' ? c.deliveryFeeCents || 0 : 0, stage: 'draft', items: [], discountCents: 0, shiftId: s.shift.id, createdAt: now(), stockConsumed: false, stockReserved: false });
      addHistory(s, c, { mode: c.mode }); break;
    }
    case 'ADD_ITEM': {
      if(c.actor!=='garcom')sales(c); open(s); const o = orderFor(s, c);
      if (o.stage !== 'draft') fail('Somente rascunhos podem receber itens. Crie um pedido complementar.');
      const p = s.products.find(p => p.id === c.productId); if (!p) fail('Produto não encontrado.');
      integer(c.quantity, 'Quantidade', 1); if (c.quantity > 100) fail('Limite de 100 unidades por item.');
      const ids = c.addonIds || []; const removals = c.removals || [];
      if (!Array.isArray(ids) || !Array.isArray(removals)) fail('Adicionais ou remoções inválidos.');
      const addons = [...new Set(ids)].map(id => { const a = p.addons.find(a => a.id === id); if (!a) fail('Adicional inválido.'); return structuredClone(a); });
      if (removals.some(r => !p.removable.includes(r))) fail('Remoção inválida.');
      const recipe = [...structuredClone(p.recipe), ...addons.flatMap(a => a.recipe)];
      const cost = recipe.reduce((total, r) => { const inv = s.inventory.find(i => i.id === r.inventoryId); if (!inv) fail('Ficha técnica inválida.'); return total + r.qty * inv.costCents; }, 0);
      const itemId = c.itemId || `item-${c.id}`;
      if (o.items.some(i => i.id === itemId)) fail('Identificador de item repetido.');
      o.items.push({ id: itemId, productId: p.id, name: p.name, quantity: c.quantity, unitPriceCents: p.priceCents + addons.reduce((sum, a) => sum + a.priceCents, 0), unitCostCents: Math.round(cost), addons: addons.map(({ id, name, priceCents }) => ({ id, name, priceCents })), removals: [...new Set(removals)], note: text(c.note), recipe, costSnapshot: recipe.map(r => ({ ...r, unitCostCents: s.inventory.find(i => i.id === r.inventoryId).costCents })) });
      addHistory(s, c, { productId: p.id, quantity: c.quantity, itemId }); break;
    }
    case 'REMOVE_ITEM': {
      if(c.actor!=='garcom')sales(c); open(s); const o = orderFor(s, c); if (o.stage !== 'draft') fail('Somente rascunhos permitem remoção.');
      const i = o.items.findIndex(i => i.id === c.itemId); if (i < 0) fail('Item não encontrado.');
      o.items.splice(i, 1); o.discountCents = 0; addHistory(s, c, { itemId: c.itemId }); break;
    }
    case 'SUBMIT_ORDER': {
      if(c.actor!=='garcom')sales(c); open(s); const o = orderFor(s, c);
      if (o.stage !== 'draft') fail('Pedido já enviado.');
      if (!o.items.length) fail('Adicione ao menos um item.');
      o.stockRequirements = requirements(o); stockMove(s, c, o, 'reserve');
      o.stage = 'received'; o.stockReserved = true; o.submittedAt = now(); addHistory(s, c); break;
    }
    case 'SET_STAGE': {
      if(c.actor==='garcom'&&c.stage!=='delivered')fail('Garçom pode registrar a entrega de um pedido pronto.','FORBIDDEN');
      open(s); const o = orderFor(s, c);
      const next = { received: 'preparing', preparing: 'ready', ready: 'delivered' }[o.stage];
      if (c.stage !== next) fail('Avance uma etapa por vez: recebido, em preparo, pronto e entregue.');
      if (c.stage === 'preparing' && !o.stockConsumed) { stockMove(s, c, o, 'consume'); o.stockConsumed = true; o.stockReserved = false; }
      o.stage = c.stage; o.updatedAt = now(); addHistory(s, c, { stage: c.stage }); break;
    }
    case 'CANCEL_ORDER': {
      open(s);
      const o = orderFor(s, c); const reason = required(c.reason, 'o motivo do cancelamento');
      if (o.stage === 'cancelled') fail('Pedido já cancelado.');
      if (['preparing', 'ready', 'delivered'].includes(o.stage)) manager(c); else sales(c);
      if (o.stockReserved) { stockMove(s, c, o, 'release'); o.stockReserved = false; }
      o.cancelledContractedCents = o.stage === 'draft' ? 0 : orderTotals(s, o).totalCents;
      o.cancelledShiftId = s.shift.id;
      o.previousStage = o.stage; o.stage = 'cancelled'; o.cancelledAt = now(); o.cancelReason = reason;
      addHistory(s, c, { reason, stockConsumed: o.stockConsumed, financialHistoryPreserved: true, salesAdjustmentCents: o.shiftId === s.shift.id ? 0 : -o.cancelledContractedCents }); break;
    }
    case 'DISCOUNT': {
      manager(c); open(s); const o = orderFor(s, c); const reason = required(c.reason, 'o motivo do desconto');
      if (o.stage === 'cancelled') fail('Pedido cancelado.');
      if (s.receipts.some(r => r.orderId === o.id)) fail('Aplique descontos antes dos recebimentos.');
      integer(c.amountCents, 'Desconto');
      const maximum = orderTotals(s, o).subtotalCents + o.deliveryFeeCents;
      if (c.amountCents > maximum) fail('Desconto maior que o total.');
      o.discountCents = c.amountCents; addHistory(s, c, { reason, amountCents: c.amountCents }); break;
    }
    case 'RECEIVE': receive(s, c, orderFor(s, c)); break;
    case 'REFUND': {
      manager(c); open(s); const reason = required(c.reason, 'o motivo do estorno'); integer(c.amountCents, 'Valor do estorno', 1);
      const original = s.receipts.find(r => r.id === c.receiptId && r.type === 'receipt'); if (!original) fail('Recebimento não encontrado.');
      const previous = s.receipts.filter(r => r.originalReceiptId === original.id);
      const remaining = original.amountCents + previous.reduce((sum, r) => sum + r.amountCents, 0);
      if (c.amountCents > remaining) fail('Estorno maior que o recebimento disponível.');
      let rest = c.amountCents; const allocations = [];
      for (const originalAllocation of [...original.allocations].reverse()) {
        const already = previous.flatMap(r => r.allocations).filter(a => a.unitId === originalAllocation.unitId).reduce((sum, a) => sum - a.amountCents, 0);
        const amount = Math.min(rest, originalAllocation.amountCents - already);
        if (amount > 0) allocations.push({ unitId: originalAllocation.unitId, amountCents: -amount });
        rest -= amount; if (!rest) break;
      }
      s.receipts.push({ id: `refund-${c.id}`, commandId: c.id, originalReceiptId: original.id, orderId: original.orderId, shiftId: s.shift.id, type: 'refund', amountCents: -c.amountCents, method: original.method, allocation: original.allocation, allocations, reason, actor: c.actor, at: now(), simulated: true });
      addHistory(s, { ...c, orderId: original.orderId }, { receiptId: original.id, amountCents: -c.amountCents, reason }); break;
    }
    case 'ADJUST_STOCK': {
      manager(c); const reason = required(c.reason, 'o motivo do ajuste'); const stock = s.inventory.find(i => i.id === c.inventoryId);
      if (!stock) fail('Item de estoque não encontrado.');
      if (!Number.isFinite(c.quantity) || Math.abs(c.quantity * 1000 - Math.round(c.quantity * 1000)) > 1e-7 || c.quantity === 0) fail('Use quantidade diferente de zero com até três casas decimais.');
      if (stock.unit === 'un' && !Number.isSafeInteger(c.quantity)) fail('Produtos em unidades exigem quantidade inteira.');
      if (Math.abs(c.quantity) > 1e8) fail('Quantidade fora do limite.');
      if (roundQty(stock.physical + c.quantity) < stock.reserved) fail('O ajuste não pode comprometer o estoque reservado.');
      stock.physical = roundQty(stock.physical + c.quantity);
      s.movements.push({ id: `adjust-${c.id}`, commandId: c.id, inventoryId: stock.id, orderId: null, kind: 'adjust', quantity: c.quantity, physicalDelta: c.quantity, reason, actor: c.actor, at: now() });
      addHistory(s, c, { inventoryId: stock.id, quantity: c.quantity, reason }); break;
    }
    case 'UPSERT_INVENTORY': {
      manager(c);
      const data = c.inventory;
      if (!data || typeof data !== 'object') fail('Informe o cadastro do estoque.');
      const id = required(data.id, 'o código do estoque');
      if (!/^[a-z0-9_-]{1,80}$/i.test(id)) fail('Use um código de estoque com letras, números, hífen ou sublinhado.');
      const existing = s.inventory.find(i => i.id === id);
      const unit = data.unit || existing?.unit;
      if (!['un', 'g', 'ml'].includes(unit)) fail('Unidade de estoque inválida: use un, g ou ml.');
      if (existing && existing.unit !== unit) fail('Não altere a unidade de um estoque existente.');
      const name = required(data.name, 'o nome do estoque');
      const min = data.min ?? existing?.min ?? 0;
      const physical = data.physical ?? existing?.physical ?? 0;
      const costCents = data.costCents ?? existing?.costCents ?? 0;
      for (const [label, value] of [['Estoque inicial', physical], ['Estoque mínimo', min], ['Custo unitário', costCents]]) {
        if (!Number.isFinite(value) || value < 0 || value > 1e8 || Math.abs(value * 1000 - Math.round(value * 1000)) > 1e-7) fail(`${label}: use valor não negativo com até três casas decimais.`);
      }
      if (unit === 'un' && (!Number.isSafeInteger(physical) || !Number.isSafeInteger(min))) fail('Estoques em unidades exigem quantidades inteiras.');
      if (existing && physical !== existing.physical) fail('Use o ajuste com motivo para alterar o saldo físico.');
      const record = { id, name, unit, physical, reserved: existing?.reserved || 0, min, costCents };
      if (existing) Object.assign(existing, record); else {
        s.inventory.push(record);
        if (physical) s.movements.push({ id: `initial-${c.id}`, commandId: c.id, inventoryId: id, orderId: null, kind: 'initial', quantity: physical, physicalDelta: physical, reason: 'Cadastro com estoque inicial', actor: c.actor, at: now() });
      }
      addHistory(s, c, { inventoryId: id, previous: existing ? structuredClone(state.inventory.find(i => i.id === id)) : null, current: record }); break;
    }
    case 'UPSERT_PRODUCT': {
      manager(c);
      const data = c.product;
      if (!data || typeof data !== 'object') fail('Informe o cadastro do produto.');
      const id = required(data.id, 'o código do produto');
      if (!/^[a-z0-9_-]{1,80}$/i.test(id)) fail('Use um código de produto com letras, números, hífen ou sublinhado.');
      const existing = s.products.find(p => p.id === id);
      const name = required(data.name, 'o nome do produto');
      const category = required(data.category, 'a categoria');
      if (data.barcode != null && typeof data.barcode !== 'string') fail('Código de barras deve ser texto para preservar zeros iniciais.');
      const barcode = data.barcode === undefined ? existing?.barcode || '' : text(data.barcode, 31);
      if (barcode && !/^[A-Za-z0-9._-]{1,30}$/.test(barcode)) fail('Código de barras: use até 30 letras, números, ponto, hífen ou sublinhado.');
      if (barcode && s.products.some(p => p.id !== id && p.barcode === barcode)) fail('Código de barras já utilizado por outro produto.');
      integer(data.priceCents, 'Preço', 1); if (data.priceCents > 1e8) fail('Preço fora do limite.');
      const validateRecipe = value => {
        if (!Array.isArray(value) || value.length > 100) fail('Ficha técnica inválida.');
        const grouped = new Map();
        for (const r of value) {
          const stock = s.inventory.find(i => i.id === r.inventoryId);
          if (!stock) fail('A ficha técnica contém estoque não cadastrado.');
          if (!Number.isFinite(r.qty) || r.qty <= 0 || r.qty > 1e8 || Math.abs(r.qty * 1000 - Math.round(r.qty * 1000)) > 1e-7) fail('Quantidade da ficha técnica: use número positivo com até três casas decimais.');
          if (stock.unit === 'un' && !Number.isSafeInteger(r.qty)) fail('A ficha técnica de produtos em unidades exige quantidade inteira.');
          grouped.set(r.inventoryId, roundQty((grouped.get(r.inventoryId) || 0) + r.qty));
        }
        return [...grouped].map(([inventoryId, qty]) => ({ inventoryId, qty }));
      };
      const recipe = validateRecipe(data.recipe ?? existing?.recipe ?? []);
      const removable = data.removable ?? existing?.removable ?? [];
      if (!Array.isArray(removable) || removable.length > 30 || removable.some(v => typeof v !== 'string' || !text(v))) fail('Remoções inválidas.');
      const sourceAddons = data.addons ?? existing?.addons ?? [];
      if (!Array.isArray(sourceAddons) || sourceAddons.length > 30) fail('Adicionais inválidos.');
      const addonIds = new Set();
      const addons = sourceAddons.map(a => {
        const addonId = required(a.id, 'o código do adicional');
        if (addonIds.has(addonId)) fail('Código de adicional repetido.'); addonIds.add(addonId);
        integer(a.priceCents, 'Preço do adicional'); if (a.priceCents > 1e8) fail('Preço do adicional fora do limite.');
        return { id: addonId, name: required(a.name, 'o nome do adicional'), priceCents: a.priceCents, recipe: validateRecipe(a.recipe || []) };
      });
      const record = { id, name, category, barcode, priceCents: data.priceCents, description: text(data.description ?? existing?.description), recipe, removable: [...new Set(removable.map(r => text(r, 80)))], addons };
      if (existing) Object.assign(existing, record); else s.products.push(record);
      addHistory(s, c, { productId: id, previous: existing ? structuredClone(state.products.find(p => p.id === id)) : null, current: record }); break;
    }
    case 'UPDATE_SETTINGS': {
      manager(c);
      if (!Array.isArray(c.modes) || !c.modes.length || c.modes.some(m => !modes.includes(m)) || !c.modes.includes(c.defaultMode)) fail('Habilite ao menos um modo e escolha uma abertura válida.');
      s.settings.modes = [...new Set(c.modes)]; s.settings.defaultMode = c.defaultMode; addHistory(s, c, { modes: s.settings.modes, defaultMode: c.defaultMode }); break;
    }
    case 'CLOSE_SHIFT': {
      manager(c); open(s);
      if (s.orders.some(o => o.stage !== 'cancelled' && (o.stage !== 'delivered' || orderTotals(s, o).balanceCents > 0))) fail('Existem pedidos ou contas abertas neste turno ou em turnos anteriores.');
      if (s.orders.some(o => orderTotals(s, o).refundDueCents > 0)) fail('Existem estornos pendentes.');
      s.shift.status = 'closed'; s.shift.closedAt = now(); s.shift.totals = shiftTotals(s); addHistory(s, c); break;
    }
    case 'OPEN_SHIFT': {
      manager(c); if (s.shift.status !== 'closed') fail('O turno atual já está aberto.');
      s.shifts.push(structuredClone(s.shift)); s.shift = { id: `turno-${s.shifts.length + 1}`, status: 'open', openedAt: now(), closedAt: null }; addHistory(s, c); break;
    }
    default: fail('Operação desconhecida.');
  }
  Object.defineProperty(s.processedCommands, c.id, { value: sig, enumerable: true, configurable: true, writable: true });
  s.revision = (s.revision || 0) + 1;
  return s;
}
