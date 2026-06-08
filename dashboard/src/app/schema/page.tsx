'use client';

import { useState, useEffect } from 'react';
import { Shield, Upload, FileJson, CheckCircle, AlertTriangle, ShieldAlert } from 'lucide-react';

interface SchemaInfo {
  loaded: boolean;
  id?: string;
  name?: string;
  version?: string;
  endpointCount?: number;
  uploadedAt?: string;
}

export default function SchemaPage() {
  const [schemaInfo, setSchemaInfo] = useState<SchemaInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [jsonInput, setJsonInput] = useState('');
  const [schemaName, setSchemaName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchSchema = async () => {
    try {
      const res = await fetch('/api/schema', {
        headers: {
          'x-user-tenant': 'tenant-demo',
        }
      });
      const data = await res.json();
      setSchemaInfo(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchema();
  }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/schema', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-tenant': 'tenant-demo',
          'x-user-role': 'admin'
        },
        body: JSON.stringify({
          name: schemaName || 'API_v1',
          jsonContent: jsonInput
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      
      setSuccess(`✅ Schema deployed! ${data.pathCount} endpoints protected.`);
      setJsonInput('');
      fetchSchema();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Active schema will be deactivated. Are you sure?')) return;
    try {
      await fetch('/api/schema', {
        method: 'DELETE',
        headers: {
          'x-user-tenant': 'tenant-demo',
          'x-user-role': 'admin'
        }
      });
      fetchSchema();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex items-center space-x-4 mb-8">
        <Shield className="w-10 h-10 text-cyan-400" />
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
            Zero-Trust Schema Firewall
          </h1>
          <p className="text-slate-400">Enforce strict API schemas at the C-engine level</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Status Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <h2 className="text-xl font-semibold mb-6 flex items-center">
            <CheckCircle className="w-5 h-5 mr-2 text-green-400" /> Current Policy Status
          </h2>
          
          {loading ? (
            <div className="animate-pulse flex space-x-4">
              <div className="h-10 bg-slate-800 rounded w-full"></div>
            </div>
          ) : schemaInfo?.loaded ? (
            <div className="space-y-6">
              <div className="p-4 bg-slate-800/50 rounded-xl border border-green-500/20">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-slate-400">Active Schema</span>
                  <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-mono">
                    ENFORCING
                  </span>
                </div>
                <p className="text-2xl font-bold text-white">{schemaInfo.name}</p>
                <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="block text-slate-500">Endpoints</span>
                    <span className="text-cyan-400 font-mono text-lg">{schemaInfo.endpointCount}</span>
                  </div>
                  <div>
                    <span className="block text-slate-500">Version</span>
                    <span className="text-white font-mono">{schemaInfo.version}</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={handleDelete}
                className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl transition-all"
              >
                Disable Schema Firewall
              </button>
            </div>
          ) : (
            <div className="p-8 text-center border-2 border-dashed border-slate-700 rounded-xl">
              <ShieldAlert className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400">No active schema.</p>
              <p className="text-sm text-slate-500 mt-2">API requests are evaluated only by the RegEx WAF.</p>
            </div>
          )}
        </div>

        {/* Upload Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <h2 className="text-xl font-semibold mb-6 flex items-center">
            <Upload className="w-5 h-5 mr-2 text-blue-400" /> Deploy New Schema
          </h2>

          <form onSubmit={handleUpload} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Schema Name</label>
              <input 
                type="text" 
                value={schemaName}
                onChange={e => setSchemaName(e.target.value)}
                placeholder="e.g. Core API v2"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-cyan-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1 flex items-center justify-between">
                <span>OpenAPI / Swagger JSON</span>
                <span className="text-xs bg-slate-800 px-2 py-1 rounded text-slate-300">Format: JSON</span>
              </label>
              <textarea 
                rows={10}
                value={jsonInput}
                onChange={e => setJsonInput(e.target.value)}
                placeholder='{ "openapi": "3.0.0", "info": { ... } }'
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-300 font-mono text-sm focus:ring-2 focus:ring-cyan-500 outline-none"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 flex items-center text-sm">
                <AlertTriangle className="w-4 h-4 mr-2 flex-shrink-0" />
                {error}
              </div>
            )}
            
            {success && (
              <div className="p-3 bg-green-500/10 border border-green-500/50 rounded-lg text-green-400 flex items-center text-sm">
                <CheckCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                {success}
              </div>
            )}

            <button 
              type="submit"
              disabled={!jsonInput.trim()}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-cyan-500/20"
            >
              Push to Fleet (PUSH_SCHEMA)
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
