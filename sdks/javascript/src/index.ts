import axios, { AxiosInstance, AxiosResponse } from 'axios';

export interface WhatsYourInfoConfig {
  apiKey?: string;
  baseURL?: string;
  timeout?: number;
}

export interface PublicProfile {
  username: string;
  firstName: string;
  lastName: string;
  bio: string;
  avatar: string;
  isProUser: boolean;
  customDomain?: string;
  socialLinks: {
    twitter?: string;
    linkedin?: string;
    github?: string;
    website?: string;
  };
  spotlightButton?: {
    text: string;
    url: string;
    color: string;
  };
  createdAt: string;
  profileUrl: string;
  subdomainUrl: string;
}

export interface AuthUser {
  _id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  isProUser: boolean;
}

export interface LoginResponse {
  message: string;
  user: AuthUser;
  token?: string;
}

export class WhatsYourInfoSDK {
  private client: AxiosInstance;
  private apiKey?: string;

  constructor(config: WhatsYourInfoConfig = {}) {
    this.apiKey = config.apiKey;
    
    this.client = axios.create({
      baseURL: config.baseURL || 'https://whatsyour.info/api',
      timeout: config.timeout || 10000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': '@whatsyour/info-js/1.0.0',
        ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` })
      }
    });
  }

  // Public API Methods
  async getProfile(username: string): Promise<PublicProfile> {
    try {
      const response: AxiosResponse<PublicProfile> = await this.client.get(
        `/public/profile/${username}`
      );
      return response.data;
    } catch (error: any) {
      throw new Error(`Failed to fetch profile: ${error.response?.data?.error || error.message}`);
    }
  }

  async searchProfiles(query: string, limit: number = 10): Promise<PublicProfile[]> {
    try {
      const response: AxiosResponse<{ profiles: PublicProfile[] }> = await this.client.get(
        `/public/search?q=${encodeURIComponent(query)}&limit=${limit}`
      );
      return response.data.profiles;
    } catch (error: any) {
      throw new Error(`Failed to search profiles: ${error.response?.data?.error || error.message}`);
    }
  }

  // Authentication Methods (requires API key)
  async authenticateUser(email: string, password: string): Promise<LoginResponse> {
    this.requireApiKey();
    
    try {
      const response: AxiosResponse<LoginResponse> = await this.client.post('/auth/login', {
        email,
        password
      });
      return response.data;
    } catch (error: any) {
      throw new Error(`Authentication failed: ${error.response?.data?.error || error.message}`);
    }
  }

  async verifyToken(token: string): Promise<AuthUser> {
    this.requireApiKey();
    
    try {
      const response: AxiosResponse<{ user: AuthUser }> = await this.client.get('/auth/verify', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return response.data.user;
    } catch (error: any) {
      throw new Error(`Token verification failed: ${error.response?.data?.error || error.message}`);
    }
  }

  async getUserProfile(token: string): Promise<AuthUser> {
    this.requireApiKey();
    
    try {
      const response: AxiosResponse<{ user: AuthUser }> = await this.client.get('/auth/user', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return response.data.user;
    } catch (error: any) {
      throw new Error(`Failed to get user profile: ${error.response?.data?.error || error.message}`);
    }
  }

  // OAuth Methods
  async createOAuthURL(clientId: string, redirectUri: string, state?: string): string {
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'profile email',
      ...(state && { state })
    });

    return `https://whatsyour.info/oauth/authorize?${params.toString()}`;
  }

  async exchangeCodeForToken(clientId: string, clientSecret: string, code: string, redirectUri: string): Promise<{ access_token: string; user: AuthUser }> {
    try {
      const response = await this.client.post('/oauth/token', {
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      });
      return response.data;
    } catch (error: any) {
      throw new Error(`Token exchange failed: ${error.response?.data?.error || error.message}`);
    }
  }

  // Utility Methods
  private requireApiKey(): void {
    if (!this.apiKey) {
      throw new Error('API key is required for this operation. Get your API key at https://whatsyour.info/dev');
    }
  }

  // Static helper methods
  static generateProfileURL(username: string): string {
    return `https://whatsyour.info/${username}`;
  }

  static generateSubdomainURL(username: string): string {
    return `https://${username}.whatsyour.info`;
  }

  static generateAvatarURL(username: string, size: number = 200): string {
    return `https://whatsyour.info/api/avatars/${username}?size=${size}`;
  }
}

export default WhatsYourInfoSDK;