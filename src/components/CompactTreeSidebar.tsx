import React, { useState, useEffect } from 'react';
import {
  ChevronRight,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  Minimize2,
  Zap,
  FileText,
  Package,
  Wallet,
  Users,
  Briefcase,
  Globe,
  Settings,
  Sparkles,
  Truck,
  BarChart3,
  CreditCard,
} from 'lucide-react';
import { TenantProfile, User } from '../types/pulse';
import { resolveNavigationTree, NavRootModule } from '../utils/navigationResolver';

interface CompactTreeSidebarProps {
  tenant: TenantProfile;
  currentUser: User;
  activeTab: string;
  activeSubView?: string;
  onSelectTab: (tabId: any, subView?: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

export const CompactTreeSidebar: React.FC<CompactTreeSidebarProps> = ({
  tenant,
  currentUser,
  activeTab,
  activeSubView,
  onSelectTab,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen = false,
  onMobileClose,
}) => {
  // Navigation tree strictly resolved by Tenant + Modules + Role
  const treeRoots: NavRootModule[] = resolveNavigationTree(tenant, currentUser);

  // Storage key for user expansion preferences
  const storageKey = `pulse_tree_expanded_${currentUser.uid}_${tenant.id}`;

  // Expanded nodes map: { [rootId]: boolean }
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const saved = window.localStorage.getItem(storageKey);
        if (saved) return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    // Default: expand the first root or the root containing the active tab
    const initial: Record<string, boolean> = {};
    if (treeRoots.length > 0) {
      initial[treeRoots[0].id] = true;
    }
    return initial;
  });

  // Save expanded states
  const toggleNode = (nodeId: string) => {
    setExpandedNodes((prev) => {
      const next = { ...prev, [nodeId]: !prev[nodeId] };
      if (typeof window !== 'undefined' && window.localStorage) {
        try {
          window.localStorage.setItem(storageKey, JSON.stringify(next));
        } catch (e) {}
      }
      return next;
    });
  };

