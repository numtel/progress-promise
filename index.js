'use strict';
const assert = require('assert');
const LISTENERS = Symbol();

class ProgressPromise extends Promise {
  constructor(executor) {
    super((resolve, reject) => {
      return executor(resolve, reject,
        value => this[LISTENERS].forEach(listener => listener(value)));
    });
    this[LISTENERS] = [];
  }
  progress(handler) {
    assert.strictEqual(typeof handler, 'function');
    this[LISTENERS].push(handler);
    return this;
  }
  static all(promises) {
    return new ProgressPromise((resolve, reject, progress) => {
      const results = new Array(promises.length);
      let resolveCount = 0
      let length = promises.length;
      promises.forEach((promise, index) => {
        promise.then(result => {
          results[index] = result;
          results.proportion = ++resolveCount / length;
          progress(results);
          if(resolveCount === length) resolve(results);
        }).catch(reject);
      });
    });
  }
}

module.exports = ProgressPromise;


