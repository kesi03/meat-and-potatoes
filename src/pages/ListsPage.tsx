import { useState, useEffect, useCallback } from 'react';
import { Box } from '@mui/material';
import ListsOverview from '../components/ListsOverview';
import ShoppingListView from '../components/ShoppingListView';
import { useApp } from '../context/AppContext';
import { useAppBarActions } from '../context/AppBarActions';
import type { ShoppingItem } from '../context/AppContext';
import { generateId } from '../meat';
import { ListDialog, ItemDialog, SaveToInventoryDialog, ShareDialog } from '../components/dialogs';
import { db } from '../firebase';
import { ref, remove } from 'firebase/database';

interface ListsPageProps {
  onMoveToInventory: (item: ShoppingItem) => void;
  initialListId?: string;
}

export enum ToggleMode{
  PICK = 'pick',
  BROWSE = 'browse',
}

export default function ListsPage({ onMoveToInventory, initialListId }: ListsPageProps) {
  const { shoppingLists, sharedLists, memberProfiles, sharedListItems, sharedListPickedItems, memberPickedItems, addShoppingList, deleteShoppingList, addItemToList, updateItemInList, deleteItemFromList, categories, currency, moveItemToInventory, activeListId, togglePickedItem, shareList, user, setActiveListId } = useApp();
  const appBarActions = useAppBarActions();
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [pickingMode, setPickingMode] = useState<ToggleMode>(ToggleMode.PICK);
  const [listDialog, setListDialog] = useState({ open: false, name: '', copyFromStandard: true });
  const [itemDialog, setItemDialog] = useState<{ open: boolean; mode: 'add' | 'edit'; item: ShoppingItem | null; listId: string | null }>({ open: false, mode: 'add', item: null, listId: null });
  const [saveToInventoryDialog, setSaveToInventoryDialog] = useState({ open: false });
  const [shareDialog, setShareDialog] = useState({ open: false, listId: '', listName: '' });

  useEffect(() => {
    if (initialListId) {
      setSelectedListId(initialListId);
    }
  }, [initialListId]);

  useEffect(() => {
    if (selectedListId) {
      const isShared = sharedLists.some(l => l.listId === selectedListId);
      if (isShared) {
        setActiveListId(selectedListId);
      }
    }
  }, [selectedListId, sharedLists, setActiveListId]);

  useEffect(() => {
    if (!selectedListId) {
      const listFromUrl = window.location.pathname.match(/\/list\/(.+)/);
      if (listFromUrl) {
        const urlSlug = listFromUrl[1];
        // Convert URL slug to list name: my-shopping-list -> My Shopping List
        const listNameFromSlug = urlSlug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        
        // First check shared lists
        const matchedSharedList = sharedLists.find(l => (l.listName || (l as any).name)?.toLowerCase() === urlSlug.toLowerCase() || (l.listName || (l as any).name)?.toLowerCase() === listNameFromSlug.toLowerCase());
        if (matchedSharedList) {
          setSelectedListId(matchedSharedList.listId);
          setActiveListId(matchedSharedList.listId);
          return;
        }
        
        // Then check own shopping lists
        const matchedOwnList = shoppingLists.find(l => l.name?.toLowerCase() === urlSlug.toLowerCase() || l.name?.toLowerCase() === listNameFromSlug.toLowerCase());
        if (matchedOwnList) {
          setSelectedListId(matchedOwnList.id);
          setActiveListId(matchedOwnList.id);
        }
      }
    }
  }, [sharedLists, shoppingLists, selectedListId, setActiveListId]);

  const handleSetPickedItems = useCallback((itemId: string) => {
    const listId = selectedListId || activeListId;
    console.log('[ListsPage] handleSetPickedItems itemId:', itemId, 'listId:', listId);
    console.log('[ListsPage] handleSetPickedItems calling togglePickedItem, togglePickedItem exists:', typeof togglePickedItem);
    if (listId) {
      console.log('[ListsPage] about to call togglePickedItem');
      togglePickedItem(listId, itemId);
      console.log('[ListsPage] called togglePickedItem');
    }
  }, [selectedListId, activeListId, togglePickedItem]);

  // Prevent double-toggle by tracking recently toggled items
  const [recentlyToggled, setRecentlyToggled] = useState<Record<string, number>>({});
  
  const handleSetPickedItemsWithDebounce = useCallback((itemId: string) => {
    const now = Date.now();
    const lastToggle = recentlyToggled[itemId] || 0;
    if (now - lastToggle < 500) {
      console.log('[ListsPage] Debouncing toggle for item:', itemId);
      return;
    }
    setRecentlyToggled(prev => ({ ...prev, [itemId]: now }));
    handleSetPickedItems(itemId);
  }, [handleSetPickedItems, recentlyToggled]);

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

  const handleAddItem = (listId: string, ownerId?: string) => {
    setItemDialog({ open: true, mode: 'add', item: null, listId: ownerId ? listId : listId });
    if (ownerId) {
      // Store ownerId temporarily for the save operation
      (window as any).__pendingOwnerId = ownerId;
    }
  };

  const handleEditItem = (item: ShoppingItem, listId: string) => {
    setItemDialog({ open: true, mode: 'edit', item, listId });
  };

  const handleSaveItem = (data: any) => {
    if (!itemDialog.listId) return;
    const ownerId = (window as any).__pendingOwnerId;
    if (itemDialog.mode === 'add') {
      const newItem: ShoppingItem = { ...data, id: generateId() };
      addItemToList(itemDialog.listId, newItem, ownerId);
    } else if (itemDialog.item) {
      updateItemInList(itemDialog.listId, itemDialog.item.id, data);
    }
    setItemDialog({ open: false, mode: 'add', item: null, listId: null });
    (window as any).__pendingOwnerId = undefined;
  };

  const handleDeleteItemFromList = (itemId: string) => {
    const listId = itemDialog.listId || selectedListId;
    const sharedList = sharedLists.find(l => l.listId === listId);
    const ownerId = sharedList?.ownerId;
    
    if (!listId) return;
    
    if (ownerId && user?.uid) {
      const targetOwnerId = ownerId === 'self' ? user.uid : ownerId;
      const itemRef = ref(db, `userData/${targetOwnerId}/shoppingLists/${listId}/items/${itemId}`);
      remove(itemRef);
    } else {
      deleteItemFromList(listId, itemId);
    }
  };

  const selectedList = shoppingLists.find(l => l.id === selectedListId);
  const selectedSharedList = sharedLists.find(l => l.listId === selectedListId);
  const isSharedList = !!selectedSharedList;
  const isSharedListMember = isSharedList && selectedSharedList?.role === 'member';
  console.log('[ListsPage] selectedListId:', selectedListId, 'selectedSharedList:', selectedSharedList, 'isSharedListMember:', isSharedListMember, 'sharedListItems:', sharedListItems.length, 'selectedList?.items:', selectedList?.items?.length);
  const listItems = (isSharedListMember ? sharedListItems : selectedList?.items || []).filter(item => !categoryFilter || item.category === categoryFilter);
  console.log('[ListsPage] listItems:', listItems.length);
  const pickedItems = isSharedList ? [...new Set([...sharedListPickedItems, ...(selectedSharedList?.role === 'owner' ? memberPickedItems : [])])] : (selectedList?.pickedItems || []);
  console.log('[ListsPage] pickedItems:', pickedItems, 'isSharedList:', isSharedList, 'sharedListPickedItems:', sharedListPickedItems);

  useEffect(() => {
    if (pickingMode && selectedList && listItems.length > 0 && pickedItems.length === listItems.length) {
      setTimeout(() => {
        setSaveToInventoryDialog({ open: true });
      }, 300);
    }
  }, [pickingMode, selectedList, listItems.length, pickedItems.length]);

  const handleSavePickedItemsToInventory = () => {
    if (!selectedListId) return;
    
    listItems.forEach(item => {
      if (pickedItems.includes(item.id)) {
        moveItemToInventory(selectedListId, item.id, item.quantity);
      }
    });

    setSaveToInventoryDialog({ open: false });
    setPickingMode(ToggleMode.BROWSE);
  };

  return (
    <Box sx={{ pb: 10 }}>
      {!selectedListId && (
        <ListsOverview
          lists={shoppingLists.filter(l => !l.isStandard)}
          sharedLists={sharedLists}
          memberProfiles={memberProfiles}
          onSelectList={setSelectedListId}
          onDeleteList={handleDeleteList}
          onAddList={() => setListDialog({ open: true, name: '', copyFromStandard: true })}
        />
      )}
      {(selectedListId && (selectedList || isSharedList)) && (
        <ShoppingListView
          list={selectedList || { id: selectedListId, name: selectedSharedList?.listName || '', items: [], isStandard: false }}
          items={listItems}
          shared={isSharedList}
          categories={categories}
          categoryFilter={categoryFilter}
          setCategoryFilter={setCategoryFilter}
          onAddItem={() => handleAddItem(selectedListId, isSharedList ? selectedSharedList?.ownerId : undefined)}
          onEditItem={(item) => handleEditItem(item, selectedListId)}
          onDeleteItem={handleDeleteItemFromList}
          onMoveToInventory={onMoveToInventory}
          addItemToList={addItemToList}
          currency={currency}
          pickingMode={pickingMode}
          setPickingMode={setPickingMode}
          pickedItems={pickedItems}
          setPickedItems={handleSetPickedItems}
          onBack={() => {
            setSelectedListId(null);
            setActiveListId('standard');
          }}
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
