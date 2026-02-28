import { useState } from 'react';
import './firebase';
import {
  ThemeProvider,
  CssBaseline,
  Box,
  AppBar,
  Toolbar,
  Typography,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Chip,
  Card,
  CardContent,
  CardActions,
  Collapse,
  Divider,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  useMediaQuery,
  Avatar,
  Alert,
  Snackbar,
  Tab,
  Tabs,
  ToggleButton,
  ToggleButtonGroup,
  Checkbox,
  ListItemAvatar,
} from '@mui/material';
import { Fab as FloatingActionButton } from '@mui/material';
import {
  ShoppingCart,
  Inventory2,
  Add,
  Delete,
  Edit,
  ExpandMore,
  ExpandLess,
  Store,
  Settings,
  Menu as MenuIcon,
  LocalGroceryStore,
  Home,
  Warning,
  CheckCircle,
  MoveToInbox,
  CheckBox,
  CheckBoxOutlineBlank,
  PlayArrow,
  List as ListIcon,
} from '@mui/icons-material';
import theme from './theme';
import { getExpirationStatus, getDaysUntilExpiration, LOCATIONS, CURRENCIES, formatCurrency, CurrencyCode } from './meat';
import { AppProvider, useApp } from './context/AppContext';

const DRAWER_WIDTH = 280;

