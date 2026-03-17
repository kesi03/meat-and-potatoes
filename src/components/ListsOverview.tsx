import { Box, Typography, Card, CardActions, Button, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Breadcrumbs, Link, Divider, Dialog, DialogTitle, DialogContent, DialogActions, Avatar, Chip } from '@mui/material';
import { ShoppingCart, Add, HomeMaxOutlined, Home, People, FolderShared, Email, Person } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

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
  email?: string;
  image?: string;
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

export default function ListsOverview({ lists, sharedLists = [], memberProfiles = {}, onSelectList, onDeleteList, onAddList }: ListsOverviewProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const getSharedMembers = (listId: string) => {
    const sharedEntry = sharedLists.find(l => l.listId === listId && l.members);
    if (sharedEntry?.members) {
      const memberIds = Object.keys(sharedEntry.members);
      const names = memberIds.map(id => getMemberName(id, memberProfiles));
      if (names.length <= 2) {
        return `${t('sharedWith')} ${names.join(', ')}`;
      }
      return `${t('sharedWith')} ${names.slice(0, 2).join(', ')} +${names.length - 2} more`;
    }
    return null;
  };

  const sharedListIds = new Set(sharedLists.filter(l => l.members && Object.keys(l.members).length > 0).map(l => l.listId));
  const myLists = lists.filter(list => !sharedListIds.has(list.id));
  const sharedByMeLists = lists.filter(list => sharedListIds.has(list.id));

  const [memberDialogOpen, setMemberDialogOpen] = useState(false);
  const [selectedListMembers, setSelectedListMembers] = useState<{ id: string; profile?: { firstName?: string; lastName?: string; alias?: string; email?: string; image?: string } }[]>([]);
  const [selectedListName, setSelectedListName] = useState('');

  const handleShowMembers = (listId: string, listName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const sharedEntry = sharedLists.find(l => l.listId === listId);
    if (sharedEntry?.members) {
      const members = Object.entries(sharedEntry.members).map(([id, _]) => ({
        id,
        profile: memberProfiles[id] as MemberProfile | undefined
      }));
      setSelectedListMembers(members);
      setSelectedListName(listName);
      setMemberDialogOpen(true);
    }
  };

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
                      secondary={getSharedMembers(list.id) || ''}
                    />
                    <Button 
                      size="small" 
                      onClick={(e) => handleShowMembers(list.id, list.name, e)}
                      sx={{ mr: 1 }}
                    >
                      {t('sharedWith')}
                    </Button>
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

      <Dialog open={memberDialogOpen} onClose={() => setMemberDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <People color="warning" />
          {selectedListName} - {t('sharedByMe')}
        </DialogTitle>
        <DialogContent>
          <Typography variant="subtitle2" sx={{ mb: 2 }}>
            {selectedListMembers.length} {selectedListMembers.length === 1 ? t('member') : t('members') || 'members'}
          </Typography>
          <List>
            {selectedListMembers.map(member => (
              <ListItem key={member.id} sx={{ bgcolor: 'action.hover', mb: 1, borderRadius: 1 }}>
                {member.profile?.image ? (
                  <Avatar src={member.profile.image} sx={{ mr: 2, width: 48, height: 48 }} />
                ) : (
                  <Avatar sx={{ mr: 2, bgcolor: 'primary.main', width: 48, height: 48 }}>
                    {member.profile?.firstName?.[0] || member.profile?.alias?.[0] || member.profile?.email?.[0] || '?'}
                  </Avatar>
                )}
                <ListItemText
                  primary={member.profile?.alias || `${member.profile?.firstName || ''} ${member.profile?.lastName || ''}`.trim() || 'Unknown'}
                  secondary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                      <Email fontSize="small" sx={{ mr: 0.5 }} />
                      {member.profile?.email || 'No email'}
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMemberDialogOpen(false)}>{t('close') || 'Close'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
