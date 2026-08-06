export interface CategoryItem {
  categoryId: number
  categoryName: string
  isVisible: boolean
}

export interface Page<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
  numberOfElements: number
  first: boolean
  last: boolean
  empty: boolean
}

export type CategoryManagementPage = Page<CategoryItem>
