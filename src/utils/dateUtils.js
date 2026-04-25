/**
 * Date utility functions
 */

/**
 * Check if a date string is within a filter range
 * @param {string} dateStr - Date string in format "DD/MM/YYYY HH:MM:SS"
 * @param {string} filter - Filter type: "Semua", "Hari Ini", "Minggu Ini", "Bulan Ini"
 * @returns {boolean}
 */
export function isDateInRange(dateStr, filter) {
  const date = new Date(dateStr.split(' ')[0].split('/').reverse().join('-'));
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  
  switch (filter) {
    case "Hari Ini":
      return date >= startOfToday;
    case "Minggu Ini": {
      const startOfWeek = new Date(startOfToday);
      startOfWeek.setDate(startOfToday.getDate() - startOfToday.getDay());
      return date >= startOfWeek;
    }
    case "Bulan Ini": {
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      return date >= startOfMonth;
    }
    default:
      return true;
  }
}

/**
 * Check if a date string is within a custom date range
 * @param {string} dateStr - Date string in format "DD/MM/YYYY HH:MM:SS"
 * @param {string} startDate - Start date in ISO format
 * @param {string} endDate - End date in ISO format
 * @returns {boolean}
 */
export function isDateInCustomRange(dateStr, startDate, endDate) {
  if (!startDate && !endDate) return true;
  
  const date = new Date(dateStr.split(' ')[0].split('/').reverse().join('-'));
  
  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return date >= start && date <= end;
  } else if (startDate) {
    const start = new Date(startDate);
    return date >= start;
  } else if (endDate) {
    const end = new Date(endDate);
    return date <= end;
  }
  
  return true;
}

/**
 * Format date for display in Indonesian locale
 * @param {string} dateStr - Date string in ISO format
 * @returns {string} Formatted date string
 */
export function formatDateForDisplay(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('id-ID');
}

/**
 * Parse Indonesian date string to Date object
 * @param {string} dateStr - Date string in format "DD/MM/YYYY"
 * @returns {Date}
 */
export function parseIndonesianDate(dateStr) {
  const parts = dateStr.split('/');
  return new Date(parts[2], parts[1] - 1, parts[0]);
}

export default {
  isDateInRange,
  isDateInCustomRange,
  formatDateForDisplay,
  parseIndonesianDate,
};
