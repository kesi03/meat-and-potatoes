import { Box, Typography, Card, CardActions, Button, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Breadcrumbs, Link } from '@mui/material';
import { ShoppingCart, Add, HomeMaxOutlined, Home } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

interface ShoppingList {
  id: string;
  name: string;
  isStandard: boolean;
  items: Array<{ id: string }>;
}

interface ListsOverviewProps {
  lists: ShoppingList[];
  onSelectList: (id: string) => void;
  onDeleteList: (id: string) => void;
  onAddList: () => void;
}

export default function ListsOverview({ lists, onSelectList, onDeleteList, onAddList }: ListsOverviewProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleSelectList = (id: string, name: string) => {
    navigate(`/list/${name.toLowerCase().replace(/\s+/g, '-')}`);
  };
  return (
    <Box data-testid="lists-overview">
      <Breadcrumbs aria-label="breadcrumb" separator="›" sx={{ mb: 2 }}>
          <Typography sx={{ color: 'text.primary' }}><Home sx={{ mr: 0.5 }} fontSize="small" /></Typography>
          <Typography sx={{ color: 'text.primary' }}>{t('myLists')}</Typography>
      </Breadcrumbs>

      {lists.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 4 }} data-testid="no-lists-message">
          <Typography variant="body1" color="text.secondary" gutterBottom>
            No shopping lists yet
          </Typography>
          <Button variant="contained" startIcon={<Add />} onClick={onAddList}>
            Create Your First List
          </Button>
        </Box>
      ) : (
        <List data-testid="lists-container">
          {lists.map(list => (
            <ListItem
              key={list.id}
              disablePadding
              sx={{ mb: 1 }}
              data-testid={`list-item-${list.id}`}
            >
              <Card sx={{ width: '100%' }}>
                <ListItemButton onClick={() => handleSelectList(list.id, list.name)}>
                  <ListItemIcon>
                    <ShoppingCart color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary={list.name} 
                    secondary={`${list.items?.length ?? 0} items`} 
                  />
                </ListItemButton>
                <CardActions>
                  <Button size="small" onClick={() => handleSelectList(list.id, list.name)} data-testid={`open-list-${list.id}`}>
                    {t('open')}
                  </Button>
                  <Button 
                    size="small" 
                    color="error" 
                    onClick={(e) => { e.stopPropagation(); onDeleteList(list.id); }}
                    data-testid={`delete-list-${list.id}`}
                  >
                    {t('delete')}
                  </Button>
                </CardActions>
              </Card>
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );
}
