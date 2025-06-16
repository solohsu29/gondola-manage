import { create } from "zustand"

import type { Project, Gondola, Document, DeliveryOrder, ShiftHistory} from '../types';
import type { Inspection } from '../types/inspection';

interface Certificate {
  id: number;
  title: string;
  gondolaId?: string;
  status: string;
  expiryDate: string;
  serialNumber:string
  expiry?:string
  projectName?:string
}

interface ProjectManager {
  id: number;
  name: string;
  email?: string;
  phone?: string;
}

interface RentalDetail {
  id: string;
  gondolaId: string;
  startDate?: string;
  endDate?: string;
  currentStatus?: string;
  contractNumber?: string;
  clientName?: string;
  projectName?: string;
  dailyRate?: number;
  monthlyRate?: number;
  billingCycle?: string;
  lastBillingDate?: string;
  nextBillingDate?: string;
  totalRentalDays?: number;
  totalAmount?: number;
  outstandingAmount?: number;
  paymentStatus?: string;
  securityDeposit?: number;
  depositStatus?: string;
  gondola?:Gondola[]
  projects?:Project[]

}

interface BillingHistory {
  id: string;
  gondolaId: string;
  startDate?: string;
  endDate?: string;
  paidDate?: string;
  invoiceDate?: string;
  // Add other fields as needed
}

interface OrientationSession {
  id: string;
  gondola_id: string;
  session_type: string;
  date: string;
  time:string;
  notes?: string;
  conducted_by?: string;
  instructor?:string;
  max_participants?:number
  duration?:number
  location?:string
}

interface AppState {
  // Profile
  profileData: any | null;
  profileLoading: boolean;
  profileError: string | null;
  fetchProfile: () => Promise<void>;
  updateProfile: (profile: any) => Promise<void>;

  updateOrientationSession: (gondolaId: string, sessionId: string, session: Partial<OrientationSession>) => Promise<boolean>; // ADDED
  createOrientationSession: (gondolaId: string, session: Omit<OrientationSession, 'id' | 'gondola_id'>) => Promise<boolean>;
  fetchShiftHistoryByGondolaId: (gondolaId: string) => Promise<void>;
  fetchRentalDetailsByGondolaId: (gondolaId: string) => Promise<void>;
  updateInspection: (inspection: Inspection) => Promise<boolean>;
  fetchInspectionsByGondolaId: (gondolaId: string) => Promise<Inspection[] | null>;
  inspections: Inspection[];
  inspectionsLoading: boolean;
  inspectionsError: string | null;
  fetchDocumentsByGondolaId: (gondolaId: string) => Promise<Document[] | null>;
  fetchGondolaById: (id: string) => Promise<Gondola | null>; // NEW: fetch single gondola by id
  updateGondolaAsync?: (id: string, gondola: Partial<Gondola>) => Promise<void>;
  deleteGondolaAsync?: (id: string) => Promise<void>;
  projects: Project[]
  gondolas: Gondola[]
  documents: Document[]
  deliveryOrders: DeliveryOrder[]
  shiftHistory: ShiftHistory[]
  rentalDetails: {
    rentalDetail: RentalDetail | null;
    billingHistory: BillingHistory[];
    gondola:Gondola[];
    projects:Project[]
  } | null;
  rentalDetailsLoading: boolean;
  rentalDetailsError: string | null;
  certificates: Certificate[]
  projectManagers: ProjectManager[];
  projectManagersLoading: boolean;
  projectManagersError: string | null;
  // Loading and error state for each entity
  projectsLoading: boolean;
  projectsError: string | null;
  gondolasLoading: boolean;
  gondolasError: string | null;
  documentsLoading: boolean;
  documentsError: string | null;
  deliveryOrdersLoading: boolean;
  deliveryOrdersError: string | null;
  shiftHistoryLoading: boolean;
  shiftHistoryError: string | null;
  certificatesLoading: boolean;
  certificatesError: string | null;
  activeProjectId: string | null
  setActiveProjectId: (id: string | null) => void
  addProject: (project:any) => Promise<void>
  updateProject: (id: string, project: any) => Promise<void>,
  addGondola: (gondola: Gondola) => void
  updateGondola: (id: string, gondola: Partial<Gondola>) => void
  addDocument: (document: Document) => void
  updateDocument: (id: string, document: Partial<Document>) => void
  addDeliveryOrder: (deliveryOrder: DeliveryOrder) => void
  updateDeliveryOrder: (id: string, deliveryOrder: Partial<DeliveryOrder>) => void
  linkDeliveryOrderToProject: (doId: string, projectId: string) => void
  addShiftHistory: (shift: ShiftHistory) => void
  shiftGondola: (
    gondolaId: string,
    newLocation: string,
    newLocationDetail: string,
    reason: string,
    notes?: string,
  ) => void
  fetchAllData:()=>Promise<void>
  fetchProjects:()=>Promise<void>
  fetchGondolas:()=>Promise<void>
  fetchDocuments:(projectId: string)=>Promise<void>
  fetchDeliveryOrders:()=>Promise<void>
  fetchShiftHistory:()=>Promise<void>
  fetchCertificates:()=>Promise<void>
  fetchProjectManagers:()=>Promise<void>
  // Orientation sessions
  orientationSessions: OrientationSession[];
  orientationSessionsLoading: boolean;
  orientationSessionsError: string | null;
  fetchOrientationSessionsByGondolaId: (gondolaId: string) => Promise<OrientationSession[] | null>;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Profile State
  profileData: null,
  profileLoading: false,
  profileError: null,

