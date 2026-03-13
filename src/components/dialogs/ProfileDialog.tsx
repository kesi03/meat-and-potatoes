import { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Avatar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
} from '@mui/material';
import { PhotoCamera, Upload } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import type { Profile } from '../../context/AppContext';

interface ProfileDialogProps {
  open: boolean;
  profile: Profile;
  onSave: (profile: Profile) => void;
  onClose: () => void;
}

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'cy', name: 'Welsh' },
  { code: 'gd', name: 'Scottish Gaelic' },
  { code: 'sv', name: 'Swedish' },
  { code: 'fi', name: 'Finnish' },
  { code: 'ga', name: 'Irish Gaelic' },
  { code: 'da', name: 'Danish' },
  { code: 'no', name: 'Norwegian' },
  { code: 'fo', name: 'Faroese' },
  { code: 'is', name: 'Icelandic' },
  { code: 'gv', name: 'Manx' },
  { code: 'kw', name: 'Cornish' },
  { code: 'se', name: 'Sami' },
  { code: 'kl', name: 'Greenland (Kalaallisut)' },
  { code: 'nl', name: 'Dutch' },
  { code: 'vl', name: 'Flemish' },
  { code: 'br', name: 'Breton' },
];

export default function ProfileDialog({
  open,
  profile,
  onSave,
  onClose,
}: ProfileDialogProps) {
  const { t, i18n } = useTranslation();
  const [formData, setFormData] = useState<Profile>(profile);
  const [capturedImage, setCapturedImage] = useState<string>(profile.image || '');
  const [showCamera, setShowCamera] = useState(false);
  const [showCropper, setShowCropper] = useState(false);
  const [cropArea, setCropArea] = useState({ x: 20, y: 20, width: 150, height: 150 });
  const [stream, setStream] = useState<MediaStream | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  useEffect(() => {
    setFormData(profile);
    setCapturedImage(profile.image || '');
  }, [profile, open]);

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setShowCamera(false);
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' } 
      });
      setStream(mediaStream);
      setShowCamera(true);
    } catch (err) {
      console.error('Error accessing camera:', err);
      fileInputRef.current?.click();
    }
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setCapturedImage(dataUrl);
        stopCamera();
        setShowCropper(true);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCapturedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const applyCrop = () => {
    setShowCropper(false);
  };

  const handleSave = () => {
    onSave({ ...formData, image: capturedImage });
    onClose();
  };

  const handleClose = () => {
    stopCamera();
    setShowCropper(false);
    onClose();
  };

  if (showCamera) {
    return (
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{t('takePhoto')}</DialogTitle>
        <DialogContent>
          <Box sx={{ position: 'relative', width: '100%', maxWidth: 400, mx: 'auto' }}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              style={{ width: '100%', borderRadius: 8 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={stopCamera}>{t('cancel')}</Button>
          <Button onClick={capturePhoto} variant="contained">
            {t('capture')}
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  if (showCropper && capturedImage) {
    return (
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{t('cropImage')}</DialogTitle>
        <DialogContent>
          <Box 
            ref={containerRef}
            sx={{ 
              position: 'relative', 
              width: '100%', 
              maxWidth: 400, 
              mx: 'auto',
              overflow: 'hidden',
              cursor: 'move',
            }}
          >
            <img
              ref={imageRef}
              src={capturedImage}
              alt="Crop"
              style={{ width: '100%', borderRadius: 8 }}
              onMouseDown={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                setCropArea(prev => ({ ...prev, x: e.clientX - rect.left - prev.width / 2, y: e.clientY - rect.top - prev.height / 2 }));
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setShowCropper(false); startCamera(); }}>
            {t('retake')}
          </Button>
          <Button onClick={applyCrop} variant="contained">
            {t('apply')}
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t('profile')}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3, mt: 1 }}>
          <Avatar
            src={capturedImage || undefined}
            variant="rounded"
            sx={{ width: 120, height: 120, mb: 2, bgcolor: 'primary.main' }}
          >
            {formData.firstName?.[0] || formData.alias?.[0] || formData.email?.[0]?.toUpperCase() || '?'}
          </Avatar>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton
              onClick={startCamera}
              sx={{ bgcolor: 'grey.200' }}
            >
              <PhotoCamera />
            </IconButton>
            <IconButton
              onClick={() => fileInputRef.current?.click()}
              sx={{ bgcolor: 'grey.200' }}
            >
              <Upload />
            </IconButton>
          </Box>
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            accept="image/png,image/jpeg,image/gif"
            onChange={handleFileChange}
          />
        </Box>

        <TextField
          fullWidth
          label={t('firstName')}
          value={formData.firstName}
          onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
          sx={{ mb: 2 }}
        />

        <TextField
          fullWidth
          label={t('lastName')}
          value={formData.lastName}
          onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
          sx={{ mb: 2 }}
        />

        <TextField
          fullWidth
          label={t('email')}
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          sx={{ mb: 2 }}
        />

        <TextField
          fullWidth
          label={t('alias')}
          value={formData.alias}
          onChange={(e) => setFormData({ ...formData, alias: e.target.value })}
          sx={{ mb: 2 }}
        />

        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>{t('language')}</InputLabel>
          <Select
            value={formData.language || i18n.language}
            label={t('language')}
            onChange={(e) => setFormData({ ...formData, language: e.target.value })}
          >
            {LANGUAGES.map((lang) => (
              <MenuItem key={lang.code} value={lang.code}>
                {lang.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>{t('cancel')}</Button>
        <Button onClick={handleSave} variant="contained">
          {t('save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
