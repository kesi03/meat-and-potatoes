import { Box, Typography, Card, CardActions, Button, List, ListItem, ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import { ShoppingCart, Add } from '@mui/icons-material';

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
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5">My Lists</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={onAddList}>
          New List
        </Button>
      </Box>

      {lists.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body1" color="text.secondary" gutterBottom>
            No shopping lists yet
          </Typography>
          <Button variant="contained" startIcon={<Add />} onClick={onAddList}>
            Create Your First List
          </Button>
        </Box>
      ) : (
        <List>
          {lists.map(list => (
            <ListItem
              key={list.id}
              disablePadding
              sx={{ mb: 1 }}
            >
              <Card sx={{ width: '100%' }}>
                <ListItemButton onClick={() => onSelectList(list.id)}>
                  <ListItemIcon>
                    <ShoppingCart color="primary" />
                  </ListItemIcon>
                  <ListItemText 
                    primary={list.name} 
                    secondary={`${list.items?.length ?? 0} items`} 
                  />
                </ListItemButton>
                <CardActions>
                  <Button size="small" onClick={() => onSelectList(list.id)}>
                    Open
                  </Button>
                  <Button 
                    size="small" 
                    color="error" 
                    onClick={(e) => { e.stopPropagation(); onDeleteList(list.id); }}
                  >
                    Delete
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
