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
  members?: Record<string, { addedAt: number; role: string }>;
}

interface MemberProfile {
  firstName?: string;
  lastName?: string;
  alias?: string;
}

interface ListsOverviewProps {
  lists: ShoppingList[];
  sharedLists?: SharedList[];
  memberProfiles?: Record<string, MemberProfile>;
  onSelectList: (id: string) => void;
  onDeleteList: (id: string) => void;
  onAddList: () => void;
}

const getMemberName = (memberId: string, memberProfiles: Record<string, MemberProfile> | undefined): string => {
  const profile = memberProfiles?.[memberId];
  if (!profile) return 'Unknown';
  return profile.alias || `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || 'Unknown';
};

const isListShared = (listId: string, sharedLists: SharedList[]) => {
  return sharedLists.some(l => l.listId === listId && l.members && Object.keys(l.members).length > 0);
};

const getSharedMembers = (listId: string, sharedLists: SharedList[], memberProfiles?: Record<string, MemberProfile>) => {
  const sharedEntry = sharedLists.find(l => l.listId === listId && l.members);
  if (sharedEntry?.members) {
    const memberIds = Object.keys(sharedEntry.members);
    const names = memberIds.map(id => getMemberName(id, memberProfiles));
    if (names.length <= 2) {
      return `Shared with ${names.join(', ')}`;
    }
    return `Shared with ${names.slice(0, 2).join(', ')} +${names.length - 2} more`;
  }
  return null;
};

export default function ListsOverview({ lists, sharedLists = [], memberProfiles = {}, onSelectList, onDeleteList, onAddList }: ListsOverviewProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const sharedListIds = new Set(sharedLists.filter(l => l.members && Object.keys(l.members).length > 0).map(l => l.listId));
  const myLists = lists.filter(list => !sharedListIds.has(list.id));
  const sharedByMeLists = lists.filter(list => sharedListIds.has(list.id));

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

      {sharedLists.some(l => l.role === 'member') && (
        <>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <FolderShared fontSize="small" /> {t('sharedWithMe')}
          </Typography>
          <List data-testid="shared-lists-container" sx={{ mb: 2 }}>
            {sharedLists.filter(l => l.role === 'member').map(sharedList => (
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
                      secondary={t('member')}
                    />
                  </ListItemButton>
                </Card>
              </ListItem>
            ))}
          </List>
          <Divider sx={{ my: 2 }} />
        </>
      )}

      {sharedByMeLists.length > 0 && (
        <>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, color: 'warning.main' }}>
            <People fontSize="small" /> {t('sharedByMe')}
          </Typography>
          <List data-testid="owner-shared-lists-container" sx={{ mb: 2 }}>
            {sharedByMeLists.map(list => (
              <ListItem
                key={list.id}
                disablePadding
                sx={{ mb: 1 }}
              >
                <Card sx={{ width: '100%', border: '2px solid #ed6c02' }}>
                  <ListItemButton onClick={() => handleSelectList(list.id, list.name)}>
                    <ListItemIcon>
                      <People color="warning" />
                    </ListItemIcon>
                    <ListItemText 
                      primary={list.name} 
                      secondary={getSharedMembers(list.id, sharedLists, memberProfiles) || ''}
                    />
                  </ListItemButton>
                </Card>
              </ListItem>
            ))}
          </List>
          <Divider sx={{ my: 2 }} />
        </>
      )}

      {myLists.length === 0 && sharedLists.filter(l => l.role === 'member').length === 0 && sharedByMeLists.length === 0 ? (
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
          {myLists.map(list => (
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
