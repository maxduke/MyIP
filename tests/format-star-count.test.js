// Unit tests for the GitHub star-count compact formatter.
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { formatStarCount } from '../frontend/utils/format-star-count.js';

describe('formatStarCount', () => {
  it('returns exact integers below 1000', () => {
    assert.equal(formatStarCount(0), '0');
    assert.equal(formatStarCount(7), '7');
    assert.equal(formatStarCount(999), '999');
  });

  it('collapses thousands to one-decimal k, dropping trailing .0', () => {
    assert.equal(formatStarCount(1000), '1k');
    assert.equal(formatStarCount(1234), '1.2k');
    assert.equal(formatStarCount(2000), '2k');
    assert.equal(formatStarCount(12345), '12.3k');
  });

  it('drops the decimal once the k value reaches three digits', () => {
    assert.equal(formatStarCount(123456), '123k');
  });

  it('collapses millions to M', () => {
    assert.equal(formatStarCount(1234567), '1.2M');
  });

  it('returns empty string for unusable input', () => {
    assert.equal(formatStarCount(null), '');
    assert.equal(formatStarCount(undefined), '');
    assert.equal(formatStarCount(NaN), '');
    assert.equal(formatStarCount(-5), '');
    assert.equal(formatStarCount('1234'), '');
  });
});
