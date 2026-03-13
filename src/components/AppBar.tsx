import * as React from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Button from '@mui/material/Button';
import ButtonGroup from '@mui/material/ButtonGroup';
import AddIcon from '@mui/icons-material/Add';
import LogoutIcon from '@mui/icons-material/Logout';
import Avatar from '@mui/material/Avatar';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useAppBarActions } from '../context/AppBarActions';
import { DeviceBanner } from './DeviceBanner';

function ResponsiveAppBar() {
  const { t } = useTranslation();
  const location = useLocation();
  const { activeListId, addItemToList, categories, currency, getActiveList, user, logout } = useApp();
  const appBarActions = useAppBarActions();

  const activeList = getActiveList();

  return (
    <AppBar position="fixed">
      <Container maxWidth="xl">
        <Toolbar disableGutters>

          {/* Desktop Logo */}
          <Typography
            variant="h6"
            noWrap
            component="a"
            href="/"
            sx={{
              mr: 2,
              display: { xs: 'none', md: 'flex' },
              fontFamily: 'monospace',
              fontWeight: 700,
              letterSpacing: '.3rem',
              color: 'inherit',
              textDecoration: 'none',
            }}
          >
            <img src="/green-logo.png" alt="Logo" style={{ height: 75, width: 75 }} />
          </Typography>

          {/* Mobile Logo */}
          <Typography
            variant="h5"
            noWrap
            component="a"
            href="/"
            sx={{
              mr: 2,
              display: { xs: 'flex', md: 'none' },
              flexGrow: 0,
              fontFamily: 'monospace',
              fontWeight: 700,
              letterSpacing: '.3rem',
              color: 'inherit',
              textDecoration: 'none',
            }}
          >
            <img src="/green-logo.png" alt="Logo" style={{ height: 60, width: 60 }} />
          </Typography>

          {/* Spacer pushes buttons to the right */}
          <Box sx={{ flexGrow: 1 }} />

          {/* Right-aligned button bar */}


          {activeList && location.pathname.startsWith('/list/') && (
            <ButtonGroup variant="contained" color="primary">
              <Button
                onClick={() => appBarActions.current.openAddItem?.()}
                startIcon={<AddIcon />}
                sx={{ color: 'white' }}
                data-testid="add-item-button"
              >
                {t('add')}
              </Button>

              <DeviceBanner
                listId={activeList.id}
                addItemToList={addItemToList}
                categories={categories}
                currency={currency}
                forceShow={true}
              />
            </ButtonGroup>
          )}

          {location.pathname === '/inventory' && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => appBarActions.current.openAddInventory?.()}
              sx={{ color: 'white' }}
              data-testid="add-inventory-button"
            >
              {t('add')}
            </Button>
          )}

          {(location.pathname === '/lists' || location.pathname === '/') && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => appBarActions.current.openAddList?.()}
              sx={{ color: 'white' }}
              data-testid="add-list-button"
            >
              {t('addList')}
            </Button>
          )}

          <Box sx={{ display: 'flex', alignItems: 'center', ml: 1 }}>
            {user?.photoURL ? (
              <Avatar src={user.photoURL} sx={{ width: 32, height: 32 }} />
            ) : user ? (
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
                {user.email?.[0]?.toUpperCase()}
              </Avatar>
            ) : null}
            <Button
              color="inherit"
              startIcon={<LogoutIcon />}
              onClick={async () => {
                await logout();
                window.location.reload();
              }}
              sx={{ ml: 1 }}
            >
              {t('logout') || 'Logout'}
            </Button>
          </Box>



        </Toolbar>
      </Container>
    </AppBar>
  );
}

export default ResponsiveAppBar;