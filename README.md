# progress-promise [![Build Status](https://travis-ci.org/numtel/progress-promise.svg?branch=master)](https://travis-ci.org/numtel/progress-promise)

Promise subclass with mechanism to report progress before resolving

## `ProgressPromise`

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

longTask()
  .progress(value => console.log(value + '%'))
  .then(() => console.log('Done'));

// 25%
// 50%
// 75%
// Done
```

## `ProgressPromise.all(<promises>)`

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

## License

MIT