function AppContent() {
  const {
    categories,
    shoppingLists,
    inventory,
    activeListId,
    setActiveListId,
    currency,
    setCurrency,
    addShoppingList,
    deleteShoppingList,
    addItemToList,
    updateItemInList,
    deleteItemFromList,
    moveItemToInventory,
    addInventoryItem,
    updateInventoryItem,
    deleteInventoryItem,
    getActiveList,
    addCategory,
    updateCategory,
    deleteCategory,
  } = useApp();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [currentView, setCurrentView] = useState('shopping');
  const [itemDialog, setItemDialog] = useState({ open: false, mode: 'add', item: null, listId: null });
  const [listDialog, setListDialog] = useState({ open: false });
  const [categoryDialog, setCategoryDialog] = useState({ open: false, mode: 'add', category: null });
  const [inventoryDialog, setInventoryDialog] = useState({ open: false, mode: 'add', item: null });
  const [expandedItem, setExpandedItem] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [pickingMode, setPickingMode] = useState(false);
  const [pickedItems, setPickedItems] = useState<Set<string>>(new Set());

  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const activeList = getActiveList();

  const handleSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleAddItem = (listId = activeListId) => {
    setItemDialog({ open: true, mode: 'add', item: null, listId });
  };

  const handleEditItem = (item, listId = activeListId) => {
    setItemDialog({ open: true, mode: 'edit', item, listId });
  };

  const handleSaveItem = (formData) => {
    if (itemDialog.mode === 'add') {
      addItemToList(itemDialog.listId, formData);
      handleSnackbar('Item added to list');
    } else {
      updateItemInList(itemDialog.listId, itemDialog.item.id, formData);
      handleSnackbar('Item updated');
    }
    setItemDialog({ open: false, mode: 'add', item: null, listId: null });
  };

  const handleDeleteItem = (itemId) => {
    deleteItemFromList(itemDialog.listId, itemId);
    setItemDialog({ open: false, mode: 'add', item: null, listId: null });
    handleSnackbar('Item deleted', 'warning');
  };

  const handleMoveToInventory = (item) => {
    moveItemToInventory(itemDialog.listId || activeListId, item.id, item.quantity);
    handleSnackbar('Item moved to inventory');
    setItemDialog({ open: false, mode: 'add', item: null, listId: null });
  };

  const handleAddList = () => {
    const name = listDialog.name?.trim();
    if (name) {
      addShoppingList(name);
      handleSnackbar('List created');
    }
    setListDialog({ open: false, name: '' });
  };

  const handleDeleteList = (listId) => {
    deleteShoppingList(listId);
    handleSnackbar('List deleted', 'warning');
  };

  const handleAddCategory = () => {
    const { name, description } = categoryDialog;
    if (name?.trim()) {
      if (categoryDialog.mode === 'edit') {
        updateCategory(categoryDialog.category.id, { name: name.trim(), description: description || '' });
        handleSnackbar('Category updated');
      } else {
        addCategory({ name: name.trim(), description: description || '' });
        handleSnackbar('Category added');
      }
    }
    setCategoryDialog({ open: false, mode: 'add', category: null, name: '', description: '' });
  };

  const handleDeleteCategory = (id) => {
    deleteCategory(id);
    handleSnackbar('Category deleted', 'warning');
  };

  const handleSaveInventoryItem = (formData) => {
    if (inventoryDialog.mode === 'add') {
      addInventoryItem(formData);
      handleSnackbar('Item added to inventory');
    } else {
      updateInventoryItem(inventoryDialog.item.id, formData);
      handleSnackbar('Inventory item updated');
    }
    setInventoryDialog({ open: false, mode: 'add', item: null });
  };

  const filteredItems = activeList?.items.filter(item => 
    !categoryFilter || item.category === categoryFilter
  ) || [];

  const inventoryByCategory = categories.reduce((acc, cat) => {
    const items = inventory.filter(item => item.category === cat.name);
    if (items.length > 0) {
      acc[cat.name] = items;
    }
    return acc;
  }, {});

  const getExpirationStats = () => {
    const stats = { expired: [], expiringSoon: [], fresh: [] };
    inventory.forEach(item => {
      const status = getExpirationStatus(item.bestByDate);
      if (status === 'expired') stats.expired.push(item);
      else if (status === 'expiring-soon') stats.expiringSoon.push(item);
      else if (status === 'fresh') stats.fresh.push(item);
    });
    return stats;
  };

  const expirationStats = getExpirationStats();

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'white' }}>
        <Typography variant="h6" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
          <LocalGroceryStore /> Shop & Stock
        </Typography>
      </Box>
      
      <Tabs
        value={currentView}
        onChange={(e, v) => setCurrentView(v)}
        variant="fullWidth"
        sx={{ borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab icon={<ShoppingCart />} label="Lists" value="shopping" />
        <Tab icon={<Inventory2 />} label="Inventory" value="inventory" />
        <Tab icon={<Settings />} label="Admin" value="admin" />
      </Tabs>

      {currentView === 'shopping' && (
        <Box sx={{ flexGrow: 1, overflow: 'auto', p: 1 }}>
          <Typography variant="overline" color="text.secondary">Shopping Lists</Typography>
          <List>
            {shoppingLists.map(list => (
              <ListItem key={list.id} disablePadding>
                <ListItemButton
                  selected={activeListId === list.id}
                  onClick={() => { setActiveListId(list.id); setMobileOpen(false); }}
                >
                  <ListItemIcon>
                    {list.isStandard ? <Home color="primary" /> : <ShoppingCart />}
                  </ListItemIcon>
                  <ListItemText primary={list.name} secondary={list.items.length > 0 ? `${list.items.length} items` : ''} />
                  {!list.isStandard && (
                    <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleDeleteList(list.id); }}>
                      <Delete fontSize="small" />
                    </IconButton>
                  )}
                </ListItemButton>
              </ListItem>
            ))}
          </List>
          <Button
            startIcon={<Add />}
            onClick={() => setListDialog({ open: true })}
            sx={{ mt: 1, ml: 1 }}
          >
            New List
          </Button>
        </Box>
      )}

      {currentView === 'admin' && (
        <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
          <Typography variant="h6" gutterBottom>Categories</Typography>
          <List dense>
            {categories.map(cat => (
              <ListItem key={cat.id} secondaryAction={
                <Box>
                  <IconButton onClick={() => setCategoryDialog({ open: true, mode: 'edit', category: cat, name: cat.name, description: cat.description })}>
                    <Edit fontSize="small" />
                  </IconButton>
                  <IconButton onClick={() => handleDeleteCategory(cat.id)}>
                    <Delete fontSize="small" />
                  </IconButton>
                </Box>
              }>
                <ListItemIcon><Store /></ListItemIcon>
                <ListItemText primary={cat.name} secondary={cat.description} />
              </ListItem>
            ))}
          </List>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setCategoryDialog({ open: true, mode: 'add', name: '', description: '' })}
            sx={{ mt: 2 }}
            fullWidth
          >
            Add Category
          </Button>
        </Box>
      )}
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar position="fixed" sx={{ zIndex: theme.zIndex.drawer + 1 }}>
        <Toolbar>
          {isMobile && (
            <IconButton color="inherit" edge="start" onClick={() => setMobileOpen(!mobileOpen)} sx={{ mr: 2 }}>
              <MenuIcon />
            </IconButton>
          )}
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {currentView === 'shopping' ? (activeList?.name || 'Shopping List') : 
             currentView === 'inventory' ? 'Home Inventory' : 'Admin'}
          </Typography>
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: DRAWER_WIDTH, flexShrink: 0 }}>
        <Drawer
          variant={isMobile ? 'temporary' : 'permanent'}
          open={isMobile ? mobileOpen : true}
          onClose={() => setMobileOpen(false)}
          sx={{
            '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' },
          }}
        >
          {drawer}
        </Drawer>
      </Box>

      <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 8, minHeight: '100vh' }}>
        {currentView === 'shopping' && (
          <ShoppingListView
            list={activeList}
            items={filteredItems}
            categories={categories}
            categoryFilter={categoryFilter}
            setCategoryFilter={setCategoryFilter}
            onAddItem={() => handleAddItem()}
            onEditItem={handleEditItem}
            onDeleteItem={handleDeleteItem}
            expandedItem={expandedItem}
            setExpandedItem={setExpandedItem}
            onMoveToInventory={handleMoveToInventory}
            currency={currency}
            pickingMode={pickingMode}
            setPickingMode={setPickingMode}
            pickedItems={pickedItems}
            setPickedItems={setPickedItems}
          />
        )}

        {currentView === 'inventory' && (
          <InventoryView
            inventory={inventory}
            categories={categories}
            inventoryByCategory={inventoryByCategory}
            expirationStats={expirationStats}
            onEditItem={(item) => setInventoryDialog({ open: true, mode: 'edit', item })}
            onDeleteItem={deleteInventoryItem}
            onAddItem={() => setInventoryDialog({ open: true, mode: 'add', item: null })}
            currency={currency}
          />
        )}

        {currentView === 'admin' && (
          <AdminView
            categories={categories}
            onAddCategory={() => setCategoryDialog({ open: true, mode: 'add', name: '', description: '' })}
            onEditCategory={(cat) => setCategoryDialog({ open: true, mode: 'edit', category: cat, name: cat.name, description: cat.description })}
            onDeleteCategory={handleDeleteCategory}
            currency={currency}
            onCurrencyChange={setCurrency}
          />
        )}
      </Box>

      {currentView === 'shopping' && (
        <FloatingActionButton
          color="secondary"
          sx={{ position: 'fixed', bottom: 24, right: 24 }}
          onClick={() => handleAddItem()}
        >
          <Add />
        </FloatingActionButton>
      )}

      {currentView === 'inventory' && (
        <FloatingActionButton
          color="secondary"
          sx={{ position: 'fixed', bottom: 24, right: 24 }}
          onClick={() => setInventoryDialog({ open: true, mode: 'add', item: null })}
        >
          <Add />
        </FloatingActionButton>
      )}

      {/* Add/Edit Item Dialog */}
      <Dialog open={itemDialog.open} onClose={() => setItemDialog({ open: false })} maxWidth="sm" fullWidth>
        <DialogTitle>{itemDialog.mode === 'add' ? 'Add Item' : 'Edit Item'}</DialogTitle>
        <ItemForm
          item={itemDialog.item}
          categories={categories}
          onSave={handleSaveItem}
          onDelete={itemDialog.mode === 'edit' ? () => handleDeleteItem(itemDialog.item.id) : null}
          onMoveToInventory={itemDialog.mode === 'edit' ? handleMoveToInventory : null}
          isEdit={itemDialog.mode === 'edit'}
        />
      </Dialog>

      {/* New List Dialog */}
      <Dialog open={listDialog.open} onClose={() => setListDialog({ open: false })}>
        <DialogTitle>New Shopping List</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="List Name"
            value={listDialog.name || ''}
            onChange={(e) => setListDialog({ ...listDialog, name: e.target.value })}
            onKeyPress={(e) => e.key === 'Enter' && handleAddList()}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setListDialog({ open: false })}>Cancel</Button>
          <Button onClick={handleAddList} variant="contained">Create</Button>
        </DialogActions>
      </Dialog>

      {/* Category Dialog */}
      <Dialog open={categoryDialog.open} onClose={() => setCategoryDialog({ open: false })}>
        <DialogTitle>{categoryDialog.mode === 'add' ? 'Add Category' : 'Edit Category'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Category Name"
            value={categoryDialog.name || ''}
            onChange={(e) => setCategoryDialog({ ...categoryDialog, name: e.target.value })}
            sx={{ mt: 1, mb: 1 }}
          />
          <TextField
            fullWidth
            label="Description"
            value={categoryDialog.description || ''}
            onChange={(e) => setCategoryDialog({ ...categoryDialog, description: e.target.value })}
            multiline
            rows={2}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCategoryDialog({ open: false })}>Cancel</Button>
          <Button onClick={handleAddCategory} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>

      {/* Inventory Item Dialog */}
      <Dialog open={inventoryDialog.open} onClose={() => setInventoryDialog({ open: false })} maxWidth="sm" fullWidth>
        <DialogTitle>{inventoryDialog.mode === 'add' ? 'Add to Inventory' : 'Edit Inventory Item'}</DialogTitle>
        <ItemForm
          item={inventoryDialog.item}
          categories={categories}
          onSave={handleSaveInventoryItem}
          onDelete={inventoryDialog.mode === 'edit' ? () => { deleteInventoryItem(inventoryDialog.item.id); setInventoryDialog({ open: false }); } : null}
          isEdit={inventoryDialog.mode === 'edit'}
          showHomeQuantity
        />
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
}

