"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Lock, User, ArrowRight } from "lucide-react";

const ERROR_MESSAGES: Record<string, string> = {
  invalid: "Kullanici adi veya parola hatali",
  session: "Oturum suresi doldu — tekrar girin",
};

function LoginForm() {
  const searchParams = useSearchParams();
  const queryError = searchParams.get("error");
  const [loading, setLoading] = useState(false);

  const error =
    (queryError && ERROR_MESSAGES[queryError]) ||
    (queryError ? "Giris basarisiz" : "");

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      <div className="glass-panel p-8 w-full max-w-md relative z-10 border-t-4 border-t-primary">
        <div className="flex flex-col items-center gap-4 mb-8">
          <img
            src="/brand-logo-circle.png"
            alt="Linux Log Guardian"
            width={512}
            height={512}
            className="h-44 w-44 sm:h-48 sm:w-48 object-contain"
          />
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight text-white neon-text">
              Linux Log Guardian
            </h1>
            <p className="text-sm text-white/50 mt-1">
              Secure Fleet Command Center
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-danger/20 border border-danger/50 rounded text-danger text-sm text-center">
            {error}
          </div>
        )}

        <form
          action="/api/auth/login"
          method="POST"
          className="flex flex-col gap-5"
          onSubmit={() => setLoading(true)}
        >
          <div>
            <label className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-2 block">
              Username
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <input
                type="text"
                name="username"
                autoComplete="username"
                className="w-full bg-black/40 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-primary transition-colors"
                placeholder="admin"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-2 block">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <input
                type="password"
                name="password"
                autoComplete="current-password"
                className="w-full bg-black/40 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-primary transition-colors"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full bg-primary hover:bg-primary/90 text-black font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(34,197,94,0.4)] hover:shadow-[0_0_25px_rgba(34,197,94,0.6)]"
          >
            {loading ? "Authenticating..." : "Access Command Center"}
            {!loading && <ArrowRight className="w-5 h-5" />}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-white/10 text-center space-y-2">
          <p className="text-xs text-white/40 font-mono">
            Protected by Log Analyzer Framework v5.0
          </p>
          {process.env.NODE_ENV === "development" && (
            <p className="text-xs text-white/35 leading-relaxed">
              Dev: parola{" "}
              <span className="font-mono text-white/50">
                {process.env.NEXT_PUBLIC_DASHBOARD_DEV_PASS_HINT ||
                  "ChangeMeOnFirstLogin!"}
              </span>
              <br />
              Docker/TLS:{" "}
              <span className="font-mono text-white/50">https://localhost:8443</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
