'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/src/components/Button';
import { API_ENDPOINTS } from '@/src/constants/api';
import { authService } from '@/src/services/auth';
import { Input } from '@/src/components/Input';

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    setError('');

    try {
      const data = await authService.login(email, password);

      console.log("LOGIN SUCCESS", data);

      router.push("/dashboard");
    } catch (err) {
      console.error(err);
      setError("Email or Password is incorrect");
    }
  };

  return (
    <div style={styles.container}>
      <form onSubmit={handleLogin} style={styles.form}>
        <h2>Agility Wiki Login</h2>

        <Input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={styles.input}
        />

        <Input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={styles.input}
        />

        {error && <p style={{ color: 'red' }}>{error}</p>}

        <Button type="submit">Login</Button>
      </form>
    </div>
  );
}

const styles: any = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    width: '300px',
    gap: '10px',
  },
  input: {
    padding: '10px',
    fontSize: '16px',
  },
};
