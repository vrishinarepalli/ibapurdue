/**
 * Time Utility Functions
 *
 * Provides helper functions for time format conversion and manipulation.
 * Used primarily for schedule sorting and display.
 */

/**
 * Convert 12-hour time format to 24-hour format for sorting.
 *
 * @param {string} timeStr - Time string in 12-hour format (e.g., "2:30 PM")
 * @returns {string} Time in 24-hour format (e.g., "14:30")
 *
 * @example
 * convertTo24Hour("2:30 PM");  // Returns "14:30"
 * convertTo24Hour("12:00 AM"); // Returns "00:00"
 * convertTo24Hour("12:00 PM"); // Returns "12:00"
 */
export function convertTo24Hour(timeStr) {
  if (!timeStr) return '00:00';

  const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return timeStr;

  let [_, hours, minutes, period] = match;
  hours = parseInt(hours);

  if (period.toUpperCase() === 'PM' && hours !== 12) {
    hours += 12;
  } else if (period.toUpperCase() === 'AM' && hours === 12) {
    hours = 0;
  }

  return `${hours.toString().padStart(2, '0')}:${minutes}`;
}

// Expose globally for backward compatibility
window.convertTo24Hour = convertTo24Hour;
