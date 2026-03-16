'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { authService } from '@/services/auth.service';

import { Input } from '@/components/Input';
import { Button } from '@/components/Button';


export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: any) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await authService.login(email, password);

      router.push('/dashboard');
    } catch (err) {
      console.error(err);
      setError('Email or Password is incorrect');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-gray-400">
      <form
        onSubmit={handleLogin}
        className="w-[480px] bg-white rounded-xl shadow-lg p-8 flex flex-col gap-5"
      >
        <h2 className="text-2xl font-semibold text-center text-black">
          Agility Wiki Login
        </h2>

        <Input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <Input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {error && (
          <p className="text-red-500 text-sm text-center">
            {error}
          </p>
        )}

        <Button
          type="submit"
          disabled={loading}
          className="bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition disabled:bg-gray-400"
        >
          {loading ? 'Logging in...' : 'Login'}
        </Button>
      </form>
    </div>
  );
}