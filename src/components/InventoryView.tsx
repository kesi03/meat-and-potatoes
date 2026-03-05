import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Avatar,
  Collapse,
  Divider,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Paper,
  Grid,
  ToggleButton,
  ToggleButtonGroup,
  Breadcrumbs,
} from '@mui/material';
import { Store, Warning, CheckCircle, Edit, Delete, Add, ExpandMore, ExpandLess, ArrowUpward, ArrowDownward, Home } from '@mui/icons-material';
import { getExpirationStatus, formatCurrency, CurrencyCode, getDaysUntilExpiration } from '../meat';
import type { InventoryItem, Category } from '../context/AppContext';
import { getCategoryName } from '../context/AppContext';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { ConfirmDeleteDialog } from './dialogs';
import { ProductBarcode } from './ProductBarcode';

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
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [dateSort, setDateSort] = useState<'none' | 'asc' | 'desc'>('none');
  
  const getTranslatedCategoryName = (catName: string) => {
    const cat = categories.find(c => c.name === catName);
    return cat ? getCategoryName(cat, i18n.language) : catName;
  };

  const getFilteredItems = (items: InventoryItem[]) => {
    let filtered = items;
    
    if (expirationFilter !== 'all') {
      filtered = items.filter(item => {
        const status = getExpirationStatus(item.bestByDate);
        if (expirationFilter === 'fresh') {
          return status === 'fresh' || status === 'unknown';
        }
        return status === expirationFilter;
      });
    }

    if (dateSort !== 'none') {
      filtered = [...filtered].sort((a, b) => {
        const dateA = a.bestByDate ? new Date(a.bestByDate).getTime() : Infinity;
        const dateB = b.bestByDate ? new Date(b.bestByDate).getTime() : Infinity;
        return dateSort === 'asc' ? dateA - dateB : dateB - dateA;
      });
    }

    return filtered;
  };

  const toggleExpand = (itemId: string) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  return (
    <Box data-testid="inventory-view">
      <Breadcrumbs aria-label="breadcrumb" separator="›" sx={{ mb: 2 }}>
                <Typography sx={{ color: 'text.primary' }}><Home sx={{ mr: 0.5 }} fontSize="small" /></Typography>
                <Typography sx={{ color: 'text.primary' }}>{t('inventory')}</Typography>
            </Breadcrumbs>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
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
            <Box sx={{ ml: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" color="text.secondary">Sort by date:</Typography>
              <ToggleButtonGroup
                value={dateSort}
                exclusive
                onChange={(_, value) => setDateSort(value || 'none')}
                size="small"
              >
                <ToggleButton value="asc" aria-label="sort earliest first">
                  <ArrowUpward fontSize="small" />
                </ToggleButton>
                <ToggleButton value="desc" aria-label="sort latest first">
                  <ArrowDownward fontSize="small" />
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>
          </Box>
        </Box>
        
      </Box>
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
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {filteredItems.map(item => (
                    <InventoryCard
                      key={item.id}
                      item={item}
                      currency={currency}
                      expanded={expandedItems.has(item.id)}
                      onToggle={() => toggleExpand(item.id)}
                      onEdit={() => onEditItem(item)}
                      onDelete={() => onDeleteItem(item.id)}
                      categories={categories}
                      getTranslatedCategoryName={getTranslatedCategoryName}
                    />
                  ))}
                </Box>
              </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );
}

interface InventoryCardProps {
  item: InventoryItem;
  currency: CurrencyCode;
  expanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  categories: Category[];
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

function InventoryCard({ 
  item, 
  currency, 
  expanded, 
  onToggle, 
  onEdit, 
  onDelete,
  categories,
  getTranslatedCategoryName,
}: InventoryCardProps) {
  const { t, i18n } = useTranslation();
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
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
            {item.image ? (
              <Avatar src={item.image} sx={{ width: 48, height: 48 }}>{item.name?.[0]}</Avatar>
            ) : (
              <Avatar sx={{ bgcolor: 'primary.light' }}>{item.name?.[0]}</Avatar>
            )}
            <Box>
              <Typography variant="subtitle1" fontWeight={600}>{item.name}</Typography>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <Chip label={getTranslatedCategoryName(item.category)} size="small" />
                {item.location && <Chip label={item.location} size="small" variant="outlined" />}
                {item.bestByDate && daysLeft !== null && (
                  <Chip
                    size="small"
                    color={statusColors[expirationStatus] as 'error' | 'warning' | 'success' | 'default'}
                    label={daysLeft < 0 ? `Expired ${Math.abs(daysLeft)}d ago` : daysLeft === 0 ? 'Expires today' : `${daysLeft}d left`}
                    icon={expirationStatus === 'expired' ? <Warning /> : expirationStatus === 'expiring-soon' ? <Warning /> : <CheckCircle />}
                  />
                )}
              </Box>
            </Box>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="h6" color="primary">{formatCurrency(item.cost || 0, currency)}</Typography>
            <Typography variant="body2" color="text.secondary">Qty: {item.homeQuantity || item.quantity}</Typography>
            {item.bestByDate && (
              <Typography variant="body2" color={expirationStatus === 'expired' ? 'error' : expirationStatus === 'expiring-soon' ? 'warning' : 'text.secondary'}>
                {new Date(item.bestByDate).toLocaleDateString()}
              </Typography>
            )}
          </Box>
        </Box>
      </CardContent>

      <CardActions sx={{ pt: 0 }}>
        <Button size="small" startIcon={expanded ? <ExpandLess /> : <ExpandMore />} onClick={onToggle}>
          {expanded ? t('less') : t('more')}
        </Button>
        <Button size="small" startIcon={<Edit />} onClick={onEdit} data-testid="edit-item-button">{t('editItem')}</Button>
        <Button size="small" startIcon={<Delete />} onClick={() => setDeleteConfirmOpen(true)} color="error" data-testid="delete-item-button">
          {t('delete')}
        </Button>
      </CardActions>

      <Collapse in={expanded}>
        <Divider />
        <CardContent>
          <Grid container spacing={2}>
            <Grid size={4}>
              {item.description && (
                <Box>
                  <Typography variant="caption" color="text.secondary">{t('description')}</Typography>
                  <Typography variant="body2">{item.description}</Typography>
                </Box>
              )}
            </Grid>
            <Grid size={2}>
              {item.weightSize && (
                <Box>
                  <Typography variant="caption" color="text.secondary">{t('weightSize')}</Typography>
                  <Typography variant="body2">{item.weightSize}</Typography>
                </Box>
              )}
            </Grid>
            <Grid size={2}>
              {item.country && (
                <Box>
                  <Typography variant="caption" color="text.secondary">{t('country')}</Typography>
                  <Typography variant="body2">{item.country}</Typography>
                </Box>
              )}
            </Grid>
            <Grid size={2}>
              {item.nutriscore && (
                <Box>
                  <Typography variant="caption" color="text.secondary">{t('nutriScore')}</Typography>
                  <Box>
                    <Chip 
                      label={item.nutriscore?.toUpperCase()} 
                      color={getNutriscoreColor(item.nutriscore)}
                      size="small"
                    />
                  </Box>
                </Box>
              )}
            </Grid>
            <Grid size={8}>
              {item.nutritionalInfo && (
                <Box sx={{ gridColumn: '1 / -1' }}>
                  <Typography variant="caption" color="text.secondary" display="block" gutterBottom>{t('nutritionalInfo')}</Typography>
                  <TableContainer component={Paper} variant="outlined" sx={{ maxWidth: 300 }}>
                    <Table size="small">
                      <TableBody>
                        {item.nutritionalInfo.split('\n').map((line, index) => {
                          const colonIndex = line.indexOf(':');
                          if (colonIndex === -1) return null;
                          const key = line.substring(0, colonIndex).trim();
                          const value = line.substring(colonIndex + 1).trim();
                          return (
                            <TableRow key={index}>
                              <TableCell sx={{ py: 0.5, pl: 1, pr: 0, fontWeight: 'bolder', fontSize: '0.75rem' }}>{key}</TableCell>
                              <TableCell sx={{ py: 0.5, pl: 0, pr: 1, fontSize: '0.75rem' }}>{value}</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}
            </Grid>
            <Grid size={8}>
              {item.ingredients && (
                <Box sx={{ gridColumn: '1 / -1' }}>
                  <Typography variant="caption" color="text.secondary">{t('ingredients')}</Typography>
                  <Typography variant="body2">{item.ingredients}</Typography>
                </Box>
              )}
              {item.allergens && (
                <Box>
                  <Typography variant="caption" color="text.secondary">{t('allergens')}</Typography>
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
                    {item.allergens.split(',').map((allergen, i) => (
                      <Chip key={i} label={allergen.trim()} color="error" size="small" />
                    ))}
                  </Box>
                </Box>
              )}
              {item.labels && (
                <Box>
                  <Typography variant="caption" color="text.secondary">{t('labels')}</Typography>
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
                    {item.labels.split(',').map((label, i) => (
                      <Chip key={i} label={label.trim()} variant="outlined" size="small" />
                    ))}
                  </Box>
                </Box>
              )}
              
              {item.bestByDate && (
                <Box>
                  <Typography variant="caption" color="text.secondary">{t('bestByDate')}</Typography>
                  <Typography variant="body2">{new Date(item.bestByDate).toLocaleDateString()}</Typography>
                </Box>
              )}
              {item.image && (
                <Box>
                  <Typography variant="caption" color="text.secondary">{t('image')}</Typography>
                  <Box sx={{ mt: 0.5 }}>
                    <img src={item.image} alt={item.name} style={{ maxWidth: 100, maxHeight: 100, borderRadius: 8 }} />
                  </Box>
                </Box>
              )}
              {item.barcode && (
                <Box>
                  <Typography variant="caption" color="text.secondary">{t('barcode')}</Typography>
                  <ProductBarcode value={item.barcode} />
                </Box>
              )}
            </Grid>
          </Grid>
        </CardContent>
      </Collapse>

      <ConfirmDeleteDialog
        open={deleteConfirmOpen}
        itemName={item.name}
        onConfirm={() => { onDelete?.(); setDeleteConfirmOpen(false); }}
        onCancel={() => setDeleteConfirmOpen(false)}
      />
    </Card>
  );
}
