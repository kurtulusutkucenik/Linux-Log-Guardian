'use client';

import { useState, useEffect, useCallback } from 'react';
import { Server, Shield, Send, Terminal, Activity, Zap, Command, Radio } from 'lucide-react';

interface FleetAgent {
  agent_id: string;
  tenant_id: string;
  tenant_name?: string;
  eps: number;
  alerts_total: number;
  rce_detections: number;
  incidents_active: number;
  attack_trees: number;
  status: string;
  last_seen: string;
}

interface FleetCommand {
  id: string;
  commandType: string;
  payload: string;
  targetAgentId: string | null;
  executed: boolean;
  status: string;
  createdAt: string;
}

export default function FleetPage() {
  const [agents, setAgents] = useState<FleetAgent[]>([]);
  const [commands, setCommands] = useState<FleetCommand[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState('ALL');
  const [cmdType, setCmdType] = useState('BAN_IP');
  const [cmdPayload, setCmdPayload] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const refresh = useCallback(async () => {
    try {
      const [fleetRes, cmdRes] = await Promise.all([
        fetch('/api/fleet', { credentials: 'include' }),
        fetch('/api/copilot/action?limit=30', { credentials: 'include' }),
      ]);
      if (fleetRes.ok) {
        const data = await fleetRes.json();
        setAgents(data.fleet || []);
        setError('');
      } else {
        setError('Fleet API — oturum gerekli (/login)');
      }
      if (cmdRes.ok) {
        const cmdData = await cmdRes.json();
        setCommands(cmdData.actions || []);
      }
    } catch (err) {
      console.error(err);
      setError('Baglanti hatasi');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, 5000);
    return () => clearInterval(timer);
  }, [refresh]);

  const handleSendCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cmdPayload) return;
    setSubmitting(true);
    setSuccess('');
    try {
      const res = await fetch('/api/fleet/commands', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commandType: cmdType,
          payload: cmdPayload,
          targetAgentId: selectedAgent === 'ALL' ? null : selectedAgent,
          reason: 'dashboard-fleet',
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setCmdPayload('');
      setSuccess(data.immediateBan?.ok ? data.immediateBan.message : data.message || 'Komut gönderildi');
      setError('');
      setTimeout(() => setSuccess(''), 6000);
      refresh();
    } catch (err) {
      console.error(err);
      setError('Komut gonderilemedi');
    } finally {
      setSubmitting(false);
    }
  };

  const online = agents.filter((a) => a.status === 'Online').length;

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-indigo-500/20 rounded-xl">
            <Server className="w-8 h-8 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-blue-500">
              Fleet Command Center
            </h1>
            <p className="text-slate-400">
              {agents.length} agent · {online} online · canli telemetry
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Radio className={`w-4 h-4 ${online > 0 ? 'text-green-400 animate-pulse' : ''}`} />
          Push: BAN_IP / PUSH_CONFIG / PUSH_WAF_RULE
        </div>
      </div>

      {error && (
        <div className="bg-amber-500/10 border border-amber-500/30 text-amber-200 px-4 py-2 rounded-lg text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-500/10 border border-green-500/30 text-green-200 px-4 py-2 rounded-lg text-sm">
          {success}
        </div>
      )}

      {/* Agent grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading && agents.length === 0 ? (
          <p className="text-slate-500 col-span-full">Yukleniyor...</p>
        ) : agents.length === 0 ? (
          <p className="text-slate-500 col-span-full">
            Henuz agent yok. rules.conf: SAAS_ENABLED=1 + dashboard seed API key ile telemetry gonderin.
          </p>
        ) : (
          agents.map((a) => (
            <div
              key={`${a.tenant_id}-${a.agent_id}`}
              className="bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-indigo-500/40 transition-colors"
            >
              <div className="flex justify-between items-start mb-2">
                <span className="font-mono text-sm text-white">{a.agent_id}</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded ${
                    a.status === 'Online'
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-slate-700 text-slate-400'
                  }`}
                >
                  {a.status}
                </span>
              </div>
              <p className="text-xs text-slate-500 mb-3">{a.tenant_name || a.tenant_id}</p>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <span className="text-slate-400">EPS</span>
                <span className="text-right text-cyan-400">{a.eps.toFixed(1)}</span>
                <span className="text-slate-400">Alerts</span>
                <span className="text-right text-amber-400">{a.alerts_total}</span>
                <span className="text-slate-400">RCE</span>
                <span className="text-right text-red-400">{a.rce_detections}</span>
                <span className="text-slate-400">Incidents</span>
                <span className="text-right text-purple-400">{a.incidents_active}</span>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl h-fit">
          <h2 className="text-xl font-semibold mb-6 flex items-center text-white">
            <Terminal className="w-5 h-5 mr-2 text-indigo-400" /> Dispatch Command
          </h2>

          <form onSubmit={handleSendCommand} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Target Agent</label>
              <select
                value={selectedAgent}
                onChange={(e) => setSelectedAgent(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="ALL">Global (All Agents)</option>
                {agents.map((a) => (
                  <option key={a.agent_id} value={a.agent_id}>
                    {a.agent_id} ({a.status})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Command Type</label>
              <select
                value={cmdType}
                onChange={(e) => setCmdType(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="BAN_IP">BAN_IP</option>
                <option value="PUSH_WAF_RULE">PUSH_WAF_RULE</option>
                <option value="PUSH_THREAT_FEED">PUSH_THREAT_FEED</option>
                <option value="PUSH_CONFIG">PUSH_CONFIG</option>
                <option value="UNBAN_IP">UNBAN_IP</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Payload</label>
              <textarea
                rows={3}
                value={cmdPayload}
                onChange={(e) => setCmdPayload(e.target.value)}
                placeholder={cmdType === 'BAN_IP' ? '203.0.113.50' : 'SET ban_threshold 15'}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-300 font-mono text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting || !cmdPayload || agents.length === 0}
              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-semibold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center"
            >
              <Send className="w-5 h-5 mr-2" />
              {submitting ? 'Dispatching...' : 'Dispatch Command'}
            </button>
          </form>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-semibold flex items-center text-white">
            <Command className="w-5 h-5 mr-2 text-slate-400" /> Command History
          </h2>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            {commands.length === 0 ? (
              <div className="p-12 text-center">
                <Shield className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">Komut kuyrugu bos.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950/50 border-b border-slate-800">
                    <th className="px-6 py-4 font-semibold text-slate-400">Target</th>
                    <th className="px-6 py-4 font-semibold text-slate-400">Command</th>
                    <th className="px-6 py-4 font-semibold text-slate-400">Payload</th>
                    <th className="px-6 py-4 font-semibold text-slate-400">Status</th>
                    <th className="px-6 py-4 font-semibold text-slate-400 text-right">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {commands.map((cmd) => (
                    <tr key={cmd.id} className="hover:bg-slate-800/30">
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 rounded text-xs font-mono ${
                            cmd.targetAgentId
                              ? 'bg-blue-500/20 text-blue-400'
                              : 'bg-purple-500/20 text-purple-400'
                          }`}
                        >
                          {cmd.targetAgentId || 'GLOBAL'}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono text-sm text-slate-300">{cmd.commandType}</td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-500 max-w-[200px] truncate" title={cmd.payload}>
                        {cmd.payload}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`flex items-center text-xs ${
                            cmd.executed ? 'text-green-400' : 'text-yellow-400'
                          }`}
                        >
                          {cmd.executed ? (
                            <><Zap className="w-3 h-3 mr-1" /> Done</>
                          ) : (
                            <><Activity className="w-3 h-3 mr-1 animate-pulse" /> Pending</>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-slate-500">
                        {new Date(cmd.createdAt).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
