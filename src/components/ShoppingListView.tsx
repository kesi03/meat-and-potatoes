import { useState } from 'react';
import {
  Box,
  Typography,
  Chip,
  ToggleButton,
  ToggleButtonGroup,
  Button,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Checkbox,
  Alert,
} from '@mui/material';
import {
  List as ListIcon,
  PlayArrow,
  ArrowBack,
} from '@mui/icons-material';
import ItemCard from './ItemCard';
import type { ShoppingItem } from '../context/AppContext';
import type { CurrencyCode } from '../meat';
import { formatCurrency } from '../meat';

interface ShoppingListViewProps {
  list?: {
    id: string;
    name: string;
    isStandard: boolean;
    items: ShoppingItem[];
  };
  items: ShoppingItem[];
  categories: Array<{ id: string; name: string }>;
  categoryFilter: string;
  setCategoryFilter: (filter: string) => void;
  onAddItem: () => void;
  onEditItem: (item: ShoppingItem) => void;
  onDeleteItem: (itemId: string) => void;
  onMoveToInventory: (item: ShoppingItem) => void;
  currency: CurrencyCode;
  pickingMode: boolean;
  setPickingMode: (mode: boolean) => void;
  pickedItems: Set<string>;
  setPickedItems: React.Dispatch<React.SetStateAction<Set<string>>>;
  onBack?: () => void;
}

export default function ShoppingListView({
  list,
  items,
  categories,
  categoryFilter,
  setCategoryFilter,
  onAddItem,
  onEditItem,
  onDeleteItem,
  onMoveToInventory,
  currency,
  pickingMode,
  setPickingMode,
  pickedItems,
  setPickedItems,
  onBack,
}: ShoppingListViewProps) {
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
        {onBack && (
          <Button startIcon={<ArrowBack />} onClick={onBack} sx={{ mr: 1 }}>
            Back
          </Button>
        )}
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
                      secondary={`Qty: ${item.quantity}`} 
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
              expanded={false}
              onToggle={() => {}}
              onEdit={() => onEditItem(item)}
              onMoveToInventory={() => onMoveToInventory(item)}
              categories={categories}
              currency={currency}
              showMoveToInventory={!list?.isStandard}
            />
          ))}
        </Box>
      )}
    </Box>
  );
}
