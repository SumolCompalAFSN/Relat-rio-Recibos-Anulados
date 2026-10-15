import React, { useState, useRef, useEffect } from 'react';
import {
  Calendar,
  FileCheck,
  Mail,
  Archive,
  Download,
  RefreshCw,
  Sparkles,
  SlidersHorizontal,
  Send,
  Eye,
  ChevronDown,
  Users
} from 'lucide-react';
import { ProcessingResult, GtGroup } from '../types';

interface HeaderProps {
  processingDate: Date;
  onDateChange: (date: Date) => void;
  result: ProcessingResult | null;
  onOpenEmailPreview: (targetGt?: GtGroup) => void;
  onSendEmail: () => void;
  onSendIndividualGt: (gtGroup: GtGroup) => void;
  onDownloadZip: () => void;
  onDownloadEml: () => void;
  onOpenTemplateModal: () => void;
  onLoadSampleData: () => void;
  hasData: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  processingDate,
  onDateChange,
  result,
  onOpenEmailPreview,
  onSendEmail,
  onSendIndividualGt,
  onDownloadZip,
  onDownloadEml,
  onOpenTemplateModal,
  onLoadSampleData,
  hasData
}) => {
  const [isGtMenuOpen, setIsGtMenuOpen] = useState(false);
  const gtDropdownRef = useRef<HTMLDivElement>(null);

  // Fecha o menu de GTs ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (gtDropdownRef.current && !gtDropdownRef.current.contains(event.target as Node)) {
        setIsGtMenuOpen(false);
      }
    };
    if (isGtMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isGtMenuOpen]);
  const dateStr = processingDate.toISOString().slice(0, 10);

  const handleDateInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      const parts = e.target.value.split('-');
      const newDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      onDateChange(newDate);
    }
  };

  const setToday = () => {
    onDateChange(new Date());
  };

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between py-4 gap-4">
          
          {/* Brand & Title */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-amber-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <FileCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-white">
                  CONTROLO DE RECIBOS ANULADOS
                </h1>
                <span className="hidden sm:inline-block text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  SAP GT Analytics
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Consolidação de anulações SAP &bull; Estatística de 5 Dias Úteis & Acumulado Anual por GT
              </p>
            </div>
          </div>

          {/* Controls: Date Picker & Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Reference Date Selector */}
            <div className="flex items-center bg-slate-800/90 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-300">
              <Calendar className="w-4 h-4 text-blue-400 mr-2 shrink-0" />
              <span className="mr-2 font-medium text-slate-400">Data Ref.:</span>
              <input
                type="date"
                value={dateStr}
                onChange={handleDateInput}
                className="bg-transparent text-white font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-1 cursor-pointer"
                title="Data de processamento de referência"
              />
              <button
                type="button"
                onClick={setToday}
                className="ml-1.5 text-[10px] text-blue-300 hover:text-white bg-slate-700/80 hover:bg-slate-700 px-1.5 py-0.5 rounded transition"
                title="Definir para a data de hoje"
              >
                Hoje
              </button>
            </div>

            {/* Template Manager Button */}
            <button
              type="button"
              onClick={onOpenTemplateModal}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
              title="Configurar tabela de correspondência de Vendedores e GT"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">Template</span> GT
            </button>

            {/* If no data yet, show sample loader shortcut */}
            {!hasData && (
              <button
                type="button"
                onClick={onLoadSampleData}
                className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-sm transition"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Carregar Exemplo SAP
              </button>
            )}

            {/* Export Actions if data is loaded */}
            {hasData && result && (
              <>
                <button
                  type="button"
                  onClick={() => onOpenEmailPreview()}
                  className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
                  title="Pré-visualizar email HTML formatado"
                >
                  <Eye className="w-3.5 h-3.5 text-blue-400" />
                  <span>Pré-visualizar</span>
                </button>

                <button
                  type="button"
                  onClick={onSendEmail}
                  className="flex items-center gap-1.5 text-xs font-bold px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white shadow-sm shadow-blue-600/30 transition ring-1 ring-blue-400/40"
                  title="Criar nova mensagem com formatação HTML completa no Novo Outlook para Windows (Técnica RVV)"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Enviar Email</span>
                </button>

                {/* Botão Enviar GT com Seleção de GT */}
                <div className="relative" ref={gtDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsGtMenuOpen((prev) => !prev)}
                    className="flex items-center gap-1.5 text-xs font-bold px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm shadow-indigo-600/30 transition ring-1 ring-indigo-400/40"
                    title="Apresentar lista de GTs para envio de email individual da equipa"
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>Enviar GT</span>
                    <ChevronDown className={`w-3 h-3 transition-transform duration-150 ${isGtMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isGtMenuOpen && (
                    <div className="absolute right-0 mt-2 w-84 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                      <div className="p-3 bg-slate-50 border-b border-slate-200">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                            Selecionar GT
                          </span>
                          <span className="text-[10px] bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full font-bold">
                            {result.gtGroups.length} GTs
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-tight">
                          Clique no GT pretendido para gerar e abrir o rascunho com o gráfico da equipa no Novo Outlook (Técnica RVV).
                        </p>
                      </div>

                      <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                        {result.gtGroups.map((group) => {
                          const displayName = group.nomeGt || group.emailGt;
                          return (
                            <div
                              key={group.emailGt}
                              className="p-3 hover:bg-indigo-50/80 transition flex items-center justify-between group gap-2"
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  setIsGtMenuOpen(false);
                                  onSendIndividualGt(group);
                                }}
                                className="flex-1 text-left"
                                title={`Criar mensagem no Outlook para ${displayName}`}
                              >
                                <div className="text-xs font-bold text-slate-900 group-hover:text-indigo-900 flex items-center gap-1.5">
                                  <span className="text-indigo-600 text-[10px]">▼</span>
                                  <span>{displayName}</span>
                                </div>
                                <div className="text-[11px] text-slate-400 font-mono truncate mt-0.5">
                                  {group.emailGt}
                                </div>
                                <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-2">
                                  <span>{group.vendedores.length} vendedores</span>
                                  <span>&bull;</span>
                                  <span>5d: <strong className="text-slate-700">{group.totalUltimos5Dias}</strong></span>
                                  <span>&bull;</span>
                                  <span>Acum: <strong className="text-slate-700">{group.totalAcumuladoAno}</strong></span>
                                </div>
                              </button>

                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setIsGtMenuOpen(false);
                                    onOpenEmailPreview(group);
                                  }}
                                  className="p-1.5 rounded-md hover:bg-indigo-100 text-slate-400 hover:text-indigo-700 transition"
                                  title={`Pré-visualizar email de ${displayName}`}
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setIsGtMenuOpen(false);
                                    onSendIndividualGt(group);
                                  }}
                                  className="px-2.5 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition flex items-center gap-1 shadow-xs"
                                  title="Abrir no Outlook (Técnica RVV)"
                                >
                                  <Send className="w-3 h-3" />
                                  <span>Enviar</span>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={onDownloadEml}
                  className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
                  title="Descarregar ficheiro .EML padrão RFC 822 para o Outlook"
                >
                  <Download className="w-3.5 h-3.5 text-slate-400" />
                  <span>Exportar EML</span>
                </button>

                <button
                  type="button"
                  onClick={onDownloadZip}
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm shadow-emerald-600/30 transition"
                  title="Descarregar pacote ZIP completo (HTML + EML + Excel + Relatório)"
                >
                  <Archive className="w-3.5 h-3.5" />
                  <span>Exportar ZIP</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
