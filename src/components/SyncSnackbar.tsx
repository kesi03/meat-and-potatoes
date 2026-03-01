import { Snackbar, Alert, CircularProgress, Box } from '@mui/material';
import { useApp } from '../context/AppContext';

export default function SyncSnackbar() {
  const { syncStatus } = useApp();

  const isOpen = syncStatus.isSyncing || syncStatus.error !== null;

  return (
    <Snackbar
      open={isOpen}
      autoHideDuration={syncStatus.error ? 6000 : 2000}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
    >
      <Alert 
        severity={syncStatus.error ? 'error' : 'success'}
        icon={syncStatus.isSyncing ? <CircularProgress size={20} /> : undefined}
        sx={{ width: '100%' }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {syncStatus.isSyncing && <CircularProgress size={20} />}
          {syncStatus.isSyncing && 'Syncing to Firebase...'}
          {!syncStatus.isSyncing && syncStatus.error && `Sync failed: ${syncStatus.error}`}
          {!syncStatus.isSyncing && !syncStatus.error && syncStatus.lastSynced && 'Synced to Firebase'}
        </Box>
      </Alert>
    </Snackbar>
  );
}
