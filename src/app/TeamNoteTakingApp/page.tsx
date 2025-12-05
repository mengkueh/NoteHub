"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./login&register.module.css";
import mainStyles from "./home/main.module.css";
import { useLanguage } from "./context/LanguageContext"

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const {lang, setLang } = useLanguage();

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
      <div className={styles.card}>
        <div className={styles.headerIcon}>🔐</div>
        <h1 className={styles.title}>{lang === "en" ? "WELCOME!" : "欢迎光临！"}</h1>
        <h2 className={styles.subtitle}>{lang === "en" ? "Sign In to Your Account" : "登录您的账号"}</h2>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div>
            <label className={styles.label}>{lang === "en" ? "Email" : "邮箱地址"}</label>
            <input
              type="email"
              placeholder={lang === "en" ? "Enter Your Email" : "请填入邮箱地址"}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={styles.input}
            />
          </div>

          <div>
            <label className={styles.label}>{lang === "en" ? "Password" : "密码"}</label>
            <input
              type="password"
              placeholder={lang === "en" ? "Enter Your Password" : "请输入密码"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className={styles.input}
            />
          </div>

          <button type="submit" className={styles.primaryButton} disabled={isLoading} aria-busy={isLoading}>
            {lang === "en" ? "Login" : "登录"}
          </button>

          <button
            type="button"
            onClick={handleRegister}
            className={styles.secondaryButton}
            disabled={isLoading}
            aria-busy={isLoading}
          >
            {lang === "en" ? "Register" : "注册账号"}
          </button>
        </form>
        <div className={styles.languageContainer}>
          <label className={styles.label}>{lang === "en" ? "Language" : "语言"}</label>
        <div className={mainStyles.languageToggleGroup}>
          <button
            onClick={() => setLang("en")}
            className={`${mainStyles.languageToggleButton} ${
              lang === "en" ? mainStyles.languageToggleButtonActive : ""
            }`}
          >
            English
          </button>

          <button
            onClick={() => setLang("zh")}
            className={`${mainStyles.languageToggleButton} ${
              lang === "zh" ? mainStyles.languageToggleButtonActive : ""
            }`}
          >
            中文
          </button>
        </div>
        </div>
      </div>
    </main>
  );
}