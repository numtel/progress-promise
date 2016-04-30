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

function delay(duration, fail) {
  return new Promise((resolve, reject) =>
    setTimeout(fail ? reject : resolve, duration));
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
  (function rejectFromProgress() {
    const REASON = 'Nobody ever expects the ...!';
    return progressiveDelay(TEST_DELAY)
      .progress(value => { throw new Error(REASON) })
      .then(() => assert(false, 'Succeeded Erroneously'))
      .catch(reason => {
        assert.strictEqual(reason.message, REASON,
          'Incorrect rejection message.');
      });
  })(),
  (function missingListenerFunction() {
    try {
      return progressiveDelay(TEST_DELAY)
        .progress()
        .then(() => assert(false, 'Succeeded Erroneously'))
        .catch(() => assert(false, 'Succeeded Erroneously'));
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
  })(),
  (function allThrows() {
    return ProgressPromise.all([ delay(TEST_DELAY), delay(TEST_DELAY, true) ])
      .then(() => assert(false, 'Succeeded Erroneously.'))
      .catch(reason => assert.strictEqual(reason, undefined,
        'Unexpected setTimeout callback argument.'));
  })(),
  (function sequence() {
    let resolveCount = 0;
    return ProgressPromise.sequence(
        // [ 0, 1, ... PROGRESS_UPDATES ]
        Array.apply(null, Array(PROGRESS_UPDATES)).map((value, index) => index),
        // Delay for proportion of total run time then return index
        input => delay(TEST_DELAY / PROGRESS_UPDATES).then(() => input)
      )
      .progress((results) => {
        resolveCount++;
        assert.strictEqual(results.length, resolveCount,
          'Results length incorrect.');
        assert.strictEqual(results.proportion, resolveCount / PROGRESS_UPDATES,
          'Progress proportion value incorrect.');
      })
      .then(results => {
        assert.strictEqual(results.length, PROGRESS_UPDATES,
          'Results length incorrect.');
        assert.strictEqual(results.proportion, 1,
          'Progress proportion value incorrect.');
        assert.strictEqual(resolveCount, PROGRESS_UPDATES,
          'Progress listener not invoked the correct number of times.');
        results.forEach((value, index) => assert.strictEqual(value, index,
          'Result value incorrect.'));
      });
  })(),
  (function sequenceThrows() {
    return ProgressPromise.sequence([ true ], fail => delay(TEST_DELAY, fail))
      .then(() => assert(false, 'Succeeded Erroneously.'))
      .catch(reason => assert.strictEqual(reason, undefined,
        'Unexpected setTimeout callback argument.'));
  })(),
])
.then(results => {
  // Test cases can be disabled by NOT immediately invoking their function
  const testCount = results.filter(x=>typeof x !== 'function').length;
  console.log(`✔ ${testCount} Passed`);
})
.catch(reason => {
  if(reason.name === 'AssertionError')
    console.error('AssertionError:',
      reason.actual, reason.operator, reason.expected);

  console.error(reason.stack);
  process.exit(1);
});

