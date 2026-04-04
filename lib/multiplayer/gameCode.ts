/**
 * Game Code Generation & Validation
 *
 * Generates unique 6-character codes for multiplayer games
 */

/**
 * Generate a random 6-character game code
 * Uses only uppercase letters and numbers, excluding confusing characters (O, 0, I, 1)
 *
 * @returns A 6-character game code (e.g., "7SPADE")
 */
export function generateGameCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // No O, 0, I, 1, L
  let code = ''

  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length)
    code += chars[randomIndex]
  }

  return code
}

/**
 * Validate a game code format
 *
 * @param code - The code to validate
 * @returns true if the code is valid format
 */
export function validateGameCode(code: string): boolean {
  if (!code || code.length !== 6) {
    return false
  }

  // Must be 6 uppercase alphanumeric characters
  return /^[A-Z0-9]{6}$/.test(code.toUpperCase())
}

/**
 * Format a game code for display (e.g., "ABC DEF")
 *
 * @param code - The code to format
 * @returns Formatted code with space in middle
 */
export function formatGameCode(code: string): string {
  if (code.length !== 6) return code
  return `${code.slice(0, 3)} ${code.slice(3)}`
}

/**
 * Normalize a game code (uppercase, remove spaces)
 *
 * @param code - The code to normalize
 * @returns Normalized code
 */
export function normalizeGameCode(code: string): string {
  return code.toUpperCase().replace(/\s/g, '')
}
