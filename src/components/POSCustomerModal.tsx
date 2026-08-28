import React, { useState } from 'react';
import { X, User, Search, CheckCircle2, UserPlus, Building, CreditCard } from 'lucide-react';
import { Customer } from '../types/pulse';

interface POSCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customers: Customer[];
  selectedCustomerId: string;
  onSelectCustomer: (customer: Customer) => void;
  onCreateTempCustomer: (customer: { id: string; name: string; taxId: string; address?: string }) => void;
}

export const POSCustomerModal: React.FC<POSCustomerModalProps> = ({
  isOpen,
  onClose,
  customers = [],
  selectedCustomerId,
  onSelectCustomer,
  onCreateTempCustomer,
}) => {
  const [tab, setTab] = useState<'SELECT' | 'NEW'>('SELECT');
  const [search, setSearch] = useState<string>('');
  
  // Custom customer form
  const [newName, setNewName] = useState<string>('');
  const [newTaxId, setNewTaxId] = useState<string>('');
  const [newAddress, setNewAddress] = useState<string>('');

  if (!isOpen) return null;

  const filteredCustomers = customers.filter((c) => {
    if (!search) return true;
    return (
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.taxId && c.taxId.includes(search)) ||
      (c.phone && c.phone.includes(search))
    );
  });

  const handleSaveCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const tempCust = {
      id: `cust_temp_${Date.now()}`,
      name: newName.trim(),
      taxId: newTaxId.trim() || '999999999',
      address: newAddress.trim() || 'Luanda, Angola',
      creditLimit: 0,
      balance: 0,
    };

    onCreateTempCustomer(tempCust);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 font-mono">
      <div className="bg-[#14141a] border border-slate-700 rounded-2xl w-full max-w-lg p-5 shadow-2xl space-y-4 text-xs">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Cliente / Identificação Fiscal (NIF)
              </h3>
              <p className="text-[10px] text-slate-400">
                Associação de cliente para emissão de Fatura / Recibo
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="grid grid-cols-2 gap-2 bg-[#1b1b22] p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setTab('SELECT')}
            className={`py-1.5 rounded-lg font-bold transition-all text-xs cursor-pointer ${
              tab === 'SELECT'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Clientes Cadastrados ({customers.length})
          </button>
          <button
            onClick={() => setTab('NEW')}
            className={`py-1.5 rounded-lg font-bold transition-all text-xs cursor-pointer ${
              tab === 'NEW'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Inserir NIF / Cliente Rápido
          </button>
        </div>

        {tab === 'SELECT' && (
          <div className="space-y-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Pesquisar por Nome, NIF ou Telefone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
                className="w-full bg-[#1b1b22] border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400"
              />
            </div>

            {/* List */}
            <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
              {filteredCustomers.map((cust) => {
                const isSelected = cust.id === selectedCustomerId;
                return (
                  <div
                    key={cust.id}
                    onClick={() => {
                      onSelectCustomer(cust);
                      onClose();
                    }}
                    className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                        : 'bg-[#18181f] border-slate-800 hover:border-slate-700 text-slate-200'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-white text-xs">{cust.name}</div>
                      <div className="text-[10px] text-slate-400">
                        NIF: {cust.taxId || '999999999'} • {cust.phone || 'Sem contacto'}
                      </div>
                    </div>
                    {isSelected && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {tab === 'NEW' && (
          <form onSubmit={handleSaveCustom} className="space-y-3">
            <div>
              <label className="block text-slate-400 text-[10px] font-bold uppercase mb-1">
                Nome do Cliente / Empresa:
              </label>
              <input
                type="text"
                required
                placeholder="Ex: João Baptista ou Luanda Logística Lda"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                autoFocus
                className="w-full bg-[#1b1b22] border border-slate-700 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-emerald-400"
              />
            </div>

            <div>
              <label className="block text-slate-400 text-[10px] font-bold uppercase mb-1">
                NIF (Número de Identificação Fiscal):
              </label>
              <input
                type="text"
                placeholder="Ex: 5418002910 ou 999999999"
                value={newTaxId}
                onChange={(e) => setNewTaxId(e.target.value)}
                className="w-full bg-[#1b1b22] border border-slate-700 rounded-xl p-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-400"
              />
            </div>

            <div>
              <label className="block text-slate-400 text-[10px] font-bold uppercase mb-1">
                Morada / Cidade (Opcional):
              </label>
              <input
                type="text"
                placeholder="Ex: Maianga, Luanda"
                value={newAddress}
                onChange={(e) => setNewAddress(e.target.value)}
                className="w-full bg-[#1b1b22] border border-slate-700 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-emerald-400"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Associar Cliente</span>
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};
