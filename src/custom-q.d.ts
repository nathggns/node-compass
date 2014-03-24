// Type definitions for Q
// Project: https://github.com/kriskowal/q
// Definitions by: Barrie Nemetchek, Andrew Gaspar
// Definitions: https://github.com/borisyankov/DefinitelyTyped  

// Modified by Nathaniel Higgins to remove IPromise to get around
// https://github.com/borisyankov/DefinitelyTyped/issues/1904

declare function Q<T>(promise: Q.Promise<T>): Q.Promise<T>;
declare function Q<T>(promise: JQueryPromise<T>): Q.Promise<T>;
declare function Q<T>(value: T): Q.Promise<T>;

declare module Q {

    interface Deferred<T> {
        promise: Promise<T>;
        resolve(value: T): void;
        reject(reason: any): void;
        notify(value: any): void;
        makeNodeResolver(): (reason: any, value: T) => void;
    }

    interface Promise<T> {
        fin(finallyCallback: () => any): Promise<T>;
        finally(finallyCallback: () => any): Promise<T>;

        then<U>(onFulfill: (value: T) => Promise<U>, onReject?: (reason: any) => Promise<U>, onProgress?: Function): Promise<U>;
        then<U>(onFulfill: (value: T) => Promise<U>, onReject?: (reason: any) => U, onProgress?: Function): Promise<U>;
        then<U>(onFulfill: (value: T) => U, onReject?: (reason: any) => Promise<U>, onProgress?: Function): Promise<U>;
        then<U>(onFulfill: (value: T) => U, onReject?: (reason: any) => U, onProgress?: Function): Promise<U>;

        spread<U>(onFulfilled: Function, onRejected?: Function): Promise<U>;

        fail<U>(onRejected: (reason: any) => U): Promise<U>;
        fail<U>(onRejected: (reason: any) => Promise<U>): Promise<U>;
        catch<U>(onRejected: (reason: any) => U): Promise<U>;
        catch<U>(onRejected: (reason: any) => Promise<U>): Promise<U>;

        progress(onProgress: (progress: any) => any): Promise<T>;

        done(onFulfilled?: (value: T) => any, onRejected?: (reason: any) => any, onProgress?: (progress: any) => any): void;

        get<U>(propertyName: String): Promise<U>;
        set<U>(propertyName: String, value: any): Promise<U>;
        delete<U>(propertyName: String): Promise<U>;
        post<U>(methodName: String, args: any[]): Promise<U>;
        invoke<U>(methodName: String, ...args: any[]): Promise<U>;
        fapply<U>(args: any[]): Promise<U>;
        fcall<U>(...args: any[]): Promise<U>;

        keys(): Promise<string[]>;
        
        thenResolve<U>(value: U): Promise<U>;
        thenReject(reason: any): Promise<T>;
        timeout(ms: number, message?: string): Promise<T>;
        delay(ms: number): Promise<T>;

        isFulfilled(): boolean;
        isRejected(): boolean;
        isPending(): boolean;

        valueOf(): any;

        inspect(): PromiseState<T>;
    }

    interface PromiseState<T> {
        state: string /* "fulfilled", "rejected", "pending" */;
        value?: T;
        reason?: any;
    }

    // if no fulfill, reject, or progress provided, returned promise will be of same type
    export function when<T>(value: Promise<T>): Promise<T>;
    export function when<T>(value: T): Promise<T>;

    // If a non-promise value is provided, it will not reject or progress
    export function when<T, U>(value: T, onFulfilled: (val: T) => Promise<U>): Promise<U>;
    export function when<T, U>(value: T, onFulfilled: (val: T) => U): Promise<U>;

    export function when<T, U>(value: Promise<T>, onFulfilled: (val: T) => Promise<U>, onRejected?: (reason: any) => Promise<U>, onProgress?: (progress: any) => any): Promise<U>;
    export function when<T, U>(value: Promise<T>, onFulfilled: (val: T) => Promise<U>, onRejected?: (reason: any) => U, onProgress?: (progress: any) => any): Promise<U>;
    export function when<T, U>(value: Promise<T>, onFulfilled: (val: T) => U, onRejected?: (reason: any) => Promise<U>, onProgress?: (progress: any) => any): Promise<U>;
    export function when<T, U>(value: Promise<T>, onFulfilled: (val: T) => U, onRejected?: (reason: any) => U, onProgress?: (progress: any) => any): Promise<U>;
    