  // Fetch profile data from API
  fetchProfile: async () => {
    set({ profileLoading: true, profileError: null });
    try {
      const res = await fetch('/api/profile');
      if (!res.ok) throw new Error('Failed to fetch profile');
      const data = await res.json();
      set({ profileData: data, profileLoading: false });
    } catch (error: any) {
      set({ profileError: error.message || 'Failed to fetch profile', profileLoading: false });
    }
  },

  // Update profile data via API
  updateProfile: async (profile: any) => {
    set({ profileLoading: true, profileError: null });
    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });
      if (!res.ok) throw new Error('Failed to update profile');
      const data = await res.json();
      set({ profileData: data, profileLoading: false });
    } catch (error: any) {
      set({ profileError: error.message || 'Failed to update profile', profileLoading: false });
    }
  },

  updateOrientationSession: async (gondolaId, sessionId, session) => {
    set({ orientationSessionsLoading: true, orientationSessionsError: null });
    try {
      const res = await fetch(`/api/gondola/${gondolaId}/orientation-sessions/${sessionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({gondolaId,sessionId,...session}),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to update orientation session');
      await get().fetchOrientationSessionsByGondolaId(gondolaId);
      set({ orientationSessionsLoading: false });
      return true;
    } catch (error: any) {
      set({ orientationSessionsError: error.message || 'Failed to update orientation session', orientationSessionsLoading: false });
      return false;
    }
  },
  createOrientationSession: async (gondolaId, session) => {
    set({ orientationSessionsLoading: true, orientationSessionsError: null });
    try {
      const res = await fetch(`/api/gondola/${gondolaId}/orientation-sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(session),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to create orientation session');
      await get().fetchOrientationSessionsByGondolaId(gondolaId);
      set({ orientationSessionsLoading: false });
      return true;
    } catch (error: any) {
      set({ orientationSessionsError: error.message || 'Failed to create orientation session', orientationSessionsLoading: false });
      return false;
    }
  },
  fetchOrientationSessionsByGondolaId: async (gondolaId: string) => {
    set({ orientationSessionsLoading: true, orientationSessionsError: null });
    try {
      const res = await fetch(`/api/gondola/${gondolaId}/orientation-sessions`);
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to fetch orientation sessions');
      const data = await res.json();
      set({ orientationSessions: data, orientationSessionsLoading: false });
      return data;
    } catch (error: any) {
      set({ orientationSessionsError: error.message || 'Failed to fetch orientation sessions', orientationSessionsLoading: false });
      return null;
    }
  },

  updateInspection: async (inspection: Inspection) => {
    const { gondolaId, id, ...updated } = inspection;
    set({ inspectionsLoading: true, inspectionsError: null });
    try {
      const res = await fetch(`/api/gondola/${gondolaId}/inspections/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to update inspection');
      await get().fetchInspectionsByGondolaId(gondolaId);
      set({ inspectionsLoading: false });
      return true;
    } catch (error: any) {
      set({ inspectionsError: error.message || 'Failed to update inspection', inspectionsLoading: false });
      return false;
    }
  },
  fetchInspectionsByGondolaId: async (gondolaId: string) => {
    set({ inspectionsLoading: true, inspectionsError: null });
    try {
      const res = await fetch(`/api/gondola/${gondolaId}/inspections`);
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to fetch inspections');
      const data = await res.json();
      set({ inspections: data, inspectionsLoading: false });
      return data;
    } catch (error: any) {
      set({ inspectionsError: error.message || 'Failed to fetch inspections', inspectionsLoading: false });
      return null;
    }
  },
  fetchDocumentsByGondolaId: async (gondolaId: string) => {
    set({ documentsLoading: true, documentsError: null });
    try {
      const res = await fetch(`/api/gondola/${gondolaId}/documents`);
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to fetch documents');
      const docs = await res.json();
      set({ documents: docs, documentsLoading: false });
      return docs;
    } catch (error: any) {
      set({ documentsError: error.message || 'Failed to fetch documents', documentsLoading: false });
      return null;
    }
  },
  fetchGondolaById: async (id: string) => {
    set({ gondolasLoading: true, gondolasError: null });
    try {
      const res = await fetch(`/api/gondola/${id}`);
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to fetch gondola');
      const data = await res.json();
      set({ gondolasLoading: false });
      return data as Gondola;
    } catch (err: any) {
      set({ gondolasError: err.message || 'Error', gondolasLoading: false });
      return null;
    }
  },
  fetchProjectManagers: async () => {
    set({ projectManagersLoading: true, projectManagersError: null });
    try {
      const res = await fetch('/api/project-manager');
      if (!res.ok) throw new Error('Failed to fetch project managers');
      const data = await res.json();
      set({ projectManagers: data, projectManagersLoading: false });
    } catch (err: any) {
      set({ projectManagersError: err.message || 'Error', projectManagersLoading: false });
    }
  },
  projects: [],
  gondolas: [],
  documents: [],
  deliveryOrders: [],
  shiftHistory: [],
  rentalDetails: null,
  rentalDetailsLoading: false,
  rentalDetailsError: null,
  certificates: [],
  inspections: [],
  inspectionsLoading: false,
  inspectionsError: null,
  projectManagers: [],
  projectManagersLoading: false,
  projectManagersError: null,
  orientationSessions: [],
  orientationSessionsLoading: false,
  orientationSessionsError: null,
  // Loading and error state for each entity
  projectsLoading: false,
  projectsError: null,
  gondolasLoading: false,
  gondolasError: null,
  documentsLoading: false,
  documentsError: null,
  deliveryOrdersLoading: false,
  deliveryOrdersError: null,
  shiftHistoryLoading: false,
  shiftHistoryError: null,
  certificatesLoading: false,
  certificatesError: null,
  activeProjectId: null,

  // Fetch all data from backend APIs and hydrate state
  fetchAllData: async () => {
    await Promise.all([
      get().fetchProjects(),
      get().fetchGondolas(),
      get().fetchDeliveryOrders(),
      get().fetchShiftHistory(),
      get().fetchCertificates(),
    ]);
  },

  fetchProjects: async () => {
    set({ projectsLoading: true, projectsError: null });
    try {
      const res = await fetch("/api/project");
      if (!res.ok) throw new Error(`Failed to fetch projects (${res.status})`);
      const data = await res.json();
      set({ projects: data,projectsLoading:false });
    } catch (err: any) {
      set({ projectsError: err.message || 'Unknown error' });
    } finally {
      set({ projectsLoading: false });
    }
  },
  fetchGondolas: async () => {
    set({ gondolasLoading: true, gondolasError: null });
    try {
      const res = await fetch("/api/gondola");
      if (!res.ok) throw new Error(`Failed to fetch gondolas (${res.status})`);
      const data = await res.json();
      set({ gondolas: data,gondolasLoading:false });
    } catch (err: any) {
      set({ gondolasError: err.message || 'Unknown error' });
    } finally {
      set({ gondolasLoading: false });
    }
  },
  fetchCertificates: async () => {
    set({ certificatesLoading: true, certificatesError: null });
    try {
      const res = await fetch('/api/certificate');
      if (!res.ok) throw new Error('Failed to fetch certificates');
      const data = await res.json();
      set({ certificates: data });
    } catch (err: any) {
      set({ certificatesError: err.message || 'Unknown error' });
    } finally {
      set({ certificatesLoading: false });
    }
  },
  fetchDocuments: async (projectId: string) => {
    if (!projectId) {
      set({ documents: [], documentsLoading: false, documentsError: 'Project ID is required to fetch documents.' });
      return;
    }
    set({ documentsLoading: true, documentsError: null });
    try {
      const res = await fetch(`/api/project/${projectId}/documents`);
      if (!res.ok) throw new Error(`Failed to fetch documents for project ${projectId} (${res.status})`);
      const data = await res.json();
      set({ documents: data, documentsLoading: false });
    } catch (error) {
      console.error(`Failed to fetch documents for project ${projectId}:`, error);
      set({ documentsLoading: false, documentsError: error instanceof Error ? error.message : String(error) });
    }
  },
  fetchDeliveryOrders: async () => {
    set({ deliveryOrdersLoading: true, deliveryOrdersError: null });
    try {
      const res = await fetch("/api/delivery-order");
      if (!res.ok) throw new Error(`Failed to fetch delivery orders (${res.status})`);
      const data = await res.json();
      set({ deliveryOrders: data,deliveryOrdersLoading:false });
    } catch (err: any) {
      set({ deliveryOrdersError: err.message || 'Unknown error' });
    } finally {
      set({ deliveryOrdersLoading: false });
    }
  },
  fetchShiftHistory: async () => {
    set({ shiftHistoryLoading: true, shiftHistoryError: null });
    try {
      const res = await fetch("/api/shift-history");
      if (!res.ok) throw new Error(`Failed to fetch shift history (${res.status})`);
      const data = await res.json();
      set({ shiftHistory: data,shiftHistoryLoading:false });
    } catch (err: any) {
      set({ shiftHistoryError: err.message || 'Unknown error' });
    } finally {
      set({ shiftHistoryLoading: false });
    }
  },

  // Fetch shift history for a specific gondola
  // (removed duplicate, see below for actual implementation)

  fetchRentalDetailsByGondolaId: async (gondolaId: string) => {
    set({ rentalDetailsLoading: true, rentalDetailsError: null });
    try {
      const res = await fetch(`/api/gondola/${gondolaId}/rental-details`);
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to fetch rental details');
      const data = await res.json();
      set({ rentalDetails: data, rentalDetailsLoading: false });
    } catch (error: any) {
      set({ rentalDetailsError: error.message || 'Failed to fetch rental details', rentalDetailsLoading: false });
    }
  },

  fetchShiftHistoryByGondolaId: async (gondolaId: string) => {
    set({ shiftHistoryLoading: true, shiftHistoryError: null });
    try {
      const res = await fetch(`/api/gondola/${gondolaId}/shift`);
      if (!res.ok) throw new Error(`Failed to fetch shift history for gondola (${res.status})`);
      const data = await res.json();
      set({ shiftHistory: data });
    } catch (err: any) {
      set({ shiftHistoryError: err.message || 'Unknown error' });
    } finally {
      set({ shiftHistoryLoading: false });
    }
  },
  setActiveProjectId: (id) => set({ activeProjectId: id }),
  addProject: async (project) => {
    set({projectsLoading:true})
    try {
      const res = await fetch('/api/project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(project),
      });
      if (!res.ok) throw new Error('Failed to add project');
      const savedProject = await res.json();
      set((state) => ({ projects: [...state.projects, savedProject] }));
      set({projectsLoading:false})
    } catch (err) {
      // Optionally: set error state or show error
      console.error(err);
      set({projectsLoading:false})
    }
  },
  updateProject: async (id, project) => {
    try {
      const res = await fetch(`/api/project/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(project),
      });
      if (!res.ok) throw new Error("Failed to update project");
      const updatedProject = await res.json();
      set((state) => ({
        projects: state.projects.map((p) => (p.id === id ? { ...p, ...updatedProject } : p)),
      }));
    } catch (err) {
      // Optionally: set error state or show error
      console.error(err);
    }
  },
  addGondola: (gondola) => set((state) => ({ gondolas: [...state.gondolas, gondola] })),
  updateGondola: (id, gondola) =>
    set((state) => ({
      gondolas: state.gondolas.map((g) => (g.id === id ? { ...g, ...gondola } : g)),
    })),

  updateGondolaAsync: async (id: string, gondola: Partial<Gondola>) => {
    try {
      const res = await fetch(`/api/gondola/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(gondola),
      });
      if (!res.ok) throw new Error('Failed to update gondola');
      const updated = await res.json();
      set((state) => ({
        gondolas: state.gondolas.map((g) => (g.id === id ? { ...g, ...updated } : g)),
      }));
    } catch (err) {
      console.error(err);
    }
  },

  deleteGondolaAsync: async (id: string) => {
    try {
      const res = await fetch(`/api/gondola/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete gondola');
      set((state) => ({
        gondolas: state.gondolas.filter((g) => g.id !== id),
      }));
    } catch (err) {
      console.error(err);
    }
  },
  addDocument: (document) => set((state) => ({ documents: [...state.documents, document] })),
  updateDocument: (id, document) =>
    set((state) => ({
      documents: state.documents.map((d) => (d.id === id ? { ...d, ...document } : d)),
    })),
  addDeliveryOrder: (deliveryOrder) => set((state) => ({ deliveryOrders: [...state.deliveryOrders, deliveryOrder] })),
  updateDeliveryOrder: (id, deliveryOrder) =>
    set((state) => ({
      deliveryOrders: state.deliveryOrders.map((d) => (d.id === id ? { ...d, ...deliveryOrder } : d)),
    })),
  linkDeliveryOrderToProject: (doId, projectId) =>
    set((state) => {
      const deliveryOrder = state.deliveryOrders.find((d) => d.id === doId)
      if (!deliveryOrder) return state

      return {
        projects: state.projects.map((p) =>
          p.id === projectId ? { ...p, deliveryOrders: [...p.deliveryOrders, deliveryOrder] } : p,
        ),
        deliveryOrders: state.deliveryOrders.filter((d) => d.id !== doId),
      }
    }),
  addShiftHistory: (shift) => set((state) => ({ shiftHistory: [...state.shiftHistory, shift] })),
  shiftGondola: (gondolaId, newLocation, newLocationDetail, reason, notes) => {
    const state = get()
    const gondola = state.gondolas.find((g) => g.id === gondolaId)
    if (!gondola) return

    const shiftRecord: ShiftHistory = {
      id: `shift-${Date.now()}`,
      gondolaId,
      fromLocation: gondola.location,
      fromLocationDetail: gondola.locationDetail,
      toLocation: newLocation,
      toLocationDetail: newLocationDetail,
      shiftDate: new Date().toISOString().split("T")[0],
      reason,
      notes,
      shiftedBy: "Current User", // In real app, get from auth
      createdAt: new Date().toISOString(),
    }

    set((state) => ({
      gondolas: state.gondolas.map((g) =>
        g.id === gondolaId
          ? {
              ...g,
              location: newLocation,
              locationDetail: newLocationDetail,
              shiftHistory: [...(g.shiftHistory || []), shiftRecord],
            }
          : g,
      ),
      shiftHistory: [...state.shiftHistory, shiftRecord],
    }))
  },
}))
