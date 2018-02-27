import { DeferredChain } from '../DeferredChain';

describe('DeferredChain', () => {
  it('correctly saves chained getters for later execution', () => {
    // given
    class A {
      field = {
        other: {
          nested: {
            doSomething() {
              return 'something';
            },
          },
        },
      };
    }

    const deferred = new DeferredChain<A>();

    // when
    const proxyB = deferred.getProxy().field.other.nested;
    deferred.resolve(new A());
    const result = proxyB.doSomething();

    // then
    expect(result).toEqual('something');
  });
});
