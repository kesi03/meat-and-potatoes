import * as React from 'react';
import { useState } from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Button from '@mui/material/Button';
import ButtonGroup from '@mui/material/ButtonGroup';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import AddIcon from '@mui/icons-material/Add';
import LogoutIcon from '@mui/icons-material/Logout';
import SettingsIcon from '@mui/icons-material/Settings';
import PersonIcon from '@mui/icons-material/Person';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import ListIcon from '@mui/icons-material/List';
import InventoryIcon from '@mui/icons-material/Inventory';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import Badge from '@mui/material/Badge';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useAppBarActions } from '../context/AppBarActions';
import { DeviceBanner } from './DeviceBanner';
import { ProfileDialog } from './dialogs';
import { ShareDialog } from './dialogs';
import { AccountTreeRounded, BarcodeReader, CloudOff, Cloud, PersonSearch, Mail } from '@mui/icons-material';
import { Divider } from '@mui/material';

function ResponsiveAppBar() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { activeListId, addItemToList, categories, currency, getActiveList, user, logout, profile, updateProfile, offlineMode, setOfflineMode, shareList, unreadCount } = useApp();
  const appBarActions = useAppBarActions();
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState({ open: false, listId: '', listName: '' });
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [scanTrigger, setScanTrigger] = useState(0);
  const open = Boolean(anchorEl);

  const activeList = getActiveList();

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMenuItemClick = (action: () => void) => {
    action();
    handleClose();
  };

  const isOnListPage = activeList && location.pathname.startsWith('/list/');
  const isOnInventoryPage = location.pathname === '/inventory';
  const isOnListsPage = location.pathname === '/lists' || location.pathname === '/';

  const getMainButtonText = () => {
    if (isOnListPage) return t('add');
    if (isOnInventoryPage) return t('add');
    if (isOnListsPage) return t('addList');
    return t('add');
  };

  const getMainButtonAction = () => {
    if (isOnListPage) return () => appBarActions.current.openAddItem?.();
    if (isOnInventoryPage) return () => appBarActions.current.openAddInventory?.();
    if (isOnListsPage) return () => appBarActions.current.openAddList?.();
    return () => appBarActions.current.openAddList?.();
  };

  const showAddGroup = isOnListPage || isOnInventoryPage || isOnListsPage;

  const handleProfileClick = () => {
    setProfileDialogOpen(true);
    handleClose();
  };

  const handleLogoutClick = async () => {
    await logout();
  };

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
          {showAddGroup && (
            <>
              <Button
                variant="contained"
                color="primary"
                startIcon={<AccountTreeRounded/>}
                endIcon={<ArrowDropDownIcon />}
                onClick={handleClick}
                sx={{ color: 'white' }}
                data-testid="actions-button"
                aria-controls={open ? 'actions-menu' : undefined}
                aria-expanded={open ? 'true' : undefined}
                aria-haspopup="menu"
              >
                {t('actions')}
              </Button>
              <Menu
                id="actions-menu"
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                MenuListProps={{
                  'aria-labelledby': 'actions-button',
                }}
                PaperProps={{
                  sx: {
                    bgcolor: 'primary.main',
                    color: 'white',
                    '& .MuiMenuItem-root': {
                      color: 'white',
                      '&:hover': {
                        bgcolor: 'primary.dark',
                      },
                      '&:focus': {
                        bgcolor: 'primary.dark',
                      },
                    },
                  },
                }}
              >
                {isOnListPage && (
                  <MenuItem onClick={() => handleMenuItemClick(() => appBarActions.current.openAddItem?.())}>
                    <AddIcon sx={{ mr: 1 }} fontSize="small" />
                    {t('addItem')}
                  </MenuItem>
                )}
                {isOnListPage && (
                  <MenuItem onClick={() => handleMenuItemClick(() => setScanTrigger(prev => prev + 1))}>
                    <BarcodeReader sx={{ mr: 1 }} fontSize="small" />
                    {t('scan')}
                  </MenuItem>
                )}
                {isOnInventoryPage && (
                  <MenuItem onClick={() => handleMenuItemClick(() => appBarActions.current.openAddInventory?.())}>
                    <InventoryIcon sx={{ mr: 1 }} fontSize="small" />
                    {t('addToInventory')}
                  </MenuItem>
                )}
                {isOnListsPage && (
                  <MenuItem onClick={() => handleMenuItemClick(() => appBarActions.current.openAddList?.())}>
                    <ListIcon sx={{ mr: 1 }} fontSize="small" />
                    {t('addList')}
                  </MenuItem>
                )}
                <Divider sx={{ borderColor: 'primary.dark', borderWidth: 1 }} />
                <MenuItem onClick={() => setOfflineMode(!offlineMode)}>
                  {offlineMode ? <CloudOff sx={{ mr: 1 }} fontSize="small" /> : <Cloud sx={{ mr: 1 }} fontSize="small" />}
                  {offlineMode ? t('online') : t('offline')}
                </MenuItem>
                 <Divider sx={{ borderColor: 'primary.dark', borderWidth: 1 }} />
                <MenuItem onClick={handleProfileClick}>
                  {(profile.image || user?.photoURL) ? (
                    <Avatar src={profile.image || user?.photoURL || undefined} sx={{ width: 20, height: 20, mr: 1 }} />
                  ) : (
                    <PersonIcon sx={{ mr: 1 }} fontSize="small" />
                  )}
                  {t('profile')}
                </MenuItem>
                <MenuItem onClick={handleLogoutClick}>
                  <LogoutIcon sx={{ mr: 1 }} fontSize="small" />
                  {t('logout')}
                </MenuItem>
                {isOnListPage && activeList && (
                  <MenuItem onClick={() => { handleClose(); setShareDialogOpen({ open: true, listId: activeList.id, listName: activeList.name }); }}>
                    <PersonSearch sx={{ mr: 1 }} fontSize="small" />
                    {t('share')}
                  </MenuItem>
                )}
                {isOnListPage && activeList && (
                  <DeviceBanner
                    listId={activeList.id}
                    addItemToList={addItemToList}
                    categories={categories}
                    currency={currency}
                    forceShow={true}
                    scanTrigger={scanTrigger}
                    hideButton={true}
                  />
                )}
              </Menu>
            </>
          )}

          <ProfileDialog
            open={profileDialogOpen}
            profile={profile}
            onSave={updateProfile}
            onClose={() => setProfileDialogOpen(false)}
          />

          <ShareDialog
            open={shareDialogOpen.open}
            listId={shareDialogOpen.listId}
            listName={shareDialogOpen.listName}
            onClose={() => setShareDialogOpen({ open: false, listId: '', listName: '' })}
            onShare={(email, message) => shareList(shareDialogOpen.listId, shareDialogOpen.listName, email, message)}
          />

          {user && (
            <IconButton
              color="inherit"
              onClick={() => navigate('/inbox')}
              sx={{ ml: 1 }}
            >
              <Badge badgeContent={unreadCount} color="error">
                <Mail />
              </Badge>
            </IconButton>
          )}


        </Toolbar>
      </Container>
    </AppBar>
  );
}

export default ResponsiveAppBar;