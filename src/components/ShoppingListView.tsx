import { useState } from 'react';
import {
  Box,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Checkbox,
  Breadcrumbs,
  Link,
  Tooltip,
} from '@mui/material';
import {
  List as ListIcon,
  Home,
  LibraryBooks,
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
import { CategoryMenu } from './CategoryMenu';

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
  pickedItems: string[];
  setPickedItems: (itemId: string) => void;
  onBack?: () => void;
  onShare?: () => void;
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
  onShare,
}: ShoppingListViewProps) {
  const { t, i18n } = useTranslation();
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  const totalCost = items.reduce(
    (sum, item) => sum + (item.cost || 0) * item.quantity,
    0
  );

  const pickedCost = items
    .filter(item => pickedItems.includes(item.id))
    .reduce((sum, item) => sum + (item.cost || 0) * item.quantity, 0);

  const handleTogglePick = (itemId: string) => {
    setPickedItems(itemId);
  };

  const filteredItems = categoryFilter
    ? items.filter(item => item.category === categoryFilter)
    : items;

  const groupedItems = categories.reduce((acc, cat) => {
    const catItems = filteredItems.filter(item => item.category === cat.name);
    if (catItems.length > 0) {
      acc[cat.name] = catItems;
    }
    return acc;
  }, {} as Record<string, typeof items>);

  const getTranslatedCategoryName = (categoryName: string): string => {
    const category = categories.find(cat => cat.name === categoryName);
    return category ? getCategoryName(category, i18n.language) : categoryName;
  }

  const pageBreadcrumbs = (
    <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
       <Typography sx={{ color: 'text.primary' }}><Home sx={{ mr: 0.5 }} fontSize="small" /></Typography>
                
      {onBack && (
        <Link sx={{ color: 'text.primary' }} href="/lists">
          {t('myLists')}
        </Link>
      )}
      <Typography sx={{ color: 'text.primary' }}>{list?.name}</Typography>
    </Breadcrumbs>
  );

  return (
    <Box data-testid="shopping-list-view">
    {pageBreadcrumbs}

      <Box
        sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}
        data-testid="list-controls"
      >
         
        <Box sx={{ display: 'flex' }}>
         
        <ToggleButtonGroup
          value={pickingMode}
          size="small"
          color='success'
          exclusive
          onChange={(_, newMode) => {
            if (newMode !== null) {
              setPickingMode(newMode);
            }
          }}
          data-testid="mode-toggle"
        >
          <Tooltip title={t('pick')}>
            <ToggleButton value={ToggleMode.PICK} size="small" data-testid="pick-button">
              <ListIcon sx={{ mr: 1 }} fontSize="small" />
            </ToggleButton>
          </Tooltip>
          <Tooltip title={t('browse')}>
            <ToggleButton value={ToggleMode.BROWSE} size="small" data-testid="browse-button">
              <LibraryBooks sx={{ mr: 1 }} fontSize="small" />
            </ToggleButton>
          </Tooltip>

        </ToggleButtonGroup>
         <CategoryMenu
          categoryFilter={categoryFilter}
          setCategoryFilter={setCategoryFilter}
          categories={categories}
          t={t}
          i18n={i18n}
          getCategoryName={getCategoryName}
        />
        </Box>
      </Box>

      <Switch mode={pickingMode}>
        <Case value={ToggleMode.PICK}>
          <Box data-testid="pick-mode-list">
            <Box sx={{ ml: 'auto', textAlign: 'right' }} data-testid="cost-display">

            <Typography variant="subtitle1" color="primary" fontWeight={500} data-testid="picking-progress">
                {pickedItems.length} / {items.length} ({formatCurrency(pickedCost, currency)})
              </Typography>
            </Box>
            {Object.entries(groupedItems).map(([category, categoryItems]) => (
              <Box key={category} sx={{ mb: 3 }}>
                <Typography
                  variant="subtitle1"
                  fontWeight={600}
                  sx={{ mb: 1, color: 'primary.main' }}
                >
                  {getTranslatedCategoryName(category)}
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
                          textDecoration: pickedItems.includes(item.id) ? 'line-through' : 'none',
                          opacity: pickedItems.includes(item.id) ? 0.6 : 1,
                        }}
                        secondaryAction={
                          <Checkbox
                            checked={pickedItems.includes(item.id)}
                            onChange={() => handleTogglePick(item.id)}
                          />
                        }
                      >
                        <ListItemAvatar>
                          <Avatar
                            sx={{
                              bgcolor: pickedItems.includes(item.id)
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
            <Box sx={{ ml: 'auto', textAlign: 'right' }} data-testid="cost-display">

             <Typography variant="subtitle1" color="primary" fontWeight={500} data-testid="total-cost">
                Total: {formatCurrency(totalCost, currency)}
              </Typography>
            </Box>
            {filteredItems.map(item => (
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