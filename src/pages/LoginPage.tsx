import { useState, useEffect } from 'react';
import { Box, Button, TextField, Typography, Paper, Divider, Alert } from '@mui/material';
import { GitHub } from '@mui/icons-material';
import { useApp } from '../context/AppContext';
import { getAuth, getRedirectResult } from 'firebase/auth';
import { auth as firebaseAuth } from '../firebase';
import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const { user, login, register, loginWithGithub, firebaseConfig, updateProfile } = useApp();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      if (!user.email && email) {
        updateProfile({ email });
      }
      navigate('/lists', { replace: true });
    }
  }, [user, navigate, email, updateProfile]);

  useEffect(() => {
    if (!firebaseAuth) return;
    
    getRedirectResult(firebaseAuth)
      .then((result) => {
        if (result?.user) {
          navigate('/lists', { replace: true });
        }
      })
      .catch((error) => {
        console.error('Redirect result error:', error);
      });
  }, [firebaseAuth, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isRegister) {
        await register(email, password);
      } else {
        await login(email, password);
      }
      updateProfile({ email });
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGithubLogin = async () => {
    setError('');
    setLoading(true);
    try {
      await loginWithGithub();
    } catch (err: any) {
      setError(err.message || 'GitHub login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: '#f5f5f5',
        p: 2,
      }}
    >
      <Paper sx={{ p: 4, maxWidth: 400, width: '100%' }}>
        <Typography variant="h5" component="h1" gutterBottom textAlign="center">
          Shopping List
        </Typography>
        
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        
        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            margin="normal"
            required
          />
          <Button
            fullWidth
            variant="contained"
            type="submit"
            disabled={loading}
            sx={{ mt: 2 }}
          >
            {isRegister ? 'Register' : 'Sign In'}
          </Button>
        </form>

        <Button
          fullWidth
          variant="text"
          onClick={() => setIsRegister(!isRegister)}
          sx={{ mt: 1 }}
        >
          {isRegister ? 'Already have an account? Sign In' : "Don't have an account? Register"}
        </Button>

        <Divider sx={{ my: 2 }}>or</Divider>

        <Button
          fullWidth
          variant="outlined"
          startIcon={<GitHub />}
          onClick={handleGithubLogin}
          disabled={loading}
        >
          Continue with GitHub
        </Button>

        {!firebaseConfig?.apiKey && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2, textAlign: 'center' }}>
            Firebase not configured. Please set up in Admin settings.
          </Typography>
        )}
      </Paper>
    </Box>
  );
}
