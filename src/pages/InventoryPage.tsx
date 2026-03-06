import { useState, useEffect } from 'react';
import { Box } from '@mui/material';
import { Add } from '@mui/icons-material';
import InventoryView from '../components/InventoryView';
import { useApp } from '../context/AppContext';
import { useAppBarActions } from '../context/AppBarActions';
import type { InventoryItem } from '../context/AppContext';
import { ItemDialog, ConfirmDialog } from '../components/dialogs';

export default function InventoryPage() {
  const { inventory, categories, currency, addInventoryItem, updateInventoryItem, deleteInventoryItem, clearInventory } = useApp();
  const appBarActions = useAppBarActions();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'add' | 'edit'>('add');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  useEffect(() => {
    appBarActions.current.openAddInventory = () => {
      setSelectedItem(null);
      setDialogMode('add');
      setDialogOpen(true);
    };
  }, [appBarActions]);

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

  return (
    <Box sx={{ pb: 10 }}>
      <InventoryView
        inventory={inventory}
        categories={categories}
        inventoryByCategory={inventoryByCategory}
        expirationStats={getExpirationStats()}
        onEditItem={handleEditItem}
        onDeleteItem={deleteInventoryItem}
        onClearInventory={() => setDeleteConfirmOpen(true)}
        handleAddItem={handleAddItem}
        currency={currency}
      />

      <ItemDialog
        open={dialogOpen}
        mode={dialogMode}
        item={selectedItem}
        categories={categories}
        onSave={handleSaveItem}
        onCancel={() => setDialogOpen(false)}
        onDelete={dialogMode === 'edit' ? handleDeleteItem : undefined}
        showHomeQuantity
      />

      <ConfirmDialog
        open={deleteConfirmOpen}
        title="Confirm Clear Inventory"
        message="Are you sure you want to clear all inventory items? This action cannot be undone."
        confirmLabel="Yes"
        cancelLabel="No"
        onConfirm={() => { clearInventory(); setDeleteConfirmOpen(false); }}
        onCancel={() => setDeleteConfirmOpen(false)}
        confirmColor="error"
      />
    </Box>
  );
}
