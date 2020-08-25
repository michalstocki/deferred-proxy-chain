import { DeferredChain } from '../DeferredChain';

// tslint:disable:typedef
// tslint:disable:no-magic-numbers
// tslint:disable:max-classes-per-file
describe('DeferredChain', () => {
  it('correctly saves chained getters for later execution', () => {
    // given
    const target = {
      field: {
        nested: {
          doSomething() {
            return 'something';
          },
        },
      },
    };
    const deferred = new DeferredChain<typeof target>();

    // when
    const proxyA = deferred.getProxy();
    const valueQueuedFromChain = proxyA.field.nested;
    deferred.setTarget(target);
    const result = valueQueuedFromChain.doSomething();

    // then
    expect(result).toEqual('something');
  });

  it('correctly works with destructuring assign', () => {
    // given
    const target = {
      nested: {
        field: {
          value: 123,
        },
      },
    };
    const deferred:DeferredChain<typeof target> = new DeferredChain<typeof target>();

    // when
    const { nested: { field } } = deferred.getProxy();
    deferred.setTarget(target);

    // then
    expect(field.value).toEqual(123);
  });

  it('supports chaining method calls and provides correct `this`', () => {
    // given
    class Target {
      private field = {
        value: 123,
      };

      public getField() {
        return this.field;
      }
    }

    const deferred = new DeferredChain<Target>();

    // when
    const field = deferred.getProxy().getField();
    deferred.setTarget(new Target());

    // then
    expect(field.value).toEqual(123);
  });
  it('supports chaining getter and provides correct `this`', () => {
    // given
    class Target {
      private innerField?:number;

      public setField(value:number):void {
        this.innerField = value;
      }

      public get field():number|undefined {
        return this.innerField;
      }
    }

    interface WrappedTarget {
      targetObj:Target;
    }

    const deferred = new DeferredChain<WrappedTarget>();

    // when
    const { targetObj } = deferred.getProxy();
    deferred.setTarget({ targetObj: new Target() });
    targetObj.setField(123);

    // then
    expect(targetObj.field).toEqual(123);
  });

  it('supports chaining methods calls and provides correct arguments', () => {
    // given
    class Target {
      private field = {
        value: 123,
      };

      public getValue(a:string, b:string, c:string) {
        if (a === 'a' && b === 'b' && c === 'c') {
          return this.field;
        }
      }
    }

    const deferred = new DeferredChain<Target>();

    // when
    const someObject:any = deferred.getProxy().getValue('a', 'b', 'c');
    deferred.setTarget(new Target());

    // then
    expect(someObject.value).toEqual(123);
  });

  it('allows replacing target object multiple times', () => {
    // given
    const target1 = {
      nested: {
        func: () => 'target 1',
      },
    };
    const target2 = {
      nested: {
        func: () => 'target 2',
      },
    };
    const deferred = new DeferredChain<typeof target1>();

    // when
    const { nested: { func } } = deferred.getProxy();
    deferred.setTarget(target1);

    // then
    expect(func()).toEqual('target 1');

    // when
    deferred.setTarget(target2);

    // then
    expect(func()).toEqual('target 2');
  });

  it('does provide "this" even when method is invoked as a variable (side effect)', () => {
    // given
    class Target {
      public getThis() {
        return this;
      }
    }

    const deferred = new DeferredChain<Target>();

    // when
    const { getThis } = deferred.getProxy();
    deferred.setTarget(new Target());

    // then
    expect(getThis()).toBeInstanceOf(Target);
  });

  it("doesn't support accessing primitive values before setting the chain target", () => {
    // given
    const target = {
      nested: {
        value: 123,
      },
    };
    const deferred = new DeferredChain<typeof target>();

    // when
    const value:number = deferred.getProxy().nested.value;
    deferred.setTarget(target);

    // then
    expect(value).not.toEqual(123);
  });
});
