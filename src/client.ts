/**
 * Zetrafi Client - Main API Client Class
 */

import type {
  ZetrafiConfig,
  ZetrafiResponse,
  ApiKeyInfo,
  ApiKeyRequest,
  RateLimitInfo,
  Post,
  Comment,
  User,
  Game,
  Asset,
  Category,
  PaginatedResponse,
  PostListParams,
  GameListParams,
  ListParams,
  CreatePostRequest,
  CreateCommentRequest,
  UpdatePostRequest
} from './types';

import {
  ZetrafiError,
  AuthenticationError,
  RateLimitError,
  NotFoundError,
  ForbiddenError,
  IpRestrictionError
} from './errors';

const DEFAULT_BASE_URL = 'https://zuzunza.com';
const DEFAULT_TIMEOUT = 30000;
const API_VERSION = 'v1';

export class ZetrafiClient {
  private apiKey?: string;
  private baseUrl: string;
  private timeout: number;
  private customHeaders: Record<string, string>;
  private lastRateLimitInfo?: RateLimitInfo;

  constructor(config: ZetrafiConfig = {}) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || DEFAULT_BASE_URL;
    this.timeout = config.timeout || DEFAULT_TIMEOUT;
    this.customHeaders = config.headers || {};
  }

  // ============================================================
  // API Key Management
  // ============================================================

  /**
   * Request a new API key
   * @param credentials User credentials
   */
  async requestApiKey(credentials: ApiKeyRequest): Promise<ApiKeyInfo> {
    const response = await this.request<ApiKeyInfo>('/auth/api-key', {
      method: 'POST',
      body: credentials,
      requiresAuth: false
    });

    if (response.data) {
      this.apiKey = response.data.key;
    }

    return response.data!;
  }

  /**
   * Get current API key info
   */
  async getApiKeyInfo(): Promise<ApiKeyInfo> {
    const response = await this.request<ApiKeyInfo>('/auth/api-key/info');
    return response.data!;
  }

  /**
   * Revoke current API key
   */
  async revokeApiKey(): Promise<void> {
    await this.request('/auth/api-key/revoke', { method: 'DELETE' });
    this.apiKey = undefined;
  }

  /**
   * Set API key manually
   */
  setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
  }

  // ============================================================
  // Posts
  // ============================================================

  /**
   * Get posts list
   */
  async getPosts(params?: PostListParams): Promise<PaginatedResponse<Post>> {
    const response = await this.request<PaginatedResponse<Post>>('/posts', {
      params: params as Record<string, string>
    });
    return response.data!;
  }

  /**
   * Get single post
   */
  async getPost(id: string): Promise<Post> {
    const response = await this.request<Post>(`/posts/${id}`);
    return response.data!;
  }

  /**
   * Create a new post (User Action - Rate Limited)
   */
  async createPost(data: CreatePostRequest): Promise<Post> {
    const response = await this.request<Post>('/posts', {
      method: 'POST',
      body: data,
      isUserAction: true
    });
    return response.data!;
  }

  /**
   * Update a post (User Action - Rate Limited)
   */
  async updatePost(id: string, data: UpdatePostRequest): Promise<Post> {
    const response = await this.request<Post>(`/posts/${id}`, {
      method: 'PATCH',
      body: data,
      isUserAction: true
    });
    return response.data!;
  }

  /**
   * Delete a post (User Action - Rate Limited)
   */
  async deletePost(id: string): Promise<void> {
    await this.request(`/posts/${id}`, {
      method: 'DELETE',
      isUserAction: true
    });
  }

  // ============================================================
  // Comments
  // ============================================================

  /**
   * Get comments for a post
   */
  async getComments(postId: string, params?: ListParams): Promise<PaginatedResponse<Comment>> {
    const response = await this.request<PaginatedResponse<Comment>>(`/posts/${postId}/comments`, {
      params: params as Record<string, string>
    });
    return response.data!;
  }

  /**
   * Create a comment (User Action - Rate Limited)
   */
  async createComment(data: CreateCommentRequest): Promise<Comment> {
    const response = await this.request<Comment>('/comments', {
      method: 'POST',
      body: data,
      isUserAction: true
    });
    return response.data!;
  }

  /**
   * Delete a comment (User Action - Rate Limited)
   */
  async deleteComment(id: string): Promise<void> {
    await this.request(`/comments/${id}`, {
      method: 'DELETE',
      isUserAction: true
    });
  }

  // ============================================================
  // Users
  // ============================================================

  /**
   * Get user profile
   */
  async getUser(id: string): Promise<User> {
    const response = await this.request<User>(`/users/${id}`);
    return response.data!;
  }

  /**
   * Get user by username
   */
  async getUserByUsername(username: string): Promise<User> {
    const response = await this.request<User>(`/users/username/${username}`);
    return response.data!;
  }

  /**
   * Search users
   */
  async searchUsers(query: string, params?: ListParams): Promise<PaginatedResponse<User>> {
    const response = await this.request<PaginatedResponse<User>>('/users/search', {
      params: { q: query, ...params } as Record<string, string>
    });
    return response.data!;
  }

  // ============================================================
  // Games
  // ============================================================

  /**
   * Get games list
   */
  async getGames(params?: GameListParams): Promise<PaginatedResponse<Game>> {
    const response = await this.request<PaginatedResponse<Game>>('/games', {
      params: params as Record<string, string>
    });
    return response.data!;
  }

  /**
   * Get single game
   */
  async getGame(id: string): Promise<Game> {
    const response = await this.request<Game>(`/games/${id}`);
    return response.data!;
  }

  /**
   * Get game play URL (secure)
   */
  async getGamePlayUrl(id: string): Promise<{ url: string; expiresAt: string }> {
    const response = await this.request<{ url: string; expiresAt: string }>(`/games/${id}/play`);
    return response.data!;
  }

  // ============================================================
  // Categories
  // ============================================================

  /**
   * Get all categories
   */
  async getCategories(): Promise<Category[]> {
    const response = await this.request<Category[]>('/categories');
    return response.data!;
  }

  /**
   * Get category by slug
   */
  async getCategoryBySlug(slug: string): Promise<Category> {
    const response = await this.request<Category>(`/categories/slug/${slug}`);
    return response.data!;
  }

  // ============================================================
  // Assets
  // ============================================================

  /**
   * Get asset info
   */
  async getAsset(id: string): Promise<Asset> {
    const response = await this.request<Asset>(`/assets/${id}`);
    return response.data!;
  }

  // ============================================================
  // Rate Limit Info
  // ============================================================

  /**
   * Get last rate limit info from response headers
   */
  getRateLimitInfo(): RateLimitInfo | undefined {
    return this.lastRateLimitInfo;
  }

  // ============================================================
  // Internal Request Method
  // ============================================================

  private async request<T>(
    endpoint: string,
    options: {
      method?: string;
      params?: Record<string, string>;
      body?: unknown;
      requiresAuth?: boolean;
      isUserAction?: boolean;
    } = {}
  ): Promise<ZetrafiResponse<T>> {
    const {
      method = 'GET',
      params,
      body,
      requiresAuth = true,
      isUserAction = false
    } = options;

    // Build URL
    const url = new URL(`/api/zetrafi/${API_VERSION}${endpoint}`, this.baseUrl);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    // Build headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Zetrafi-Version': API_VERSION,
      ...this.customHeaders
    };

    if (requiresAuth) {
      if (!this.apiKey) {
        throw new AuthenticationError('API key is required. Use requestApiKey() or setApiKey() first.');
      }
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    if (isUserAction) {
      headers['X-User-Action'] = 'true';
    }

    // Make request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const fetchFn = typeof fetch !== 'undefined' ? fetch : (await import('node-fetch')).default;

      const response = await (fetchFn as typeof fetch)(url.toString(), {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      // Parse rate limit headers
      this.lastRateLimitInfo = this.parseRateLimitHeaders(response.headers, isUserAction);

      // Parse response
      const data = await response.json() as ZetrafiResponse<T>;

      // Handle errors
      if (!response.ok) {
        this.handleErrorResponse(response.status, data);
      }

      return data;
    } catch (error: unknown) {
      clearTimeout(timeoutId);

      if (error instanceof ZetrafiError) {
        throw error;
      }

      if (error instanceof Error && error.name === 'AbortError') {
        throw new ZetrafiError('Request timeout', 'TIMEOUT', 408);
      }

      throw new ZetrafiError(
        error instanceof Error ? error.message : 'Unknown error',
        'NETWORK_ERROR',
        0
      );
    }
  }

  private parseRateLimitHeaders(headers: Headers, isUserAction: boolean): RateLimitInfo | undefined {
    const limit = headers.get('X-RateLimit-Limit');
    const remaining = headers.get('X-RateLimit-Remaining');
    const reset = headers.get('X-RateLimit-Reset');

    if (limit && remaining && reset) {
      return {
        limit: parseInt(limit, 10),
        remaining: parseInt(remaining, 10),
        reset: parseInt(reset, 10),
        type: isUserAction ? 'user_action' : 'standard'
      };
    }

    return undefined;
  }

  private handleErrorResponse(status: number, data: ZetrafiResponse): never {
    const message = data.message || data.error || 'Unknown error';

    switch (status) {
      case 401:
        throw new AuthenticationError(message);
      case 403:
        if (data.error === 'IP_RESTRICTION') {
          throw new IpRestrictionError(message);
        }
        throw new ForbiddenError(message);
      case 404:
        throw new NotFoundError('Resource', message);
      case 429:
        const rateLimit = this.lastRateLimitInfo;
        throw new RateLimitError(
          message,
          rateLimit?.limit || 0,
          rateLimit?.remaining || 0,
          rateLimit?.reset || 0,
          rateLimit?.type || 'standard'
        );
      default:
        throw new ZetrafiError(message, data.error || 'UNKNOWN_ERROR', status);
    }
  }
}
