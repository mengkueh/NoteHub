"use client";
import Link from "next/link";
import { useLanguage } from "@/app/TeamNoteTakingApp/context/LanguageContext";

type Props = { loginPath?: string; registerPath?: string };

export default function NotLoggedIn({ loginPath = "/TeamNoteTakingApp", registerPath = "/TeamNoteTakingApp/register" }: Props) {
  const { lang } = useLanguage();
  return (
    <main style={{
      height: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#000",
      color: "#fff",
      textAlign: "center",
      padding: 24,
    }}>
      <div style={{ maxWidth: 720 }}>
        <h1 style={{ fontSize: 20, lineHeight: 1.4, marginBottom: 18 }}>
          {lang === "en"
            ? "You are not logged in yet. Please return to login page to Login Or Create an account."
            : "您尚未登录。请返回登录页面进行登录或注册账号。"}
        </h1>

        <div style={{ marginTop: 16, display: "flex", gap: 12, justifyContent: "center" }}>
          <Link href={loginPath}>
            <button style={{
              background: "transparent",
              color: "#fff",
              border: "1px solid #fff",
              padding: "8px 18px",
              borderRadius: 6,
              cursor: "pointer"
            }}>
              {lang === "en" ? "Login" : "登录"}
            </button>
          </Link>

          <Link href={registerPath}>
            <button style={{
              background: "#fff",
              color: "#000",
              border: "none",
              padding: "8px 18px",
              borderRadius: 6,
              cursor: "pointer"
            }}>
              {lang === "en" ? "Register Account" : "注册账号"}
            </button>
          </Link>
        </div>
      </div>
    </main>
  );
}