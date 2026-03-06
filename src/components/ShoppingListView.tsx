import { useState } from 'react';
import {
  Box,
  Typography,
  Chip,
  ToggleButton,
  ToggleButtonGroup,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Checkbox,
  Alert,
  Breadcrumbs,
  Link,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  List as ListIcon,
  PlayArrow,
  Home,
} from '@mui/icons-material';
import ItemCard from './ItemCard';
import type { ShoppingItem, Category } from '../context/AppContext';
import { getCategoryName } from '../context/AppContext';
import type { CurrencyCode } from '../meat';
import { formatCurrency, getTranslatedItemName } from '../meat';
import { useTranslation } from 'react-i18next';
import SwipeableListItem from './SwipeableListItem';
import { ToggleMode } from '../pages/ListsPage';
import { Case, Switch } from './Switch';

interface ShoppingListViewProps {
  list?: {
    id: string;
    name: string;
    isStandard: boolean;
    items: ShoppingItem[];
  };
  items: ShoppingItem[];
  categories: Category[];
  categoryFilter: string;
  setCategoryFilter: (filter: string) => void;
  onAddItem: () => void;
  onEditItem: (item: ShoppingItem) => void;
  onDeleteItem: (itemId: string) => void;
  onMoveToInventory: (item: ShoppingItem) => void;
  addItemToList: (listId: string, item: Omit<ShoppingItem, 'id'>) => void;
  currency: CurrencyCode;
  pickingMode: ToggleMode
  setPickingMode: (pickMode: ToggleMode) => void;
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
  addItemToList,
  currency,
  pickingMode,
  setPickingMode,
  pickedItems,
  setPickedItems,
  onBack,
}: ShoppingListViewProps) {
  const { t, i18n } = useTranslation();
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  const totalCost = items.reduce(
    (sum, item) => sum + (item.cost || 0) * item.quantity,
    0
  );

  const pickedCost = items
    .filter(item => pickedItems.has(item.id))
    .reduce((sum, item) => sum + (item.cost || 0) * item.quantity, 0);

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
    <Box data-testid="shopping-list-view">
      <Breadcrumbs aria-label="breadcrumb" separator="›" sx={{ mb: 2 }}>
        <Typography sx={{ color: 'text.primary' }}>
          <Home sx={{ mr: 0.5 }} fontSize="small" />
        </Typography>
        <Link sx={{ color: 'text.primary' }} href="/lists">
          {t('myLists')}
        </Link>
        <Typography sx={{ color: 'text.primary' }}>{list?.name}</Typography>
      </Breadcrumbs>

      <Box
        sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}
        data-testid="list-controls"
      >
        <ToggleButtonGroup
          value={pickingMode}
          exclusive
          onChange={(_, newMode) => {
            if (newMode !== null) {
              setPickingMode(newMode);
            }
          }}
          data-testid="mode-toggle"
        >
          <ToggleButton value={ToggleMode.PICK} data-testid="pick-button">
            <PlayArrow sx={{ mr: 1 }} />
            {t('pick')}
          </ToggleButton>

          <ToggleButton value={ToggleMode.BROWSE} data-testid="browse-button">
            <ListIcon sx={{ mr: 1 }} />
            {t('browse')}
          </ToggleButton>
        </ToggleButtonGroup>
        <>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Category</InputLabel>
                <Select
                  value={categoryFilter}
                  label="Category"
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  data-testid="category-filter"
                >
                  <MenuItem value="">All</MenuItem>
                  {categories.map(cat => (
                    <MenuItem key={cat.id} value={cat.name}>
                      {getCategoryName(cat, i18n.language)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </>
        <Switch mode={pickingMode}>
          <Case value={ToggleMode.PICK}>
            <Box sx={{ ml: 'auto', textAlign: 'right' }} data-testid="cost-display">
              <Typography variant="h6" color="primary" data-testid="picking-progress">
                {pickedItems.size} / {items.length} ({formatCurrency(pickedCost, currency)})
              </Typography>
            </Box>
          </Case>
          <Case value={ToggleMode.BROWSE}>
            
            <Box sx={{ ml: 'auto', textAlign: 'right' }} data-testid="cost-display">

              <Typography variant="h6" color="primary" data-testid="total-cost">
                Total: {formatCurrency(totalCost, currency)}
              </Typography>
            </Box>
          </Case>
        </Switch>
      </Box>

      <Switch mode={pickingMode}>
        <Case value={ToggleMode.PICK}>
          <Box data-testid="pick-mode-list">
            {Object.entries(groupedItems).map(([category, categoryItems]) => (
              <Box key={category} sx={{ mb: 3 }}>
                <Typography
                  variant="subtitle1"
                  fontWeight={600}
                  sx={{ mb: 1, color: 'primary.main' }}
                >
                  {category}
                </Typography>

                <List>
                  {categoryItems.map(item => (
                    <SwipeableListItem
                      key={item.id}
                      item={item}
                      onDelete={() => {
                        console.log('Deleting item', item.id);
                        onDeleteItem(item.id);
                      }}
                    >
                      <ListItem
                        key={item.id}
                        data-testid={`pick-item-${item.id}`}
                        sx={{
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
                          <Avatar
                            sx={{
                              bgcolor: pickedItems.has(item.id)
                                ? 'success.main'
                                : 'primary.light',
                            }}
                          >
                            {item.name[0]}
                          </Avatar>
                        </ListItemAvatar>

                        <ListItemText
                          primary={getTranslatedItemName(item.name, t)}
                          secondary={`Qty: ${item.quantity}`}
                        />
                      </ListItem>
                    </SwipeableListItem>
                  ))}
                </List>
              </Box>
            ))}
          </Box>
        </Case>

        <Case value={ToggleMode.BROWSE}>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {items.map(item => (
              <ItemCard
                key={item.id}
                item={item}
                expanded={expandedItem === item.id}
                onToggle={() =>
                  setExpandedItem(expandedItem === item.id ? null : item.id)
                }
                onEdit={() => onEditItem(item)}
                onDelete={() => onDeleteItem(item.id)}
                onMoveToInventory={() => onMoveToInventory(item)}
                categories={categories}
                currency={currency}
                showMoveToInventory={!list?.isStandard}
              />
            ))}
          </Box>
        </Case>
      </Switch>
    </Box>
  );
}