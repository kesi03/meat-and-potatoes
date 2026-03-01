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
} from '@mui/material';
import {
  Edit,
  MoveToInbox,
  ExpandMore,
  ExpandLess,
  Warning,
  CheckCircle,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { getExpirationStatus, getDaysUntilExpiration, formatCurrency, CurrencyCode } from '../meat';
import type { ShoppingItem, Category } from '../context/AppContext';
import { getCategoryName } from '../context/AppContext';

interface ItemCardProps {
  item: ShoppingItem;
  expanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
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
  onMoveToInventory, 
  categories,
  currency,
  showMoveToInventory = true,
}: ItemCardProps) {
  const { t, i18n } = useTranslation();
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
            <Avatar sx={{ bgcolor: 'primary.light' }}>{item.name?.[0]}</Avatar>
            <Box>
              <Typography variant="subtitle1" fontWeight={600}>{item.name}</Typography>
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
          {expanded ? 'Less' : 'More'}
        </Button>
        <Button size="small" startIcon={<Edit />} onClick={onEdit}>{t('editItem')}</Button>
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
                <Typography variant="caption" color="text.secondary">Description</Typography>
                <Typography variant="body2">{item.description}</Typography>
              </Box>
            )}
            {item.barcode && (
              <Box>
                <Typography variant="caption" color="text.secondary">Barcode</Typography>
                <Typography variant="body2">{item.barcode}</Typography>
              </Box>
            )}
            {item.weightSize && (
              <Box>
                <Typography variant="caption" color="text.secondary">Weight/Size</Typography>
                <Typography variant="body2">{item.weightSize}</Typography>
              </Box>
            )}
            {item.nutritionalInfo && (
              <Box>
                <Typography variant="caption" color="text.secondary">Nutritional Info</Typography>
                <Typography variant="body2">{item.nutritionalInfo}</Typography>
              </Box>
            )}
            {item.bestByDate && (
              <Box>
                <Typography variant="caption" color="text.secondary">Best By</Typography>
                <Typography variant="body2">{new Date(item.bestByDate).toLocaleDateString()}</Typography>
              </Box>
            )}
          </Box>
        </CardContent>
      </Collapse>
    </Card>
  );
}
