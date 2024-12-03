'use client';

import { createContext, useContext, useReducer, useCallback } from 'react';

interface DashboardState {
  matches: {
    data: any[];
    loading: boolean;
    error: string | null;
  };
  notifications: {
    data: any[];
    loading: boolean;
    error: string | null;
  };
  interviews: {
    data: any[];
    loading: boolean;
    error: string | null;
  };
  activities: {
    data: any[];
    loading: boolean;
    error: string | null;
  };
}

const initialState: DashboardState = {
  matches: { data: [], loading: false, error: null },
  notifications: { data: [], loading: false, error: null },
  interviews: { data: [], loading: false, error: null },
  activities: { data: [], loading: false, error: null }
};

const DashboardContext = createContext<{
  state: DashboardState;
  actions: any;
} | null>(null);

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(dashboardReducer, initialState);

  const actions = {
    fetchMatches: async () => {
      // Implement fetch logic
    },
    fetchNotifications: async () => {
      // Implement fetch logic
    },
    fetchInterviews: async () => {
      // Implement fetch logic
    },
    fetchActivities: async () => {
      // Implement fetch logic
    }
  };

  return (
    <DashboardContext.Provider value={{ state, actions }}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
}

function dashboardReducer(state: DashboardState, action: any) {
  switch (action.type) {
    default:
      return state;
  }
}
