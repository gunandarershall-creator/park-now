// ============================================================================
//  UNIT TESTS - Park Now
// ============================================================================
//  What is this file?
//  ------------------
//  A "unit test" is a tiny program that exercises one piece of my code in
//  isolation and checks it behaves correctly. If I change something later
//  and accidentally break one of these tests, Jest (the testing framework)
//  will shout at me and I'll know straight away before shipping a bug.
//
//  This file has 13 tests grouped into 3 sections, covering the three
//  bits of logic that, if they went wrong, would cause the worst user-
//  facing problems:
//
//    1. useSessionTimer
//         The live countdown clock on the session-in-progress screen.
//         If this is off by one second, the driver thinks they have time
//         left when they don't (or vice versa). Really embarrassing for
//         a paid product.
//
//    2. bookSpotAtomically
//         The transaction that actually books a spot. If this breaks,
//         two drivers might both get the same parking space, or the
//         inventory counter goes negative, or a booking gets charged
//         for but no record is saved.
//
//    3. Past-time guard
//         The check on the checkout screen that stops a driver picking
//         a start time that is already in the past. Had a subtle bug
//         where the "current minute" itself got rejected (Defect #6 in
//         the dissertation).
//
//  HOW TO RUN:
//    npm test                                  (interactive, watches files)
//    npm test -- --coverage --watchAll=false   (one-off with coverage report)
//
//  None of these tests talk to real Firebase. Everything Firebase-related
//  is mocked (replaced with fake doubles I control), so the tests are
//  fast and don't need network access.
// ============================================================================

// ─── IMPORTS ────────────────────────────────────────────────────────────────
// renderHook lets me run a React hook in isolation without rendering a full
// component tree. act() wraps updates so React doesn't complain about state
// changing outside of its knowledge.
import { renderHook, act } from '@testing-library/react';
import { useSessionTimer } from '../controllers/useSessionTimer';


// ─── FIREBASE MOCKS ─────────────────────────────────────────────────────────
// My booking code calls into Firebase's runTransaction, doc, query, etc.
// I replace all of those with jest.fn() stubs so I can control EXACTLY
// what they return for each test. This means the tests never actually
// touch the cloud database. They run in memory, in milliseconds.
//
// Key idea: `jest.mock(path, factory)` tells Jest "whenever anyone imports
// from this path, give them THIS fake instead of the real one".

// Replace my own Firebase wrapper module with a stub.
jest.mock('../models/firebase', () => ({
  db: { __mock: true },
  getSpotsRef:    () => ({ __ref: 'spots' }),
  getBookingsRef: () => ({ __ref: 'bookings' }),
}));

// Replace the parts of the Firebase SDK I actually use.
jest.mock('firebase/firestore', () => ({
  doc:            jest.fn((ref, id) => ({ __ref: ref, id })),
  runTransaction: jest.fn(),
  query:          jest.fn((...args) => ({ __query: args })),
  where:          jest.fn((field, op, value) => ({ field, op, value })),
  getDocs:        jest.fn(),
}));

// Important: I have to `require` the code-under-test AFTER the mocks above,
// otherwise it would get the real Firebase before my fakes are in place.
const firestore = require('firebase/firestore');
const { bookSpotAtomically } = require('../models/concurrencyModel');


// ─── TEST FIXTURES ──────────────────────────────────────────────────────────
// Reusable "sample data" I feed into the functions being tested. Keeping
// them at the top makes each test shorter and easier to read.

const mockSpot = {
  id: 'spot-42',
  price: 2.5,
  hostId: 'host-abc',
  address: '12 Kingston Rd',
  spotsLeft: 1,
};
const mockUser = { uid: 'driver-xyz-9999' };

// Helper: tell the fake getDocs() query to return whatever bookings I want.
// Used to simulate "there is already an overlapping booking in the db".
const mockOverlapQuery = (bookings = []) => {
  firestore.getDocs.mockResolvedValue({
    docs: bookings.map((b) => ({ data: () => b })),
  });
};

// Helper: tell the fake runTransaction() to immediately run the caller's
// update function, with a txn object whose .get() returns the given
// snapshot. Saves me from hand-writing this plumbing in every test.
const mockTxn = (spotSnap) => {
  firestore.runTransaction.mockImplementation(async (_db, updateFn) => {
    const txn = {
      get:    jest.fn().mockResolvedValue(spotSnap),
      update: jest.fn(),
      set:    jest.fn(),
    };
    return updateFn(txn);
  });
};

