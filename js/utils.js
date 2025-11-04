/**
 * ============================================================================
 * UTILITY FUNCTIONS
 * ============================================================================
 *
 * This module contains helper functions for data conversion, particularly
 * for WebAuthn/biometric authentication which requires converting between
 * different encoding formats (ArrayBuffer, Base64, Base64URL).
 *
 * Key Functions:
 * - arrayBufferToBase64: Convert binary data to standard Base64
 * - base64ToArrayBuffer: Convert Base64 string to binary data
 * - base64urlToBase64: Convert URL-safe Base64 to standard Base64
 * - arrayBufferToBase64url: Convert binary data to URL-safe Base64
 *
 * Note: Base64URL is used by WebAuthn to ensure credentials work in URLs
 * without special character escaping issues.
 * ============================================================================
 */

/**
 * Convert an ArrayBuffer to a standard Base64 string
 * @param {ArrayBuffer} buffer - The binary data to convert
 * @returns {string} Base64 encoded string
 */
export function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Convert a standard Base64 string to an ArrayBuffer
 * @param {string} base64 - The Base64 string to convert
 * @returns {ArrayBuffer} Binary data
 */
export function base64ToArrayBuffer(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Convert a Base64URL string to standard Base64
 * Base64URL uses '-' and '_' instead of '+' and '/', and omits padding '='
 * @param {string} base64url - The Base64URL string to convert
 * @returns {string} Standard Base64 string
 */
export function base64urlToBase64(base64url) {
  let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  // Add padding if needed
  while (base64.length % 4 !== 0) {
    base64 += '=';
  }
  return base64;
}

/**
 * Convert an ArrayBuffer to a Base64URL string
 * @param {ArrayBuffer} buffer - The binary data to convert
 * @returns {string} Base64URL encoded string
 */
export function arrayBufferToBase64url(buffer) {
  const base64 = arrayBufferToBase64(buffer);
  // Convert to URL-safe format by replacing special characters and removing padding
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}
