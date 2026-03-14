import { useState, useEffect } from 'react';
import { Box, Typography, List, ListItem, ListItemText, ListItemIcon, IconButton, Button, Paper, Divider, Chip } from '@mui/material';
import { Mail, PersonAdd, Check, Close, Delete, Share } from '@mui/icons-material';
import { useApp } from '../context/AppContext';
import { useAppBarActions } from '../context/AppBarActions';
import { db } from '../firebase';
import { ref, update, remove } from 'firebase/database';

export default function InboxPage() {
  const { notifications, acceptInvitation, declineInvitation, markNotificationRead, unreadCount, user } = useApp();
  const [processing, setProcessing] = useState<string | null>(null);

  console.log('Notifications:', notifications);
  console.log('User:', user?.uid);

  const invitationNotifications = notifications.filter(n => n.type === 'invitation' || n.type === 'invitation_accepted');

  return (
    <Box sx={{ pb: 7 }}>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold' }}>
        Inbox {unreadCount > 0 && <Chip label={unreadCount} color="error" size="small" sx={{ ml: 1 }} />}
      </Typography>

      {invitationNotifications.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Mail sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            No invitations yet
          </Typography>
          <Typography variant="body2" color="text.secondary">
            When someone shares a list with you, it will appear here
          </Typography>
        </Paper>
      ) : (
        <List>
          {invitationNotifications.map((notification, index) => (
            <Paper 
              key={notification.id} 
              sx={{ mb: 1, bgcolor: notification.read ? 'background.paper' : 'action.hover' }}
            >
              <ListItem
                secondaryAction={
                  notification.status === 'pending' ? (
                    <>
                      <IconButton 
                        color="success" 
                        onClick={() => handleAccept(notification)}
                        disabled={processing === notification.id}
                        sx={{ mr: 1 }}
                      >
                        <Check />
                      </IconButton>
                      <IconButton 
                        color="error" 
                        onClick={() => handleDecline(notification)}
                        disabled={processing === notification.id}
                      >
                        <Close />
                      </IconButton>
                    </>
                  ) : (
                    <Chip 
                      label={notification.status === 'accepted' ? 'Accepted' : 'Declined'} 
                      size="small" 
                      color={notification.status === 'accepted' ? 'success' : 'default'}
                    />
                  )
                }
              >
                <ListItemIcon>
                  <PersonAdd color={notification.read ? 'disabled' : 'primary'} />
                </ListItemIcon>
                <ListItemText
                  primary={getNotificationTitle(notification)}
                  secondary={formatDate(notification.createdAt)}
                  primaryTypographyProps={{
                    fontWeight: notification.read ? 'normal' : 'bold'
                  }}
                />
              </ListItem>
              {notification.status === 'pending' && (
                <Box sx={{ px: 2, pb: 2 }}>
                  <Button 
                    size="small" 
                    startIcon={<Check />}
                    onClick={() => handleAccept(notification)}
                    disabled={processing === notification.id}
                    sx={{ mr: 1 }}
                  >
                    Accept
                  </Button>
                  <Button 
                    size="small" 
                    startIcon={<Close />}
                    onClick={() => handleDecline(notification)}
                    disabled={processing === notification.id}
                  >
                    Decline
                  </Button>
                </Box>
              )}
            </Paper>
          ))}
        </List>
      )}
    </Box>
  );
}