// Wipe all mock state between tests so they don't leak into each other.
beforeEach(() => {
  jest.clearAllMocks();
});


// ════════════════════════════════════════════════════════════════════════════
//  SECTION 1 - useSessionTimer
// ════════════════════════════════════════════════════════════════════════════
//  The countdown clock hook. Takes an ISO timestamp (the end of the booking)
//  and returns:
//     secondsLeft   - raw number of seconds remaining
//     timeDisplay   - formatted "HH:MM:SS" string for the UI
//     isWarning     - true in the last 5 minutes (UI goes orange)
//     isExpired     - true once the end time has passed (UI goes red)
//
//  I use jest.useFakeTimers() to freeze the clock. This lets me set the
//  current time to an exact moment, then "advance" time by specific
//  amounts, and assert what the hook reports at each step.
// ════════════════════════════════════════════════════════════════════════════
describe('useSessionTimer', () => {
  // Freeze real time before each test and restore it after.
  beforeEach(() => {
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  // ── Test 1.1 ─────────────────────────────────────────────────────────────
  // Regression test for a bug I found in Sprint 5. The booking was
  // committed at 14:33:47.234 for a 2-hour window, so there should be
  // 2:00:00 left. But I was using Math.floor, which rounded 7199.995
  // seconds down to 7199 and displayed 1:59:59. Fixed it with Math.ceil
  // and added this test so it never happens again.
  test('initialises at full duration when committed sub-second (Math.ceil fix)', () => {
    jest.setSystemTime(new Date('2026-04-19T14:33:47.234Z'));
    const endTime = new Date('2026-04-19T16:33:47.234Z').toISOString();

    const { result } = renderHook(() => useSessionTimer(endTime));

    expect(result.current.secondsLeft).toBe(7200);
    expect(result.current.timeDisplay).toBe('02:00:00');
    expect(result.current.isExpired).toBe(false);
    expect(result.current.isWarning).toBe(false);
  });

  // ── Test 1.2 ─────────────────────────────────────────────────────────────
  // Basic sanity check: if 3 real seconds pass, the countdown should have
  // dropped by 3. I advance the fake clock and check.
  test('ticks down by one second per wall-clock second', () => {
    jest.setSystemTime(new Date('2026-04-19T12:00:00.000Z'));
    const endTime = new Date('2026-04-19T12:00:10.000Z').toISOString();

    const { result } = renderHook(() => useSessionTimer(endTime));
    expect(result.current.secondsLeft).toBe(10);

    act(() => {
      jest.advanceTimersByTime(3000);
    });
    expect(result.current.secondsLeft).toBe(7);
  });

  // ── Test 1.3 ─────────────────────────────────────────────────────────────
  // With 4 minutes left, the warning flag should be on (UI goes orange).
  // This drives the "you have less than 5 minutes remaining, extend?" banner.
  test('raises warning flag in the last 5 minutes', () => {
    jest.setSystemTime(new Date('2026-04-19T12:00:00.000Z'));
    const endTime = new Date('2026-04-19T12:04:00.000Z').toISOString();
    const { result } = renderHook(() => useSessionTimer(endTime));
    expect(result.current.isWarning).toBe(true);
    expect(result.current.isExpired).toBe(false);
  });

  // ── Test 1.4 ─────────────────────────────────────────────────────────────
  // Current time is 1 second after the end time. The hook should say
  // "expired" and show 00:00:00 (not a negative number).
  test('raises expired flag when endTime has passed', () => {
    jest.setSystemTime(new Date('2026-04-19T12:00:01.000Z'));
    const endTime = new Date('2026-04-19T12:00:00.000Z').toISOString();
    const { result } = renderHook(() => useSessionTimer(endTime));
    expect(result.current.isExpired).toBe(true);
    expect(result.current.timeDisplay).toBe('00:00:00');
  });

  // ── Test 1.5 ─────────────────────────────────────────────────────────────
  // Defensive case: if a component mounts before the endTime is known
  // (null), the hook must not crash. It should return safe defaults.
  test('gracefully handles null endTime', () => {
    const { result } = renderHook(() => useSessionTimer(null));
    expect(result.current.secondsLeft).toBe(0);
    expect(result.current.isExpired).toBe(false);
    expect(result.current.isWarning).toBe(false);
  });
});


// ════════════════════════════════════════════════════════════════════════════
//  SECTION 2 - bookSpotAtomically (OCC throw-paths)
// ════════════════════════════════════════════════════════════════════════════
//  This function is the heart of the booking flow. It decides whether a
//  booking is allowed to go through, and throws specific error codes when
//  it isn't. Each test below covers one of those paths.
//
//  The general pattern: I set up the mocks to simulate a particular
//  scenario, call bookSpotAtomically, then assert it either resolves
//  (success) or rejects with a specific error code.
// ════════════════════════════════════════════════════════════════════════════
describe('bookSpotAtomically (Optimistic Concurrency Control)', () => {

  // ── Test 2.1 ─────────────────────────────────────────────────────────────
  // Happy path. Spot exists, has 1 place left, no overlapping bookings.
  // Should succeed, decrement to 0, and charge the right amount.
  // Calculation: £2.50/hr × 2 hours + £1.50 insurance = £6.50.
  test('Phase-3 commit succeeds on a free spot', async () => {
    mockOverlapQuery([]);
    mockTxn({
      exists: () => true,
      data:   () => ({ spotsLeft: 1 }),
    });

    const result = await bookSpotAtomically({
      spot: mockSpot,
      user: mockUser,
      bookingDuration: 2,
      hasInsurance: true,
    });

    expect(result.newSpotsLeft).toBe(0);
    expect(result.amountToCharge).toBe(6.50);
    expect(result.bookingId).toMatch(/^\d+-driver/);
    expect(firestore.runTransaction).toHaveBeenCalledTimes(1);
  });

  // ── Test 2.2 ─────────────────────────────────────────────────────────────
  // What if the host deleted the spot in the split second between the
  // driver tapping it and pressing Pay? The transaction's Phase 1 read
  // must throw SPOT_NOT_FOUND rather than silently creating a booking
  // against a non-existent listing.
  test('Phase-1 read throws SPOT_NOT_FOUND when the document is missing', async () => {
    mockOverlapQuery([]);
    mockTxn({
      exists: () => false,
      data:   () => ({}),
    });

    await expect(
      bookSpotAtomically({
        spot: mockSpot, user: mockUser, bookingDuration: 1, hasInsurance: false,
      })
    ).rejects.toMatchObject({ code: 'SPOT_NOT_FOUND' });
  });

  // ── Test 2.3 ─────────────────────────────────────────────────────────────
  // The race-loser case. The spot exists, but by the time we read it
  // inside the transaction, another driver has already bagged the last
  // place and spotsLeft is 0. Phase 2 must throw SPOT_UNAVAILABLE.
  //
  // This is the scenario that most directly maps to the concurrency
  // claim in the dissertation: in the "last spot" race, all drivers but
  // one should see this error.
  test('Phase-2 validate throws SPOT_UNAVAILABLE when inventory is zero', async () => {
    mockOverlapQuery([]);
    mockTxn({
      exists: () => true,
      data:   () => ({ spotsLeft: 0 }),
    });

    await expect(
      bookSpotAtomically({
        spot: mockSpot, user: mockUser, bookingDuration: 1, hasInsurance: false,
      })
    ).rejects.toMatchObject({ code: 'SPOT_UNAVAILABLE' });
  });

  // ── Test 2.4 ─────────────────────────────────────────────────────────────
  // Before even opening a transaction, I run a pre-check that looks for
  // bookings that overlap the requested time window. If there's an
  // existing booking for the same spot from 14:30 to 15:30 and you
  // request 14:45 to 15:45, that's a clash and I reject it.
  //
  // Critical assertion at the bottom: runTransaction must NOT have been
  // called. If we opened the transaction we would have decremented
  // inventory for a booking that couldn't actually go ahead.
  test('Pre-transaction overlap check throws TIME_CONFLICT', async () => {
    const now = new Date();
    const existingStart = new Date(now.getTime() + 30 * 60 * 1000).toISOString();
    const existingEnd   = new Date(now.getTime() + 90 * 60 * 1000).toISOString();
    mockOverlapQuery([{
      startTime: existingStart,
      endTime:   existingEnd,
      driverId:  'someone-else',
    }]);

    await expect(
      bookSpotAtomically({
        spot: mockSpot, user: mockUser, bookingDuration: 1, hasInsurance: false,
      })
    ).rejects.toMatchObject({ code: 'TIME_CONFLICT' });

    expect(firestore.runTransaction).not.toHaveBeenCalled();
  });

  // ── Test 2.5 ─────────────────────────────────────────────────────────────
  // Edge case. What if the "overlapping booking" is actually YOURS, i.e.
  // you're extending or re-booking your own slot? That shouldn't be a
  // conflict. The overlap check filters out your own bookings by driverId.
  test('Overlap check ignores the user\u2019s own bookings (self-conflict allowed)', async () => {
    const now = new Date();
    mockOverlapQuery([{
      startTime: new Date(now.getTime() + 30 * 60 * 1000).toISOString(),
      endTime:   new Date(now.getTime() + 90 * 60 * 1000).toISOString(),
      driverId:  mockUser.uid,
    }]);
    mockTxn({
      exists: () => true,
      data:   () => ({ spotsLeft: 1 }),
    });

    await expect(
      bookSpotAtomically({
        spot: mockSpot, user: mockUser, bookingDuration: 1, hasInsurance: false,
      })
    ).resolves.toBeDefined();
  });
});


// ════════════════════════════════════════════════════════════════════════════
//  SECTION 3 - Past-time guard (minute precision)
// ════════════════════════════════════════════════════════════════════════════
//  The checkout screen has an <input type="datetime-local"> which only
//  has minute precision (you can pick 14:33 but not 14:33:47). When I
//  compared it to the current time using the raw millisecond value, the
//  current minute itself was always rejected, because a few seconds into
//  that minute had already elapsed. Defect #6 in the testing chapter.
//
//  Fix: round both sides down to the nearest minute before comparing.
//  That way "now is 14:33:47 and you picked 14:33" is treated as OK.
//
//  The test lifts the comparator inline (copied from CheckoutView) so I
//  don't have to mount the whole React component tree just to test four
//  lines of logic.
// ════════════════════════════════════════════════════════════════════════════
describe('Past-time guard - minute precision', () => {

  // The exact comparator used in CheckoutView, reproduced here for the test.
  const isPastTime = (selectedIso) => {
    const selected = new Date(selectedIso);
    const now      = new Date();
    // Strip seconds and milliseconds off both sides. Now they're both
    // "clean minute" values and can be compared fairly.
    selected.setSeconds(0, 0);
    now.setSeconds(0, 0);
    return selected.getTime() < now.getTime();
  };

  beforeEach(() => jest.useFakeTimers());
  afterEach(()  => jest.useRealTimers());

  // Important gotcha: <input type="datetime-local"> gives me strings like
  // "2026-04-19T14:33" with NO timezone suffix. JavaScript parses those
  // as LOCAL time. So I have to freeze the system clock using the local
  // Date constructor (which treats its args as local) and not a UTC
  // ISO string, otherwise the two sides of the comparison disagree.
  // The `3` in the month argument is April, because months are 0-indexed
  // in JavaScript Date. Yes, really.
  const LOCAL_MAY_19_14_33_47 = new Date(2026, 3, 19, 14, 33, 47);

  // ── Test 3.1 ─────────────────────────────────────────────────────────────
  // The regression case. Clock is 14:33:47. User picks 14:33. Must be
  // accepted. Before the fix, this returned true (rejected).
  test('current minute is valid even mid-second (regression for Defect #6)', () => {
    jest.setSystemTime(LOCAL_MAY_19_14_33_47);
    expect(isPastTime('2026-04-19T14:33')).toBe(false);
  });

  // ── Test 3.2 ─────────────────────────────────────────────────────────────
  // Clock is 14:33:47. User picks 14:32. Must be rejected.
  test('previous minute is rejected', () => {
    jest.setSystemTime(LOCAL_MAY_19_14_33_47);
    expect(isPastTime('2026-04-19T14:32')).toBe(true);
  });

  // ── Test 3.3 ─────────────────────────────────────────────────────────────
  // Clock is 14:33:47. User picks 14:34. Must be accepted.
  test('future minute is valid', () => {
    jest.setSystemTime(LOCAL_MAY_19_14_33_47);
    expect(isPastTime('2026-04-19T14:34')).toBe(false);
  });
});
