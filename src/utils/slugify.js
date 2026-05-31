/**
 * Convert string into clean, URL-friendly slug
 * @param {string} text - String to slugify
 * @returns {string} - Slugified string
 */
export const slugify = (text) => {
  if (!text) return '';

  return text
    .toString()
    .toLowerCase()
    .normalize('NFD') // Normalize accent marks
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[đĐ]/g, 'd') // Convert special Vietnamese d char
    .replace(/[^a-z0-9\s-]/g, '') // Remove non-alphanumeric chars
    .trim()
    .replace(/\s+/g, '-') // Convert spaces to -
    .replace(/-+/g, '-'); // Collapse double dashes
};
