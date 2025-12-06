/**
 * Сервис для управления контекстом пользователя
 * Хранит и предоставляет user ID для HTTP заголовков
 */
class UserContextService {
  private static readonly USER_ID_KEY = 'validatey_user_id';
  private userId: string | null = null;

  constructor() {
    // Загружаем user ID из localStorage при инициализации
    this.loadUserId();
  }

  /**
   * Получить текущий user ID
   */
  getUserId(): string | null {
    return this.userId;
  }

  /**
   * Установить user ID
   */
  setUserId(userId: string): void {
    this.userId = userId;
    // Сохраняем в localStorage для персистентности
    if (typeof window !== 'undefined') {
      localStorage.setItem(UserContextService.USER_ID_KEY, userId);
    }
  }

  /**
   * Загрузить user ID из localStorage
   */
  private loadUserId(): void {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(UserContextService.USER_ID_KEY);
      if (stored) {
        this.userId = stored;
      }
    }
  }

  /**
   * Очистить user ID (при выходе из системы)
   */
  clearUserId(): void {
    this.userId = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem(UserContextService.USER_ID_KEY);
    }
  }

  /**
   * Генерировать временный user ID для анонимных пользователей
   * Используется до момента авторизации
   */
  generateTemporaryUserId(): string {
    // Генерируем UUID v4
    const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
    
    this.setUserId(uuid);
    return uuid;
  }

  /**
   * Получить user ID, создав временный, если его нет
   */
  getOrCreateUserId(): string {
    let id = this.getUserId();
    if (!id) {
      id = this.generateTemporaryUserId();
    }
    return id;
  }
}

// Singleton instance
export const userContextService = new UserContextService();

