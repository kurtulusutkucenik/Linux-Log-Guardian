'use client';

import { useState, useEffect } from 'react';
import { Blocks, UploadCloud, Cpu, Trash2, CheckCircle, AlertCircle, Terminal } from 'lucide-react';

interface PluginInfo {
  id: string;
  name: string;
  version: string;
  active: boolean;
  callsTotal: number;
  blocksTotal: number;
  uploadedAt: string;
}

export default function PluginsPage() {
  const [plugins, setPlugins] = useState<PluginInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [uploading, setUploading] = useState(false);

  const fetchPlugins = async () => {
    try {
      const res = await fetch('/api/plugins', { headers: { 'x-user-tenant': 'tenant-demo' }});
      const data = await res.json();
      setPlugins(data.plugins || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlugins();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      setFile(f);
      if (!name) setName(f.name.replace('.wasm', ''));
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setUploading(true);

    try {
      // Read file as base64
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1];
        await fetch('/api/plugins', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-tenant': 'tenant-demo',
            'x-user-role': 'admin'
          },
          body: JSON.stringify({
            name: name || 'Custom Plugin',
            wasmBase64: base64
          })
        });
        setFile(null);
        setName('');
        fetchPlugins();
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to disable this plugin across the fleet?')) return;
    await fetch(`/api/plugins?id=${id}`, {
      method: 'DELETE',
      headers: {
        'x-user-tenant': 'tenant-demo',
        'x-user-role': 'admin'
      }
    });
    fetchPlugins();
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-purple-500/20 rounded-xl">
            <Blocks className="w-8 h-8 text-purple-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-500">
              WebAssembly Plugin Runtime
            </h1>
            <p className="text-slate-400">Hot-plug Go/Rust/TS security logic into the core engine</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Plugin List */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-semibold flex items-center text-white">
            <Cpu className="w-5 h-5 mr-2 text-slate-400" /> Loaded Plugins
          </h2>
          
          {loading ? (
            <div className="animate-pulse space-y-4">
              {[1, 2].map(i => <div key={i} className="h-32 bg-slate-800 rounded-xl"></div>)}
            </div>
          ) : plugins.length === 0 ? (
            <div className="p-12 text-center border-2 border-dashed border-slate-700 rounded-xl">
              <Blocks className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400">No WebAssembly plugins deployed.</p>
            </div>
          ) : (
            plugins.map(p => (
              <div key={p.id} className={`p-6 rounded-2xl border transition-all ${p.active ? 'bg-slate-900 border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.1)]' : 'bg-slate-900/50 border-slate-800 opacity-70'}`}>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${p.active ? 'bg-green-400 shadow-[0_0_10px_#4ade80]' : 'bg-slate-600'}`} />
                    <h3 className="text-xl font-bold text-white">{p.name}</h3>
                    <span className="px-2 py-1 bg-slate-800 text-slate-300 rounded text-xs font-mono">v{p.version}</span>
                  </div>
                  {p.active && (
                    <button 
                      onClick={() => handleDelete(p.id)}
                      className="text-red-400 hover:bg-red-500/20 p-2 rounded-lg transition-colors"
                      title="Deactivate Plugin"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                    <span className="block text-slate-500 text-sm mb-1">Invocations</span>
                    <span className="text-2xl font-mono text-cyan-400">{p.callsTotal.toLocaleString()}</span>
                  </div>
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                    <span className="block text-slate-500 text-sm mb-1">Threats Blocked</span>
                    <span className="text-2xl font-mono text-pink-400">{p.blocksTotal.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Deploy New Plugin */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl h-fit sticky top-8">
          <h2 className="text-xl font-semibold mb-6 flex items-center">
            <UploadCloud className="w-5 h-5 mr-2 text-purple-400" /> Hot Deploy
          </h2>
          
          <form onSubmit={handleUpload} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Plugin Name</label>
              <input 
                type="text" 
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Custom JWT Auth"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-purple-500 outline-none"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Wasm Binary (.wasm)</label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-700 border-dashed rounded-xl hover:border-purple-500/50 transition-colors">
                <div className="space-y-1 text-center">
                  <Terminal className="mx-auto h-12 w-12 text-slate-400" />
                  <div className="flex text-sm text-slate-400">
                    <label htmlFor="file-upload" className="relative cursor-pointer bg-slate-900 rounded-md font-medium text-purple-400 hover:text-purple-300">
                      <span>Upload a file</span>
                      <input id="file-upload" name="file-upload" type="file" className="sr-only" accept=".wasm" onChange={handleFileChange} />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-slate-500">
                    {file ? file.name : "WASM up to 10MB"}
                  </p>
                </div>
              </div>
            </div>

            <button 
              type="submit"
              disabled={!file || uploading}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold rounded-xl transition-all disabled:opacity-50 shadow-lg shadow-purple-500/20"
            >
              {uploading ? 'Deploying...' : 'Deploy to Fleet'}
            </button>
            
            <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl text-sm text-blue-300 flex items-start">
              <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5" />
              <p>Plugin will be immediately hot-plugged into the C engine without restarting via Wasmtime.</p>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}
