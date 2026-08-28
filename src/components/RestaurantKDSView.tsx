import React, { useState } from 'react';
import {
  UtensilsCrossed,
  Flame,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Layers,
  ChefHat,
  Bell,
  Coffee,
  Wine,
  Users,
  Plus,
  RefreshCw,
} from 'lucide-react';
import { Product, TenantProfile, User } from '../types/pulse';

interface OrderTicket {
  id: string;
  table: string;
  waiter: string;
  time: string;
  items: {
    name: string;
    qty: number;
    notes?: string;
    category: 'COZINHA' | 'BAR' | 'SOBREMESA';
    status: 'PENDING' | 'COOKING' | 'READY' | 'SERVED';
  }[];
  status: 'OPEN' | 'IN_PREP' | 'READY' | 'CLOSED';
}

interface RestaurantKDSViewProps {
  tenant: TenantProfile;
  products: Product[];
  currentUser: User;
  currency: string;
}

export const RestaurantKDSView: React.FC<RestaurantKDSViewProps> = ({
  tenant,
  products,
  currentUser,
  currency,
}) => {
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'COZINHA' | 'BAR'>('ALL');
  const [selectedTable, setSelectedTable] = useState<string>('Mesa 02');

  const [tables, setTables] = useState<
    { id: string; name: string; capacity: number; status: 'FREE' | 'OCCUPIED' | 'BILL_REQUESTED'; guests: number; total: number }[]
  >([
    { id: 't1', name: 'Mesa 01', capacity: 2, status: 'OCCUPIED', guests: 2, total: 18500 },
    { id: 't2', name: 'Mesa 02', capacity: 4, status: 'OCCUPIED', guests: 3, total: 32400 },
    { id: 't3', name: 'Mesa 03', capacity: 4, status: 'FREE', guests: 0, total: 0 },
    { id: 't4', name: 'Mesa 04', capacity: 6, status: 'BILL_REQUESTED', guests: 5, total: 64200 },
    { id: 't5', name: 'Mesa 05', capacity: 2, status: 'FREE', guests: 0, total: 0 },
    { id: 't6', name: 'Mesa 06', capacity: 8, status: 'FREE', guests: 0, total: 0 },
    { id: 't7', name: 'Balcão 01', capacity: 1, status: 'OCCUPIED', guests: 1, total: 4500 },
    { id: 't8', name: 'Balcão 02', capacity: 1, status: 'FREE', guests: 0, total: 0 },
  ]);

  const [tickets, setTickets] = useState<OrderTicket[]>([
    {
      id: 'KDS-101',
      table: 'Mesa 02',
      waiter: 'João Manuel',
      time: '14:22 (Há 12 min)',
      status: 'IN_PREP',
      items: [
        { name: 'Hambúrguer Gourmet PULSE', qty: 2, notes: 'Bem passado, sem cebola', category: 'COZINHA', status: 'COOKING' },
        { name: 'Prato do Dia (Muamba de Galinha)', qty: 1, notes: 'Com pirão extra', category: 'COZINHA', status: 'READY' },
        { name: 'Cuca Cerveja Lata 33cl', qty: 3, notes: 'Bem gelada', category: 'BAR', status: 'SERVED' },
        { name: 'Sumo Natural de Maracujá', qty: 1, notes: 'Sem açúcar', category: 'BAR', status: 'READY' },
      ],
    },
    {
      id: 'KDS-102',
      table: 'Mesa 01',
      waiter: 'Marta Silva',
      time: '14:28 (Há 6 min)',
      status: 'IN_PREP',
      items: [
        { name: 'Hambúrguer Gourmet PULSE', qty: 1, notes: 'Ponto médio', category: 'COZINHA', status: 'COOKING' },
        { name: 'Café Espresso Gourmet', qty: 2, notes: 'Curto', category: 'BAR', status: 'PENDING' },
      ],
    },
    {
      id: 'KDS-103',
      table: 'Mesa 04',
      waiter: 'Carlos Viana',
      time: '14:32 (Há 2 min)',
      status: 'OPEN',
      items: [
        { name: 'Prato do Dia (Muamba de Galinha)', qty: 3, notes: 'Para mesa toda', category: 'COZINHA', status: 'PENDING' },
        { name: 'Água Mineral com Gás', qty: 3, notes: 'Com limão', category: 'BAR', status: 'PENDING' },
      ],
    },
  ]);

  const advanceItemStatus = (ticketId: string, itemIdx: number) => {
    setTickets((prev) =>
      prev.map((t) => {
        if (t.id !== ticketId) return t;
        const newItems = [...t.items];
        const current = newItems[itemIdx].status;
        const nextStatus =
          current === 'PENDING'
            ? 'COOKING'
            : current === 'COOKING'
            ? 'READY'
            : current === 'READY'
            ? 'SERVED'
            : 'SERVED';
        newItems[itemIdx] = { ...newItems[itemIdx], status: nextStatus };
        return { ...t, items: newItems };
      })
    );
  };

  const advanceAllTicketItems = (ticketId: string) => {
    setTickets((prev) =>
      prev.map((t) => {
        if (t.id !== ticketId) return t;
        return {
          ...t,
          status: 'READY',
          items: t.items.map((i) => ({ ...i, status: 'READY' })),
        };
      })
    );
  };

  const recipeProducts = products.filter((p) => p.type === 'recipe');

  return (
    <div id="restaurant-kds-module" className="space-y-4 font-mono">
      
      {/* RESTAURANT HEADER BANNER */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <UtensilsCrossed className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-white uppercase text-sm">
              Módulo de Restauração, Mesas & KDS (Kitchen Display System)
            </div>
            <div className="text-[11px] text-slate-400">
              {tenant.tradeName} • Fichas Técnicas Ativas • Gestão de Comandas
            </div>
          </div>
        </div>

        {/* Section Filters */}
        <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 p-1 rounded-lg">
          <button
            onClick={() => setActiveFilter('ALL')}
            className={`px-3 py-1 rounded text-xs font-bold transition-colors ${
              activeFilter === 'ALL' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            Todos ({tickets.length})
          </button>
          <button
            onClick={() => setActiveFilter('COZINHA')}
            className={`px-3 py-1 rounded text-xs font-bold transition-colors ${
              activeFilter === 'COZINHA' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            🍳 Cozinha
          </button>
          <button
            onClick={() => setActiveFilter('BAR')}
            className={`px-3 py-1 rounded text-xs font-bold transition-colors ${
              activeFilter === 'BAR' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            🍹 Bar & Cafetaria
          </button>
        </div>
      </div>

      {/* TOP SECTION: TABLE OCCUPANCY MATRIX */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-2">
        <div className="flex justify-between items-center text-xs">
          <span className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">
            Mapa de Ocupação do Salão & Balcão
          </span>
          <div className="flex items-center gap-3 text-[10px] text-slate-400">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Livre
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" /> Ocupada
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" /> Conta Pedida
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {tables.map((tbl) => (
            <div
              key={tbl.id}
              onClick={() => setSelectedTable(tbl.name)}
              className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all ${
                selectedTable === tbl.name
                  ? 'border-amber-400 bg-amber-500/10 shadow-md shadow-amber-500/10'
                  : tbl.status === 'OCCUPIED'
                  ? 'bg-slate-950 border-amber-500/40 hover:border-amber-400'
                  : tbl.status === 'BILL_REQUESTED'
                  ? 'bg-slate-950 border-rose-500/50 hover:border-rose-400'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex justify-between items-center">
                <span className="font-bold text-xs text-white">{tbl.name}</span>
                <span
                  className={`w-2 h-2 rounded-full ${
                    tbl.status === 'FREE'
                      ? 'bg-emerald-500'
                      : tbl.status === 'OCCUPIED'
                      ? 'bg-amber-500 animate-pulse'
                      : 'bg-rose-500'
                  }`}
                />
              </div>

              <div className="mt-2 text-[10px] text-slate-400">
                {tbl.status === 'FREE' ? (
                  <span className="text-emerald-400">Disponível ({tbl.capacity} pax)</span>
                ) : (
                  <div>
                    <div className="text-slate-200">{tbl.guests} clientes</div>
                    <div className="font-bold text-amber-400 mt-0.5">
                      {tbl.total.toLocaleString()} {currency}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* TWO COLUMN: KDS TICKETS & RECIPES (BOM) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        
        {/* KDS PRODUCTION SCREEN (8 COLS) */}
        <div className="lg:col-span-8 space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-white uppercase flex items-center gap-1.5">
              <ChefHat className="w-4 h-4 text-amber-400" />
              <span>Comandas Ativas na Cozinha / Bar ({tickets.length})</span>
            </h3>
            <span className="text-[10px] text-slate-500">
              Tempo médio de preparo: 14 min
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {tickets.map((ticket) => (
              <div
                key={ticket.id}
                className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-3 shadow-lg flex flex-col justify-between"
              >
                <div>
                  {/* Ticket Header */}
                  <div className="flex justify-between items-start border-b border-slate-800 pb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-amber-400">{ticket.table}</span>
                        <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.2 rounded font-mono">
                          {ticket.id}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        Empregado: {ticket.waiter}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-[10px] font-bold text-amber-300 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{ticket.time}</span>
                      </div>
                    </div>
                  </div>

                  {/* Ticket Items */}
                  <div className="mt-2.5 space-y-2">
                    {ticket.items
                      .filter((i) => activeFilter === 'ALL' || i.category === activeFilter)
                      .map((item, idx) => (
                        <div
                          key={idx}
                          onClick={() => advanceItemStatus(ticket.id, idx)}
                          className={`p-2 rounded-lg border text-xs cursor-pointer transition-all flex items-start justify-between gap-2 ${
                            item.status === 'READY'
                              ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                              : item.status === 'COOKING'
                              ? 'bg-amber-950/30 border-amber-500/40 text-amber-200'
                              : item.status === 'SERVED'
                              ? 'bg-slate-950/40 border-slate-800 text-slate-500 line-through'
                              : 'bg-slate-950 border-slate-800 text-slate-200 hover:border-slate-700'
                          }`}
                        >
                          <div>
                            <div className="flex items-center gap-1.5 font-bold">
                              <span className="text-amber-400">{item.qty}x</span>
                              <span>{item.name}</span>
                            </div>
                            {item.notes && (
                              <div className="text-[10px] text-slate-400 mt-0.5 italic">
                                Obs: {item.notes}
                              </div>
                            )}
                          </div>

                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0 ${
                              item.status === 'READY'
                                ? 'bg-emerald-500 text-slate-950'
                                : item.status === 'COOKING'
                                ? 'bg-amber-500 text-slate-950 animate-pulse'
                                : item.status === 'SERVED'
                                ? 'bg-slate-800 text-slate-400'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {item.status === 'COOKING'
                              ? 'A Preparar'
                              : item.status === 'READY'
                              ? 'Pronto'
                              : item.status === 'SERVED'
                              ? 'Servido'
                              : 'Pendente'}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Ticket Footer Action */}
                <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
                  <span className="text-[10px] text-slate-500">
                    Toque nos itens para avançar
                  </span>
                  <button
                    onClick={() => advanceAllTicketItems(ticket.id)}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1 rounded text-[10px] font-bold transition-colors flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Tudo Pronto</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RECIPES & BOM INGREDIENTS BREAKDOWN (4 COLS) */}
        <div className="lg:col-span-4 space-y-3">
          <h3 className="text-xs font-bold text-white uppercase flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-sky-400" />
            <span>Fichas Técnicas & Ingredientes (BOM)</span>
          </h3>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-3">
            <p className="text-[11px] text-slate-400">
              A cada venda de prato ou bebida composta, o PULSE.OS deduz automaticamente a matéria-prima do stock físico:
            </p>

            <div className="space-y-2.5">
              {recipeProducts.map((recipe) => (
                <div key={recipe.id} className="bg-slate-950 border border-slate-800 rounded-lg p-2.5 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-bold text-white text-xs">{recipe.name}</span>
                      <span className="text-[10px] text-slate-500 block">
                        Preço Venda: {recipe.price.toLocaleString()} {currency}
                      </span>
                    </div>
                    <span className="bg-amber-500/20 text-amber-300 text-[9px] px-1.5 py-0.2 rounded font-bold border border-amber-500/30">
                      RECEITA
                    </span>
                  </div>

                  <div className="border-t border-slate-800 pt-2 space-y-1">
                    <span className="text-[9px] text-slate-500 uppercase tracking-wider block font-bold">
                      Explosão de Ingredientes:
                    </span>
                    {recipe.recipeItems?.map((ing, i) => {
                      const rawMat = products.find((p) => p.id === ing.rawProductId);
                      return (
                        <div key={i} className="flex justify-between items-center text-[10px] text-slate-300">
                          <span>{rawMat?.name || ing.rawProductId}</span>
                          <span className="font-mono text-amber-300">
                            {ing.quantity} {ing.unit}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
