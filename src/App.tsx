import React, { useState, useEffect, useMemo, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  FileCheck,
  AlertCircle,
  HelpCircle,
  FileSpreadsheet,
  Mail,
  Archive,
  Download,
  Info
} from 'lucide-react';
import { Header } from './components/Header';
import { FileUploadSection } from './components/FileUploadSection';
import { KpiCards } from './components/KpiCards';
import { ChartsSection } from './components/ChartsSection';
import { GtConsolidatedTable } from './components/GtConsolidatedTable';
import { EmailPreviewModal } from './components/EmailPreviewModal';
import { ReceiptDetailsModal } from './components/ReceiptDetailsModal';
import { TemplateManagerModal } from './components/TemplateManagerModal';

import { SellerTemplate, SapRawRow, ProcessingResult, SellerSummary, GtGroup } from './types';
import { DEFAULT_SELLERS_TEMPLATE } from './data/defaultTemplate';
import {
  parseSapExcel,
  parseTemplateEmails,
  SapParseResult
} from './utils/excelParser';
import { aggregateSapData } from './utils/aggregator';
import {
  downloadZipPackage,
  downloadEmlFile,
  downloadExcelReport,
  openOutlookDraftMessage,
  openIndividualGtOutlookDraft,
  triggerDownload
} from './utils/exporter';

