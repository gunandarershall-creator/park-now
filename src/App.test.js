// ============================================================================
//  App.test.js - default smoke test that ships with Create React App
// ============================================================================
//  This is the very basic "does the app render at all" test that CRA
//  scaffolds for every new project. It mounts <App /> into a fake DOM and
//  checks that the text "learn react" appears somewhere on the page.
//
//  NOTE: I kept this file for completeness but the real tests live in
//  src/__tests__/unit.test.js, which exercises the session timer, the
//  OCC booking transaction, and the past-time guard. That's the file
//  reported against in the testing chapter.
// ============================================================================

import { render, screen } from '@testing-library/react';
import App from './App';

test('renders learn react link', () => {
  // Render the whole App component into a simulated browser DOM.
  render(<App />);

  // Look for any element whose text matches "learn react" (case-insensitive).
  const linkElement = screen.getByText(/learn react/i);

  // Assert it's actually in the document. If not, the test fails.
  expect(linkElement).toBeInTheDocument();
});