function ShoppingListView({ list, items, categories, categoryFilter, setCategoryFilter, onAddItem, onEditItem, onDeleteItem, expandedItem, setExpandedItem, onMoveToInventory, currency, pickingMode, setPickingMode, pickedItems, setPickedItems }) {
  const totalCost = items.reduce((sum, item) => sum + (item.cost || 0) * item.quantity, 0);
  const pickedCost = items.filter(item => pickedItems.has(item.id)).reduce((sum, item) => sum + (item.cost || 0) * item.quantity, 0);

  const handleTogglePick = (itemId: string) => {
    setPickedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const groupedItems = categories.reduce((acc, cat) => {
    const catItems = items.filter(item => item.category === cat.name);
    if (catItems.length > 0) {
      acc[cat.name] = catItems;
    }
    return acc;
  }, {} as Record<string, typeof items>);

  return (
    <Box>
      <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
        <ToggleButtonGroup value={pickingMode ? 'pick' : 'browse'} exclusive onChange={(e, v) => v && setPickingMode(v === 'pick')}>
          <ToggleButton value="browse"><ListIcon sx={{ mr: 1 }} />Browse</ToggleButton>
          <ToggleButton value="pick"><PlayArrow sx={{ mr: 1 }} />Pick</ToggleButton>
        </ToggleButtonGroup>
        
        {!pickingMode && (
          <>
            <Chip label="All" onClick={() => setCategoryFilter('')} color={!categoryFilter ? 'primary' : 'default'} />
            {categories.map(cat => (
              <Chip key={cat.id} label={cat.name} onClick={() => setCategoryFilter(cat.name)} color={categoryFilter === cat.name ? 'primary' : 'default'} />
            ))}
          </>
        )}
        
        <Box sx={{ ml: 'auto', textAlign: 'right' }}>
          {pickingMode ? (
            <Typography variant="h6" color="primary">
              {pickedItems.size} / {items.length} ({formatCurrency(pickedCost, currency)})
            </Typography>
          ) : (
            <Typography variant="h6" color="primary">
              Total: {formatCurrency(totalCost, currency)}
            </Typography>
          )}
        </Box>
      </Box>

      {items.length === 0 ? (
        <Alert severity="info">No items in this list. Click + to add items.</Alert>
      ) : pickingMode ? (
        <Box>
          {Object.entries(groupedItems).map(([category, categoryItems]) => (
            <Box key={category} sx={{ mb: 3 }}>
              <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1, color: 'primary.main' }}>
                {category}
              </Typography>
              <List>
                {categoryItems.map(item => (
                  <ListItem
                    key={item.id}
                    sx={{ 
                      bgcolor: 'background.paper', 
                      mb: 1, 
                      borderRadius: 1,
                      textDecoration: pickedItems.has(item.id) ? 'line-through' : 'none',
                      opacity: pickedItems.has(item.id) ? 0.6 : 1,
                    }}
                    secondaryAction={
                      <Checkbox
                        checked={pickedItems.has(item.id)}
                        onChange={() => handleTogglePick(item.id)}
                        icon={<CheckBoxOutlineBlank />}
                        checkedIcon={<CheckBox />}
                      />
                    }
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: pickedItems.has(item.id) ? 'success.main' : 'primary.light' }}>
                        {item.name[0]}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText 
                      primary={item.name} 
                      secondary={`Qty: ${item.quantity} ${item.cost ? '| ' + formatCurrency(item.cost, currency) : ''}`} 
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          ))}
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {items.map(item => (
            <ItemCard
              key={item.id}
              item={item}
              expanded={expandedItem === item.id}
              onToggle={() => setExpandedItem(expandedItem === item.id ? null : item.id)}
              onEdit={() => onEditItem(item)}
              onMoveToInventory={() => onMoveToInventory(item)}
              categories={categories}
              currency={currency}
            />
          ))}
        </Box>
      )}
    </Box>
  );
}

