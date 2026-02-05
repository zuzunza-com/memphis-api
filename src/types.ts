/**
 * Zetrafi Type Definitions
 */

export interface ZetrafiConfig {
  /** API Key for authentication */
  apiKey?: string;
  /** Base URL (default: https://zuzunza.com) */
  baseUrl?: string;
  /** Request timeout in ms (default: 30000) */
  timeout?: number;
  /** Custom headers */
  headers?: Record<string, string>;
}

export interface ZetrafiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  meta?: ResponseMeta;
}

export interface ResponseMeta {
  page?: number;
  perPage?: number;
  total?: number;
  totalPages?: number;
  rateLimit?: RateLimitInfo;
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number;
  type: 'standard' | 'user_action' | 'comment_write' | 'restricted_write';
}

export type AclType = 'app' | 'cloud' | 'user' | 'admin';

export interface ApiKeyInfo {
  key: string;
  userId: string;
  permissions: string[];
  aclType?: AclType;
  rateLimit: {
    standard: number;
    userAction: number;
  };
  createdAt: string;
  expiresAt: string | null;
}

export interface ApiKeyRequest {
  email: string;
  password: string;
  name?: string;
  permissions?: string[];
  aclType?: AclType;
  gameId?: string; // Required for 'cloud' ACL type
}

// Resource Types

export interface User {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
  bio?: string;
  createdAt: string;
  stats?: UserStats;
}

export interface UserStats {
  posts: number;
  comments: number;
  likes: number;
  followers: number;
  following: number;
}

export interface Post {
  id: string;
  title: string;
  content?: string;
  excerpt?: string;
  authorId: string;
  author?: User;
  categoryId: string;
  tags?: string[];
  thumbnailUrl?: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  author?: User;
  content: string;
  parentId?: string;
  likeCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Game {
  id: string;
  title: string;
  description?: string;
  authorId: string;
  author?: User;
  type: 'swf' | 'html5' | 'unity';
  thumbnailUrl?: string;
  gameUrl?: string;
  playCount: number;
  likeCount: number;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Asset {
  id: string;
  name: string;
  type: 'image' | 'audio' | 'video' | 'other';
  url: string;
  size: number;
  mimeType: string;
  ownerId: string;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string;
  postCount: number;
}

// Paginated Response
export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}

// Query Parameters
export interface ListParams {
  page?: number;
  perPage?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface PostListParams extends ListParams {
  categoryId?: string;
  authorId?: string;
  tag?: string;
  search?: string;
}

export interface GameListParams extends ListParams {
  type?: 'swf' | 'html5' | 'unity';
  authorId?: string;
  tag?: string;
  search?: string;
}

// Game Cloud
export interface GameCloudDatabase {
  gameId: string;
  ownerUserId?: string | null;
  meta?: Record<string, unknown> | null;
  config?: Record<string, unknown> | null;
  recordCount?: number;
  createdAt: string;
  updatedAt?: string | null;
}

export interface GameCloudRecord {
  id: string;
  gameId: string;
  collection: string;
  key: string;
  data: Record<string, unknown>;
  createdBy?: string | null;
  updatedBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface GameCloudRecordList {
  items: GameCloudRecord[];
  total: number;
  limit: number;
  offset: number;
}

export interface GameCloudRecordListParams {
  collection?: string;
  key?: string;
  keyPrefix?: string;
  limit?: number;
  offset?: number;
  orderBy?: 'created_at' | 'updated_at' | 'key';
  order?: 'asc' | 'desc';
}

export type GameCloudFilterOperator =
  | 'eq'
  | 'neq'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'ilike'
  | 'in'
  | 'contains';

export interface GameCloudQueryFilter {
  field: string;
  op: GameCloudFilterOperator;
  value: string | number | boolean | Array<string | number | boolean> | Record<string, unknown>;
}

export interface GameCloudQueryRequest {
  collection?: string;
  filters?: GameCloudQueryFilter[];
  limit?: number;
  offset?: number;
  orderBy?: 'created_at' | 'updated_at' | 'key';
  order?: 'asc' | 'desc';
}

export interface GameCloudRecordUpsertRequest {
  collection?: string;
  key: string;
  data: Record<string, unknown>;
}

export interface GameCloudFunctionInfo {
  name: string;
  description?: string | null;
  readOnly: boolean;
}

export interface GameCloudFunctionResult<T = unknown> {
  result: T;
}

export interface GameCloudUserPublic {
  id: string;
  displayName?: string | null;
  nickname?: string | null;
  level?: number | null;
  avatar?: string | null;
}

// Write Actions (Rate Limited - 10/hour per IP)
export interface CreatePostRequest {
  title: string;
  content: string;
  categoryId: string;
  tags?: string[];
  thumbnailUrl?: string;
}

export interface CreateCommentRequest {
  postId: string;
  content: string;
  parentId?: string;
}

export interface UpdatePostRequest {
  title?: string;
  content?: string;
  categoryId?: string;
  tags?: string[];
  thumbnailUrl?: string;
}

// ZUN Protocol Request/Response Types
export interface ZunPostRequest {
  title?: string;
  content?: string;
  tags?: string[];
}

export interface ZunCommentRequest {
  text: string;
  isSecret?: boolean;
}
