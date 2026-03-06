import React, { createContext, useContext, useRef } from 'react';

interface AppBarActions {
  openAddInventory?: () => void;
  openAddList?: () => void;
  openAddItem?: () => void;
}

const AppBarActionsContext = createContext<React.MutableRefObject<AppBarActions>>(
  { current: {} }
);

export function AppBarActionsProvider({ children }: { children: React.ReactNode }) {
  const actionsRef = useRef<AppBarActions>({});

  return (
    <AppBarActionsContext.Provider value={actionsRef}>
      {children}
    </AppBarActionsContext.Provider>
  );
}

export function useAppBarActions() {
  return useContext(AppBarActionsContext);
}
