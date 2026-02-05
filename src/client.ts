/**
 * Zetrafi Client - Main API Client Class
 */

import type {
  ZetrafiConfig,
  ZetrafiResponse,
  ApiKeyInfo,
  ApiKeyRequest,
  AclType,
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
  GameCloudDatabase,
  GameCloudRecord,
  GameCloudRecordList,
  GameCloudRecordListParams,
  GameCloudQueryRequest,
  GameCloudRecordUpsertRequest,
  GameCloudFunctionInfo,
  GameCloudFunctionResult,
  GameCloudUserPublic,
  CreatePostRequest,
  CreateCommentRequest,
  UpdatePostRequest,
  ZunPostRequest,
  ZunCommentRequest
} from './types';

import {
  ZetrafiError,
  AuthenticationError,
  RateLimitError,
  NotFoundError,
  ForbiddenError,
  IpRestrictionError
} from './errors';

import { ZunEncoder } from './zun';
import type { ZunArray, ZunResponse } from './zun';
import { ZunDecoder } from './zun/decoder';

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

  /**
   * Extract game ID from cloud API key
   * Returns null if not a cloud key
   */
  extractGameIdFromApiKey(apiKey?: string): string | null {
    const key = apiKey || this.apiKey;
    if (!key || !key.startsWith('zun_cloud_')) {
      return null;
    }
    const gameId = key.substring(10); // Remove 'zun_cloud_' prefix
    // Validate UUID format
    if (gameId.length === 36 && gameId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      return gameId;
    }
    return null;
  }

  /**
   * Extract user ID from user API key
   * Returns null if not a user key
   */
  extractUserIdFromApiKey(apiKey?: string): string | null {
    const key = apiKey || this.apiKey;
    if (!key || !key.startsWith('zun_user_')) {
      return null;
    }
    const userId = key.substring(9); // Remove 'zun_user_' prefix
    // Validate UUID format
    if (userId.length === 36 && userId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      return userId;
    }
    return null;
  }

  /**
   * Get ACL type from API key
   */
  getAclTypeFromApiKey(apiKey?: string): AclType | null {
    const key = apiKey || this.apiKey;
    if (!key) return null;
    if (key.startsWith('zun_admin_')) return 'admin';
    if (key.startsWith('zun_cloud_')) return 'cloud';
    if (key.startsWith('zun_user_')) return 'user';
    if (key.startsWith('zun_app_')) return 'app';
    return null;
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
    const stringParams: Record<string, string> = { q: query };
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          stringParams[key] = String(value);
        }
      });
    }
    const response = await this.request<PaginatedResponse<User>>('/users/search', {
      params: stringParams
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
  // Game Cloud
  // ============================================================

  /**
   * Get game cloud database info
   */
  async getGameCloudDatabase(gameId: string): Promise<GameCloudDatabase> {
    const response = await this.request<GameCloudDatabase>(`/game-cloud/${gameId}/database`);
    return response.data!;
  }

  /**
   * Ensure game cloud database exists
   */
  async ensureGameCloudDatabase(gameId: string, options?: { meta?: Record<string, unknown>; config?: Record<string, unknown> }): Promise<GameCloudDatabase> {
    const response = await this.request<GameCloudDatabase>(`/game-cloud/${gameId}/database`, {
      method: 'POST',
      body: options || {}
    });
    return response.data!;
  }

  /**
   * List game cloud records
   */
  async getGameCloudRecords(gameId: string, params?: GameCloudRecordListParams): Promise<GameCloudRecordList> {
    const response = await this.request<GameCloudRecordList>(`/game-cloud/${gameId}/records`, {
      params: params as Record<string, string>
    });
    return response.data!;
  }

  /**
   * Get a game cloud record by key
   */
  async getGameCloudRecord(gameId: string, key: string, collection?: string): Promise<GameCloudRecord> {
    const response = await this.request<GameCloudRecord>(`/game-cloud/${gameId}/records/${encodeURIComponent(key)}`, {
      params: collection ? { collection } : undefined
    });
    return response.data!;
  }

  /**
   * Upsert a game cloud record
   */
  async putGameCloudRecord(gameId: string, payload: GameCloudRecordUpsertRequest): Promise<GameCloudRecord> {
    const response = await this.request<GameCloudRecord>(`/game-cloud/${gameId}/records`, {
      method: 'POST',
      body: payload
    });
    return response.data!;
  }

  /**
   * Delete a game cloud record by key
   */
  async deleteGameCloudRecord(gameId: string, key: string, collection?: string): Promise<void> {
    await this.request(`/game-cloud/${gameId}/records/${encodeURIComponent(key)}`, {
      method: 'DELETE',
      params: collection ? { collection } : undefined
    });
  }

  /**
   * Query game cloud records
   */
  async queryGameCloudRecords(gameId: string, query: GameCloudQueryRequest): Promise<GameCloudRecordList> {
    const response = await this.request<GameCloudRecordList>(`/game-cloud/${gameId}/query`, {
      method: 'POST',
      body: query
    });
    return response.data!;
  }

  /**
   * List game cloud functions
   */
  async listGameCloudFunctions(gameId: string): Promise<GameCloudFunctionInfo[]> {
    const response = await this.request<GameCloudFunctionInfo[]>(`/game-cloud/${gameId}/functions`);
    return response.data!;
  }

  /**
   * Call a game cloud function
   */
  async callGameCloudFunction<T = unknown>(gameId: string, name: string, args?: Record<string, unknown>): Promise<GameCloudFunctionResult<T>> {
    const response = await this.request<GameCloudFunctionResult<T>>(`/game-cloud/${gameId}/functions/${name}`, {
      method: 'POST',
      body: { args: args || {} }
    });
    return response.data!;
  }

  /**
   * Get public user data for game cloud
   */
  async getGameCloudUser(gameId: string, userId: string): Promise<GameCloudUserPublic> {
    const response = await this.request<GameCloudUserPublic>(`/game-cloud/${gameId}/users/${userId}`);
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
  // ZUN Protocol - Game Cloud API
  // ============================================================

  /**
   * Get game cloud database (ZUN protocol)
   */
  async zunGetGameCloudDatabase(gameId: string): Promise<GameCloudDatabase> {
    const response = await this.zunRequest(`/game-cloud/${gameId}/database`, []);
    if (!response.data || response.data.length === 0) {
      throw new ZetrafiError('Failed to get game cloud database', 'ZUN_REQUEST_FAILED', 500);
    }
    return response.data[0] as unknown as GameCloudDatabase;
  }

  /**
   * Ensure game cloud database exists (ZUN protocol)
   */
  async zunEnsureGameCloudDatabase(
    gameId: string,
    options?: { meta?: Record<string, unknown>; config?: Record<string, unknown> }
  ): Promise<GameCloudDatabase> {
    const requestData: ZunArray = options ? [options as unknown as ZunArray[0]] : [];
    const response = await this.zunRequest(`/game-cloud/${gameId}/database`, requestData);
    if (!response.data || response.data.length === 0) {
      throw new ZetrafiError('Failed to ensure game cloud database', 'ZUN_REQUEST_FAILED', 500);
    }
    return response.data[0] as unknown as GameCloudDatabase;
  }

  /**
   * Get game cloud records (ZUN protocol)
   */
  async zunGetGameCloudRecords(
    gameId: string,
    params?: GameCloudRecordListParams
  ): Promise<GameCloudRecordList> {
    const requestData: ZunArray = params ? [params as unknown as ZunArray[0]] : [];
    const response = await this.zunRequest(`/game-cloud/${gameId}/records`, requestData);
    if (!response.data || response.data.length === 0) {
      throw new ZetrafiError('Failed to get game cloud records', 'ZUN_REQUEST_FAILED', 500);
    }
    return response.data[0] as unknown as GameCloudRecordList;
  }

  /**
   * Upsert game cloud record (ZUN protocol)
   */
  async zunPutGameCloudRecord(
    gameId: string,
    payload: GameCloudRecordUpsertRequest
  ): Promise<GameCloudRecord> {
    const requestData: ZunArray = [payload as unknown as ZunArray[0]];
    const response = await this.zunRequest(`/game-cloud/${gameId}/records`, requestData);
    if (!response.data || response.data.length === 0) {
      throw new ZetrafiError('Failed to upsert game cloud record', 'ZUN_REQUEST_FAILED', 500);
    }
    return response.data[0] as unknown as GameCloudRecord;
  }

  /**
   * Query game cloud records (ZUN protocol)
   */
  async zunQueryGameCloudRecords(
    gameId: string,
    query: GameCloudQueryRequest
  ): Promise<GameCloudRecordList> {
    const requestData: ZunArray = [query as unknown as ZunArray[0]];
    const response = await this.zunRequest(`/game-cloud/${gameId}/query`, requestData);
    if (!response.data || response.data.length === 0) {
      throw new ZetrafiError('Failed to query game cloud records', 'ZUN_REQUEST_FAILED', 500);
    }
    return response.data[0] as unknown as GameCloudRecordList;
  }

  // ============================================================
  // ZUN Protocol - Posts API
  // ============================================================

  /**
   * Get posts list (ZUN protocol)
   */
  async zunGetPosts(params?: { limit?: number; offset?: number }): Promise<{ items: Post[]; total: number; limit: number; offset: number }> {
    const requestData: ZunArray = params ? [params as unknown as ZunArray[0]] : [];
    const response = await this.zunRequest('/posts', requestData);
    if (!response.data || response.data.length === 0) {
      throw new ZetrafiError('Failed to get posts', 'ZUN_REQUEST_FAILED', 500);
    }
    return response.data[0] as unknown as { items: Post[]; total: number; limit: number; offset: number };
  }

  /**
   * Create post (ZUN protocol - restricted write rate limited)
   */
  async zunCreatePost(data: ZunPostRequest): Promise<Post> {
    const requestData: ZunArray = [data as unknown as ZunArray[0]];
    const response = await this.zunRequest('/posts', requestData);
    if (!response.data || response.data.length === 0) {
      throw new ZetrafiError('Failed to create post', 'ZUN_REQUEST_FAILED', 500);
    }
    return response.data[0] as unknown as Post;
  }

  /**
   * Update post (ZUN protocol - only own posts for user ACL)
   */
  async zunUpdatePost(postId: string, data: ZunPostRequest): Promise<Post> {
    const requestData: ZunArray = [data as unknown as ZunArray[0]];
    const response = await this.zunRequest(`/posts/${postId}`, requestData);
    if (!response.data || response.data.length === 0) {
      throw new ZetrafiError('Failed to update post', 'ZUN_REQUEST_FAILED', 500);
    }
    return response.data[0] as unknown as Post;
  }

  /**
   * Delete post (ZUN protocol - only own posts for user ACL)
   */
  async zunDeletePost(postId: string): Promise<void> {
    const response = await this.zunRequest(`/posts/${postId}`, []);
    if (!response.data || response.data.length === 0) {
      throw new ZetrafiError('Failed to delete post', 'ZUN_REQUEST_FAILED', 500);
    }
  }

  /**
   * Create comment (ZUN protocol - rate limited: 4 per hour for user ACL)
   */
  async zunCreateComment(postId: string, data: ZunCommentRequest): Promise<Comment> {
    const requestData: ZunArray = [data as unknown as ZunArray[0]];
    const response = await this.zunRequest(`/posts/${postId}/comments`, requestData);
    if (!response.data || response.data.length === 0) {
      throw new ZetrafiError('Failed to create comment', 'ZUN_REQUEST_FAILED', 500);
    }
    return response.data[0] as unknown as Comment;
  }

  // ============================================================
  // ZUN Protocol
  // ============================================================

  /**
   * Send a ZUN protocol request
   * @param endpoint ZUN endpoint path
   * @param data ZUN array to send
   * @returns ZUN response with data and optional traceback
   */
  async zunRequest(endpoint: string, data: ZunArray): Promise<ZunResponse> {
    if (!this.apiKey) {
      throw new AuthenticationError('API key is required for ZUN protocol. Use setApiKey() first.');
    }

    // Build URL
    const url = new URL(endpoint, this.baseUrl);

    // Encode request data
    const requestBuffer = ZunEncoder.encodeArray(data);

    // Build headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/octet-stream',
      'Authorization': `Bearer ${this.apiKey}`,
      ...this.customHeaders
    };

    // Make request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      let fetchFn: typeof fetch;
      if (typeof fetch !== 'undefined') {
        fetchFn = fetch;
      } else {
        try {
          // @ts-ignore - node-fetch is a peer dependency, types may not be available
          // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-explicit-any
          const nodeFetch = await import('node-fetch') as any;
          if (!nodeFetch || !nodeFetch.default) {
            throw new ZetrafiError(
              'fetch is not available. Install node-fetch or use a fetch polyfill.',
              'FETCH_NOT_AVAILABLE',
              0
            );
          }
          fetchFn = nodeFetch.default;
        } catch {
          throw new ZetrafiError(
            'fetch is not available. Install node-fetch or use a fetch polyfill.',
            'FETCH_NOT_AVAILABLE',
            0
          );
        }
      }

      // Convert Uint8Array to ArrayBuffer for fetch body
      const bodyBuffer = requestBuffer.buffer.slice(
        requestBuffer.byteOffset, 
        requestBuffer.byteOffset + requestBuffer.byteLength
      ) as ArrayBuffer;

      const response = await (fetchFn as typeof fetch)(url.toString(), {
        method: 'POST',
        headers,
        body: bodyBuffer,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      // Handle 403 - Invalid API key (empty array response)
      if (response.status === 403) {
        const responseBuffer = await response.arrayBuffer();
        const responseArray = ZunDecoder.decode(new Uint8Array(responseBuffer));
        
        if (Array.isArray(responseArray) && responseArray.length === 0) {
          throw new ForbiddenError('Invalid API key or access denied');
        }
        
        throw new ForbiddenError('Access denied');
      }

      // Handle 200 - Success
      if (response.status === 200) {
        const responseBuffer = await response.arrayBuffer();
        const zunResponse = ZunDecoder.decodeResponse(new Uint8Array(responseBuffer));
        
        // Check if response is empty (failure)
        if (!zunResponse.data || zunResponse.data.length === 0) {
          // If traceback exists, it's a runtime error
          if (zunResponse.traceback && zunResponse.traceback.length > 0) {
            const errorMessage = zunResponse.traceback.map((v: unknown) => String(v)).join('\n');
            throw new ZetrafiError(
              `ZUN runtime error: ${errorMessage}`,
              'ZUN_RUNTIME_ERROR',
              500,
              { traceback: zunResponse.traceback }
            );
          }
          // Otherwise, it's a general failure
          throw new ZetrafiError('ZUN request failed', 'ZUN_REQUEST_FAILED', 500);
        }
        
        return zunResponse;
      }

      // Handle other status codes
      throw new ZetrafiError(
        `Unexpected status code: ${response.status}`,
        'ZUN_ERROR',
        response.status
      );
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
      let fetchFn: typeof fetch;
      if (typeof fetch !== 'undefined') {
        fetchFn = fetch;
      } else {
        try {
          // @ts-ignore - node-fetch is a peer dependency, types may not be available
          // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-explicit-any
          const nodeFetch = await import('node-fetch') as any;
          if (!nodeFetch || !nodeFetch.default) {
            throw new ZetrafiError(
              'fetch is not available. Install node-fetch or use a fetch polyfill.',
              'FETCH_NOT_AVAILABLE',
              0
            );
          }
          fetchFn = nodeFetch.default;
        } catch {
          throw new ZetrafiError(
            'fetch is not available. Install node-fetch or use a fetch polyfill.',
            'FETCH_NOT_AVAILABLE',
            0
          );
        }
      }

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
    const typeHeader = headers.get('X-RateLimit-Type');

    if (limit && remaining && reset) {
      let type: RateLimitInfo['type'] = isUserAction ? 'user_action' : 'standard';
      if (typeHeader) {
        if (typeHeader === 'comment_write' || typeHeader === 'restricted_write') {
          type = typeHeader;
        }
      }
      return {
        limit: parseInt(limit, 10),
        remaining: parseInt(remaining, 10),
        reset: parseInt(reset, 10),
        type
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
