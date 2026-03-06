/**
 * Service for managing user context
 * Stores and provides user ID for HTTP headers
 */
class UserContextService {
  private static readonly USER_ID_KEY = 'validatey_user_id';
  private userId: string | null = null;
  private sessionReady = false;

  constructor() {
    // Load user ID from localStorage on initialization
    this.loadUserId();
  }

  /**
   * Get current user ID
   */
  getUserId(): string | null {
    return this.userId;
  }

  /**
   * Set user ID
   */
  setUserId(userId: string): void {
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      console.error('Invalid UUID format for userId:', userId);
      return;
    }
    this.userId = userId;
    // Save to localStorage for persistence
    if (typeof window !== 'undefined') {
      localStorage.setItem(UserContextService.USER_ID_KEY, userId);
    }
  }

  /**
   * Load user ID from localStorage
   */
  private loadUserId(): void {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(UserContextService.USER_ID_KEY);
      if (stored) {
        // Validate that the stored userId is a valid UUID format
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (uuidRegex.test(stored)) {
          this.userId = stored;
        } else {
          // Invalid format, clear it
          localStorage.removeItem(UserContextService.USER_ID_KEY);
          this.userId = null;
        }
      }
    }
  }

  /**
   * Clear user ID (on logout)
   */
  clearUserId(): void {
    this.userId = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem(UserContextService.USER_ID_KEY);
    }
  }

  /**
   * Generate temporary user ID for anonymous users
   * Used until authentication
   */
  generateTemporaryUserId(): string {
    // Generate UUID v4
    const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });

    this.setUserId(uuid);
    return uuid;
  }

  /**
   * Get user ID, creating a temporary one if it doesn't exist
   */
  getOrCreateUserId(): string {
    let id = this.getUserId();
    if (!id) {
      id = this.generateTemporaryUserId();
    }
    return id;
  }

  /** Session has been loaded (auth state known). Used to avoid loading projects with stale userId. */
  isSessionReady(): boolean {
    return this.sessionReady;
  }

  setSessionReady(ready: boolean): void {
    this.sessionReady = ready;
  }
}

// Singleton instance
export const userContextService = new UserContextService();



