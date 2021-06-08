/* 2.1 */

export const MISSING_KEY = '___MISSING___'

type PromisedStore<K, V> = {
    get(key: K): Promise<V>,
    set(key: K, value: V): Promise<void>,
    delete(key: K): Promise<void>
}

// A
export function makePromisedStore<K, V>(): PromisedStore<K, V> {
    let promisedStore = new Map<K, V>()
    return {
        get(key: K) {
                return new Promise<V>((resolve, reject)=>{
                    if(promisedStore.has(key)){
                        const val = promisedStore.get(key);
                        if(val !== undefined)
                            resolve(val);
                        else
                            reject(MISSING_KEY);//key is undefined  
                    }
                    else
                        reject(MISSING_KEY);//key does not exists    
                })
           
        },
        set(key: K, value: V) {
            return new Promise<void>((resolve)=>{
                //if(promisedStore.has(key)){
                    promisedStore.set(key, value);
                    resolve();
                //}
            })
        },
        delete(key: K) {
            return new Promise<void>((resolve, reject)=>{
                if(promisedStore.has(key)){
                    promisedStore.delete(key);
                    resolve(); 
                }
                else{
                    reject(MISSING_KEY);//key does not exists 
                }
            })
        },
    }
}

// B - returns a promise containing a list of values 
export function getAll<K, V>(store: PromisedStore<K, V>, keys: K[]): Promise<V[]> {
    const value = keys.map(x => (store.get(x)));
    return Promise.all(value);
}

/* 2.2 */

//??? (you may want to add helper functions here)

// const asyncFunc = async<T,R> (store:PromisedStore<T,R> ,key:T, f:(param:T) => R): Promise<R> => {
    
// }



export function asycMemo<T, R>(f: (param: T) => R): (param: T) => Promise<R> {
    const promisedStore = makePromisedStore<T, R>();
    return async (key:T):Promise<R> =>{
    try{   
        return await promisedStore.get(key);
    }
    catch(err){
        await promisedStore.set(key, f(key));
    }    
    return await promisedStore.get(key);
    }
}

/* 2.3 */

 function* filterGenerator<T>(genFn: () => Generator<T>, filterFn: (pred:T) => boolean): Generator<T>{
    let genf : Generator<T> = genFn();
    let x : IteratorResult<T,any> = genf.next();
    while(!x.done)
    {
        if(filterFn(x.value))
            yield x.value;
        x = genf.next();
    }
}

export function lazyFilter<T>(genFn: () => Generator<T>, filterFn: (pred:T) => boolean): () => Generator<T> {
    return ():Generator<T> => filterGenerator(genFn, filterFn);
}

function* mapGenerator<T,R> (genFn: () => Generator<T>, mapFn: (param:T) => R): Generator<R> {
    let genf : Generator<T> = genFn();
    let x : IteratorResult<T,any> = genf.next();
    while(!x.done)
    {
        yield mapFn(x.value);
        x = genf.next();
    }
}

export function lazyMap<T, R>(genFn: () => Generator<T>, mapFn: (param:T) => R): () => Generator<R> {
    return () : Generator<R> => mapGenerator(genFn, mapFn);
}

function sleep(ms:number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

export async function asyncWaterfallWithRetry(fns: [() => Promise<any>, ...((param: any) => any)[]]): Promise<any> {
    let result:any;

    for (let i = 0 ; i < fns.length; i++)
    {     
        try {
            result = await fns[i](result);
        } catch (error) {
            try {
                sleep(2000);
                result = await fns[i](result);
            } catch (error) {
                try {
                    sleep(2000);
                    result = await fns[i](result);
                } catch (error) {
                    throw error;
                }
            }
         }
    }
    return result;
}
