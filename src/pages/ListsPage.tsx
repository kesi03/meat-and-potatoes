import { useState, useEffect } from 'react';
import { Box, Fab, Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, FormControlLabel, Checkbox, Typography, Alert } from '@mui/material';
import { Add, CheckCircle } from '@mui/icons-material';
import ListsOverview from '../components/ListsOverview';
import ShoppingListView from '../components/ShoppingListView';
import ItemForm from '../components/ItemForm';
import { useApp } from '../context/AppContext';
import type { ShoppingItem } from '../context/AppContext';
import { generateId } from '../meat';
import { useTranslation } from 'react-i18next';

interface ListsPageProps {
  onMoveToInventory: (item: ShoppingItem) => void;
}

export default function ListsPage({ onMoveToInventory }: ListsPageProps) {
  const { t } = useTranslation();
  const { shoppingLists, addShoppingList, updateShoppingList, deleteShoppingList, addItemToList, updateItemInList, deleteItemFromList, categories, currency, moveItemToInventory } = useApp();
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [pickingMode, setPickingMode] = useState(false);
  const [pickedItems, setPickedItems] = useState<Set<string>>(new Set());
  const [listDialog, setListDialog] = useState({ open: false, name: '', copyFromStandard: true });
  const [itemDialog, setItemDialog] = useState({ open: false, mode: 'add', item: null as ShoppingItem | null, listId: null as string | null });
  const [saveToInventoryDialog, setSaveToInventoryDialog] = useState({ open: false });

  const handleAddList = () => {
    if (listDialog.name.trim()) {
      const items = listDialog.copyFromStandard ? [...(shoppingLists.find(l => l.isStandard)?.items || [])] : [];
      const newList = addShoppingList(listDialog.name, items);
      setListDialog({ open: false, name: '', copyFromStandard: true });
      setSelectedListId(newList.id);
    }
  };

  const handleDeleteList = (listId: string) => {
    deleteShoppingList(listId);
    if (selectedListId === listId) setSelectedListId(null);
  };

  const handleAddItem = (listId: string) => {
    setItemDialog({ open: true, mode: 'add', item: null, listId });
  };

  const handleEditItem = (item: ShoppingItem, listId: string) => {
    setItemDialog({ open: true, mode: 'edit', item, listId });
  };

  const handleSaveItem = (data: any) => {
    if (!itemDialog.listId) return;
    if (itemDialog.mode === 'add') {
      const newItem: ShoppingItem = { ...data, id: generateId() };
      addItemToList(itemDialog.listId, newItem);
    } else if (itemDialog.item) {
      updateItemInList(itemDialog.listId, itemDialog.item.id, data);
    }
    setItemDialog({ open: false, mode: 'add', item: null, listId: null });
  };

  const handleDeleteItemFromList = (itemId: string) => {
    if (!itemDialog.listId) return;
    deleteItemFromList(itemDialog.listId, itemId);
  };

  const selectedList = shoppingLists.find(l => l.id === selectedListId);
  const listItems = selectedList?.items?.filter(item => !categoryFilter || item.category === categoryFilter) || [];

  // Check if all items are picked
  useEffect(() => {
    if (pickingMode && selectedList && listItems.length > 0 && pickedItems.size === listItems.length) {
      // Show dialog after a brief delay to ensure UI has updated
      setTimeout(() => {
        setSaveToInventoryDialog({ open: true });
      }, 300);
    }
  }, [pickingMode, selectedList, listItems.length, pickedItems.size]);

  const handleSavePickedItemsToInventory = () => {
    if (!selectedListId) return;
    
    // Move all picked items to inventory
    listItems.forEach(item => {
      if (pickedItems.has(item.id)) {
        moveItemToInventory(selectedListId, item.id, item.quantity);
      }
    });

    // Reset picking mode and clear picked items
    setSaveToInventoryDialog({ open: false });
    setPickingMode(false);
    setPickedItems(new Set());
  };

  return (
    <Box sx={{ pb: 10 }}>
      {!selectedListId && (
        <ListsOverview
          lists={shoppingLists.filter(l => !l.isStandard)}
          onSelectList={setSelectedListId}
          onDeleteList={handleDeleteList}
          onAddList={() => setListDialog({ open: true, name: '', copyFromStandard: true })}
        />
      )}

      {selectedListId && selectedList && (
        <ShoppingListView
          list={selectedList}
          items={listItems}
          categories={categories}
          categoryFilter={categoryFilter}
          setCategoryFilter={setCategoryFilter}
          onAddItem={() => handleAddItem(selectedListId)}
          onEditItem={(item) => handleEditItem(item, selectedListId)}
          onDeleteItem={handleDeleteItemFromList}
          onMoveToInventory={onMoveToInventory}
          currency={currency}
          pickingMode={pickingMode}
          setPickingMode={setPickingMode}
          pickedItems={pickedItems}
          setPickedItems={setPickedItems}
          onBack={() => setSelectedListId(null)}
        />
      )}

      {selectedListId && (
        <Fab
          color="secondary"
          sx={{ position: 'fixed', bottom: 80, right: 24 }}
          onClick={() => handleAddItem(selectedListId)}
        >
          <Add />
        </Fab>
      )}

      <Dialog open={listDialog.open} onClose={() => setListDialog({ open: false, name: '', copyFromStandard: true })}>
        <DialogTitle>{t('newShoppingList')}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="List Name"
            value={listDialog.name}
            onChange={(e) => setListDialog({ ...listDialog, name: e.target.value })}
            onKeyPress={(e) => e.key === 'Enter' && handleAddList()}
            sx={{ mb: 2 }}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={listDialog.copyFromStandard}
                onChange={(e) => setListDialog({ ...listDialog, copyFromStandard: e.target.checked })}
              />
            }
            label={t('copyFromStandard')}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setListDialog({ open: false, name: '', copyFromStandard: true })}>{t('cancel')}</Button>
          <Button onClick={handleAddList} variant="contained">{t('create')}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={itemDialog.open} onClose={() => setItemDialog({ open: false, mode: 'add', item: null, listId: null })} maxWidth="sm" fullWidth>
        <DialogTitle>{itemDialog.mode === 'add' ? t('addItem') : t('editItem')}</DialogTitle>
        <ItemForm
          item={itemDialog.item}
          categories={categories}
          onSave={handleSaveItem}
          onCancel={() => setItemDialog({ open: false, mode: 'add', item: null, listId: null })}
          onDelete={itemDialog.mode === 'edit' ? () => handleDeleteItemFromList(itemDialog.item!.id) : undefined}
          isEdit={itemDialog.mode === 'edit'}
        />
      </Dialog>

      <Dialog open={saveToInventoryDialog.open} onClose={() => setSaveToInventoryDialog({ open: false })} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CheckCircle color="success" />
          All Items Picked!
        </DialogTitle>
        <DialogContent>
          <Alert severity="success" sx={{ mb: 2 }}>
            All {listItems.length} items in this list have been picked!
          </Alert>
          <Typography>
            Would you like to save these items to your inventory?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSaveToInventoryDialog({ open: false })}>Continue Shopping</Button>
          <Button onClick={handleSavePickedItemsToInventory} variant="contained" color="success">
            Save to Inventory
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