    //export function try(method: Function, ...args: any[]): Promise<any>; // <- This is broken currently - not sure how to fix.

    export function fbind<T>(method: (...args: any[]) => Promise<T>, ...args: any[]): (...args: any[]) => Promise<T>;
    export function fbind<T>(method: (...args: any[]) => T, ...args: any[]): (...args: any[]) => Promise<T>;

    export function fcall<T>(method: (...args: any[]) => T, ...args: any[]): Promise<T>;

    export function send<T>(obj: any, functionName: string, ...args: any[]): Promise<T>;
    export function invoke<T>(obj: any, functionName: string, ...args: any[]): Promise<T>;
    export function mcall<T>(obj: any, functionName: string, ...args: any[]): Promise<T>;

    export function nfbind<T>(nodeFunction: Function, ...args: any[]): (...args: any[]) => Promise<T>;
    export function nfcall<T>(nodeFunction: Function, ...args: any[]): Promise<T>;

    export function ninvoke<T>(nodeModule: any, functionName: string, ...args: any[]): Promise<T>;
    export function nsend<T>(nodeModule: any, functionName: string, ...args: any[]): Promise<T>;
    export function nmcall<T>(nodeModule: any, functionName: string, ...args: any[]): Promise<T>;

    export function all<T>(promises: Promise<T>[]): Promise<T[]>;
    export function all<T>(promises: any[]): Promise<T[]>;
    
    export function allSettled<T>(promises: Promise<T>[]): Promise<PromiseState<T>[]>;
    export function allSettled<T>(promises: any[]): Promise<PromiseState<T>[]>;

    export function allResolved<T>(promises: Promise<T>[]): Promise<Promise<T>[]>;
    export function allResolved<T>(promises: any[]): Promise<Promise<T>[]>;

    export function spread<U>(promises: any[], onFulfilled: (...args: any[]) => Promise<U>, onRejected: (reason: any) => Promise<U>): Promise<U>;
    export function spread<U>(promises: any[], onFulfilled: (...args: any[]) => Promise<U>, onRejected: (reason: any) => U): Promise<U>;
    export function spread<U>(promises: any[], onFulfilled: (...args: any[]) => U, onRejected: (reason: any) => Promise<U>): Promise<U>;
    export function spread<U>(promises: any[], onFulfilled: (...args: any[]) => U, onRejected: (reason: any) => U): Promise<U>;
    
    export function spread<T, U>(promises: Promise<T>[], onFulfilled: (...args: T[]) => Promise<U>, onRejected: (reason: any) => Promise<U>): Promise<U>;
    export function spread<T, U>(promises: Promise<T>[], onFulfilled: (...args: T[]) => Promise<U>, onRejected: (reason: any) => U): Promise<U>;
    export function spread<T, U>(promises: Promise<T>[], onFulfilled: (...args: T[]) => U, onRejected: (reason: any) => Promise<U>): Promise<U>;
    export function spread<T, U>(promises: Promise<T>[], onFulfilled: (...args: T[]) => U, onRejected: (reason: any) => U): Promise<U>;
    
    export function timeout<T>(promise: Promise<T>, ms: number, message?: string): Promise<T>;

    export function delay<T>(promise: Promise<T>, ms: number): Promise<T>;
    export function delay<T>(value: T, ms: number): Promise<T>;

    export function isFulfilled(promise: Promise<any>): boolean;
    export function isRejected(promise: Promise<any>): boolean;
    export function isPending(promise: Promise<any>): boolean;

    export function defer<T>(): Deferred<T>;

    export function reject(reason?: any): Promise<any>;

    export function promise<T>(resolver: (resolve: (val: Promise<T>) => void , reject: (reason: any) => void , notify: (progress: any) => void ) => void ): Promise<T>;
    export function promise<T>(resolver: (resolve: (val: T) => void , reject: (reason: any) => void , notify: (progress: any) => void ) => void ): Promise<T>;

    export function promised<T>(callback: (...args: any[]) => T): (...args: any[]) => Promise<T>;

    export function isPromise(object: any): boolean;
    export function isPromiseAlike(object: any): boolean;
    export function isPending(object: any): boolean;

    export function async<T>(generatorFunction: any): (...args: any[]) => Promise<T>;
    export function nextTick(callback: Function): void;

    export var onerror: (reason: any) => void;
    export var longStackSupport: boolean;

    export function resolve<T>(object: Promise<T>): Promise<T>;
    export function resolve<T>(object: T): Promise<T>;
}

declare module "q" {
    export = Q;
}
