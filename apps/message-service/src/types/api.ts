/** A generic paginated API response interface. */
export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
}
