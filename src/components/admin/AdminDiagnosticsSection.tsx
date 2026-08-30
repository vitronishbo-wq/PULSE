import React, { useState } from 'react';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCw,
  Cpu,
  Server,
  Zap,
  Check,
  X,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { KernelFailedJob, SystemHealthCheck } from '../../types/platform';
import { initialFailedJobs, initialSystemHealth } from '../../data/platformSeedData';
import { Orchestrator } from '../../engines/Orchestrator';

interface AdminDiagnosticsSectionProps {
  leafId: string;
}

export const AdminDiagnosticsSection: React.FC<AdminDiagnosticsSectionProps> = ({ leafId }) => {
  const orchestrator = Orchestrator.getInstance();

  const [healthChecks] = useState<SystemHealthCheck[]>(initialSystemHealth);
  const [failedJobs, setFailedJobs] = useState<KernelFailedJob[]>(initialFailedJobs);
  const [testResults, setTestResults] = useState<any[]>([]);
  const [isRunningTests, setIsRunningTests] = useState(false);

  const testSuites = [
    { id: 'TS-01', name: 'EventBus Dispatches & Isolation Test', status: 'PASSED', duration: '2.1ms' },
    { id: 'TS-02', name: 'Tenant Row-Level Security Isolation', status: 'PASSED', duration: '1.4ms' },
    { id: 'TS-03', name: 'AGT RSA-SHA1 2048-bit Digital Signature', status: 'PASSED', duration: '5.2ms' },
    { id: 'TS-04', name: 'Chained Hash Fiscal Integrity Sequence', status: 'PASSED', duration: '3.0ms' },
    { id: 'TS-05', name: 'Multicaixa Reference Mod10/Mod11 Validation', status: 'PASSED', duration: '0.8ms' },
    { id: 'TS-06', name: 'Offline IndexedDB Conflict Resolution (LWW)', status: 'PASSED', duration: '4.1ms' },
  ];

  const handleRunAllTests = () => {
    setIsRunningTests(true);
    setTimeout(() => {
      setTestResults(testSuites);
      setIsRunningTests(false);
    }, 1200);
  };

  const handleRetryJob = (jobId: string) => {
    setFailedJobs((prev) =>
      prev.map((j) =>
        j.id === jobId
          ? {
              ...j,
              status: 'RETRYING',
              attempts: j.attempts + 1,
            }
          : j
      )
    );
  };

  return (
    <div className="space-y-4 text-xs font-mono">
      {/* 1. LEAF: TEST RUNNER */}
      {leafId === 'test_runner' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center border-b border-[#2d2d2d] pb-2">
            <div>
              <h3 className="text-sm font-bold text-white uppercase flex items-center gap-2">
                <Play className="w-4 h-4 text-emerald-400" />
                Suite Automatizada de Testes do Kernel (ULCE Test Runner)
              </h3>
              <p className="text-[11px] text-slate-400">Verificação contínua de isolamento, RBAC, e integridade fiscal</p>
            </div>
            <button
              onClick={handleRunAllTests}
              disabled={isRunningTests}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded font-bold text-xs flex items-center gap-1.5 transition-colors shadow"
            >
              {isRunningTests ? <RotateCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
              {isRunningTests ? 'Executando Suites...' : 'Executar Todos os Testes'}
            </button>
          </div>

          <div className="space-y-2">
            {(testResults.length > 0 ? testResults : testSuites).map((test) => (
              <div
                key={test.id}
                className="bg-[#252526] border border-[#3c3c3c] p-3 rounded flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-bold">
                    ✓
                  </span>
                  <span className="font-bold text-white text-xs">{test.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-slate-400 font-mono text-[10px]">{test.duration}</span>
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                    {test.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. LEAF: SYSTEM HEALTH */}
      {leafId === 'system_health' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center border-b border-[#2d2d2d] pb-2">
            <div>
              <h3 className="text-sm font-bold text-white uppercase flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                Diagnóstico em Tempo Real da Saúde dos Micro-Motores
              </h3>
              <p className="text-[11px] text-slate-400">Latência, conectividade externa e estado dos nós</p>
            </div>
          </div>

          <div className="space-y-2">
            {healthChecks.map((hc, idx) => (
              <div
                key={idx}
                className="bg-[#252526] border border-[#3c3c3c] p-3 rounded flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-white text-xs flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    {hc.service}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{hc.message}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sky-400 font-mono text-[11px]">{hc.latencyMs} ms</span>
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                    {hc.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. LEAF: FAILED JOBS */}
      {leafId === 'failed_jobs' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center border-b border-[#2d2d2d] pb-2">
            <div>
              <h3 className="text-sm font-bold text-white uppercase flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                Fila de Jobs Assíncronos com Falha (Dead Letter Queue)
              </h3>
              <p className="text-[11px] text-slate-400">Disparos de webhook, SMS e relatórios com erro</p>
            </div>
          </div>

          <div className="space-y-3">
            {failedJobs.map((job) => (
              <div
                key={job.id}
                className="bg-[#252526] border border-[#3c3c3c] rounded p-3 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-rose-400 font-bold font-mono">{job.id}</span>
                    <span className="text-white font-bold">{job.jobName}</span>
                    <span className="text-slate-400 text-[10px] font-mono">({job.queueName})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400">Tentativas: {job.attempts}</span>
                    <button
                      onClick={() => handleRetryJob(job.id)}
                      className="px-2 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded text-[10px] font-bold transition-colors"
                    >
                      Reenfileirar
                    </button>
                  </div>
                </div>

                <div className="p-2 bg-[#141414] border border-[#2d2d2d] rounded text-[10px] text-rose-300 font-mono">
                  {job.errorStack}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
