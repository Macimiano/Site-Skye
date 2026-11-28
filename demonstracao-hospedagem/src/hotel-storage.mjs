import {createHotelDemoState,dispatchHotel} from './hotel-domain.mjs';
export const HOTEL_STORAGE_KEY='skye.demo.hotel.v1';
export function createHotelStore(storage=globalThis.localStorage,locks=globalThis.navigator?.locks){
  function read(){
    const raw=storage.getItem(HOTEL_STORAGE_KEY);
    if(raw===null)return createHotelDemoState();
    const s=JSON.parse(raw);
    if(s?.schemaVersion!==1||!['reservations','rooms','blocks','receipts','history','processed','outbox','plans','categories'].every(k=>Array.isArray(s[k])))throw new Error('Dados de hospedagem incompatíveis.');
    return s;
  }
  function save(s){storage.setItem(HOTEL_STORAGE_KEY,JSON.stringify(s));return s;}
  function locked(operation){return locks?locks.request(HOTEL_STORAGE_KEY,operation):operation();}
  return {read,transact:c=>locked(()=>save(dispatchHotel(read(),c))),reset:()=>locked(()=>save(createHotelDemoState()))};
}
