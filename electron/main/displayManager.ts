import { screen, Display } from "electron";

/**
 * Display management utility for intelligent window positioning
 * - Main window (controller): Always on internal/laptop display
 * - Published window (projection): Always on external monitor
 * - Works regardless of Windows primary display setting
 */

/**
 * Detect the internal (laptop) display for the controller window
 */
export function detectInternalDisplay(): Display {
  const displays = screen.getAllDisplays();
  const primaryDisplay = screen.getPrimaryDisplay();

  console.log("🔍 Detecting internal display (controller)...", {
    totalDisplays: displays.length,
    primaryDisplayId: primaryDisplay.id,
    primaryIsInternal: primaryDisplay.internal,
  });

  // Strategy 1: Find display marked as internal (laptop screen)
  const internalDisplay = displays.find((d) => d.internal);

  if (internalDisplay) {
    console.log("✅ Strategy 1: Found internal display (laptop screen)", {
      id: internalDisplay.id,
      bounds: internalDisplay.bounds,
      isPrimary: internalDisplay.id === primaryDisplay.id,
    });
    return internalDisplay;
  }

  // Fallback: Use primary display
  console.log("⚠️ No internal display found - using primary display", {
    id: primaryDisplay.id,
    bounds: primaryDisplay.bounds,
    internal: primaryDisplay.internal,
  });
  return primaryDisplay;
}

/**
 * Detect the external display for the projection window
 */
export function detectExternalDisplay(): Display | null {
  const displays = screen.getAllDisplays();
  const primaryDisplay = screen.getPrimaryDisplay();

  console.log("🔍 Detecting external display (projection)...", {
    totalDisplays: displays.length,
    primaryDisplayId: primaryDisplay.id,
  });

  // If only one display, no external display available
  if (displays.length === 1) {
    console.log("⚠️ Only one display detected - no external display available");
    return null;
  }

  // Strategy 1: Find non-internal displays (external monitors/projectors)
  // ✅ Works regardless of which display is set as primary in Windows
  const externalNonInternal = displays.find((display) => !display.internal);

  if (externalNonInternal) {
    console.log("✅ Strategy 1: Found non-internal external display", {
      id: externalNonInternal.id,
      bounds: externalNonInternal.bounds,
      isPrimary: externalNonInternal.id === primaryDisplay.id,
    });
    return externalNonInternal;
  }

  // Strategy 2: Find displays not at origin (0,0) - likely secondary monitors
  const externalNotAtOrigin = displays.find(
    (display) =>
      (display.bounds.x !== 0 || display.bounds.y !== 0) &&
      display.id !== primaryDisplay.id
  );

  if (externalNotAtOrigin) {
    console.log("✅ Strategy 2: Found display not at origin (secondary)", {
      id: externalNotAtOrigin.id,
      bounds: externalNotAtOrigin.bounds,
    });
    return externalNotAtOrigin;
  }

  // Strategy 3: Use second display if multiple exist
  const secondaryDisplay = displays.find(
    (display) => display.id !== primaryDisplay.id
  );

  if (secondaryDisplay) {
    console.log("✅ Strategy 3: Using second display as external", {
      id: secondaryDisplay.id,
      bounds: secondaryDisplay.bounds,
    });
    return secondaryDisplay;
  }

  console.log("⚠️ No suitable external display found");
  return null;
}
