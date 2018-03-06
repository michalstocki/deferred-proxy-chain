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
    const call:GetterCall = { name: property, type: 'getter' };
    if (this.hasTarget()) {
      return this.execCall(call);
    }
    const nextChainHandler:DeferredProxyHandler<T> = new DeferredProxyHandler<T>(call);
    nextChainHandler.setParent(this);
    return new Proxy({} as any, nextChainHandler);
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
