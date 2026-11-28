import { createDemoState, dispatch } from './domain.mjs';

export const STORAGE_KEY = 'skye.demo.restaurant.v1';
export function createStore(storage = globalThis.localStorage) {
  function read() {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return createDemoState();
    let state;
    try { state = JSON.parse(raw); } catch { throw new Error('Os dados desta demonstração não puderam ser lidos. Reinicie somente o piloto de restaurante para recuperar.'); }
    if (state.schemaVersion !== 1 || !['orders','receipts','inventory','products','history','movements','shifts'].every(key => Array.isArray(state[key])) || !state.settings || !Array.isArray(state.settings.modes) || !state.shift || !state.processedCommands || typeof state.processedCommands !== 'object') throw new Error('Versão de dados incompatível. Reinicie esta demonstração.');
    return state;
  }
  function commit(command) {
    const state = dispatch(read(), command);
    storage.setItem(STORAGE_KEY, JSON.stringify(state));
    return state;
  }
  async function transact(command) {
    if (globalThis.navigator?.locks) return navigator.locks.request(STORAGE_KEY, () => commit(command));
    return commit(command); // Sem Web Locks: demonstração em uma aba por vez.
  }
  async function reset() {
    const write = () => { const state = createDemoState(); storage.setItem(STORAGE_KEY, JSON.stringify(state)); return state; };
    if (globalThis.navigator?.locks) return navigator.locks.request(STORAGE_KEY, write);
    return write();
  }
  return { read, transact, reset };
}
