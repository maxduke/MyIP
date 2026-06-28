// Tests for frontend/utils/timezone.js. Only the pure offset formatter and the
// shape of getTimezoneInfo are exercised — the actual zone/offset values depend
// on the host's timezone, which the Node test runner doesn't pin.

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { formatUtcOffset, getTimezoneInfo } from '../frontend/utils/timezone.js';

describe('formatUtcOffset', () => {
  it('formats east-positive offsets with a leading +', () => {
    assert.equal(formatUtcOffset(480), '+08:00');   // China
    assert.equal(formatUtcOffset(330), '+05:30');   // India (half-hour)
    assert.equal(formatUtcOffset(345), '+05:45');   // Nepal (quarter-hour)
  });

  it('formats west offsets with a leading -', () => {
    assert.equal(formatUtcOffset(-300), '-05:00');  // US Eastern (DST)
    assert.equal(formatUtcOffset(-480), '-08:00');  // US Pacific
  });

  it('treats zero as +00:00', () => {
    assert.equal(formatUtcOffset(0), '+00:00');
  });
});

describe('getTimezoneInfo', () => {
  it('returns an { timezone, offset } pair of strings', () => {
    const info = getTimezoneInfo();
    assert.equal(typeof info.timezone, 'string');
    assert.equal(typeof info.offset, 'string');
  });

  it('produces a well-formed offset for the host timezone', () => {
    const { offset } = getTimezoneInfo();
    // Empty only on platforms without Date; otherwise must match ±HH:MM.
    assert.match(offset, /^$|^[+-]\d{2}:\d{2}$/);
  });
});
