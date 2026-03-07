import * as React from 'react';
import Box from '@mui/material/Box';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import RestoreIcon from '@mui/icons-material/Restore';
import FavoriteIcon from '@mui/icons-material/Favorite';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import { AdminPanelSettings, Home, Inventory, List } from '@mui/icons-material';
import { Paper } from '@mui/material';
import { useTranslation } from 'react-i18next';

export default function SimpleBottomNavigation() {
  const [value, setValue] = React.useState(0);
  const { t } = useTranslation();

  return (
    <Paper sx={{ position: 'fixed', bottom: 0, left: 0, right: 0 }} elevation={3}>
      
    
      <BottomNavigation
        showLabels
        value={value}
        onChange={(event, newValue) => {
          setValue(newValue);
        }}
      >
        <BottomNavigationAction href="/lists" label={t('lists')} icon={<List />} data-testid="nav-lists" />
        <BottomNavigationAction href="/inventory" label={t('inventory')} icon={<Inventory />} data-testid="nav-inventory" />
        <BottomNavigationAction href="/admin" label={t('admin')} icon={<AdminPanelSettings />} data-testid="nav-admin" />
      </BottomNavigation>
    </Paper>
  );
}
