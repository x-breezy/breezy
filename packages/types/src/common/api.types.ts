/** A generic API response type. Narrow on `success` to get typed data or error. */
export type ApiResponse<T> =
  | { success: true; data: T; message?: string }
  | { success: false; error: string }

/** A generic paginated API response interface. */
export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
}
