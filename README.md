# progress-promise [![Build Status](https://travis-ci.org/numtel/progress-promise.svg?branch=master)](https://travis-ci.org/numtel/progress-promise) [![npm version](https://badge.fury.io/js/progress-promise.svg)](https://www.npmjs.com/package/progress-promise)

Promise subclass with mechanism to report progress before resolving

## class ProgressPromise extends Promise

### constructor(executor)
* `executor` `<Function>` Invoked immediately
  * `resolve` `<Function>` Same as original `Promise`
  * `reject` `<Function>` Same as original `Promise`
  * `progress` `<Function>` Before resolving, pass single argument to progress listener (May be invoked multiple times)

Executor function receives extra argument: `progress`, a function to be called to notify a listener before resolving.

```javascript
const ProgressPromise = require('progress-promise');

function longTask() {
  return new ProgressPromise((resolve, reject, progress) => {
    setTimeout(() => progress(25), 250);
    setTimeout(() => progress(50), 500);
    setTimeout(() => progress(75), 750);
    setTimeout(resolve, 1000);
  });
}
```

### progress(handler)
* `handler` `<Function>` Invoked by `progress` function passed to `executor`
  * `value` `<Function>` Value from `executor`

Promise rejects if progress handler throws.

```javascript
longTask()
  .progress(value => console.log(value + '%'))
  .then(() => console.log('Done'));

// 25%
// 50%
// 75%
// Done
```

### static all(promises)
* `promises` `<Array(Promise)>` Array of Promise, or compatible

Like `Promise.all()` but the results are passed to the `progress` listener as an `Array` after each completion.

A custom property, `proportion` is added to this results array containing the value of the number of Promises resolved divided by the total number of Promises.

```javascript
function delay(duration) {
  return new Promise(resolve =>
    setTimeout(() => resolve(duration), duration));
}

ProgressPromise.all([ delay(300), delay(100) ])
  .progress(results => console.log('Progress', results))
  .then(results => console.log('Resolved', results));

// Progress [ , 100, proportion: 0.5 ]
// Progress [ 300, 100, proportion: 1 ]
// Resolved [ 300, 100, proportion: 1 ]
```

### static sequence(inputs, handler)
* `inputs` `<Array>` Input values to be passed to `handler` sequentially
* `handler` `<Function>` Invoked for each input value, must return Promise
  * `value` From `inputs` array

Handler is invoked once for each input value, starting with the first index and proceding after each Promise returned resolves.

Progress is reported the same as `ProgressPromise.all()`.

```javascript
ProgressPromise.sequence([ 200, 100 ], value => delay(value))
  .progress(results => console.log('Progress', results))
  .then(results => console.log('Resolved', results));

// Progress [ 200, proportion: 0.5 ]
// Progress [ 200, 100, proportion: 1 ]
// Resolved [ 200, 100, proportion: 1 ]
```

## Design Considerations

### Single argument for progress listeners

The function that invokes each listener on progress updates only has a single argument available due to the lack of support for spread operators in the target Node.js version this package aims to support, 4.3.

```javascript
value => this[LISTENERS].forEach(listener => listener(value))
```
If a normal (not arrow) function is used here, `this` cannot be accessed before `super()` is called, making it impossible to bind to the listeners instance property.

### Symbols as private properties

The new ES6 `Symbol()` type creates a non-enumerating value that can be used as a key on an object. Creating a key on an object instance with a Symbol can be similar to creating a private property if the Symbol is not shared. If Symbols are not available, a fallback string property key is used.


## License

MIT
