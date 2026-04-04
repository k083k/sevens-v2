"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { testConnection, testRealtimeSetup } from "@/lib/supabase/test-connection";

export default function TestPage() {
  const [connectionStatus, setConnectionStatus] = useState<string>("Not tested");
  const [realtimeStatus, setRealtimeStatus] = useState<string>("Not tested");

  const handleTestConnection = async () => {
    setConnectionStatus("Testing...");
    const success = await testConnection();
    setConnectionStatus(success ? "✅ Connected!" : "❌ Failed");
  };

  const handleTestRealtime = async () => {
    setRealtimeStatus("Testing...");
    const success = await testRealtimeSetup();
    setRealtimeStatus(success ? "✅ Realtime working!" : "❌ Failed");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-blue-50 dark:from-slate-950 dark:to-slate-900 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Supabase Connection Test</h1>

        <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-lg space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">Database Connection</h2>
            <div className="flex items-center gap-4">
              <Button onClick={handleTestConnection}>Test Connection</Button>
              <span className="text-lg">{connectionStatus}</span>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4">Realtime Setup</h2>
            <div className="flex items-center gap-4">
              <Button onClick={handleTestRealtime}>Test Realtime</Button>
              <span className="text-lg">{realtimeStatus}</span>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
              Check the browser console for detailed logs
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
