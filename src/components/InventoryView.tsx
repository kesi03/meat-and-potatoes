import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Chip,
} from '@mui/material';
import { Store, Warning, CheckCircle } from '@mui/icons-material';
import { getExpirationStatus, formatCurrency, CurrencyCode, getDaysUntilExpiration } from '../meat';
import type { InventoryItem, Category } from '../context/AppContext';

interface InventoryViewProps {
  inventory: InventoryItem[];
  categories: Category[];
  inventoryByCategory: Record<string, InventoryItem[]>;
  expirationStats: {
    expired: InventoryItem[];
    expiringSoon: InventoryItem[];
    fresh: InventoryItem[];
  };
  onEditItem: (item: InventoryItem) => void;
  onDeleteItem: (id: string) => void;
  onAddItem: () => void;
  currency: CurrencyCode;
}

export default function InventoryView({
  inventory,
  categories,
  inventoryByCategory,
  expirationStats,
  onEditItem,
  onDeleteItem,
  currency,
}: InventoryViewProps) {
  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>Expiration Status</Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Chip icon={<Warning />} label={`Expired: ${expirationStats.expired.length}`} color="error" />
          <Chip icon={<Warning />} label={`Expiring Soon: ${expirationStats.expiringSoon.length}`} color="warning" />
          <Chip icon={<CheckCircle />} label={`Fresh: ${expirationStats.fresh.length}`} color="success" />
        </Box>
      </Box>

      {inventory.length === 0 ? (
        <Typography color="text.secondary">Your inventory is empty. Add items from your shopping lists.</Typography>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {Object.entries(inventoryByCategory).map(([category, items]) => (
            <Box key={category}>
              <Typography variant="h6" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Store /> {category}
              </Typography>
              <List>
                {items.map(item => (
                  <InventoryListItem
                    key={item.id}
                    item={item}
                    currency={currency}
                    onEdit={() => onEditItem(item)}
                  />
                ))}
              </List>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}

interface InventoryListItemProps {
  item: InventoryItem;
  currency: CurrencyCode;
  onEdit: () => void;
}

function InventoryListItem({ item, currency, onEdit }: InventoryListItemProps) {
  const expirationStatus = getExpirationStatus(item.bestByDate);
  const daysLeft = getDaysUntilExpiration(item.bestByDate);

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
        <Box sx={{ textAlign: 'right' }}>
          <Typography variant="body2" color="text.secondary">
            Home: {item.homeQuantity}
          </Typography>
          {item.bestByDate && (
            <Typography variant="caption" color={`${statusColors[expirationStatus]}.main`}>
              {daysLeft !== null && (daysLeft < 0 ? `Expired ${Math.abs(daysLeft)}d` : `${daysLeft}d left`)}
            </Typography>
          )}
        </Box>
      }
    >
      <ListItemAvatar>
        <Avatar sx={{ bgcolor: 'primary.light' }}>{item.name[0]}</Avatar>
      </ListItemAvatar>
      <ListItemText 
        primary={item.name} 
        secondary={
          <Box component="span" sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
            <Chip label={item.category} size="small" />
            {item.location && <Chip label={item.location} size="small" variant="outlined" />}
            {item.cost && <Typography variant="caption">{formatCurrency(item.cost, currency)}</Typography>}
          </Box>
        }
      />
    </ListItem>
  );
}
