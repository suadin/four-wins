import assert from 'node:assert/strict';
import test from 'node:test';
import {
  compareVersions,
  parseVersion,
  updateState,
  versionView,
} from '../src/app/version.ts';

test('[BASIC-VERSION-01] the app version opens SPECS with a tooltip', () => {
  const view = versionView({ app: 'four-wins', appVersion: '1.0.0', standard: '1.1.0' }, '1.1.0');
  assert.equal(view.appLabel, '1.0.0');
  assert.equal(view.appTip, 'four-wins 1.0.0 — open SPECS');
  assert.equal(view.basicTip, 'Basic Specs 1.1.0 — current');
});

test('[BASIC-VERSION-02] the Basic Specs version carries its version', () => {
  const view = versionView({ app: 'four-wins', appVersion: '1.0.0', standard: '1.1.0' }, '1.1.0');
  assert.equal(view.basicLabel, '1.1.0');
  assert.equal(view.outdated, false);
});

test('[BASIC-VERSION-03] only major updates are outdated', () => {
  assert.deepEqual(parseVersion('1.2.3'), [1, 2, 3]);
  assert.equal(compareVersions('1.2.3', '1.2.2'), 1);
  assert.equal(updateState('1.0.2', '1.1.0'), 'newer');
  assert.equal(updateState('1.0.2', '1.0.3'), 'newer');
  assert.equal(updateState('1.0.2', '2.0.0'), 'major');
  assert.equal(updateState('1.0.2', '1.0.2'), 'current');
  assert.match(versionView({ app: 'x', appVersion: '1.0.0', standard: '1.0.2' }, '2.0.0').basicTip, /2\.0\.0 available/);
});

test('[BASIC-VERSION-04] an unknown latest stays neutral', () => {
  const view = versionView({ app: 'x', appVersion: '1.0.0', standard: '1.0.2' }, null);
  assert.equal(view.outdated, false);
  assert.equal(view.basicTip, 'Basic Specs 1.0.2 — latest not checked');
});
