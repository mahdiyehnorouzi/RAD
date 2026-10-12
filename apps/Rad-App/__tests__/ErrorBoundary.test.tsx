/**
 * @format
 */

import React from 'react';
import { Text } from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import { ErrorBoundary } from '../src/ErrorBoundary';
import { copy } from '../src/config';

let shouldThrow = true;
let renders = 0;

function Flaky() {
  renders += 1;
  if (shouldThrow) throw new Error('boom');
  return <Text>ok</Text>;
}

const texts = (tree: ReactTestRenderer.ReactTestRenderer) =>
  tree.root.findAllByType(Text).map(t => t.props.children);

test('shows the Persian error screen and recovers on reload', async () => {
  // React logs caught render errors; keep the test output clean.
  const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
  let tree!: ReactTestRenderer.ReactTestRenderer;

  await ReactTestRenderer.act(() => {
    tree = ReactTestRenderer.create(
      <ErrorBoundary>
        <Flaky />
      </ErrorBoundary>,
    );
  });
  expect(texts(tree)).toEqual([copy.errorTitle, copy.crashBody, copy.reload]);
  expect(texts(tree).join(' ')).not.toContain('boom');

  shouldThrow = false;
  const before = renders;
  await ReactTestRenderer.act(() => {
    tree.root
      .find(n => n.props.accessibilityRole === 'button' && !!n.props.onPress)
      .props.onPress();
  });
  expect(texts(tree)).toEqual(['ok']);
  expect(renders).toBeGreaterThan(before);

  spy.mockRestore();
});