function ItemCard({ item, expanded, onToggle, onEdit, onMoveToInventory, categories, showHomeQuantity, currency }) {
  const expirationStatus = getExpirationStatus(item.bestByDate);
  const daysLeft = getDaysUntilExpiration(item.bestByDate);

  const statusColors = {
    expired: 'error',
    'expiring-soon': 'warning',
    fresh: 'success',
    unknown: 'default',
  };

  return (
    <Card sx={{ borderLeft: 4, borderColor: `${statusColors[expirationStatus]}.main` }}>
      <CardContent sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexGrow: 1 }}>
            <Avatar sx={{ bgcolor: 'primary.light' }}>{item.name?.[0]}</Avatar>
            <Box>
              <Typography variant="subtitle1" fontWeight={600}>{item.name}</Typography>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <Chip label={item.category} size="small" />
                {item.bestByDate && (
                  <Chip
                    size="small"
                    color={statusColors[expirationStatus]}
                    label={daysLeft < 0 ? `Expired ${Math.abs(daysLeft)}d ago` : daysLeft === 0 ? 'Expires today' : `${daysLeft}d left`}
                    icon={expirationStatus === 'expired' ? <Warning /> : expirationStatus === 'expiring-soon' ? <Warning /> : <CheckCircle />}
                  />
                )}
              </Box>
            </Box>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="h6" color="primary">{formatCurrency(item.cost || 0, currency)}</Typography>
            <Typography variant="body2" color="text.secondary">Qty: {item.quantity}</Typography>
          </Box>
        </Box>
      </CardContent>

      <CardActions sx={{ pt: 0 }}>
        <Button size="small" startIcon={expanded ? <ExpandLess /> : <ExpandMore />} onClick={onToggle}>
          {expanded ? 'Less' : 'More'}
        </Button>
        <Button size="small" startIcon={<Edit />} onClick={onEdit}>Edit</Button>
        {onMoveToInventory && (
          <Button size="small" startIcon={<MoveToInbox />} onClick={onMoveToInventory}>To Inventory</Button>
        )}
      </CardActions>

      <Collapse in={expanded}>
        <Divider />
        <CardContent>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
            {item.description && (
              <Box>
                <Typography variant="caption" color="text.secondary">Description</Typography>
                <Typography variant="body2">{item.description}</Typography>
              </Box>
            )}
            {item.barcode && (
              <Box>
                <Typography variant="caption" color="text.secondary">Barcode</Typography>
                <Typography variant="body2">{item.barcode}</Typography>
              </Box>
            )}
            {item.weightSize && (
              <Box>
                <Typography variant="caption" color="text.secondary">Weight/Size</Typography>
                <Typography variant="body2">{item.weightSize}</Typography>
              </Box>
            )}
            {item.nutritionalInfo && (
              <Box>
                <Typography variant="caption" color="text.secondary">Nutritional Info</Typography>
                <Typography variant="body2">{item.nutritionalInfo}</Typography>
              </Box>
            )}
            {item.bestByDate && (
              <Box>
                <Typography variant="caption" color="text.secondary">Best By</Typography>
                <Typography variant="body2">{new Date(item.bestByDate).toLocaleDateString()}</Typography>
              </Box>
            )}
            {showHomeQuantity && item.homeQuantity !== undefined && (
              <Box>
                <Typography variant="caption" color="text.secondary">Quantity at Home</Typography>
                <Typography variant="body2">{item.homeQuantity}</Typography>
              </Box>
            )}
          </Box>
        </CardContent>
      </Collapse>
    </Card>
  );
}

