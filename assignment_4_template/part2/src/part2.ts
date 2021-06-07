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

// export async function asyncWaterfallWithRetry(fns: [() => Promise<any>, ...((param: any) => any)[]]): Promise<any> {
//     let index = 0;
//     let prev: Promise<any>;
//     let temp: any; 
//     for(let x of fns){
//         if(index === 0){//first function
//             prev = new Promise<any>((resolveOne) => {
//                  try{
//                      resolveOne(fns[0]());//if everything is ok
//                  }
//                  catch{//first time 
//                     setTimeout(() => {
//                         return new Promise<any>((resolveTwo) => {
//                             try{
//                                 resolveTwo(fns[0]());
//                             }
//                             catch(err){//second time
//                                 setTimeout(() => {
//                                     return new Promise<any>((resolveThree, reject) => {
//                                         try{
//                                             resolveThree(fns[0]());
//                                         }
//                                         catch(err){//third time
//                                             reject(err)
//                                         }
//                                     })
//                                 }, 2000) //wait for 2 seconds and try again 
//                             }
//                         })
//                     }, 2000) //wait for 2 seconds and try again
//                  }
//             })
//         }
//         else{//rest of functions
//             prev = new Promise<any>((resolveOne) => {
//                 try{
//                     resolveOne(x(temp));//if everything is ok
//                 }
//                 catch{//first time 
//                    setTimeout(() => {
//                        return new Promise<any>((resolveTwo) => {
//                            try{
//                                resolveTwo(x(temp));
//                            }
//                            catch(err){//second time
//                                setTimeout(() => {
//                                    return new Promise<any>((resolveThree, reject) => {
//                                        try{
//                                            resolveThree(x(temp));
//                                        }
//                                        catch(err){//third time
//                                            reject(err)
//                                        }
//                                    })
//                                }, 2000) //wait for 2 seconds and try again 
//                            }
//                        })
//                    }, 2000) //wait for 2 seconds and try again
//                 }
//            })
//         }
//         index ++;
//         temp = prev;    
//     }
// }
let t:number = 2000;

function rejectDelay(reason:any) {
    return new Promise(function(resolve, reject) {
        setTimeout(reject.bind(null, reason), t); 
    });
}

export async function asyncWaterfallWithRetry(fns: [() => Promise<any>, ...((param: any) => any)[]]): Promise<any> {
    let p : Promise<any> = fns[0]().catch(error=>fns[0]()).catch(rejectDelay).catch(error=>fns[0]()).catch(rejectDelay).then(result=>fns[1](result)).catch(error=>{return error;});
    for(let i = 2 ; i < fns.length ; i++ )
    {
        p = p.catch(result=>fns[i-1](result)).catch(rejectDelay);
        p = p.catch(result=>fns[i-1](result)).catch(rejectDelay);
        p = p.then(result => fns[i](result)).catch(error=>{return error;});
    }
    return p;
}
