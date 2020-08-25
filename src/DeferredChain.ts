export class DeferredChain<T> {

  private readonly proxyHandler:DeferredProxyHandler<T>;
  private readonly rootProxy:T;

  constructor() {
    this.proxyHandler = new DeferredProxyHandler<T>({ type: 'root', name: 'root' });
    this.rootProxy = new Proxy({} as any, this.proxyHandler);
  }

  public getProxy():T {
    return this.rootProxy;
  }

  public setTarget(target:T):void {
    this.proxyHandler.setTarget(target);
  }

}

const PROXY_RECOGNITION_SYMBOL:unique symbol = Symbol('PROXY_RECOGNITION_SYMBOL');

// tslint:disable:max-classes-per-file
class DeferredProxyHandler<T extends {}> implements ProxyHandler<T> {

  private currentTarget?:T;
  private parent?:DeferredProxyHandler<T>;

  constructor(private initCall:ProxyInitiator) {
  }

  public setParent(parent:DeferredProxyHandler<T>):void {
    this.parent = parent;
  }

  public setTarget(target:T):void {
    this.currentTarget = target;
  }

  public get(neverTarget:T, property:PropertyKey, receiver:T):any {
    if (property === PROXY_RECOGNITION_SYMBOL) {
      return true;
    }

    const call:GetterCall = { name: property, type: 'getter' };
    if (this.hasTarget()) {
      return this.execCall(call);
    }
    return this.createProxyFor(call);
  }

  public apply(neverTarget:T, thisArg:any, argArray:any = []):any {
    const call:MethodCall = { type: 'method', args: argArray, thisContext: thisArg };
    if (this.hasTarget()) {
      return this.execCall(call);
    }
    return this.createProxyFor(call);
  }

  private createProxyFor(call:GetterCall | MethodCall):any {
    const nextChainHandler:DeferredProxyHandler<T> = new DeferredProxyHandler<T>(call);
    nextChainHandler.setParent(this);
    const proxyTarget:any = function syntheticTarget():void {
      return undefined;
    };
    return new Proxy(proxyTarget, nextChainHandler);
  }

  private hasTarget():boolean {
    return !!(this.currentTarget || (this.parent && this.parent.hasTarget()));
  }

  private execCall(call:ProxyInitiator):any {
    if (this.currentTarget) {
      return execCallOnTarget(this.currentTarget, call);
    }
    if (this.parent) {
      return execCallOnTarget(this.parent.execCall(this.initCall), call);
    }
  }
}

function execCallOnTarget(target:any, call:ProxyInitiator):any {
  if (call.type === 'getter') {
    const descriptor:PropertyDescriptor | undefined =
      Object.getOwnPropertyDescriptor(Object.getPrototypeOf(target), call.name);

    if (descriptor && descriptor.value && descriptor.value instanceof Function) {
      return function (this:any):any {
        let thisArg:any;

        if (this && (this)[PROXY_RECOGNITION_SYMBOL]) {
          // binding a method to a `this` as a target object when recognized a chained method call
          thisArg = target;
        }

        return target[call.name].apply(thisArg, arguments);
      };
    }

    return target[call.name];
  }

  if (call.type === 'method') {
    return target.apply(call.thisContext, call.args);
  }
}

type ProxyInitiator = GetterCall | MethodCall | RootProxy;

interface GetterCall {
  type:'getter';
  name:PropertyKey;
}

interface MethodCall {
  type:'method';
  thisContext:any;
  args:any[];
}

interface RootProxy {
  type:'root';
  name:'root';
}
