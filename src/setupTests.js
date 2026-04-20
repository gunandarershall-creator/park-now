// ============================================================================
//  setupTests.js - runs once before any Jest test starts
// ============================================================================
//  Jest loads this file automatically before it runs the test suite. It's
//  the right place to register extra features that should be available to
//  every test without needing to import them by hand each time.
//
//  Here I'm only adding one thing: jest-dom, which gives me nicer
//  assertions for DOM elements. With it I can write expressive lines like:
//
//      expect(element).toHaveTextContent(/react/i)
//      expect(button).toBeDisabled()
//      expect(input).toHaveValue('hello')
//
//  Without jest-dom I'd have to poke at raw DOM properties manually, which
//  is verbose and error-prone. Docs: https://github.com/testing-library/jest-dom
// ============================================================================

import '@testing-library/jest-dom';
