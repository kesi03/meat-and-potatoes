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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Paper,
} from '@mui/material';
import {
  Edit,
  MoveToInbox,
  ExpandMore,
  ExpandLess,
  Warning,
  CheckCircle,
  Delete,
} from '@mui/icons-material';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getExpirationStatus, getDaysUntilExpiration, formatCurrency, CurrencyCode, getTranslatedItemName } from '../meat';

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
import type { ShoppingItem, Category } from '../context/AppContext';
import { getCategoryName } from '../context/AppContext';
import { ProductBarcode } from './ProductBarcode';

interface ItemCardProps {
  item: ShoppingItem;
  expanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete?: () => void;
  onMoveToInventory?: () => void;
  categories: Category[];
  currency: CurrencyCode;
  showMoveToInventory?: boolean;
}

export default function ItemCard({ 
  item, 
  expanded, 
  onToggle, 
  onEdit, 
  onDelete,
  onMoveToInventory, 
  categories,
  currency,
  showMoveToInventory = true,
}: ItemCardProps) {
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
              <Typography variant="subtitle1" fontWeight={600}>{getTranslatedItemName(item.name, t)}</Typography>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                {(() => {
                  const cat = categories.find(c => c.name === item.category);
                  const translatedName = cat ? getCategoryName(cat, i18n.language) : item.category;
                  return <Chip label={translatedName} size="small" />;
                })()}
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
            <Typography variant="body2" color="text.secondary">Qty: {item.quantity}</Typography>
          </Box>
        </Box>
      </CardContent>

      <CardActions sx={{ pt: 0 }}>
        <Button size="small" startIcon={expanded ? <ExpandLess /> : <ExpandMore />} onClick={onToggle}>
          {expanded ? t('less') : t('more')}
        </Button>
        <Button size="small" startIcon={<Edit />} onClick={onEdit}>{t('editItem')}</Button>
        {onDelete && (
          <Button size="small" startIcon={<Delete />} onClick={() => setDeleteConfirmOpen(true)} color="error">
            {t('delete')}
          </Button>
        )}
        {onMoveToInventory && showMoveToInventory && (
          <Button size="small" startIcon={<MoveToInbox />} onClick={onMoveToInventory}>{t('toInventory')}</Button>
        )}
      </CardActions>

      <Collapse in={expanded}>
        <Divider />
        <CardContent>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
            {item.description && (
              <Box>
                <Typography variant="caption" color="text.secondary">{t('description')}</Typography>
                <Typography variant="body2">{item.description}</Typography>
              </Box>
            )}
            
            {item.weightSize && (
              <Box>
                <Typography variant="caption" color="text.secondary">{t('weightSize')}</Typography>
                <Typography variant="body2">{item.weightSize}</Typography>
              </Box>
            )}
            {item.nutritionalInfo && (
              <Box sx={{ gridColumn: '1 / -1' }}>
                <Typography variant="caption" color="text.secondary" display="block" gutterBottom>{t('nutritionalInfo')}</Typography>
                <TableContainer component={Paper} variant="outlined" sx={{ maxWidth: 300 }}>
                  <Table size="small" sx={{
      '& .MuiTableRow-root:nth-of-type(odd)': {
        backgroundColor: (theme) => theme.palette.action.hover,
      },
    }}
>
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
            {item.country && (
              <Box>
                <Typography variant="caption" color="text.secondary">{t('country')}</Typography>
                <Typography variant="body2">{item.country}</Typography>
              </Box>
            )}
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
          </Box>
        </CardContent>
      </Collapse>

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
    </Card>
  );
}
