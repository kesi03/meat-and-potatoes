import { useState, useEffect, useCallback } from 'react';
import { Box } from '@mui/material';
import ListsOverview from '../components/ListsOverview';
import ShoppingListView from '../components/ShoppingListView';
import { useApp } from '../context/AppContext';
import { useAppBarActions } from '../context/AppBarActions';
import type { ShoppingItem } from '../context/AppContext';
import { generateId } from '../meat';
import { ListDialog, ItemDialog, SaveToInventoryDialog } from '../components/dialogs';

const STORAGE_KEY = 'shopping-list-picked-items';

const loadPickedItems = (listId: string): Set<string> => {
  try {
    const stored = localStorage.getItem(`${STORAGE_KEY}-${listId}`);
    return stored ? new Set(JSON.parse(stored)) : new Set();
  } catch {
    return new Set();
  }
};

const savePickedItems = (listId: string, items: Set<string>) => {
  localStorage.setItem(`${STORAGE_KEY}-${listId}`, JSON.stringify([...items]));
};

interface ListsPageProps {
  onMoveToInventory: (item: ShoppingItem) => void;
  initialListId?: string;
}

export enum ToggleMode{
  PICK = 'pick',
  BROWSE = 'browse',
}

export default function ListsPage({ onMoveToInventory, initialListId }: ListsPageProps) {
  const { shoppingLists, addShoppingList, deleteShoppingList, addItemToList, updateItemInList, deleteItemFromList, categories, currency, moveItemToInventory, activeListId } = useApp();
  const appBarActions = useAppBarActions();
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [pickingMode, setPickingMode] = useState<ToggleMode>(ToggleMode.PICK);
  const [pickedItems, setPickedItems] = useState<Set<string>>(new Set());
  const [listDialog, setListDialog] = useState({ open: false, name: '', copyFromStandard: true });
  const [itemDialog, setItemDialog] = useState<{ open: boolean; mode: 'add' | 'edit'; item: ShoppingItem | null; listId: string | null }>({ open: false, mode: 'add', item: null, listId: null });
  const [saveToInventoryDialog, setSaveToInventoryDialog] = useState({ open: false });
  console.log("ListsPage pickingMode:", pickingMode);

  useEffect(() => {
    if (initialListId) {
      setSelectedListId(initialListId);
    }
  }, [initialListId]);

  useEffect(() => {
    if (selectedListId) {
      setPickedItems(loadPickedItems(selectedListId));
    }
  }, [selectedListId]);

  const handleSetPickedItems = useCallback((items: Set<string> | ((prev: Set<string>) => Set<string>)) => {
    setPickedItems(prev => {
      const newItems = typeof items === 'function' ? items(prev) : items;
      if (selectedListId) {
        savePickedItems(selectedListId, newItems);
      }
      return newItems;
    });
  }, [selectedListId]);

  useEffect(() => {
    appBarActions.current.openAddList = () => setListDialog({ open: true, name: '', copyFromStandard: true });
    appBarActions.current.openAddItem = () => {
      const listId = selectedListId || activeListId;
      console.log('Opening add item dialog for listId:', listId);
      if (listId) setItemDialog({ open: true, mode: 'add', item: null, listId });
    };
  }, [appBarActions, selectedListId, activeListId]);

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
    const listId = itemDialog.listId || selectedListId;
    if (!listId) return;
    deleteItemFromList(listId, itemId);
  };

  const selectedList = shoppingLists.find(l => l.id === selectedListId);
  const listItems = selectedList?.items?.filter(item => !categoryFilter || item.category === categoryFilter) || [];

  useEffect(() => {
    if (pickingMode && selectedList && listItems.length > 0 && pickedItems.size === listItems.length) {
      setTimeout(() => {
        setSaveToInventoryDialog({ open: true });
      }, 300);
    }
  }, [pickingMode, selectedList, listItems.length, pickedItems.size]);

  const handleSavePickedItemsToInventory = () => {
    if (!selectedListId) return;
    
    listItems.forEach(item => {
      if (pickedItems.has(item.id)) {
        moveItemToInventory(selectedListId, item.id, item.quantity);
      }
    });

    setSaveToInventoryDialog({ open: false });
    setPickingMode(ToggleMode.BROWSE);
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
          addItemToList={addItemToList}
          currency={currency}
          pickingMode={pickingMode}
          setPickingMode={setPickingMode}
          pickedItems={pickedItems}
          setPickedItems={handleSetPickedItems}
          onBack={() => setSelectedListId(null)}
        />
      )}

      <ListDialog
        open={listDialog.open}
        name={listDialog.name}
        copyFromStandard={listDialog.copyFromStandard}
        onNameChange={(name) => setListDialog({ ...listDialog, name })}
        onCopyFromStandardChange={(copyFromStandard) => setListDialog({ ...listDialog, copyFromStandard })}
        onSave={handleAddList}
        onCancel={() => setListDialog({ open: false, name: '', copyFromStandard: true })}
      />

      <ItemDialog
        open={itemDialog.open}
        mode={itemDialog.mode}
        item={itemDialog.item}
        categories={categories}
        onSave={handleSaveItem}
        onCancel={() => setItemDialog({ open: false, mode: 'add', item: null, listId: null })}
        onDelete={itemDialog.mode === 'edit' ? () => handleDeleteItemFromList(itemDialog.item!.id) : undefined}
      />

      <SaveToInventoryDialog
        open={saveToInventoryDialog.open}
        itemCount={listItems.length}
        onSave={handleSavePickedItemsToInventory}
        onCancel={() => setSaveToInventoryDialog({ open: false })}
      />
    </Box>
  );
}
