// UUID generation utility compatible with app, iOS, and web platforms

/**
 * Generates a UUID v4 string
 * @returns A UUID v4 string in the format xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
 */
export function generateUUID(): string {
  // Use crypto API if available (Web and newer platforms)
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  
  // Fallback for older environments or React Native
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    // Generate random number between 0-15
    const r = Math.random() * 16 | 0;
    // For 'x' use the random number directly
    // For 'y' use the random number but ensure the first bit is 0 and the second is 1 (0b10xxxxxx)
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    // Convert to hexadecimal string
    return v.toString(16);
  });
}

/**
 * Checks if a string is a valid UUID
 * @param uuid The string to validate
 * @returns True if the string is a valid UUID, false otherwise
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}