/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import App from '../App';

// The native WebView isn't available under Jest.
jest.mock('react-native-webview', () => {
  const { View } = require('react-native');
  return { WebView: View };
});

// The splash fallback timer and animations would otherwise outlive the test.
jest.useFakeTimers();

test('renders correctly', async () => {
  let tree: ReactTestRenderer.ReactTestRenderer | undefined;
  await ReactTestRenderer.act(() => {
    tree = ReactTestRenderer.create(<App />);
  });
  await ReactTestRenderer.act(() => {
    tree?.unmount();
  });
});
