import axios from 'axios';
import type { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import { 
  Product, 
  ApiResponse, 
  CartItemWithProduct,
  User, 
  LoginCredentials, 
  RegisterCredentials,
  Club 
} from '../types';

// Create Axios instance
const api: AxiosInstance = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// If a token is present in localStorage when the app loads, set it on the axios instance
const _savedToken = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
if (_savedToken) {
  api.defaults.headers.common['Authorization'] = `Bearer ${_savedToken}`;
}

// Auth APIs
export const login = async (
  credentials: LoginCredentials
): Promise<ApiResponse<{ token: string; user: User }>> => {
  const response = await api.post<ApiResponse<{ token: string; user: User }>>(
    '/auth/login',
    credentials
  );
  return response.data;
};

export const register = async (
  credentials: RegisterCredentials
): Promise<ApiResponse<User>> => {
  const response = await api.post<ApiResponse<User>>('/auth/register', {
    username: credentials.username,
    email: credentials.email,
    password: credentials.password,
  });
  return response.data;
};

// Backwards-compatible helpers
export const loginUser = async (credentials: any): Promise<any> => {
  const response = await api.post('/auth/login', credentials);
  return response.data;
};

export const registerUser = async (credentials: any): Promise<any> => {
  const response = await api.post('/auth/register', credentials);
  return response.data;
};

export const logout = async (): Promise<ApiResponse> => {
  const response = await api.post<ApiResponse>('/auth/logout');
  return response.data;
};

// Club APIs
export const getClubs = async (): Promise<Club[]> => {
  const response = await api.get<Club[]>('/clubs');
  return response.data || [];
};

export const getClubProducts = async (clubId: number): Promise<Product[]> => {
  const response = await api.get<Product[]>(`/clubs/${clubId}/products`);
  return response.data || [];
};

// Product APIs
export const searchProducts = async (query: string): Promise<Product[]> => {
  if (!query.trim()) return [];
  const response = await api.get<Product[]>('/products/search', {
    params: { q: query },
  });
  return response.data || [];
};

export const getProducts = async (filters?: { club?: string | undefined; season?: string | undefined; player?: string | undefined }): Promise<Product[]> => {
  const response = await api.get<Product[]>('/products', {
    params: filters,
  });
  return response.data || [];
};

export const getProduct = async (id: number): Promise<Product> => {
  const response = await api.get(`/products/${id}`);
  return response.data as Product;
};

// Cart APIs
export const getCart = async (): Promise<CartItemWithProduct[]> => {
  const response = await api.get('/cart');
  return (response.data as CartItemWithProduct[]) || [];
};

export const addToCart = async (
  productId: number,
  quantity: number,
  meta?: Record<string, any>
): Promise<ApiResponse> => {
  const body: any = { productId, quantity };
  if (meta) body.meta = meta;
  const response = await api.post<ApiResponse>('/cart/add', body);
  return response.data;
};

export const updateCartQuantity = async (
  productId: number,
  quantity: number
): Promise<ApiResponse> => {
  const response = await api.put<ApiResponse>(`/cart/update/${productId}`, { quantity });
  return response.data;
};

export const removeFromCart = async (
  productId: number
): Promise<ApiResponse> => {
  const response = await api.delete<ApiResponse>(`/cart/remove/${productId}`);
  return response.data;
};

// Orders APIs
export const placeOrder = async (billingAddress?: any): Promise<any> => {
  const response = await api.post<any>('/orders', billingAddress || {});
  return response.data;
};

// User Profile APIs
export const getUserProfile = async (): Promise<User> => {
  const response = await api.get<ApiResponse<User>>('/auth/profile');
  return response.data as any;
};

export const updateUserProfile = async (
  userData: Partial<User>
): Promise<ApiResponse<User>> => {
  const response = await api.put<ApiResponse<User>>('/auth/profile', userData);
  return response.data;
};

// Token helpers
export const setAuthToken = (token: string) => {
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
};

export const clearAuthToken = () => {
  delete api.defaults.headers.common['Authorization'];
};

// Error interceptor
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    console.error('[API_ERROR]', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
    });
    if (error.response?.status === 401) {
      clearAuthToken();
      console.error('Unauthorized access - token cleared');
    }
    return Promise.reject(error);
  }
);

export default api;
