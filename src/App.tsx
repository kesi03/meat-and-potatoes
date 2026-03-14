import './firebase';
import { createBrowserRouter, RouterProvider, useLocation, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { ThemeProvider, CssBaseline, Paper, Box, LinearProgress } from '@mui/material';
import { AppProvider, useApp } from './context/AppContext';
import { AppBarActionsProvider } from './context/AppBarActions';
import { hasValidSession } from './session';

import { ShoppingCart, Inventory2, Settings } from '@mui/icons-material';
import ListsPage from './pages/ListsPage';
import InboxPage from './pages/InboxPage';
import ShoppingListView from './components/ShoppingListView';
import InventoryPage from './pages/InventoryPage';
import AdminPage from './pages/AdminPage';
import LoginPage from './pages/LoginPage';
import theme from './theme';
import type { ShoppingItem } from './context/AppContext';
import AppBar from './components/AppBar';
import SyncSnackbar from './components/SyncSnackbar';
import SimpleBottomNavigation from './components/BottomNavigation';

const NAVIGATION = [
  { kind: 'header' as const, title: 'Main' },
  { segment: 'lists', title: 'Lists', icon: <ShoppingCart /> },
  { segment: 'inventory', title: 'Inventory', icon: <Inventory2 /> },
  { segment: 'admin', title: 'Admin', icon: <Settings /> },
];

function AppContent() {
  const { user, authLoading, moveItemToInventory, shoppingLists, sharedLists, addItemToList, updateItemInList, deleteItemFromList, categories, currency, activeListId, setActiveListId } = useApp();
  const location = useLocation();
  const params = useParams();
  const listName = params['*']?.replace('list/', '');
  const [, setForceUpdate] = useState(0);

  console.log('AppContent render:', { user: !!user, authLoading });

  const selectedList = listName ? shoppingLists.find(l => l.name?.toLowerCase() === listName.toLowerCase()) : null;
  
  // Also check shared lists by name
  const selectedSharedList = listName ? sharedLists.find(l => l.listName?.toLowerCase() === listName.toLowerCase()) : null;

  useEffect(() => {
    if (selectedList && selectedList.id !== activeListId) {
      setActiveListId(selectedList.id);
    } else if (selectedSharedList && selectedSharedList.listId !== activeListId) {
      setActiveListId(selectedSharedList.listId);
    }
  }, [selectedList, selectedSharedList, activeListId, setActiveListId]);

  const handleMoveToInventory = (item: ShoppingItem) => {
    moveItemToInventory('', item.id, item.quantity);
  };

  useEffect(() => {
    if (user) {
      setForceUpdate(n => n + 1);
    }
  }, [user]);

  if (authLoading && !hasValidSession()) {
    return (
      <Box sx={{ width: '100%', minHeight: '100vh' }}>
        <LinearProgress />
      </Box>
    );
  }

  if (!user && !hasValidSession()) {
    return <LoginPage />;
  }

  return (
    <>
      <AppBar />
      <Box sx={{ p: 2, mt: 8 }}>
      {location.pathname === '/' && <ListsPage onMoveToInventory={handleMoveToInventory} />}
      {location.pathname === '/lists' && <ListsPage onMoveToInventory={handleMoveToInventory} />}
      {location.pathname.startsWith('/list/') && (
        <ListsPage 
          onMoveToInventory={handleMoveToInventory}
          initialListId={selectedList?.id}
        />
      )}
      {location.pathname === '/inventory' && <InventoryPage />}
      {location.pathname === '/inbox' && <InboxPage />}
      {location.pathname === '/admin' && <AdminPage />}
      </Box>
      <SimpleBottomNavigation />
      <SyncSnackbar />
    </>
  );
}

const router = createBrowserRouter([
  {
    path: '/*',
    element: <AppContent />,
  },
]);

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppProvider>
        <AppBarActionsProvider>
          <RouterProvider router={router} />
        </AppBarActionsProvider>
      </AppProvider>
    </ThemeProvider>
  );
}
