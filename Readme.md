# deferred-proxy-chain

Allows collecting chained calls that are evaluated asynchronously when the target object arrives

## How to use

```javascript
    const deferred = new DeferredChain();
    const doSomething = deferred.getProxy().field.nested.doSomething;
    const target = {
      field: {
        nested: {
          doSomething() {
            return 'something';
          },
        },
      },
    };
    deferred.setTarget(target);
    
    const result = doSomething();

    expect(result).toEqual('something');
```

## Features

* allows performing property chain or even method calls on nonexistent objects
* on chain can be executed against different target objects (calling setTarget multiple times)
* methods called in the chain are executed with the correct this object

## Limitations

* doesn't support calls that resolves to a primitive value in the target object,
* doesn't cache values returned by the functions and getters in the chain – each call executed since the target
object has been set, causes execution of the methods used earlier in the chain 
