'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type Post = { id: string; email: string; password: string };

export default function TeamNoteTakingPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);

  async function fetchPosts() {
    setLoading(true);
    const res = await fetch('/api/posts');
    const data = await res.json();
    setPosts(data);
    setLoading(false);
  }

  useEffect(() => { fetchPosts(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      alert('Please fill in all fields');
      return;
    }

    const res = await fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (res.ok) {
      const newPost = await res.json();
      setPosts(prev => [newPost, ...prev]);
      setEmail('');
      setPassword('');
    } else {
      alert('Failed to save');
    }
  }

  return (
    <main style={{ padding: 20, fontFamily: 'sans-serif' }}>
      <h1>WELCOME!<br/>Team Note Taking App</h1>
      <form onSubmit={handleSubmit} style={{ marginBottom: 20 }}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          style={{ marginRight: 8 }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          style={{ marginRight: 8 }}
        />
        <button type="submit" className='cursor: pointer'>Register</button>
        
      </form>





      {/* <h2>Saved Data</h2>
      {loading ? <p>Loading...</p> :
        posts.length === 0 ? <p>No data</p> :
        <ul>
          {posts.map(p => (
            <li key={p.id}>
              <b>{p.email}</b> — {p.password}
            </li>
          ))}
        </ul>
      } */}
    </main>
  );
}
