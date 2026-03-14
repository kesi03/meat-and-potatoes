import { Box, Typography, Card, CardActions, Button, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Breadcrumbs, Link, Divider } from '@mui/material';
import { ShoppingCart, Add, HomeMaxOutlined, Home, People, FolderShared } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

interface ShoppingList {
  id: string;
  name: string;
  isStandard: boolean;
  items: Array<{ id: string }>;
}

interface SharedList {
  listId: string;
  listName?: string;
  name?: string;
  ownerId: string;
  role: string;
}

interface ListsOverviewProps {
  lists: ShoppingList[];
  sharedLists?: SharedList[];
  onSelectList: (id: string) => void;
  onDeleteList: (id: string) => void;
  onAddList: () => void;
}

export default function ListsOverview({ lists, sharedLists = [], onSelectList, onDeleteList, onAddList }: ListsOverviewProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleSelectList = (id: string, name: string) => {
    if (!name) return;
    navigate(`/list/${name.toLowerCase().replace(/\s+/g, '-')}`);
  };
  return (
    <Box data-testid="lists-overview">
      <Breadcrumbs aria-label="breadcrumb" separator="›" sx={{ mb: 2 }}>
          <Typography sx={{ color: 'text.primary' }}><Home sx={{ mr: 0.5 }} fontSize="small" /></Typography>
          <Typography sx={{ color: 'text.primary' }}>{t('myLists')}</Typography>
      </Breadcrumbs>

      {sharedLists.length > 0 && (
        <>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <FolderShared fontSize="small" /> Shared with me
          </Typography>
          <List data-testid="shared-lists-container" sx={{ mb: 2 }}>
            {sharedLists.map(sharedList => (
              <ListItem
                key={sharedList.listId}
                disablePadding
                sx={{ mb: 1 }}
              >
                <Card sx={{ width: '100%', bgcolor: 'action.hover' }}>
                  <ListItemButton onClick={() => handleSelectList(sharedList.listId, sharedList.listName || sharedList.name || '')}>
                    <ListItemIcon>
                      <FolderShared color="secondary" />
                    </ListItemIcon>
                    <ListItemText 
                      primary={sharedList.listName || sharedList.name} 
                      secondary={sharedList.role === 'owner' ? 'Owner' : 'Member'}
                    />
                  </ListItemButton>
                </Card>
              </ListItem>
            ))}
          </List>
          <Divider sx={{ my: 2 }} />
        </>
      )}

      {lists.length === 0 && sharedLists.length === 0 ? (
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
