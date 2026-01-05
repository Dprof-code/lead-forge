import { create } from "zustand";
import { JobStatus, JobType } from "@/types";

interface Job {
  id: string;
  type: JobType;
  status: JobStatus;
  progress: number;
  total?: number;
  createdAt: Date;
  updatedAt: Date;
}

interface JobStore {
  jobs: Job[];
  activeJob: Job | null;
  addJob: (job: Job) => void;
  updateJob: (id: string, updates: Partial<Job>) => void;
  removeJob: (id: string) => void;
  setActiveJob: (job: Job | null) => void;
}

export const useJobStore = create<JobStore>((set) => ({
  jobs: [],
  activeJob: null,
  addJob: (job) => set((state) => ({ jobs: [...state.jobs, job] })),
  updateJob: (id, updates) =>
    set((state) => ({
      jobs: state.jobs.map((job) =>
        job.id === id ? { ...job, ...updates } : job
      ),
    })),
  removeJob: (id) =>
    set((state) => ({ jobs: state.jobs.filter((job) => job.id !== id) })),
  setActiveJob: (job) => set({ activeJob: job }),
}));
