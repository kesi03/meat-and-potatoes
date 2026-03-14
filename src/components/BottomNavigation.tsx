import * as React from 'react';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import { AdminPanelSettings, Inventory, List, Mail } from '@mui/icons-material';
import { Paper, Badge, IconButton } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export default function SimpleBottomNavigation() {
  const location = useLocation();
  const { unreadCount } = useApp();
  const { t } = useTranslation();

  const getValue = () => {
    if (location.pathname === '/lists' || location.pathname.startsWith('/list/')) return 0;
    if (location.pathname === '/inventory') return 1;
    if (location.pathname === '/inbox') return 2;
    if (location.pathname === '/admin') return 3;
    return 0;
  };

  return (
    <Paper sx={{ position: 'fixed', bottom: 0, left: 0, right: 0 }} elevation={3}>
      <BottomNavigation
        showLabels
        value={getValue()}
      >
        <BottomNavigationAction href="/lists" label={t('lists')} icon={<List />} data-testid="nav-lists" />
        <BottomNavigationAction href="/inventory" label={t('inventory')} icon={<Inventory />} data-testid="nav-inventory" />
        <BottomNavigationAction 
          href="/inbox" 
          label={t('inbox')} 
          icon={
            <Badge badgeContent={unreadCount} color="error">
              <Mail />
            </Badge>
          } 
          data-testid="nav-inbox" 
        />
        <BottomNavigationAction href="/admin" label={t('admin')} icon={<AdminPanelSettings />} data-testid="nav-admin" />
      </BottomNavigation>
    </Paper>
  );
}
