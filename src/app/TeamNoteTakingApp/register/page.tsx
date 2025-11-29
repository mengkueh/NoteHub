'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../login&register.module.css';

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (isLoading) return;
    
    setError('');
    
    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    const prevCursor = document.documentElement.style.cursor;
    document.documentElement.style.cursor = 'wait';

    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        // const newPost = await res.json();
        // Redirect to login page after successful registration
        router.push('/TeamNoteTakingApp');
      } else {
        try {
          const data = await res.json();
          setError(data.error || 'Registration failed');
        } catch {
          setError('Registration failed');
        }
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Registration error:', err);
    } finally {
      document.documentElement.style.cursor = prevCursor || 'auto';
      setIsLoading(false);
    }
  }

  const handleBackToLogin = () => {
    if (isLoading) return;
    router.push('/TeamNoteTakingApp');
  };

  return (
    <main className={styles.main}>
      <div className={styles.card}>
        <button
          type="button"
          onClick={handleBackToLogin}
          className={styles.backButton}
          disabled={isLoading}
          aria-label="Back to login"
        >
          ←
        </button>
        <div className={styles.headerIcon}>✨</div>
        <h1 className={styles.title}>Create Your Account</h1>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div>
            <label className={styles.label}>Email</label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
              required
              className={styles.input}
            />
          </div>

          <div>
            <label className={styles.label}>Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
              required
              className={styles.input}
            />
          </div>

          <button type="submit" className={styles.primaryButton} disabled={isLoading} aria-busy={isLoading}>
            Register
          </button>
        </form>
        
        {error && (
          <div className={styles.errorMessage} role="alert">
            {error}
          </div>
        )}
      </div>
    </main>
  );
}
