import { create } from 'zustand'

interface EmployeeSearchOverlayState {
  isOpen: boolean
  query: string
  selectedDeptId: number | undefined
  selectedEmpId: number | undefined
}

interface EmployeeSearchOverlayActions {
  open: (initialQuery?: string) => void
  close: () => void
  setQuery: (value: string) => void
  selectDept: (deptId: number) => void
  selectEmployee: (empId: number, deptId: number) => void
}

export const useEmployeeSearchOverlayStore = create<
  EmployeeSearchOverlayState & EmployeeSearchOverlayActions
>((set) => ({
  isOpen: false,
  query: '',
  selectedDeptId: undefined,
  selectedEmpId: undefined,
  open: (initialQuery) => set({ isOpen: true, query: initialQuery ?? '' }),
  close: () => set({ isOpen: false }),
  setQuery: (value) => set({ query: value }),
  selectDept: (deptId) => set({ selectedDeptId: deptId }),
  selectEmployee: (empId, deptId) => set({ selectedEmpId: empId, selectedDeptId: deptId }),
}))
