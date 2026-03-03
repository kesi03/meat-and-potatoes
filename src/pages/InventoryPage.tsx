import { useState } from 'react';
import { Box, Fab, Dialog, DialogTitle } from '@mui/material';
import { Add } from '@mui/icons-material';
import InventoryView from '../components/InventoryView';
import ItemForm from '../components/ItemForm';
import { useApp } from '../context/AppContext';
import type { InventoryItem } from '../context/AppContext';
import { useTranslation } from 'react-i18next';

export default function InventoryPage() {
  const { t } = useTranslation();
  const { inventory, categories, currency, addInventoryItem, updateInventoryItem, deleteInventoryItem, clearInventory } = useApp();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'add' | 'edit'>('add');
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  const inventoryByCategory = categories.reduce((acc, cat) => {
    const items = inventory.filter(item => item.category === cat.name);
    if (items.length > 0) {
      acc[cat.name] = items;
    }
    return acc;
  }, {} as Record<string, InventoryItem[]>);

  const getExpirationStats = () => {
    const now = new Date();
    const expired: InventoryItem[] = [];
    const expiringSoon: InventoryItem[] = [];
    const fresh: InventoryItem[] = [];

    inventory.forEach(item => {
      if (!item.bestByDate) {
        fresh.push(item);
        return;
      }
      const bestBy = new Date(item.bestByDate);
      const daysUntil = Math.ceil((bestBy.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      if (daysUntil < 0) expired.push(item);
      else if (daysUntil <= 3) expiringSoon.push(item);
      else fresh.push(item);
    });

    return { expired, expiringSoon, fresh };
  };

  const handleAddItem = () => {
    setSelectedItem(null);
    setDialogMode('add');
    setDialogOpen(true);
  };

  const handleEditItem = (item: InventoryItem) => {
    setSelectedItem(item);
    setDialogMode('edit');
    setDialogOpen(true);
  };

  const handleSaveItem = (data: any) => {
    if (dialogMode === 'add') {
      addInventoryItem(data);
    } else if (selectedItem) {
      updateInventoryItem(selectedItem.id, data);
    }
    setDialogOpen(false);
  };

  const handleDeleteItem = () => {
    if (selectedItem) {
      deleteInventoryItem(selectedItem.id);
      setDialogOpen(false);
    }
  };

  const handleClearAll = () => {
    if (inventory.length === 0) return;
    if (window.confirm('Are you sure you want to remove all items from inventory?')) {
      clearInventory();
    }
  };

  return (
    <Box sx={{ pb: 10 }}>
      <InventoryView
        inventory={inventory}
        categories={categories}
        inventoryByCategory={inventoryByCategory}
        expirationStats={getExpirationStats()}
        onEditItem={handleEditItem}
        onDeleteItem={deleteInventoryItem}
        onClearInventory={handleClearAll}
        currency={currency}
      />

      <Fab
        color="secondary"
        sx={{ position: 'fixed', bottom: 80, right: 24 }}
        onClick={handleAddItem}
      >
        <Add />
      </Fab>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{dialogMode === 'add' ? t('addItem') : t('editItem')}</DialogTitle>
        <ItemForm
          item={selectedItem}
          categories={categories}
          onSave={handleSaveItem}
          onCancel={() => setDialogOpen(false)}
          onDelete={dialogMode === 'edit' ? handleDeleteItem : undefined}
          isEdit={dialogMode === 'edit'}
          showHomeQuantity
        />
      </Dialog>
    </Box>
  );
}
