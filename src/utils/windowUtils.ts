/**
 * Utility functions for window operations and title cleaning
 */

/**
 * Clean window titles to show only app names without document/task content
 * Examples:
 * "Get all windows in electronjs | Dustin John Pfister at github pages - Google Chrome" -> "Google Chrome"
 * "Visual Studio Code - windowEnumeration.ts" -> "Visual Studio Code"
 * "File Explorer" -> "File Explorer"
 */
export function cleanWindowTitle(title: string, appName: string): string {
  // Common patterns to clean
  const patterns = [
    // Chrome: "Page Title - Google Chrome" -> "Google Chrome"
    /^.* - Google Chrome$/,
    // Firefox: "Page Title - Mozilla Firefox" -> "Mozilla Firefox"  
    /^.* - Mozilla Firefox$/,
    // Edge: "Page Title - Microsoft Edge" -> "Microsoft Edge"
    /^.* - Microsoft Edge$/,
    // VS Code: "Filename - Visual Studio Code" -> "Visual Studio Code"
    /^.* - Visual Studio Code$/,
    // Notepad: "Filename - Notepad" -> "Notepad"
    /^.* - Notepad$/,
    // Word: "Document - Microsoft Word" -> "Microsoft Word"
    /^.* - Microsoft Word$/,
    // Excel: "Workbook - Microsoft Excel" -> "Microsoft Excel"
    /^.* - Microsoft Excel$/,
  ];

  // Check if title matches any pattern
  for (const pattern of patterns) {
    if (pattern.test(title)) {
      // Extract app name from the end
      const parts = title.split(' - ');
      if (parts.length >= 2) {
        return parts[parts.length - 1];
      }
    }
  }

  // If no pattern matches, try to extract from app name or return title as is
  const appNames = {
    'chrome': 'Google Chrome',
    'firefox': 'Mozilla Firefox', 
    'msedge': 'Microsoft Edge',
    'code': 'Visual Studio Code',
    'notepad': 'Notepad',
    'winword': 'Microsoft Word',
    'excel': 'Microsoft Excel',
    'explorer': 'File Explorer',
    'teams': 'Microsoft Teams',
    'whatsapp': 'WhatsApp',
    'discord': 'Discord',
    'slack': 'Slack',
    'zoom': 'Zoom',
    'vlc': 'VLC Media Player',
    'steam': 'Steam',
  };

  // Check if we can map by app name
  const appKey = appName.toLowerCase().replace('.exe', '');
  if (appNames[appKey]) {
    return appNames[appKey];
  }

  // If title is very long, truncate it
  if (title.length > 50) {
    return title.substring(0, 47) + '...';
  }

  return title;
}

/**
 * Calculate optimal grid layout for given number of windows
 */
export function calculateGridLayout(windowCount: number): { cols: number; rows: number; className: string } {
  if (windowCount <= 1) {
    return { cols: 1, rows: 1, className: 'grid-cols-1' };
  }
  if (windowCount <= 2) {
    return { cols: 2, rows: 1, className: 'grid-cols-2' };
  }
  if (windowCount <= 4) {
    return { cols: 2, rows: 2, className: 'grid-cols-2' };
  }
  if (windowCount <= 6) {
    return { cols: 3, rows: 2, className: 'grid-cols-3' };
  }
  if (windowCount <= 9) {
    return { cols: 3, rows: 3, className: 'grid-cols-3' };
  }
  if (windowCount <= 12) {
    return { cols: 4, rows: 3, className: 'grid-cols-4' };
  }
  if (windowCount <= 16) {
    return { cols: 4, rows: 4, className: 'grid-cols-4' };
  }
  
  // For more than 16 windows, use 5 columns
  return { cols: 5, rows: Math.ceil(windowCount / 5), className: 'grid-cols-5' };
}

/**
 * Calculate optimal window card size based on container size and window count
 */
export function calculateWindowCardSize(
  containerWidth: number,
  containerHeight: number,
  windowCount: number
): { width: number; height: number; fontSize: string } {
  const layout = calculateGridLayout(windowCount);
  const gap = 8; // 8px gap between cards
  
  const availableWidth = containerWidth - (gap * (layout.cols - 1));
  const availableHeight = containerHeight - (gap * (layout.rows - 1));
  
  const cardWidth = Math.floor(availableWidth / layout.cols);
  const cardHeight = Math.floor(availableHeight / layout.rows);
  
  // Determine font size based on card size
  let fontSize = 'text-xs';
  if (cardWidth > 120 && cardHeight > 80) {
    fontSize = 'text-sm';
  }
  if (cardWidth > 180 && cardHeight > 120) {
    fontSize = 'text-base';
  }
  
  return {
    width: Math.max(60, cardWidth), // Minimum 60px width
    height: Math.max(40, cardHeight), // Minimum 40px height
    fontSize
  };
}