/**
 * Shared utility functions for the Cardano Explorer
 */

const LOVELACE_TO_ADA = 1000000;

/**
 * Formats a Unix timestamp to a localized date string
 * @param {number} timestamp - Unix timestamp in seconds
 * @returns {string} Formatted date string
 */
export function formatDate(timestamp) {
  return new Date(timestamp * 1000).toLocaleString();
}

/**
 * Converts Lovelace to ADA with proper formatting
 * @param {string|number} lovelace - Amount in Lovelace
 * @returns {string} Formatted ADA amount
 */
export function formatAda(lovelace) {
  const value = parseInt(lovelace) || 0;
  return (value / LOVELACE_TO_ADA).toFixed(6);
}

/**
 * Gets a DOM element by ID with error handling
 * @param {string} id - Element ID
 * @returns {HTMLElement} The found element or a placeholder
 */
export function getElement(id) {
  const element = document.getElementById(id);
  if (!element) {
    console.error(`Element with id '${id}' not found`);
    const placeholder = document.createElement('div');
    placeholder.id = id;
    document.body.appendChild(placeholder);
    return placeholder;
  }
  return element;
}

export { LOVELACE_TO_ADA };
