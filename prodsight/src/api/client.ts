// Mock API client that simulates backend calls with local storage and delays

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export interface ApiError {
  message: string;
  status: number;
}

class ApiClient {
  private baseDelay = 500; // Simulate network delay

  private async delay(ms: number = this.baseDelay): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private getStorageKey(endpoint: string): string {
    return `prodsight_${endpoint.replace(/\//g, '_')}`;
  }

  private loadFromStorage<T>(key: string, fallback: T): T {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : fallback;
    } catch {
      return fallback;
    }
  }

  private saveToStorage<T>(key: string, data: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save to localStorage:', error);
    }
  }

  async get<T>(endpoint: string, fallbackData: T): Promise<ApiResponse<T>> {
    await this.delay();
    
    try {
      const storageKey = this.getStorageKey(endpoint);
      const data = this.loadFromStorage(storageKey, fallbackData);
      
      return {
        data,
        success: true,
      };
    } catch (error) {
      throw {
        message: 'Failed to fetch data',
        status: 500,
      } as ApiError;
    }
  }

  async post<T, R>(endpoint: string, data: T, currentData: R): Promise<ApiResponse<R>> {
    await this.delay();
    
    try {
      const storageKey = this.getStorageKey(endpoint);
      let updatedData: R;

      if (Array.isArray(currentData)) {
        // For arrays, add new item
        updatedData = [...currentData, { ...data, id: Date.now().toString() }] as R;
      } else {
        // For objects, merge data
        updatedData = { ...currentData, ...data } as R;
      }

      this.saveToStorage(storageKey, updatedData);
      
      return {
        data: updatedData,
        success: true,
        message: 'Data created successfully',
      };
    } catch (error) {
      throw {
        message: 'Failed to create data',
        status: 500,
      } as ApiError;
    }
  }

  async put<T, R>(endpoint: string, id: string, data: T, currentData: R): Promise<ApiResponse<R>> {
    await this.delay();
    
    try {
      const storageKey = this.getStorageKey(endpoint);
      let updatedData: R;

      if (Array.isArray(currentData)) {
        // For arrays, update specific item
        updatedData = (currentData as any[]).map(item => 
          item.id === id ? { ...item, ...data } : item
        ) as R;
      } else {
        // For objects, merge data
        updatedData = { ...currentData, ...data } as R;
      }

      this.saveToStorage(storageKey, updatedData);
      
      return {
        data: updatedData,
        success: true,
        message: 'Data updated successfully',
      };
    } catch (error) {
      throw {
        message: 'Failed to update data',
        status: 500,
      } as ApiError;
    }
  }

  async delete<R>(endpoint: string, id: string, currentData: R): Promise<ApiResponse<R>> {
    await this.delay();
    
    try {
      const storageKey = this.getStorageKey(endpoint);
      let updatedData: R;

      if (Array.isArray(currentData)) {
        // For arrays, remove item
        updatedData = (currentData as any[]).filter(item => item.id !== id) as R;
      } else {
        // For objects, this would depend on the specific use case
        updatedData = currentData;
      }

      this.saveToStorage(storageKey, updatedData);
      
      return {
        data: updatedData,
        success: true,
        message: 'Data deleted successfully',
      };
    } catch (error) {
      throw {
        message: 'Failed to delete data',
        status: 500,
      } as ApiError;
    }
  }

  // Authentication simulation
  async authenticate(username: string, password: string): Promise<ApiResponse<any>> {
    await this.delay(1000); // Longer delay for auth
    
    try {
      // Import users data
      const usersModule = await import('../data/users.json');
      const users = usersModule.default;
      
      const user = users.find(u => u.username === username && u.password === password);
      
      if (!user) {
        throw {
          message: 'Invalid credentials',
          status: 401,
        } as ApiError;
      }

      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;
      
      return {
        data: userWithoutPassword,
        success: true,
        message: 'Authentication successful',
      };
    } catch (error) {
      if ((error as ApiError).status === 401) {
        throw error;
      }
      throw {
        message: 'Authentication failed',
        status: 500,
      } as ApiError;
    }
  }
}

export const apiClient = new ApiClient();