export default function App() {
  // Estado dos Templates de Vendedores
  const [templates, setTemplates] = useState<SellerTemplate[]>(() => {
    try {
      const saved = localStorage.getItem('controlo_recibos_templates');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return DEFAULT_SELLERS_TEMPLATE;
  });

  // Estado dos Dados SAP
  const [sapRecords, setSapRecords] = useState<SapRawRow[]>([]);
  const [parseInfo, setParseInfo] = useState<SapParseResult | null>(null);
  const [processingDate, setProcessingDate] = useState<Date>(() => new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Filtros e Seleção
  const [selectedGtFilter, setSelectedGtFilter] = useState<string>('');
  const [selectedSellerForAudit, setSelectedSellerForAudit] = useState<SellerSummary | null>(null);

  // Modais
  const [isEmailPreviewOpen, setIsEmailPreviewOpen] = useState(false);
  const [previewTargetGt, setPreviewTargetGt] = useState<GtGroup | null>(null);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [successNotification, setSuccessNotification] = useState<string | null>(null);

  // Grava templates no localStorage
  const handleSaveTemplates = (updated: SellerTemplate[]) => {
    setTemplates(updated);
    try {
      localStorage.setItem('controlo_recibos_templates', JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  // Cálculo da agregação principal
  const processingResult = useMemo<ProcessingResult | null>(() => {
    if (sapRecords.length === 0) return null;
    return aggregateSapData(sapRecords, templates, {
      referenceDate: processingDate,
      includeReferenceDateIn5Days: false,
      showZeroActivitySellers: false
    });
  }, [sapRecords, templates, processingDate]);

  // Carrega demonstração inicial automaticamente para que a aplicação venha imediatamente com dados operacionais
  const loadSampleData = useCallback(() => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const sampleBuffer = generateSampleSapWorkbook(processingDate);
      parseSapExcel(sampleBuffer).then((result) => {
        setSapRecords(result.records);
        setParseInfo(result);
        setIsLoading(false);
        try {
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.8 }
          });
        } catch {
          // ignore
        }
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao carregar dados de exemplo.');
      setIsLoading(false);
    }
  }, [processingDate]);

  // Carrega na primeira montagem se ainda não tiver dados
  useEffect(() => {
    if (sapRecords.length === 0) {
      loadSampleData();
    }
  }, [loadSampleData, sapRecords.length]);

  // Upload de ficheiro Excel SAP
  const handleSapFileUpload = async (file: File) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const result = await parseSapExcel(file);
      setSapRecords(result.records);
      setParseInfo(result);
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch {
        // ignore
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao processar ficheiro Excel SAP.');
    } finally {
      setIsLoading(false);
    }
  };

  // Upload de ficheiro Template_Emails.xlsx
  const handleTemplateFileUpload = async (file: File) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const parsedTemplates = await parseTemplateEmails(file);
      handleSaveTemplates(parsedTemplates);
      setSuccessNotification(`Template atualizado com sucesso! ${parsedTemplates.length} vendedores carregados.`);
      setTimeout(() => setSuccessNotification(null), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao processar ficheiro Template_Emails.xlsx.');
    } finally {
      setIsLoading(false);
    }
  };

  

  // Envio de email para o Novo Outlook para Windows (Técnica RVV)
  // Gera o rascunho com X-Unsent: 1 e HTML formatado, permitindo revisão manual e clique em Enviar
  const handleSendEmail = () => {
    if (!processingResult) return;
    openOutlookDraftMessage(processingResult);
    setSuccessNotification(
      'Email gerado com sucesso! A abrir nova mensagem no Novo Outlook para Windows com cabeçalhos, tabelas e cores formatadas em HTML.'
    );
    setTimeout(() => setSuccessNotification(null), 6000);
    try {
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.7 }
      });
    } catch {
      // ignore
    }
  };

  // Envio de email individual por GT para o Novo Outlook para Windows (Técnica RVV)
  const handleSendIndividualGt = (gtGroup: GtGroup) => {
    if (!processingResult) return;
    openIndividualGtOutlookDraft(processingResult, gtGroup);
    const gtName = gtGroup.nomeGt || gtGroup.emailGt;
    setSuccessNotification(
      `Email individual para ${gtName} gerado com sucesso! A abrir nova mensagem no Novo Outlook com gráfico da equipa e tabela formatada.`
    );
    setTimeout(() => setSuccessNotification(null), 6000);
    try {
      confetti({
        particleCount: 50,
        spread: 50,
        origin: { y: 0.7 }
      });
    } catch {
      // ignore
    }
  };

  const handleOpenEmailPreview = (targetGt?: GtGroup) => {
    setPreviewTargetGt(targetGt || null);
    setIsEmailPreviewOpen(true);
  };

  // Exportação EML direta
  const handleDownloadEml = () => {
    if (!processingResult) return;
    downloadEmlFile(processingResult);
  };

  // Exportação ZIP completa
  const handleDownloadZip = () => {
    if (!processingResult) return;
    downloadZipPackage(processingResult);
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-800 flex flex-col font-sans">
      
      {/* Top Header */}
      <Header
        processingDate={processingDate}
        onDateChange={setProcessingDate}
        result={processingResult}
        onOpenEmailPreview={handleOpenEmailPreview}
        onSendEmail={handleSendEmail}
        onSendIndividualGt={handleSendIndividualGt}
        onDownloadZip={handleDownloadZip}
        onDownloadEml={handleDownloadEml}
        onOpenTemplateModal={() => setIsTemplateModalOpen(true)}
        onLoadSampleData={loadSampleData}
        hasData={sapRecords.length > 0}
      />

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Success notification if any */}
        {successNotification && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center justify-between shadow-xs">
            <span className="font-semibold">{successNotification}</span>
            <button
              type="button"
              onClick={() => setSuccessNotification(null)}
              className="text-emerald-700 hover:text-emerald-950 font-bold ml-4"
            >
              ✕
            </button>
          </div>
        )}
        
        {/* Error notification if any */}
        {errorMessage && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3 shadow-xs">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-bold">Erro no processamento do ficheiro:</strong>
              <span>{errorMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="ml-auto text-rose-500 hover:text-rose-800 font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* Upload & Setup Section */}
        <FileUploadSection
          onSapFileUpload={handleSapFileUpload}
          onTemplateFileUpload={handleTemplateFileUpload}
          onLoadSampleData={loadSampleData}
          isLoading={isLoading}
          parseInfo={parseInfo}
          processingResult={processingResult}
          templatesCount={templates.length}
        />

        {/* Processing Results & Dashboard */}
        {processingResult && (
          <>
            {/* KPI Overview Cards */}
            <KpiCards
              kpis={processingResult.kpis}
              totalUltimos5Dias={processingResult.gtGroups.reduce(
                (sum, g) => sum + g.totalUltimos5Dias,
                0
              )}
            />

            {/* Visual Charts: Top 10 Vendedores & Top 10 GT */}
            <ChartsSection
              kpis={processingResult.kpis}
              onSelectSellerCode={(code) => {
                // Procura vendedor e abre auditoria
                for (const g of processingResult.gtGroups) {
                  const found = g.vendedores.find((s) => s.codigo === code);
                  if (found) {
                    setSelectedSellerForAudit(found);
                    break;
                  }
                }
              }}
              onSelectGt={(gt) => setSelectedGtFilter(gt)}
            />

            {/* Consolidated GT Table with Rankings and Highlights */}
            <GtConsolidatedTable
              gtGroups={processingResult.gtGroups}
              selectedGtFilter={selectedGtFilter}
              onSelectGtFilter={setSelectedGtFilter}
              onOpenReceiptDetails={(seller) => setSelectedSellerForAudit(seller)}
              onSendIndividualGt={handleSendIndividualGt}
            />
          </>
        )}

        {/* If no data loaded */}
        {!processingResult && !isLoading && (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
            <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4">
              <FileSpreadsheet className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Nenhum ficheiro SAP de recibos carregado
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mb-5">
              Arrasta o ficheiro Excel exportado do SAP para a área superior ou clica no botão abaixo para carregar dados de demonstração da Sumol+Compal.
            </p>
            <button
              type="button"
              onClick={loadSampleData}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition"
            >
              Carregar Dados de Demonstração SAP
            </button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-5 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">CONTROLO DE RECIBOS ANULADOS</span>
            <span>&bull;</span>
            <span>Direção Comercial &bull; Operações SAP</span>
          </div>
          <div className="text-[11px] text-slate-400">
            Regra: Apenas 1 ocorrência por Nº doc. &bull; Códigos GVnd estritamente texto (001, 049, G04) &bull; CC: Paulo Cordeiro, Luis Carril, Fernando Coimbra
          </div>
        </div>
      </footer>

      {/* Modals */}
      {processingResult && (
        <EmailPreviewModal
          isOpen={isEmailPreviewOpen}
          onClose={() => {
            setIsEmailPreviewOpen(false);
            setPreviewTargetGt(null);
          }}
          result={processingResult}
          initialGtGroup={previewTargetGt}
          onSendEmail={handleSendEmail}
          onSendIndividualGt={handleSendIndividualGt}
        />
      )}

      {selectedSellerForAudit && processingResult && (
        <ReceiptDetailsModal
          seller={selectedSellerForAudit}
          onClose={() => setSelectedSellerForAudit(null)}
          referenceDate={processingDate}
          businessDaysRange={processingResult.businessDaysRange}
        />
      )}

      <TemplateManagerModal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        templates={templates}
        onSaveTemplates={handleSaveTemplates}
        onUploadFile={handleTemplateFileUpload}
      />

    </div>
  );
}
