import './firebase';
import { createBrowserRouter, RouterProvider, useLocation } from 'react-router-dom';
import { ThemeProvider, CssBaseline, Paper, Box } from '@mui/material';
import { AppProvider, useApp } from './context/AppContext';

import { ShoppingCart, Inventory2, Settings } from '@mui/icons-material';
import ListsPage from './pages/ListsPage';
import InventoryPage from './pages/InventoryPage';
import AdminPage from './pages/AdminPage';
import theme from './theme';
import type { ShoppingItem } from './context/AppContext';
import AppBar from './components/AppBar';
import SyncSnackbar from './components/SyncSnackbar';

const NAVIGATION = [
  { kind: 'header' as const, title: 'Main' },
  { segment: 'lists', title: 'Lists', icon: <ShoppingCart /> },
  { segment: 'inventory', title: 'Inventory', icon: <Inventory2 /> },
  { segment: 'admin', title: 'Admin', icon: <Settings /> },
];

function AppContent() {
  const { moveItemToInventory } = useApp();
  const location = useLocation();

  const handleMoveToInventory = (item: ShoppingItem) => {
    moveItemToInventory('', item.id, item.quantity);
  };

  return (

    <>
      <AppBar />
      <Box sx={{ p: 2, mt: 8 }}>
      {location.pathname === '/' && <ListsPage onMoveToInventory={handleMoveToInventory} />}
      {location.pathname === '/lists' && <ListsPage onMoveToInventory={handleMoveToInventory} />}
      {location.pathname === '/inventory' && <InventoryPage />}
      {location.pathname === '/admin' && <AdminPage />}
      </Box>
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
        <RouterProvider router={router} />
      </AppProvider>
    </ThemeProvider>
  );
}