  // Collapse All action
  const handleCollapseAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedNodes({});
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(storageKey, JSON.stringify({}));
      } catch (e) {}
    }
  };

  // Auto-expand the root node that contains the active tab if it's not already expanded
  useEffect(() => {
    for (const root of treeRoots) {
      const containsActive = root.submodules.some((sub) =>
        sub.items.some((item) => item.targetTab === activeTab)
      );
      if (containsActive && !expandedNodes[root.id]) {
        setExpandedNodes((prev) => {
          const next = { ...prev, [root.id]: true };
          if (typeof window !== 'undefined' && window.localStorage) {
            try {
              window.localStorage.setItem(storageKey, JSON.stringify(next));
            } catch (e) {}
          }
          return next;
        });
        break;
      }
    }
  }, [activeTab]);

  const iconMap: Record<string, any> = {
    Zap,
    FileText,
    Package,
    Truck,
    Wallet,
    Users,
    Briefcase,
    Globe,
    BarChart3,
    Settings,
    CreditCard,
  };

  // Content rendering
  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#18181b] text-slate-300 select-none font-mono text-xs border-r border-[#27272a]">
      {/* 1. Header minimalista da árvore (Estilo VS Code Explorer) */}
      <div className="flex items-center justify-between px-2.5 py-2 border-b border-[#27272a] bg-[#121215] text-[11px]">
        {!isCollapsed && (
          <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-slate-400 truncate">
            <span>EXPLORER</span>
            <span className="text-[9px] text-emerald-400 font-normal">
              [{tenant.segment || tenant.businessSegment || 'CORE'}]
            </span>
          </div>
        )}

        <div className="flex items-center gap-1 ml-auto">
          {!isCollapsed && (
            <button
              onClick={handleCollapseAll}
              title="Recolher Tudo"
              className="p-1 hover:bg-[#27272a] text-slate-400 hover:text-white rounded transition-colors cursor-pointer"
            >
              <Minimize2 className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={onToggleCollapse}
            title={isCollapsed ? 'Expandir Navegação' : 'Recolher Navegação'}
            className="p-1 hover:bg-[#27272a] text-slate-400 hover:text-emerald-400 rounded transition-colors cursor-pointer"
          >
            {isCollapsed ? (
              <ChevronsRight className="w-3.5 h-3.5" />
            ) : (
              <ChevronsLeft className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* 2. Árvore de Módulos */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden py-1.5 scrollbar-thin">
        {isCollapsed ? (
          // Mini-Rail (Ícones apenas no estado mínimo)
          <div className="flex flex-col items-center gap-1.5 py-1">
            {treeRoots.map((root) => {
              const Icon = iconMap[root.iconName] || Zap;
              const hasActiveLeaf = root.submodules.some((s) =>
                s.items.some((i) => i.targetTab === activeTab)
              );
              return (
                <button
                  key={root.id}
                  onClick={() => {
                    onToggleCollapse();
                    setExpandedNodes((p) => ({ ...p, [root.id]: true }));
                  }}
                  title={root.label}
                  className={`w-9 h-9 flex items-center justify-center rounded-lg transition-all cursor-pointer ${
                    hasActiveLeaf
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-[#27272a]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </button>
              );
            })}
          </div>
        ) : (
          // Full Tree View (› MÓDULO > › SUBMÓDULO > › FUNÇÃO)
          <div className="space-y-0.5 px-1">
            {treeRoots.map((root) => {
              const isExpanded = !!expandedNodes[root.id];
              const Icon = iconMap[root.iconName] || Zap;
              const hasActiveLeaf = root.submodules.some((s) =>
                s.items.some((i) => i.targetTab === activeTab)
              );

              return (
                <div key={root.id} className="text-xs">
                  {/* Root Node */}
                  <button
                    onClick={() => toggleNode(root.id)}
                    className={`w-full flex items-center gap-1.5 px-1.5 py-1 rounded text-left transition-colors cursor-pointer ${
                      hasActiveLeaf
                        ? 'text-emerald-300 font-semibold bg-[#27272a]/60'
                        : 'text-slate-300 hover:text-white hover:bg-[#27272a]/40'
                    }`}
                  >
                    <span className="text-slate-500">
                      {isExpanded ? (
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                      )}
                    </span>
                    <Icon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate tracking-wide font-bold text-[11px]">
                      {root.label}
                    </span>
                  </button>

                  {/* Children / Submodules */}
                  {isExpanded && (
                    <div className="pl-3.5 border-l border-[#27272a] ml-2.5 my-0.5 space-y-0.5">
                      {root.submodules.map((sub) => (
                        <div key={sub.id} className="space-y-0.5">
                          {/* Leaf Items */}
                          {sub.items.map((item) => {
                            const isSelected =
                              activeTab === item.targetTab &&
                              (!item.subView || item.subView === activeSubView);
                            return (
                              <button
                                key={item.id}
                                onClick={() => {
                                  onSelectTab(item.targetTab, item.subView);
                                  if (isMobileOpen && onMobileClose) {
                                    onMobileClose();
                                  }
                                }}
                                className={`w-full flex items-center justify-between gap-1.5 px-2 py-1 rounded text-left transition-all cursor-pointer ${
                                  isSelected
                                    ? 'bg-emerald-500/15 text-emerald-300 font-bold border-l-2 border-emerald-400 pl-1.5'
                                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#27272a]/30'
                                }`}
                              >
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <span className="text-[10px] text-slate-600">›</span>
                                  <span className="truncate text-[11px] font-sans">
                                    {item.label}
                                  </span>
                                </div>
                                {item.badge && (
                                  <span className="text-[9px] px-1 py-0.2 rounded bg-[#27272a] text-slate-400 border border-[#3f3f46]">
                                    {item.badge}
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. Footer minimalista da sidebar */}
      {!isCollapsed && (
        <div className="p-2 border-t border-[#27272a] bg-[#121215] flex items-center justify-between text-[10px] text-slate-500 font-mono">
          <div className="truncate">
            {currentUser.name.split(' ')[0]} ({currentUser.role})
          </div>
          <span className="text-emerald-500 font-bold">●</span>
        </div>
      )}
    </div>
  );

  // Desktop sidebar wrapper vs Mobile drawer
  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        id="pulse-compact-sidebar"
        className={`hidden md:block transition-all duration-200 shrink-0 sticky top-10 h-[calc(100vh-42px)] ${
          isCollapsed ? 'w-12' : 'w-60'
        }`}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div
          id="pulse-mobile-sidebar-drawer"
          className="fixed inset-0 z-50 md:hidden flex"
        >
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onMobileClose}
          />
          <div className="relative w-4/5 max-w-xs h-full bg-[#18181b] z-10 shadow-2xl animate-in slide-in-from-left">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
