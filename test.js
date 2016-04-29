'use strict';
const assert = require('assert');
const ProgressPromise = require('.');
const PROGRESS_UPDATES = 10;
const TEST_DELAY = 100;

// Test helper functions
function progressiveDelay(duration) {
  return new ProgressPromise((resolve, reject, progress) => {
    // A timer for each progress event
    for(let i = 0; i < PROGRESS_UPDATES; i++) {
      setTimeout(
        () => progress(i / PROGRESS_UPDATES),
        duration / PROGRESS_UPDATES * (i + 1)
      );
    }
    setTimeout(resolve, duration);
  });
}

function delay(duration) {
  return new Promise(resolve => setTimeout(resolve, duration));
}

// Begin test cases
Promise.all([
  (function successCase() {
    let progressCount = 0;
    return progressiveDelay(TEST_DELAY)
      .progress(value => progressCount++)
      .then(() => assert.strictEqual(progressCount, PROGRESS_UPDATES,
        'Progress listener not invoked the correct number of times.'));
  })(),
  (function missingListenerFunction() {
    try {
      return progressiveDelay(TEST_DELAY)
        .progress()
        .then(() => assert(false, 'Succeeded Erroneously'));
    } catch(error) {
      assert.strictEqual(error.name, 'AssertionError');
      assert.strictEqual(error.actual, 'undefined');
    }
  })(),
  (function all() {
    let resolveCount = 0;
    return ProgressPromise.all(
        Array.apply(null, Array(PROGRESS_UPDATES)).map((value, index) =>
          delay(TEST_DELAY / PROGRESS_UPDATES * (index + 1))
            .then(() => index)
        )
      )
      .progress((results) => {
        resolveCount++;
        assert.strictEqual(results.proportion, resolveCount / PROGRESS_UPDATES,
          'Progress proportion value incorrect.');
      })
      .then(results => {
        assert.strictEqual(results.proportion, 1,
          'Progress proportion value incorrect.');
        assert.strictEqual(resolveCount, PROGRESS_UPDATES,
          'Progress listener not invoked the correct number of times.');
        results.forEach((value, index) => assert.strictEqual(value, index,
          'Result value incorrect.'));
      });
  })()
])
.then(() => console.log('✔ Passed'))
.catch(reason => {
  if(reason.name === 'AssertionError')
    console.error('AssertionError:',
      reason.actual, reason.operator, reason.expected);

  console.error(reason.stack);
  process.exit(1);
});

