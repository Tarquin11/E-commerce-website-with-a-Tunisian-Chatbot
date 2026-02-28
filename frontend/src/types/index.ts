export interface Club {
  id: number;
  name: string;
  logo_url: string;
  description: string;
  country: string;
  league?: string;
  product_count: number;
}

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  image_url: string;
  category: string;
  club_id: number;
  club_name: string;
  club_logo: string;
  season: string;
  club?: Club;
  is_legendary?: boolean;
  player_slug?: string;
}

// Auth related types
export interface User {
  id: number;
  username: string;
  email: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

// Cart related types
export interface CartItem {
  productId: number;
  quantity: number;
  meta?: Record<string, any> | null;
}

export interface CartProduct {
  id: number;
  name: string;
  price: number;
  stock: number;
  image_url: string;
}

export interface CartItemWithProduct extends CartItem {
  product: CartProduct;
}

// API Response types
export interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  error?: string;
}