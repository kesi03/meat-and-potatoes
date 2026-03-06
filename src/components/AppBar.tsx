import * as React from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Menu from '@mui/material/Menu';
import MenuIcon from '@mui/icons-material/Menu';
import Container from '@mui/material/Container';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import ButtonGroup from '@mui/material/ButtonGroup';
import Tooltip from '@mui/material/Tooltip';
import MenuItem from '@mui/material/MenuItem';
import AdbIcon from '@mui/icons-material/Adb';
import ShoppingBasketIcon from '@mui/icons-material/ShoppingBasket';
import BarcodeReaderIcon from '@mui/icons-material/BarcodeReader';
import AddIcon from '@mui/icons-material/Add';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useAppBarActions } from '../context/AppBarActions';
import { DeviceBanner } from './DeviceBanner';

function ResponsiveAppBar() {
  const { t } = useTranslation();
  const location = useLocation();
  const [anchorElNav, setAnchorElNav] = React.useState<null | HTMLElement>(null);
  const [anchorElUser, setAnchorElUser] = React.useState<null | HTMLElement>(null);
  const { activeListId, addItemToList, categories, currency, getActiveList } = useApp();
  const appBarActions = useAppBarActions();

  const pages = [
    { name: t('lists'), path: '/lists', segment: 'lists' },
    { name: t('inventory'), path: '/inventory', segment: 'inventory' },
    { name: t('admin'), path: '/admin', segment: 'admin' },
  ];

  const settings = [t('profile'), t('account'), t('dashboard'), t('logout')];

  const handleOpenNavMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElNav(event.currentTarget);
  };
  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseNavMenu = () => {
    setAnchorElNav(null);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const activeList = getActiveList();

  return (
    <AppBar position="fixed">
      <Container maxWidth="xl">
        <Toolbar disableGutters>
          
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

          <Box sx={{ flexGrow: 1, display: { xs: 'flex', md: 'none' } }}>
            <IconButton
              size="large"
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleOpenNavMenu}
              color="inherit"
            >
              <MenuIcon />
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorElNav}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'left',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'left',
              }}
              open={Boolean(anchorElNav)}
              onClose={handleCloseNavMenu}
              sx={{ display: { xs: 'block', md: 'none' } }}
            >
              {pages.map((page) => (
                <MenuItem key={page.name} onClick={() => { handleCloseNavMenu();
                    document.location.href = page.path;
                 }}>
                  <Typography sx={{ textAlign: 'center',  }}>{page.name}</Typography>
                </MenuItem>
              ))}
            </Menu>
          </Box>
          
          <Typography
            variant="h5"
            noWrap
            component="a"
            href="/"
            sx={{
              mr: 2,
              display: { xs: 'flex', md: 'none' },
              flexGrow: 1,
              fontFamily: 'monospace',
              fontWeight: 700,
              letterSpacing: '.3rem',
              color: 'inherit',
              textDecoration: 'none',
            }}
          >
            <img src="/green-logo.png" alt="Logo" style={{ height: 60, width: 60 }} />
          </Typography>
           
          <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }}>
            {pages.map((page) => (
              <Button
                key={page.name}
                href={page.path}
                onClick={handleCloseNavMenu}
                data-testid={`nav-${page.segment}`}
                sx={{ my: 2, color: '#e6dbc9', display: 'block', mr: 5 }}
              >
                {page.name}
              </Button>
            ))}
          </Box>
          {activeList && location.pathname.startsWith('/list/') && (
            <ButtonGroup variant="contained" color="primary">
              <Button 
                onClick={() => appBarActions.current.openAddItem?.()}
                startIcon={<AddIcon />}
                sx={{ color: 'white' }}
                data-testid="add-item-button"
              >
                Add
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
        </Toolbar>
      </Container>
    </AppBar>
  );
}
export default ResponsiveAppBar;
