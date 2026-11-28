import { createWineDemoState, dispatchWine } from './wine-domain.mjs';
export const WINE_STORAGE_KEY='skye.demo.wine.v1';
export function createWineStore(storage=globalThis.localStorage) {
  function read() {
    const raw=storage.getItem(WINE_STORAGE_KEY);if(!raw)return createWineDemoState();let state;
    try{state=JSON.parse(raw);}catch{throw new Error('Os dados da adega não puderam ser lidos. Reinicie somente esta demonstração para recuperar.');}
    if(!state||state.schemaVersion!==1||!['products','batches','returnableTypes','orders','receipts','movements','history','shifts'].every(k=>Array.isArray(state[k]))||!state.shift||!state.processedCommands||typeof state.processedCommands!=='object'||typeof state.businessDate!=='string')throw new Error('Versão de dados da adega incompatível. Reinicie esta demonstração.');
    return state;
  }
  function commit(c){const state=dispatchWine(read(),c);storage.setItem(WINE_STORAGE_KEY,JSON.stringify(state));return state;}
  async function transact(c){if(globalThis.navigator?.locks)return navigator.locks.request(WINE_STORAGE_KEY,()=>commit(c));return commit(c);}
  async function reset(){const save=()=>{const state=createWineDemoState();storage.setItem(WINE_STORAGE_KEY,JSON.stringify(state));return state;};if(globalThis.navigator?.locks)return navigator.locks.request(WINE_STORAGE_KEY,save);return save();}
  return {read,transact,reset};
}
