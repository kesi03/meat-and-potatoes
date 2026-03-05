import { useState } from 'react';
import { useSwipeable } from 'react-swipeable';
import { Box, IconButton } from '@mui/material';
import { Delete } from '@mui/icons-material';
import { ConfirmDeleteDialog } from './dialogs';

interface Props {
  children: React.ReactNode;
  onDelete: () => void;
  height?: number;
  item?: { id: string; name: string };
}

export default function SwipeableListItem({ children, onDelete, height = 72, item }: Props) {
  const [offset, setOffset] = useState(0);
  const [open, setOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const handlers = useSwipeable({
    onSwipedLeft: () => setOpen(true),
    onSwipedRight: () => setOpen(false),
    trackMouse: true,
  });

  const handleDelete = () => {
    setDeleteConfirmOpen(true);
  };

  return (
    <Box
      {...handlers}
      sx={{
        position: 'relative',
        overflow: 'hidden',
        height,
      }}
    >
      {/* Delete button panel */}
      <Box
        sx={{
          position: 'absolute',
          right: 0,
          top: 0,
          height: '100%',
          width: 80,
          bgcolor: 'error.main',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <IconButton onClick={handleDelete} sx={{ color: 'white' }}>
          <Delete />
        </IconButton>
      </Box>

      {/* Sliding content */}
      <Box
        sx={{
          height: '100%',
          transform: `translateX(${open ? '-80px' : '0px'})`,
          transition: 'transform 0.2s ease',
          bgcolor: 'background.paper',
        }}
      >
        {children}
      </Box>
      <ConfirmDeleteDialog
        open={deleteConfirmOpen}
        itemName={item?.name}
        onConfirm={() => { onDelete?.(); setDeleteConfirmOpen(false); }}
        onCancel={() => { setDeleteConfirmOpen(false); setOpen(false); }}
      />
    </Box>
  );
}