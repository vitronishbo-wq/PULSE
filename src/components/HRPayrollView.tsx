import React, { useState } from 'react';
import {
  Users,
  FileCheck,
  CreditCard,
  Plus,
  Play,
  Search,
  CheckCircle2,
  Calendar,
  DollarSign,
  Download,
  Building,
} from 'lucide-react';
import { Employee, Payslip, TenantProfile } from '../types/pulse';
import { Orchestrator } from '../engines/Orchestrator';

interface HRPayrollViewProps {
  tenant: TenantProfile;
}

export const HRPayrollView: React.FC<HRPayrollViewProps> = ({ tenant }) => {
  const orchestrator = Orchestrator.getInstance();
  const hrEngine = orchestrator.hrEngine;

  const [employees, setEmployees] = useState<Employee[]>(hrEngine.getEmployees(tenant.id));
  const [payslips, setPayslips] = useState<Payslip[]>(hrEngine.getPayslips(tenant.id));
  const [search, setSearch] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('2026-08');
  const [activeTab, setActiveTab] = useState<'EMPLOYEES' | 'PAYROLL' | 'PAYSLIPS'>('EMPLOYEES');
  const [successMsg, setSuccessMsg] = useState('');

  // Process single employee payroll
  const handleProcessPayroll = (employeeId: string) => {
    const payslip = hrEngine.processEmployeePayroll(employeeId, selectedPeriod, tenant.country);
    if (payslip) {
      setPayslips(hrEngine.getPayslips(tenant.id));
      setSuccessMsg(`Salário de ${payslip.employeeName} processado com sucesso (${payslip.netSalary.toLocaleString()} ${tenant.currency})`);
      setTimeout(() => setSuccessMsg(''), 4000);
    }
  };

  // Process batch payroll for all active employees
  const handleProcessBatchPayroll = () => {
    employees.filter((e) => e.active).forEach((e) => {
      hrEngine.processEmployeePayroll(e.id, selectedPeriod, tenant.country);
    });
    setPayslips(hrEngine.getPayslips(tenant.id));
    setSuccessMsg(`Folha salarial completa do período ${selectedPeriod} processada com sucesso!`);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const filteredEmployees = employees.filter(
    (e) =>
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.role.toLowerCase().includes(search.toLowerCase()) ||
      e.department.toLowerCase().includes(search.toLowerCase()) ||
      e.taxId.includes(search)
  );

  return (
    <div id="view-hr-payroll" className="p-3 sm:p-4 space-y-3 font-mono text-xs text-slate-200">
      {/* Dense View Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-3 rounded">
        <div className="flex items-center gap-3">
          <Users className="w-5 h-5 text-emerald-400" />
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Recursos Humanos, Retenções & Processamento Salarial
            </h2>
            <div className="text-[11px] text-slate-400">
              Cálculo legal de impostos ({tenant.country === 'AO' ? 'IRT Progressivo + INSS 3%/8%' : 'IRS + Seg. Social'}) • Tenant: <strong className="text-white">{tenant.tradeName}</strong>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Period Selector */}
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-700 px-2 py-1 rounded text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400 text-[10px]">Período:</span>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="bg-transparent text-emerald-400 font-bold focus:outline-none cursor-pointer text-xs"
            >
              <option value="2026-08" className="bg-slate-900 text-white">Agosto 2026</option>
              <option value="2026-07" className="bg-slate-900 text-white">Julho 2026</option>
              <option value="2026-06" className="bg-slate-900 text-white">Junho 2026</option>
            </select>
          </div>

          <button
            onClick={handleProcessBatchPayroll}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-3 py-1.5 rounded font-bold text-xs flex items-center gap-1.5 transition-colors"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Processar Folha Completa</span>
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-2.5 bg-emerald-950/40 border border-emerald-500/50 rounded text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Dense Navigation Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-800 pb-1">
        {[
          { id: 'EMPLOYEES', label: `Quadro de Colaboradores (${employees.length})` },
          { id: 'PAYROLL', label: `Simulação & Processamento (${selectedPeriod})` },
          { id: 'PAYSLIPS', label: `Recibos Emitidos (${payslips.length})` },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`px-3 py-1.5 rounded text-[11px] font-bold transition-colors ${
              activeTab === t.id
                ? 'bg-slate-800 text-emerald-400 border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* TAB 1: EMPLOYEES LIST TABLE */}
      {activeTab === 'EMPLOYEES' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3 bg-slate-900/60 border border-slate-800 p-2 rounded">
            <div className="flex items-center gap-2 flex-1">
              <Search className="w-3.5 h-3.5 text-slate-500" />
              <input
                type="text"
                placeholder="Filtrar colaboradores por nome, cargo, departamento ou NIF..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-transparent text-white focus:outline-none w-full text-xs"
              />
            </div>
            <div className="text-[11px] text-slate-400">
              Total: <strong className="text-white">{filteredEmployees.length}</strong> colaboradores
            </div>
          </div>

          <div className="border border-slate-800 rounded bg-slate-950 overflow-auto">
            <table className="w-full text-left font-mono text-[11px] border-collapse">
              <thead className="bg-slate-900 text-slate-400 border-b border-slate-800 uppercase text-[10px] sticky top-0">
                <tr>
                  <th className="py-2 px-2.5">ID</th>
                  <th className="py-2 px-2.5">Nome Completo</th>
                  <th className="py-2 px-2.5">NIF / Contribuinte</th>
                  <th className="py-2 px-2.5">Seg. Social (INSS)</th>
                  <th className="py-2 px-2.5">Função / Cargo</th>
                  <th className="py-2 px-2.5">Departamento</th>
                  <th className="py-2 px-2.5 text-right">Salário Base</th>
                  <th className="py-2 px-2.5 text-right">Subsídios</th>
                  <th className="py-2 px-2.5 text-center">Estado</th>
                  <th className="py-2 px-2.5 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {filteredEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-900/60">
                    <td className="py-2 px-2.5 text-emerald-400 font-bold">{emp.id}</td>
                    <td className="py-2 px-2.5 text-white font-bold">{emp.name}</td>
                    <td className="py-2 px-2.5 text-slate-300">{emp.taxId}</td>
                    <td className="py-2 px-2.5 text-slate-300">{emp.socialSecurityNumber}</td>
                    <td className="py-2 px-2.5 text-slate-200">{emp.role}</td>
                    <td className="py-2 px-2.5 text-slate-400">{emp.department}</td>
                    <td className="py-2 px-2.5 text-right font-bold text-white">
                      {emp.baseSalary.toLocaleString()} {tenant.currency}
                    </td>
                    <td className="py-2 px-2.5 text-right text-slate-300">
                      {(emp.foodAllowance + emp.transportAllowance).toLocaleString()} {tenant.currency}
                    </td>
                    <td className="py-2 px-2.5 text-center">
                      <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30 text-[10px]">
                        Ativo
                      </span>
                    </td>
                    <td className="py-2 px-2.5 text-right">
                      <button
                        onClick={() => handleProcessPayroll(emp.id)}
                        className="px-2 py-0.5 bg-emerald-500/10 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded text-[10px] font-bold"
                      >
                        Processar Salário
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: PAYROLL CALCULATION MATRIX */}
      {activeTab === 'PAYROLL' && (
        <div className="border border-slate-800 rounded bg-slate-950 overflow-auto">
          <table className="w-full text-left font-mono text-[11px] border-collapse">
            <thead className="bg-slate-900 text-slate-400 border-b border-slate-800 uppercase text-[10px] sticky top-0">
              <tr>
                <th className="py-2 px-2.5">Colaborador</th>
                <th className="py-2 px-2.5 text-right">Salário Base</th>
                <th className="py-2 px-2.5 text-right">Subsídios</th>
                <th className="py-2 px-2.5 text-right">Total Ilíquido</th>
                <th className="py-2 px-2.5 text-right text-amber-400">INSS Func. (3%)</th>
                <th className="py-2 px-2.5 text-right text-red-400">Retenção IRT</th>
                <th className="py-2 px-2.5 text-right text-emerald-400">Salário Líquido</th>
                <th className="py-2 px-2.5 text-right text-slate-400">Encargo Empresa (8%)</th>
                <th className="py-2 px-2.5 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              {employees.map((emp) => {
                const calc = hrEngine.calculatePayroll(emp, tenant.country);
                return (
                  <tr key={emp.id} className="hover:bg-slate-900/60">
                    <td className="py-2 px-2.5 text-white font-bold">{emp.name}</td>
                    <td className="py-2 px-2.5 text-right text-slate-300">{emp.baseSalary.toLocaleString()} {tenant.currency}</td>
                    <td className="py-2 px-2.5 text-right text-slate-300">{(emp.foodAllowance + emp.transportAllowance).toLocaleString()} {tenant.currency}</td>
                    <td className="py-2 px-2.5 text-right font-bold text-white">{calc.grossTotal.toLocaleString()} {tenant.currency}</td>
                    <td className="py-2 px-2.5 text-right text-amber-400 font-bold">-{calc.ssEmployee.toLocaleString()} {tenant.currency}</td>
                    <td className="py-2 px-2.5 text-right text-red-400 font-bold">-{calc.irtDeduction.toLocaleString()} {tenant.currency}</td>
                    <td className="py-2 px-2.5 text-right text-emerald-400 font-bold text-xs">{calc.netSalary.toLocaleString()} {tenant.currency}</td>
                    <td className="py-2 px-2.5 text-right text-slate-400">+{calc.ssCompany.toLocaleString()} {tenant.currency}</td>
                    <td className="py-2 px-2.5 text-right">
                      <button
                        onClick={() => handleProcessPayroll(emp.id)}
                        className="px-2 py-0.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded text-[10px]"
                      >
                        Pagar & Emitir
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 3: ISSUED PAYSLIPS */}
      {activeTab === 'PAYSLIPS' && (
        <div className="border border-slate-800 rounded bg-slate-950 overflow-auto">
          <table className="w-full text-left font-mono text-[11px] border-collapse">
            <thead className="bg-slate-900 text-slate-400 border-b border-slate-800 uppercase text-[10px] sticky top-0">
              <tr>
                <th className="py-2 px-2.5">Recibo ID</th>
                <th className="py-2 px-2.5">Período</th>
                <th className="py-2 px-2.5">Colaborador</th>
                <th className="py-2 px-2.5 text-right">Total Ilíquido</th>
                <th className="py-2 px-2.5 text-right">INSS (3%)</th>
                <th className="py-2 px-2.5 text-right">IRT Retido</th>
                <th className="py-2 px-2.5 text-right">Líquido Pago</th>
                <th className="py-2 px-2.5">Data de Emissão</th>
                <th className="py-2 px-2.5 text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850">
              {payslips.map((p) => (
                <tr key={p.id} className="hover:bg-slate-900/60">
                  <td className="py-2 px-2.5 text-emerald-400 font-bold">{p.id}</td>
                  <td className="py-2 px-2.5 text-white font-bold">{p.period}</td>
                  <td className="py-2 px-2.5 text-slate-200">{p.employeeName}</td>
                  <td className="py-2 px-2.5 text-right text-slate-300">{p.grossTotal.toLocaleString()} {tenant.currency}</td>
                  <td className="py-2 px-2.5 text-right text-amber-400">-{p.socialSecurityEmployee.toLocaleString()} {tenant.currency}</td>
                  <td className="py-2 px-2.5 text-right text-red-400">-{p.irtDeduction.toLocaleString()} {tenant.currency}</td>
                  <td className="py-2 px-2.5 text-right text-emerald-400 font-bold">{p.netSalary.toLocaleString()} {tenant.currency}</td>
                  <td className="py-2 px-2.5 text-slate-400 text-[10px]">{p.processedAt.split('T')[0]}</td>
                  <td className="py-2 px-2.5 text-center">
                    <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30 text-[10px]">
                      {p.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
