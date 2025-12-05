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

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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
  };

  return (
    <main style={{ color: 'black', backgroundColor: 'White', padding: 20, fontFamily: 'sans-serif', textAlign: 'center', alignItems: 'center' }}>
      <div className='m-[10%]'>
        <h1 className='text-6xl'>WELCOME!</h1>
        <h1 className='text-4xl'>Team Note Taking App</h1>
      </div>
      <form className='text-xl' onSubmit={handleSubmit}>
        <p>Email:</p>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ backgroundColor: 'lightgrey', width: '100%' ,marginBottom: 8 }}
        />
        <p>Password:</p>
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ backgroundColor: 'lightgrey', width: '100%' ,marginBottom: 8 }}
        />
        <button className='display: px-[2%] block border rounded mx-auto cursor-pointer hover:bg-blue-600 transition-all duration-300 ease-in-out' type="submit">Login</button>
        <button className='display: px-[2%] mt-[2%] block border rounded mx-auto cursor-pointer hover:bg-blue-600 transition-all duration-300 ease-in-out' onClick={() => router.push('/TeamNoteTakingApp/register')}>Register</button>
      </form>
    </main>
  );
}

