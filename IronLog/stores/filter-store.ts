import { create } from 'zustand'
import type { MuscleGroup, Equipment, Difficulty } from '@/types'

interface FilterState {
  search: string
  muscleGroups: MuscleGroup[]
  equipment: Equipment[]
  difficulty: Difficulty | null

  setSearch: (search: string) => void
  toggleMuscleGroup: (group: MuscleGroup) => void
  toggleEquipment: (equip: Equipment) => void
  setDifficulty: (difficulty: Difficulty | null) => void
  reset: () => void
}

const initialState = {
  search: '',
  muscleGroups: [] as MuscleGroup[],
  equipment: [] as Equipment[],
  difficulty: null as Difficulty | null,
}

export const useFilterStore = create<FilterState>((set) => ({
  ...initialState,

  setSearch: (search) => set({ search }),

  toggleMuscleGroup: (group) =>
    set((state) => ({
      muscleGroups: state.muscleGroups.includes(group)
        ? state.muscleGroups.filter((g) => g !== group)
        : [...state.muscleGroups, group],
    })),

  toggleEquipment: (equip) =>
    set((state) => ({
      equipment: state.equipment.includes(equip)
        ? state.equipment.filter((e) => e !== equip)
        : [...state.equipment, equip],
    })),

  setDifficulty: (difficulty) => set({ difficulty }),

  reset: () => set(initialState),
}))
