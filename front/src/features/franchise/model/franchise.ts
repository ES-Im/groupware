import type { RegisterDomainIdResponse } from '@/shared/api/registerDomainIdResponse'

export interface Franchise {
  id: number
  name: string
  address: string
  ownerName: string
  BusinessStatus: string
  managerEmpId: number
  managerEmpName: string
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

export type FranchisesPage = Page<Franchise>

export interface AssignableManager {
  empId: number
  empName: string
}

export const BUSINESS_STATUS_CODES = [
  'OPEN',
  'CLOSED',
  'PRE_OPEN',
  'TEMP_CLOSED',
  'READY_TO_OPEN',
] as const

export type BusinessStatusCode = (typeof BUSINESS_STATUS_CODES)[number]

export const BUSINESS_STATUS_LABEL: Record<BusinessStatusCode, string> = {
  OPEN: '정상 영업 중',
  CLOSED: '폐업',
  PRE_OPEN: '가오픈',
  TEMP_CLOSED: '일시 영업 중단',
  READY_TO_OPEN: '영업 준비 상태',
}

const BUSINESS_STATUS_BY_LABEL: Record<string, BusinessStatusCode> = Object.fromEntries(
  BUSINESS_STATUS_CODES.map((code) => [BUSINESS_STATUS_LABEL[code], code]),
)

export function resolveBusinessStatusCode(displayName: string): BusinessStatusCode | undefined {
  return BUSINESS_STATUS_BY_LABEL[displayName]
}

export interface FranchiseDetail {
  id: number
  name: string
  address: string
  ownerName: string
  businessNumber: string
  contactNumber: string
  contactEmail: string
  BusinessStatus: string
  memo: string
  managerEmpId: number
  managerEmpName: string
}

export interface FranchiseCreateRequest {
  businessNumber: string
  franchiseName: string
  address: string
  ownerName: string
  contactNumber: string
  contactEmail: string
  managerEmpId?: number
}

export type FranchiseCreateResponse = RegisterDomainIdResponse

export interface FranchiseEducationCalendarItem {
  id: number
  date: string
  place: string
  title: string
  isFull: boolean
  isActive: boolean
}

export interface FranchiseEducationFileInfo {
  fileId: number
  originalName: string
  extension: string
  fileSize: number
}

export interface FranchiseEducationDetail {
  id: number
  date: string
  startAt: string
  place: string
  title: string
  content: string
  appliedCount: number
  capacity: number
  remainingCapacity: number
  isActive: boolean
  fileListInfoList: FranchiseEducationFileInfo[] | null
}

export interface FranchiseEducationApplicant {
  applicationId: number
  externalId: string
  franchiseId: number
  franchiseName: string
  contactNumber: string
  contactEmail: string
  appliedCount: number
  appliedAt: string
}

export type FranchiseEducationApplicantsPage = Page<FranchiseEducationApplicant>

export interface FranchiseEducationCreateRequest {
  educationDate: string
  place: string
  title: string
  content: string
  capacity: number
}

export type FranchiseEducationCreateResponse = RegisterDomainIdResponse

export interface FranchiseInquiry {
  inquiryId: number
  externalId: string
  franchiseId: number
  franchiseName: string
  inquiryTitle: string
  inquiryAt: string
  isAnswered: boolean
  assignedManagerId: number | null
  assignedManagerName: string | null
  isDeleted: boolean
}

export type FranchiseInquiriesPage = Page<FranchiseInquiry>

export interface FranchiseInquiryDetail {
  inquiryId: number
  externalId: string
  franchiseId: number
  franchiseName: string
  inquirerContact: string
  inquiryAt: string
  inquiryTitle: string
  inquiryContent: string
  assignedManagerId: number | null
  assignedManagerName: string | null
  isDeleted: boolean
}

export interface FranchiseInquiryAnswer {
  answerId: number
  content: string
  isSubmitted: boolean
  answeredAt: string
  answeredEmpId: number
  answeredEmpName: string
}

export interface FranchiseMonthlySalesPoint {
  salesMonth: number
  salesAmount: number
  orderCount: number
}

export interface FranchiseYearlySales {
  franchiseId: number
  franchiseName: string
  salesYear: number
  totalSalesAmount: number
  totalOrderCount: number
  averageSalesAmount: number
  averageOrderAmount: number
  salesMonths: number
  monthlySales: FranchiseMonthlySalesPoint[]
}

export interface FranchiseDailySales {
  franchiseId: number
  franchiseName: string
  salesDate: string
  salesAmount: number
  orderCount: number
}

export interface FranchiseDailySalesPoint {
  salesDate: number
  salesAmount: number
  orderCount: number
}

export interface FranchiseMonthlySales {
  franchiseId: number
  franchiseName: string
  salesMonth: number
  totalSalesAmount: number
  totalOrderCount: number
  averageOrderAmount: number
  averageDailySalesAmount: number
  salesDays: number
  dailySales: FranchiseDailySalesPoint[]
}
