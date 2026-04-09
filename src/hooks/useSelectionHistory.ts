import { useCallback, useRef, useState } from "react";

/**
 * Tracks window selection history for undo/redo.
 *
 * History is stored in a ref so that push/undo/redo always operate on the
 * latest data regardless of React render cycles or closure staleness.
 * A plain version counter triggers re-renders so canUndo/canRedo stay reactive.
 *
 * Max 50 history entries — oldest are dropped silently.
 */

const MAX_HISTORY = 50;

export type SelectionMap = Record<string, boolean>;

function cloneSnapshot<T>(value: T): T {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }

  return JSON.parse(JSON.stringify(value)) as T;
}

export function useSelectionHistory<T>(initialState: T) {
  // Ref holds the real data — always current, never stale in closures.
  const entriesRef = useRef<T[]>([cloneSnapshot(initialState)]);
  const indexRef = useRef<number>(0);

  // Version counter purely to trigger re-renders.
  const [, setVersion] = useState(0);
  const bump = () => setVersion((v) => v + 1);

  /** Record a new selection snapshot (call after applying the change). */
  const push = useCallback((snapshot: T) => {
    // Trim any future entries beyond current index
    entriesRef.current = entriesRef.current.slice(0, indexRef.current + 1);
    entriesRef.current.push(cloneSnapshot(snapshot));

    // Cap history size
    if (entriesRef.current.length > MAX_HISTORY) {
      entriesRef.current.shift();
    }

    indexRef.current = entriesRef.current.length - 1;
    bump();
  }, []);

  /** Move back one step. Returns the restored SelectionMap, or null if at start. */
  const undo = useCallback((): T | null => {
    if (indexRef.current <= 0) return null;
    indexRef.current -= 1;
    const result = cloneSnapshot(entriesRef.current[indexRef.current]);
    bump();
    return result;
  }, []);

  /** Move forward one step. Returns the restored SelectionMap, or null if at end. */
  const redo = useCallback((): T | null => {
    if (indexRef.current >= entriesRef.current.length - 1) return null;
    indexRef.current += 1;
    const result = cloneSnapshot(entriesRef.current[indexRef.current]);
    bump();
    return result;
  }, []);

  /** Whether undo is available (reactive). */
  const canUndo = indexRef.current > 0;

  /** Whether redo is available (reactive). */
  const canRedo = indexRef.current < entriesRef.current.length - 1;

  /** Reset history (e.g. on fresh window enumeration). */
  const reset = useCallback(
    (initial?: T) => {
      entriesRef.current = [
        cloneSnapshot(initial ?? cloneSnapshot(initialState)),
      ];
      indexRef.current = 0;
      bump();
    },
    [initialState],
  );

  return { push, undo, redo, canUndo, canRedo, reset };
}
