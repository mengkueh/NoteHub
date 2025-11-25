// 'use client';
// import { useState } from 'react';
// import { useRouter } from 'next/navigation';

// export default function LoginPage() {
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [error, setError] = useState('');
//   const router = useRouter();

//   async function handleLogin(e: React.FormEvent) {
//     e.preventDefault();
//     setError('');

//     const res = await fetch('/api/login', {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({ email, password }),
//     });

//     const data = await res.json();

//     if (data.success) {
//       router.push('/home');
//     } else {
//       setError(data.message || 'Login failed');
//     }
//   }

//   return (
//     <main style={{ color: 'black', backgroundColor: 'White', padding: 20, fontFamily: 'sans-serif', textAlign: 'center', alignItems: 'center' }}>
//       <div className='m-[10%]'>
//         <h1 className='text-6xl'>WELCOME!</h1>
//         <h1 className='text-4xl'>Team Note Taking App</h1>
//       </div>
//       <form className='text-xl' onSubmit={handleLogin}>
//         <p>Email:</p>
//         <input
//           type="email"
//           // placeholder="Email"
//           value={email}
//           onChange={e => setEmail(e.target.value)}
//           style={{ backgroundColor: 'lightgrey', width: '100%', marginBottom: 8 }}
//         />
//         <p>Password:</p>
//         <input
//           type="password"
//           // placeholder="Password"
//           value={password}
//           onChange={e => setPassword(e.target.value)}
//           style={{ backgroundColor: 'lightgrey', width: '100%' ,marginBottom: 8 }}
//         />
//         <button className='display: px-[2%] block border rounded mx-auto cursor-pointer hover:bg-blue-600 transition-all duration-300 ease-in-out' type="submit">Login</button>
//         <button className='display: px-[2%] mt-[2%] block border rounded mx-auto cursor-pointer hover:bg-blue-600 transition-all duration-300 ease-in-out' onClick={() => router.push('/TeamNoteTakingApp/register')}>Register</button>
//       </form>
      
//       {error && <p style={{ color: 'red' }}>{error}</p>}
//     </main>
//   );
// }


"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./login&register.module.css";
// import { useLanguage } from "../context/LanguageContext"

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setIsLoading(true);
    const prevCursor = document.documentElement.style.cursor;
    document.documentElement.style.cursor = "wait";

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        router.push("/TeamNoteTakingApp/home");
      } else {
        alert("Invalid email or password");
      }
    } finally {
      // If navigation didn't occur, restore cursor/loading state
      document.documentElement.style.cursor = prevCursor || "auto";
      setIsLoading(false);
    }
  };

  const handleRegister = () => {
    if (isLoading) return;
    setIsLoading(true);
    document.documentElement.style.cursor = "wait";
    try {
      router.push("/TeamNoteTakingApp/register");
      // No finally: navigation will unmount this page. If it fails, we restore after a short delay.
      setTimeout(() => {
        document.documentElement.style.cursor = "auto";
        setIsLoading(false);
      }, 1500);
    } catch {
      document.documentElement.style.cursor = "auto";
      setIsLoading(false);
    }
  };

  return (
    <main className={styles.main}>
      {/* <div>
        <button onClick={() => setLang("en")}>English</button>
      <button onClick={() => setLang("zh")}>中文</button>
      </div> */}
      <div className={styles.card}>
        <div className={styles.headerIcon}>🔐</div>
        <h1 className={styles.title}>WELCOME!</h1>
        <h2 className={styles.subtitle}>Sign In to Your Account</h2>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div>
            <label className={styles.label}>Email</label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
              onChange={(e) => setPassword(e.target.value)}
              required
              className={styles.input}
            />
          </div>

          <button type="submit" className={styles.primaryButton} disabled={isLoading} aria-busy={isLoading}>
            Login
          </button>

          <button
            type="button"
            onClick={handleRegister}
            className={styles.secondaryButton}
            disabled={isLoading}
            aria-busy={isLoading}
          >
            Register
          </button>
        </form>
      </div>
    </main>
  );
}

