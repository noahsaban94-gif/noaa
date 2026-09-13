import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  Phone,
  Truck,
  Building2,
  FolderOpen,
  Plus,
  ExternalLink,
  FileText,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { Client, Order } from '../types';
import { INITIAL_CLIENTS } from '../data/mockAndInitialData';
import { ClientPortfolioModal } from './ClientPortfolioModal';

interface ClientsViewProps {
  onSelectClientForOrder: (client: Client) => void;
  orders?: Order[];
}

export const ClientsView: React.FC<ClientsViewProps> = ({
  onSelectClientForOrder,
  orders = [],
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClientForPortfolio, setSelectedClientForPortfolio] = useState<Client | null>(null);

  // Cross-reference helper to get orders count for each client
  const clientOrdersMap = useMemo(() => {
    const map: Record<string | number, number> = {};

    INITIAL_CLIENTS.forEach((client) => {
      const clientNameLower = client.name.toLowerCase().trim();
      const nameKeywords = clientNameLower
        .replace(/[\/\-\(\)\"]/g, ' ')
        .split(' ')
        .filter((w) => w.length > 2);

      const count = orders.filter((o) => {
        const oName = (o.clientName || '').toLowerCase().trim();
        if (oName === clientNameLower) return true;
        if (oName.includes(clientNameLower) || clientNameLower.includes(oName)) return true;
        return nameKeywords.some((kw) => oName.includes(kw));
      }).length;

      map[client.id] = count;
    });

    return map;
  }, [orders]);

  const filteredClients = INITIAL_CLIENTS.filter((c) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      c.name.toLowerCase().includes(term) ||
      c.phone.toLowerCase().includes(term) ||
      (c.comaxId && c.comaxId.toLowerCase().includes(term)) ||
      (c.contactPerson && c.contactPerson.toLowerCase().includes(term))
    );
  });

  const totalDriveFolders = INITIAL_CLIENTS.filter((c) => !!c.driveFolderUrl).length;
  const totalMatchedOrders = Object.values(clientOrdersMap).reduce((a: number, b: number) => a + b, 0);

  return (
    <div className="space-y-4">
      {/* Header & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 win-card rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold text-slate-900">תיקי לקוחות וקבלנים (CRM)</h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold">
                ח. סבן 1994
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              הצלבה וסריקה בזמן אמת של היסטוריית הזמנות ותעודות משלוח מגיליון Google Sheets ותיקיות Drive
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="w-full sm:w-72 relative">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="חיפוש קבלן, טלפון או Comax..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-9 pl-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          />
        </div>
      </div>

      {/* CRM Overview Stats Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] text-slate-400 font-semibold block">לקוחות פעילים</span>
          <strong className="text-xl font-black text-slate-900">{INITIAL_CLIENTS.length}</strong>
          <span className="text-[10px] text-slate-500 block mt-0.5">קבלנים רשומים</span>
        </div>

        <div className="p-3 bg-white rounded-2xl border border-blue-200 bg-blue-50/20 shadow-2xs">
          <span className="text-[11px] text-blue-600 font-semibold block">הזמנות ותעודות מקושרות</span>
          <strong className="text-xl font-black text-blue-700">{totalMatchedOrders}</strong>
          <span className="text-[10px] text-blue-600 block mt-0.5">סריקה פעילה מהגיליון</span>
        </div>

        <div className="p-3 bg-white rounded-2xl border border-amber-200 bg-amber-50/20 shadow-2xs">
          <span className="text-[11px] text-amber-700 font-semibold block">תיקיות Google Drive</span>
          <strong className="text-xl font-black text-amber-800">{totalDriveFolders}</strong>
          <span className="text-[10px] text-amber-600 block mt-0.5">תיקיות מסמכים מקושרות</span>
        </div>

        <div className="p-3 bg-white rounded-2xl border border-emerald-200 bg-emerald-50/20 shadow-2xs">
          <span className="text-[11px] text-emerald-700 font-semibold block">התאמת שיבוץ נהגים</span>
          <strong className="text-xl font-black text-emerald-800">100%</strong>
          <span className="text-[10px] text-emerald-600 block mt-0.5">חכמת מנוף / עלי איסוזו</span>
        </div>
      </div>

      {/* Clients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredClients.map((client) => {
          const isCrane = client.defaultDriver?.includes('חכמת');
          const linkedOrdersCount = clientOrdersMap[client.id] || 0;

          return (
            <div
              key={client.id}
              className="win-card win-card-hover rounded-2xl p-4 flex flex-col justify-between transition text-right group border border-slate-200/90 hover:border-blue-300"
            >
              <div>
                {/* Header: Name, Comax, Phone */}
                <div className="flex items-start justify-between">
                  <div className="cursor-pointer" onClick={() => setSelectedClientForPortfolio(client)}>
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-sm font-extrabold text-slate-900 group-hover:text-blue-600 transition">
                        {client.name}
                      </h3>
                      {client.comaxId && (
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                          #{client.comaxId}
                        </span>
                      )}
                    </div>
                    {client.contactPerson && (
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        איש קשר: {client.contactPerson}
                      </p>
                    )}
                  </div>

                  <a
                    href={`tel:${client.phone}`}
                    className="p-2 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition"
                    title={`חייג ל${client.name}`}
                  >
                    <Phone className="w-4 h-4" />
                  </a>
                </div>

                {/* Details */}
                <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-medium">טלפון:</span>
                    <span className="font-mono font-bold text-slate-800">{client.phone}</span>
                  </div>

                  {client.defaultDriver && (
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 font-medium">נהג קבוע:</span>
                      <span
                        className={`px-2 py-0.5 rounded-md font-semibold text-[11px] ${
                          isCrane ? 'bg-amber-50 text-amber-900' : 'bg-blue-50 text-blue-900'
                        }`}
                      >
                        {client.defaultDriver}
                      </span>
                    </div>
                  )}

                  {client.defaultWarehouse && (
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 font-medium">מחסן מקור:</span>
                      <span className="text-[11px] font-medium text-slate-700">
                        {client.defaultWarehouse}
                      </span>
                    </div>
                  )}

                  {/* Sheet Cross-Reference Indicator */}
                  <div className="pt-2 mt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-medium flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5 text-blue-500" />
                      <span>הזמנות ותעודות בגיליון:</span>
                    </span>
                    <span
                      className={`font-bold px-2 py-0.5 rounded-md text-[11px] ${
                        linkedOrdersCount > 0
                          ? 'bg-blue-50 text-blue-700 border border-blue-100'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {linkedOrdersCount > 0 ? `${linkedOrdersCount} הזמנות מקושרות` : 'ללא הזמנה פתוחה'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                <button
                  onClick={() => setSelectedClientForPortfolio(client)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition"
                  title="צפה בכרטיס תיק לקוח המלא"
                >
                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                  <span>תיק לקוח</span>
                </button>

                <div className="flex items-center gap-1.5">
                  {client.driveFolderUrl && (
                    <a
                      href={client.driveFolderUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-xl text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition"
                      title="פתח תיקיית Drive של הלקוח"
                    >
                      <FolderOpen className="w-4 h-4 text-amber-500" />
                    </a>
                  )}

                  <button
                    onClick={() => onSelectClientForOrder(client)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold transition active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>הזמנה</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Customer Portfolio Card Modal */}
      <ClientPortfolioModal
        isOpen={!!selectedClientForPortfolio}
        onClose={() => setSelectedClientForPortfolio(null)}
        client={selectedClientForPortfolio}
        orders={orders}
        onOpenNewOrderForClient={onSelectClientForOrder}
      />
    </div>
  );
};
