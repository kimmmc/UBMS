import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_CONFIG, getApiUrl } from '@/config/api';

// Requests that should NOT be retried (mutations that could cause duplicates)
const NON_RETRYABLE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

// Network/transient errors that are safe to retry
const isRetryableError = (error: any): boolean => {
  if (!error) return false;
  const msg = String(error?.message || error).toLowerCase();
  return (
    msg.includes('network request failed') ||
    msg.includes('fetch failed') ||
    msg.includes('network error') ||
    msg.includes('etimedout') ||
    msg.includes('econnreset') ||
    msg.includes('econnrefused') ||
    msg.includes('failed to fetch') ||
    msg.includes('aborted') ||
    msg.includes('timeout')
  );
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

class ApiService {
  private baseURL: string;

  constructor() {
    this.baseURL = getApiUrl();
    console.log('Driver API Service initialized with URL:', this.baseURL);
  }

  private async getAuthToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('driver_authToken');
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  /**
   * Core request method with:
   *  - AbortController-based timeout (avoids hanging forever)
   *  - Exponential backoff retry for GET requests and network errors
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retries = API_CONFIG.MAX_RETRIES
  ): Promise<T> {
    const token = await this.getAuthToken();
    const method = (options.method || 'GET').toUpperCase();
    const url = `${this.baseURL}${endpoint}`;

    // Only retry GET requests automatically to avoid duplicate mutations
    const canRetry = !NON_RETRYABLE_METHODS.has(method);

    let lastError: any;

    for (let attempt = 0; attempt <= (canRetry ? retries : 0); attempt++) {
      // Exponential backoff: 0ms, 1s, 2s, 4s …
      if (attempt > 0) {
        const delay = API_CONFIG.RETRY_DELAY * Math.pow(2, attempt - 1);
        console.log(`Driver API retry ${attempt}/${retries} for ${method} ${endpoint} in ${delay}ms`);
        await sleep(delay);
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

      try {
        const config: RequestInit = {
          headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
            ...options.headers,
          },
          signal: controller.signal,
          ...options,
        };

        console.log(`Driver API Request [attempt ${attempt + 1}]: ${method} ${url}`);
        const response = await fetch(url, config);

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error(`Driver API Error: ${response.status}`, errorData);
          // 5xx errors may be worth retrying; 4xx are not
          if (response.status >= 500 && canRetry && attempt < retries) {
            lastError = new Error(errorData.error || `HTTP error! status: ${response.status}`);
            continue;
          }
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log(`Driver API Response: ${method} ${endpoint}`, data);
        return data;

      } catch (error: any) {
        clearTimeout(timeoutId);

        const isAbortError = error?.name === 'AbortError';
        const networkErr = isAbortError
          ? new Error('Request timed out. The server may be waking up, please try again.')
          : error;

        if ((isRetryableError(error) || isAbortError) && canRetry && attempt < retries) {
          lastError = networkErr;
          continue;
        }

        throw networkErr;
      }
    }

    throw lastError ?? new Error('Request failed after retries');
  }

  // Authentication
  async login(email: string, password: string) {
    return this.request<{
      message: string;
      token: string;
      user: {
        id: string;
        name: string;
        email: string;
        phone: string;
        role: string;
      };
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async getProfile() {
    return this.request<{
      user: {
        id: string;
        name: string;
        email: string;
        phone: string;
        role: string;
      };
    }>('/auth/profile');
  }

  async logout() {
    try {
      // Call backend logout endpoint if it exists
      await this.request<{ message: string }>('/auth/logout', {
        method: 'POST',
      });
    } catch (error) {
      // If logout endpoint doesn't exist or fails, that's okay
      // The main logout happens client-side
      console.log('Backend logout endpoint not available or failed:', error);
    }
  }

  // Driver-specific endpoints
  async getDriverBus() {
    return this.request<{
      bus: {
        _id: string;
        plateNumber: string;
        capacity: number;
        fare: number;
        driverId: any;
        routeId: any;
        currentLocation: {
          latitude: number | null;
          longitude: number | null;
          lastUpdated: Date | null;
          speed: number;
          heading: number;
        };
        isActive: boolean;
        isOnline: boolean;
      };
    }>('/buses/driver/my-bus');
  }

  async checkDriverBusAssignment() {
    return this.request<{
      bus?: any;
      message?: string;
      error?: string;
      driverId?: string;
      availableBuses?: any[];
    }>('/buses/driver/check-assignment');
  }

  async updateBusLocation(busId: string, latitude: number, longitude: number, speed: number = 0, heading: number = 0, accuracy: number = 0) {
    return this.request<{
      message: string;
      bus: any;
    }>('/bus-locations/update', {
      method: 'POST',
      body: JSON.stringify({ busId, latitude, longitude, speed, heading, accuracy }),
    });
  }

  async setDriverOnlineStatus(busId: string, isOnline: boolean) {
    return this.request<{
      message: string;
    }>('/bus-locations/driver/status', {
      method: 'POST',
      body: JSON.stringify({ busId, isOnline }),
    });
  }

  async getDriverSchedules() {
    return this.request<{
      schedules: Array<{
        _id: string;
        busId: any;
        routeId: any;
        departureTime: Date;
        estimatedArrivalTimes: Array<{
          pickupPointId: any;
          estimatedTime: Date;
          actualTime?: Date;
        }>;
        status: string;
      }>;
    }>('/bus-schedules/driver/my-schedules');
  }

  async getInterestedPassengers(scheduleId: string) {
    return this.request<{
      interests: Array<{
        _id: string;
        userId: any;
        busScheduleId: any;
        pickupPointId: any;
        status: string;
        createdAt: Date;
      }>;
    }>(`/bus-schedules/${scheduleId}/interested-users`);
  }

  async updateUserInterestStatus(interestId: string, status: 'confirmed' | 'cancelled') {
    return this.request<{
      message: string;
      interest: any;
    }>(`/bus-schedules/interests/${interestId}`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  async startTrip(scheduleId: string, direction?: 'outbound' | 'inbound') {
    return this.request<{
      message: string;
      schedule: any;
      cleanedInterests: number;
    }>('/bus-schedules/start-trip', {
      method: 'POST',
      body: JSON.stringify({ scheduleId, direction }),
    });
  }

  async endTrip(scheduleId: string) {
    return this.request<{
      message: string;
      deletedInterests: number;
      scheduleDeleted: boolean;
    }>('/bus-schedules/end-trip', {
      method: 'POST',
      body: JSON.stringify({ scheduleId }),
    });
  }

  async updateArrivalTime(scheduleId: string, pickupPointId: string, actualTime: Date) {
    return this.request<{
      message: string;
      schedule: any;
    }>(`/bus-schedules/${scheduleId}/arrival`, {
      method: 'PATCH',
      body: JSON.stringify({ pickupPointId, actualTime }),
    });
  }

  // General endpoints that drivers might need
  async getBuses() {
    return this.request<{
      buses: Array<{
        _id: string;
        plateNumber: string;
        capacity: number;
        fare: number;
        driverId: any;
        routeId: any;
        currentLocation: {
          latitude: number | null;
          longitude: number | null;
          lastUpdated: Date | null;
          speed: number;
          heading: number;
        };
        isActive: boolean;
        isOnline: boolean;
      }>;
    }>('/buses');
  }

  async getRoutes() {
    return this.request<{
      routes: Array<{
        _id: string;
        name: string;
        description: string;
        pickupPoints: any[];
        estimatedDuration: number;
        fare: number;
        isActive: boolean;
      }>;
    }>('/routes');
  }

  async getBusSchedules(status?: string, routeId?: string, date?: string) {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (routeId) params.append('routeId', routeId);
    if (date) params.append('date', date);

    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request<{
      schedules: Array<{
        _id: string;
        busId: any;
        routeId: any;
        departureTime: Date;
        estimatedArrivalTimes: Array<{
          pickupPointId: any;
          estimatedTime: Date;
          actualTime?: Date;
        }>;
        status: string;
      }>;
    }>(`/bus-schedules${query}`);
  }
}

export const apiService = new ApiService();