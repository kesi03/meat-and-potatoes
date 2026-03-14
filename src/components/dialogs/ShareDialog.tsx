import { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Box, Typography, CircularProgress, Alert } from '@mui/material';
import { PersonAdd, Check, Email } from '@mui/icons-material';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../firebase';

interface ShareDialogProps {
  open: boolean;
  listId: string;
  listName: string;
  onClose: () => void;
  onShare: (email: string, message: string) => Promise<void>;
}

export default function ShareDialog({ open, listId, listName, onClose, onShare }: ShareDialogProps) {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [userFound, setUserFound] = useState<{ found: boolean; name?: string } | null>(null);
  const [error, setError] = useState('');
  const [shared, setShared] = useState(false);

  const handleEmailChange = async (value: string) => {
    setEmail(value);
    setUserFound(null);
    setError('');
    
    if (value.includes('@') && value.includes('.')) {
      try {
        const lookupUser = httpsCallable(functions, 'lookupUser');
        const result = await lookupUser({ email: value });
        setUserFound(result.data as { found: boolean; name?: string });
      } catch {
        // User not found - this is fine for non-members
      }
    }
  };

  const handleShare = async () => {
    if (!email) {
      setError('Please enter an email address');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      await onShare(email, message || `I'd like to share my shopping list "${listName}" with you.`);
      setShared(true);
      setTimeout(() => {
        onClose();
        setShared(false);
        setEmail('');
        setMessage('');
        setUserFound(null);
      }, 2000);
    } catch (err) {
      setError('Failed to send invitation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setEmail('');
    setMessage('');
    setUserFound(null);
    setError('');
    setShared(false);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PersonAdd color="primary" />
          Share "{listName}"
        </Box>
      </DialogTitle>
      <DialogContent>
        {shared ? (
          <Alert severity="success" sx={{ mt: 1 }}>
            Invitation sent successfully!
          </Alert>
        ) : (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Enter the email address of the person you want to share this list with.
            </Typography>
            
            <TextField
              fullWidth
              label="Email address"
              type="email"
              value={email}
              onChange={(e) => handleEmailChange(e.target.value)}
              sx={{ mb: 2 }}
              InputProps={{
                startAdornment: <Email sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            />
            
            {userFound?.found && (
              <Alert severity="success" icon={<Check />} sx={{ mb: 2 }}>
                Member found: {userFound.name}
              </Alert>
            )}
            
            <TextField
              fullWidth
              label="Message (optional)"
              multiline
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Add a personal message..."
            />
            
            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        {!shared && (
          <Button 
            onClick={handleShare} 
            variant="contained" 
            disabled={loading || !email}
            startIcon={loading ? <CircularProgress size={20} /> : <PersonAdd />}
          >
            Send Invitation
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