function InventoryView({ inventory, categories, inventoryByCategory, expirationStats, onEditItem, onDeleteItem, onAddItem, currency }) {
  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>Expiration Status</Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Chip icon={<Warning />} label={`Expired: ${expirationStats.expired.length}`} color="error" />
          <Chip icon={<Warning />} label={`Expiring Soon: ${expirationStats.expiringSoon.length}`} color="warning" />
          <Chip icon={<CheckCircle />} label={`Fresh: ${expirationStats.fresh.length}`} color="success" />
        </Box>
      </Box>

      {inventory.length === 0 ? (
        <Alert severity="info">Your inventory is empty. Click + to add items.</Alert>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {Object.entries(inventoryByCategory).map(([category, items]) => (
            <Box key={category}>
              <Typography variant="h6" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Store /> {category}
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {items.map(item => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    expanded={false}
                    onToggle={() => {}}
                    onEdit={() => onEditItem(item)}
                    categories={categories}
                    showHomeQuantity
                    currency={currency}
                  />
                ))}
              </Box>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}

function AdminView({ categories, onAddCategory, onEditCategory, onDeleteCategory, currency, onCurrencyChange }) {
  return (
    <Box>
      <Typography variant="h6" gutterBottom>Settings</Typography>
      
      <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>Currency</Typography>
      <FormControl fullWidth sx={{ mb: 3 }}>
        <Select
          value={currency}
          onChange={(e) => onCurrencyChange(e.target.value)}
        >
          {CURRENCIES.map(c => (
            <MenuItem key={c.code} value={c.code}>
              {c.symbol} {c.name} ({c.code})
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Typography variant="h6" gutterBottom>Category Management</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Manage supermarket categories/departments for organizing items.
      </Typography>
      <List>
        {categories.map(cat => (
          <ListItem
            key={cat.id}
            secondaryAction={
              <Box>
                <IconButton onClick={() => onEditCategory(cat)}><Edit /></IconButton>
                <IconButton onClick={() => onDeleteCategory(cat.id)}><Delete /></IconButton>
              </Box>
            }
            sx={{ bgcolor: 'background.paper', mb: 1, borderRadius: 1 }}
          >
            <ListItemIcon><Store /></ListItemIcon>
            <ListItemText primary={cat.name} secondary={cat.description} />
          </ListItem>
        ))}
      </List>
      <Button variant="contained" startIcon={<Add />} onClick={onAddCategory}>
        Add Category
      </Button>
    </Box>
  );
}

function ItemForm({ item, categories, onSave, onDelete, onMoveToInventory, isEdit, showHomeQuantity }) {
  const [formData, setFormData] = useState({
    name: item?.name || '',
    category: item?.category || categories[0]?.name || '',
    quantity: item?.quantity || 1,
    cost: item?.cost || 0,
    description: item?.description || '',
    barcode: item?.barcode || '',
    nutritionalInfo: item?.nutritionalInfo || '',
    weightSize: item?.weightSize || '',
    bestByDate: item?.bestByDate || '',
    location: item?.location || 'Fridge',
    homeQuantity: item?.homeQuantity || 1,
  });

  const handleChange = (field) => (e) => {
    setFormData({ ...formData, [field]: e.target.value });
  };

  const handleSubmit = () => {
    onSave({
      ...formData,
      quantity: parseInt(formData.quantity) || 1,
      cost: parseFloat(formData.cost) || 0,
      homeQuantity: showHomeQuantity ? (parseInt(formData.homeQuantity) || 1) : formData.homeQuantity,
    });
  };

  return (
    <>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Item Name"
            value={formData.name}
            onChange={handleChange('name')}
            fullWidth
            required
          />
          <FormControl fullWidth>
            <InputLabel>Category</InputLabel>
            <Select value={formData.category} onChange={handleChange('category')} label="Category">
              {categories.map(cat => (
                <MenuItem key={cat.id} value={cat.name}>{cat.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label="Quantity"
              type="number"
              value={formData.quantity}
              onChange={handleChange('quantity')}
              fullWidth
              inputProps={{ min: 1 }}
            />
            <TextField
              label="Cost"
              type="number"
              value={formData.cost}
              onChange={handleChange('cost')}
              fullWidth
              InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
              inputProps={{ min: 0, step: 0.01 }}
            />
          </Box>
          {showHomeQuantity && (
            <TextField
              label="Quantity at Home"
              type="number"
              value={formData.homeQuantity}
              onChange={handleChange('homeQuantity')}
              fullWidth
              inputProps={{ min: 0 }}
            />
          )}
          <FormControl fullWidth>
            <InputLabel>Location</InputLabel>
            <Select value={formData.location} onChange={handleChange('location')} label="Location">
              {LOCATIONS.map(loc => (
                <MenuItem key={loc} value={loc}>{loc}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="Best By Date"
            type="date"
            value={formData.bestByDate}
            onChange={handleChange('bestByDate')}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="Description"
            value={formData.description}
            onChange={handleChange('description')}
            fullWidth
            multiline
            rows={2}
          />
          <TextField
            label="Barcode"
            value={formData.barcode}
            onChange={handleChange('barcode')}
            fullWidth
          />
          <TextField
            label="Weight/Size"
            value={formData.weightSize}
            onChange={handleChange('weightSize')}
            fullWidth
          />
          <TextField
            label="Nutritional Information"
            value={formData.nutritionalInfo}
            onChange={handleChange('nutritionalInfo')}
            fullWidth
            multiline
            rows={2}
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2, gap: 1 }}>
        {onDelete && (
          <Button onClick={onDelete} color="error" sx={{ mr: 'auto' }}>Delete</Button>
        )}
        {onMoveToInventory && (
          <Button onClick={onMoveToInventory} startIcon={<MoveToInbox />}>To Inventory</Button>
        )}
        <Button onClick={() => {}}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={!formData.name.trim()}>
          Save
        </Button>
      </DialogActions>
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppProvider>
        <AppContent />
      </AppProvider>
    </ThemeProvider>
  );
}
