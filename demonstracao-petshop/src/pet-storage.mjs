import {createPetDemoState,dispatchPet} from './pet-domain.mjs';
export const PET_STORAGE_KEY='skye.demo.pet.v1';
export function createPetStore(storage=globalThis.localStorage){
  function read(){
    const raw=storage.getItem(PET_STORAGE_KEY);if(!raw)return createPetDemoState();let s;
    try{s=JSON.parse(raw);}catch{throw new Error('Os dados do pet shop não puderam ser lidos. Reinicie somente esta demonstração.');}
    if(!s||s.schemaVersion!==1||!['tutors','pets','professionals','resources','unavailable','services','inventory','orders','receipts','movements','occurrences','history','shifts'].every(key=>Array.isArray(s[key]))||!s.shift||!s.processedCommands||typeof s.processedCommands!=='object'||typeof s.businessDate!=='string')throw new Error('Versão de dados do pet shop incompatível. Reinicie esta demonstração.');
    return s;
  }
  function commit(c){const s=dispatchPet(read(),c);storage.setItem(PET_STORAGE_KEY,JSON.stringify(s));return s;}
  async function transact(c){if(globalThis.navigator?.locks)return navigator.locks.request(PET_STORAGE_KEY,()=>commit(c));return commit(c);}
  async function reset(){const save=()=>{const s=createPetDemoState();storage.setItem(PET_STORAGE_KEY,JSON.stringify(s));return s;};if(globalThis.navigator?.locks)return navigator.locks.request(PET_STORAGE_KEY,save);return save();}
  return {read,transact,reset};
}
