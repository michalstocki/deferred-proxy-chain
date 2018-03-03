import { DeferredChain } from '../DeferredChain';

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
    const deferred = new DeferredChain<typeof target>();

    // when
    const { nested: { field } } = deferred.getProxy();
    deferred.setTarget(target);

    // then
    expect(field.value).toEqual(123);
  });

  it('supports chaining method calls and provides correct `this`', () => {
    // given
    class Target {
      field = {
        value: 123,
      };

      getField() {
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

  it(`doesn't provide "this" when method is invoked as a variable`, () => {
    // given
    class Target {
      field = {
        value: 123,
      };

      getField() {
        return this.field;
      }
    }

    const deferred = new DeferredChain<Target>();

    // when
    const { getField } = deferred.getProxy();
    deferred.setTarget(new Target());

    // then
    expect(getField()).toBeUndefined()
  });

  it(`doesn't support accessing primitive values before setting the chain target`, () => {
    // given
    const target = {
      nested: {
        value: 123,
      },
    };
    const deferred = new DeferredChain<typeof target>();

    // when
    const value = deferred.getProxy().nested.value;
    deferred.setTarget(target);

    // then
    expect(value).not.toEqual(123);
  });
});
