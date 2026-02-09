import { create } from "zustand";

interface StudentSelectorState {
  selectedStudentId: string | null;
  setSelectedStudent: (studentId: string | null) => void;
}

export const useStudentSelectorStore = create<StudentSelectorState>((set) => ({
  selectedStudentId: null,
  setSelectedStudent: (studentId) => set({ selectedStudentId: studentId }),
}));
