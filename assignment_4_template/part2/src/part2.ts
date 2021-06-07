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
                if(promisedStore.has(key)){
                    promisedStore.set(key, value);
                    resolve();
                }
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
    for(let x of genFn().next().value){
        if(filterFn(x))
            yield x;   
    }
}

export function lazyFilter<T>(genFn: () => Generator<T>, filterFn: (pred:T) => boolean): Generator<T> {
    return filterGenerator(genFn, filterFn);
}

function* mapGenerator<T,R> (genFn: () => Generator<T>, mapFn: (param:T) => R): Generator<R> {
    for(let x of genFn().next().value){
        yield mapFn(x);
    }
}

export function lazyMap<T, R>(genFn: () => Generator<T>, mapFn: (param:T) => R): Generator<R> {
    return mapGenerator(genFn, mapFn);
}

/* 2.4 */
// you can use 'any' in this question

// const helper = (func: () => Promise<any>): Promise<any> => {
//     return new Promise<any>((resolve, reject) => {
//         setTimeout(() => {
//             resolve(func().catch((err) => {
//                 reject(err);
//             }))
//         },2000)//second time
//     })
// }

// const helper1 = (func: (v:any) => Promise<any>, v: any): Promise<any> =>{
//     return new Promise<any>((resolve, reject) => {
//         setTimeout(() => {
//             resolve(func(v).catch((err) => {
//                 reject(err);
//             }))
//         },2000)//second time
//     })
// }

export async function asyncWaterfallWithRetry(fns: [() => Promise<any>, ...((param: any) => any)[]]): Promise<any> {
    let index = 0;
    let prev: Promise<any>;
    let temp: any; 
    for(let x of fns){
        if(index === 0){//first function
            prev = fns[0]().catch(() => { 
                return new Promise<any>(((resolveOne) => 
                    setTimeout(() => {
                        resolveOne(fns[0]().catch(() => {
                            return new Promise<any>(((resolveTwo, rejectTwo) => {
                                setTimeout(() => {
                                    resolveTwo(fns[0]().catch((err) => {
                                        rejectTwo(err)
                                    }))
                                }, 2000) //set 2 seconds
                            }))
                        }))
                    }, 2000) //set 2 seconds    
                ))
            })
        }
        else{//rest of functions
            prev = x(temp).catch(() => {
                return new Promise<any>(((resolveOne) => {
                    setTimeout(() => {
                        resolveOne(x(temp).catch(() => {
                            return new Promise<any>(((resolveTwo, reject) => {
                                setTimeout(() => {
                                    resolveTwo(x(temp).catch((err:any) => {
                                        reject(err)
                                    }))
                                }, 2000) //set 2 seconds
                            }))
                        }))
                    }, 2000)// set 2 seconds
                    })    
                )
            })
        }
        index = index +  1;
        temp = prev;    
    }
}