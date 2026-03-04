import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Chip,
  IconButton,
  Button,
  ToggleButton,
  ToggleButtonGroup,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  ButtonGroup,
} from '@mui/material';
import { Store, Warning, CheckCircle, Edit, Delete, Add } from '@mui/icons-material';
import { getExpirationStatus, formatCurrency, CurrencyCode, getDaysUntilExpiration } from '../meat';
import type { InventoryItem, Category } from '../context/AppContext';
import { getCategoryName } from '../context/AppContext';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { t } from 'i18next';

interface InventoryViewProps {
  inventory: InventoryItem[];
  categories: Category[];
  inventoryByCategory: Record<string, InventoryItem[]>;
  expirationStats: {
    expired: InventoryItem[];
    expiringSoon: InventoryItem[];
    fresh: InventoryItem[];
  };
  handleAddItem: () => void;
  onEditItem: (item: InventoryItem) => void;
  onDeleteItem: (id: string) => void;
  onClearInventory: () => void;
  currency: CurrencyCode;
}

export default function InventoryView({
  inventory,
  categories,
  inventoryByCategory,
  expirationStats,
  handleAddItem,
  onEditItem,
  onDeleteItem,
  onClearInventory,
  currency,
}: InventoryViewProps) {
  const { t, i18n } = useTranslation();
  const [expirationFilter, setExpirationFilter] = useState<string>('all');
 
  
  const getTranslatedCategoryName = (catName: string) => {
    const cat = categories.find(c => c.name === catName);
    return cat ? getCategoryName(cat, i18n.language) : catName;
  };

  const getFilteredItems = (items: InventoryItem[]) => {
    if (expirationFilter === 'all') return items;
    return items.filter(item => {
      const status = getExpirationStatus(item.bestByDate);
      if (expirationFilter === 'fresh') {
        return status === 'fresh' || status === 'unknown';
      }
      return status === expirationFilter;
    });
  };
  
  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h6" gutterBottom>{t('inventory')}</Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Chip 
              icon={<Warning />} 
              label={`${t('expired')}: ${expirationStats.expired.length}`} 
              color={expirationFilter === 'expired' ? 'error' : 'default'}
              onClick={() => setExpirationFilter(expirationFilter === 'expired' ? 'all' : 'expired')}
              sx={{ cursor: 'pointer' }}
            />
            <Chip 
              icon={<Warning />} 
              label={`${t('expiringSoon')}: ${expirationStats.expiringSoon.length}`} 
              color={expirationFilter === 'expiring-soon' ? 'warning' : 'default'}
              onClick={() => setExpirationFilter(expirationFilter === 'expiring-soon' ? 'all' : 'expiring-soon')}
              sx={{ cursor: 'pointer' }}
            />
            <Chip 
              icon={<CheckCircle />} 
              label={`${t('fresh')}: ${expirationStats.fresh.length}`} 
              color={expirationFilter === 'fresh' ? 'success' : 'default'}
              onClick={() => setExpirationFilter(expirationFilter === 'fresh' ? 'all' : 'fresh')}
              sx={{ cursor: 'pointer' }}
            />
          </Box>
        </Box>
        
      </Box>
      {inventory.length > 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
            <ButtonGroup variant="outlined" color="error" size="small">
              <Button
                color="primary"
                variant="contained"
                startIcon={<Add />}
                onClick={handleAddItem}>{t('add')}</Button>
               <Button
              variant="contained"
              color="error"
              size="small"
              startIcon={<Delete />}
              onClick={onClearInventory}
            >
              {t('clearAllInventory')}
            </Button>
            </ButtonGroup>
          </Box>
        )}

      {inventory.length === 0 ? (
        <Typography color="text.secondary">{t('inventory')} is empty. Add items from your shopping lists.</Typography>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {Object.entries(inventoryByCategory).map(([category, items]) => {
            const filteredItems = getFilteredItems(items);
            if (filteredItems.length === 0) return null;
            return (
              <Box key={category}>
                <Typography variant="subtitle1" sx={{ mt: 2, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Store /> {getTranslatedCategoryName(category)}
                </Typography>
                <List>
                  {filteredItems.map(item => (
                    <InventoryListItem
                      key={item.id}
                      item={item}
                      currency={currency}
                      onEdit={() => onEditItem(item)}
                      onDelete={() => onDeleteItem(item.id)}
                      getTranslatedCategoryName={getTranslatedCategoryName}
                    />
                  ))}
                </List>
              </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );
}

interface InventoryListItemProps {
  item: InventoryItem;
  currency: CurrencyCode;
  onEdit: () => void;
  onDelete: () => void;
  getTranslatedCategoryName: (catName: string) => string;
}

function getNutriscoreColor(grade: string): "success" | "warning" | "error" | "info" | "default" {
  const colors: Record<string, "success" | "warning" | "error" | "info" | "default"> = {
    'a': 'success',
    'b': 'info',
    'c': 'warning',
    'd': 'warning',
    'e': 'error',
  };
  return colors[grade?.toLowerCase()] || 'default';
}

function InventoryListItem({ item, currency, onEdit, onDelete, getTranslatedCategoryName }: InventoryListItemProps) {
  const expirationStatus = getExpirationStatus(item.bestByDate);
  const daysLeft = getDaysUntilExpiration(item.bestByDate);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const handleDelete = () => {
    setDeleteConfirmOpen(true);
  };

  const statusColors = {
    expired: 'error',
    'expiring-soon': 'warning',
    fresh: 'success',
    unknown: 'default',
  };

  return (
    <ListItem
      sx={{ 
        bgcolor: 'background.paper', 
        mb: 1, 
        borderRadius: 1,
        borderLeft: 4,
        borderColor: `${statusColors[expirationStatus]}.main`,
      }}
      secondaryAction={
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ textAlign: 'right', mr: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Home: {item.homeQuantity}
            </Typography>
            {item.bestByDate && (
              <Typography variant="caption" color={`${statusColors[expirationStatus]}.main`}>
                {daysLeft !== null && (daysLeft < 0 ? `Expired ${Math.abs(daysLeft)}d` : `${daysLeft}d left`)}
              </Typography>
            )}
          </Box>
          <IconButton onClick={onEdit} size="small">
            <Edit fontSize="small" />
          </IconButton>
          <IconButton onClick={handleDelete} size="small" color="error">
            <Delete fontSize="small" />
          </IconButton>
        </Box>
      }
    >
      <ListItemAvatar>
        {item.image ? (
          <Avatar src={item.image} sx={{ bgcolor: 'primary.light' }}>{item.name[0]}</Avatar>
        ) : (
          <Avatar sx={{ bgcolor: 'primary.light' }}>{item.name[0]}</Avatar>
        )}
      </ListItemAvatar>
      <ListItemText 
        primary={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="subtitle1">{item.name}</Typography>
            {item.nutriscore && (
              <Chip label={item.nutriscore.toUpperCase()} size="small" color={getNutriscoreColor(item.nutriscore)} />
            )}
          </Box>
        } 
        secondary={
          <Box component="span" sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
            <Chip label={getTranslatedCategoryName(item.category)} size="small" />
            {item.location && <Chip label={item.location} size="small" variant="outlined" />}
            {item.allergens && <Chip label={item.allergens} size="small" color="error" />}
            {item.labels && <Chip label={item.labels.split(',')[0]} size="small" variant="outlined" />}
            {item.cost && <Typography variant="caption">{formatCurrency(item.cost, currency)}</Typography>}
          </Box>
        }
      />
     <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle>{t('confirmDelete') || 'Confirm Delete'}</DialogTitle>
          <DialogContent>
            <Typography>{t('confirmDeleteMessage', { defaultValue: 'Are you sure you want to delete "{{name}}"?', name: item.name })}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>{t('cancel')}</Button>
          <Button onClick={() => { onDelete?.(); setDeleteConfirmOpen(false); }} color="error" variant="contained">
            {t('delete')}
          </Button>
        </DialogActions>
      </Dialog>
       </ListItem>
  );
}
