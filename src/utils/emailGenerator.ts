import { ProcessingResult, GtGroup } from '../types';
import { FIXED_CC_EMAILS } from '../data/defaultTemplate';
import {
  generateTop10VendedoresChartImage,
  generateRankingGtChartImage
} from './chartImageGenerator';

export interface EmailData {
  to: string[];
  cc: string[];
  subject: string;
  htmlBody: string;
  plainTextBody: string;
  chartTop10Base64?: string;
  chartRankingGtBase64?: string;
}

/**
 * Retorna os emails TO únicos (todos os GTs válidos encontrados)
 */
export function extractToGtEmails(gtGroups: GtGroup[]): string[] {
  const emails = new Set<string>();
  for (const group of gtGroups) {
    const email = group.emailGt.trim().toLowerCase();
    if (email && email.includes('@') && !email.includes('não atribuído') && !email.includes('sem gt')) {
      emails.add(email);
    }
  }
  return Array.from(emails);
}

export interface GenerateHtmlOptions {
  top10Img?: string;
  rankingGtImg?: string;
  isForEml?: boolean;
}

/**
 * Gera o HTML completo do email, com estilos inline robustos para Outlook e Gmail.
 * Inclui os gráficos do Top 10 Vendedores e Ranking GT antes das tabelas detalhadas.
 */
export function generateEmailHtml(
  result: ProcessingResult,
  options?: GenerateHtmlOptions
): string {
  const { gtGroups, businessDaysRange, processingDate } = result;

  const formatDatePt = (d: Date) =>
    d.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' });

  // Imagens dos gráficos
  const top10Img =
    options?.top10Img ??
    (result.chartImages?.top10VendedoresPng ||
      generateTop10VendedoresChartImage(result.kpis.top10Vendedores));

  const rankingGtImg =
    options?.rankingGtImg ??
    (result.chartImages?.rankingGtPng ||
      generateRankingGtChartImage(result.kpis.rankingGts || result.kpis.top10Gts));

  const top10Src = options?.isForEml ? 'cid:chart_top10_vendedores' : top10Img;
  const rankingGtSrc = options?.isForEml ? 'cid:chart_ranking_gt' : rankingGtImg;

  // Constrói tabelas por GT
  const tablesHtml = gtGroups
    .map((group) => {
      const rowsHtml = group.vendedores
        .map((s) => {
          let rankBadgeBg = '#f3f4f6';
          let rankBadgeColor = '#374151';
          let rowBg = '#ffffff';
          let statusBadge = '';

          if (s.ultimos5DiasUteis === 0) {
            statusBadge = `<span style="display:inline-block; padding:2px 8px; font-size:11px; font-weight:600; border-radius:12px; background-color:#dcfce7; color:#15803d; border:1px solid #bbf7d0;">✓ 0 Anulações (5d)</span>`;
          }

          if (s.ranking <= 3 && s.acumuladoAno > 0) {
            rankBadgeBg = '#fee2e2';
            rankBadgeColor = '#b91c1c';
            rowBg = '#fff8f8';
          } else if (s.acumuladoAno > 0) {
            rankBadgeBg = '#fef3c7';
            rankBadgeColor = '#b45309';
          }

          const recentCellBg = s.ultimos5DiasUteis === 0 ? '#f0fdf4' : '#ffffff';
          const recentTextColor = s.ultimos5DiasUteis === 0 ? '#16a34a' : '#1f2937';

          return `
            <tr style="background-color:${rowBg}; border-bottom:1px solid #e5e7eb;">
              <td style="padding:10px 12px; text-align:center; font-weight:bold; font-size:13px; color:#111827;">
                <span style="display:inline-block; min-width:24px; padding:3px 8px; border-radius:12px; background-color:${rankBadgeBg}; color:${rankBadgeColor}; font-weight:700;">
                  #${s.ranking}
                </span>
              </td>
              <td style="padding:10px 12px; text-align:left; font-family:'Courier New', monospace; font-weight:bold; color:#1e3a8a; font-size:13px;">
                ${s.codigo}
              </td>
              <td style="padding:10px 12px; text-align:left; font-size:13px; color:#1f2937;">
                <strong>${s.nomeVendedor}</strong>
                ${statusBadge ? `<div style="margin-top:3px;">${statusBadge}</div>` : ''}
              </td>
              <td style="padding:10px 12px; text-align:center; font-size:13px; font-weight:700; background-color:${recentCellBg}; color:${recentTextColor}; border-left:1px solid #f3f4f6; border-right:1px solid #f3f4f6;">
                ${s.ultimos5DiasUteis}
              </td>
              <td style="padding:10px 12px; text-align:center; font-size:13px; font-weight:700; color:#111827;">
                ${s.acumuladoAno}
              </td>
            </tr>
          `;
        })
        .join('');

      return `
        <div style="margin-bottom:28px; background-color:#ffffff; border:1px solid #e2e8f0; border-radius:8px; overflow:hidden; box-shadow:0 1px 3px rgba(0,0,0,0.05);">
          <!-- Cabeçalho GT -->
          <div style="background-color:#1e3a8a; padding:12px 18px; display:block;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
              <tr>
                <td style="text-align:left; vertical-align:middle;">
                  <span style="font-size:15px; font-weight:700; color:#ffffff; letter-spacing:0.3px;">
                    GT: <span style="color:#ffffff;">${group.nomeGt || group.emailGt}</span>
                  </span>
                </td>
                <td style="text-align:right; vertical-align:middle; color:#dbeafe; font-size:12px;">
                  <span>Vendedores: <strong>${group.totalVendedores}</strong></span> |
                  <span>5 Dias Úteis: <strong>${group.totalUltimos5Dias}</strong></span> |
                  <span>Acumulado Ano: <strong>${group.totalAcumuladoAno}</strong></span>
                </td>
              </tr>
            </table>
          </div>

          <!-- Tabela de Vendedores -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
            <thead>
              <tr style="background-color:#f8fafc; border-bottom:2px solid #cbd5e1; font-size:12px; color:#475569; text-transform:uppercase; letter-spacing:0.5px;">
                <th style="padding:10px 12px; text-align:center; width:70px;">Ranking</th>
                <th style="padding:10px 12px; text-align:left; width:80px;">Código</th>
                <th style="padding:10px 12px; text-align:left;">Vendedor</th>
                <th style="padding:10px 12px; text-align:center; width:150px; background-color:#f1f5f9;">Últimos 5 Dias Úteis</th>
                <th style="padding:10px 12px; text-align:center; width:130px;">Acumulado Ano</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
            <tfoot>
              <tr style="background-color:#f1f5f9; font-weight:bold; border-top:2px solid #cbd5e1; font-size:12px; color:#1e293b;">
                <td colspan="3" style="padding:10px 12px; text-align:right;">Subtotal ${group.nomeGt || group.emailGt}:</td>
                <td style="padding:10px 12px; text-align:center; color:#1e40af;">${group.totalUltimos5Dias}</td>
                <td style="padding:10px 12px; text-align:center; color:#0f172a;">${group.totalAcumuladoAno}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      `;
    })
    .join('');

  return `<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Resumo Semanal de Recibos Anulados</title>
</head>
<body style="margin:0; padding:0; background-color:#f3f4f6; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color:#1f2937; line-height:1.5;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3f4f6; padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:760px; background-color:#ffffff; border-radius:10px; border:1px solid #e5e7eb; overflow:hidden; box-shadow:0 4px 6px -1px rgba(0,0,0,0.1);">
          
          <!-- Top Banner Corporativo -->
          <tr>
            <td style="background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%); background-color:#1e3a8a; padding:24px 28px; color:#ffffff;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <h1 style="margin:0; font-size:22px; font-weight:800; color:#ffffff; letter-spacing:-0.3px;">
                      CONTROLO DE RECIBOS ANULADOS
                    </h1>
                    <div style="margin-top:6px; font-size:13px; color:#e0e7ff;">
                      Resumo Semanal de Recibos Anulados
                    </div>
                  </td>
                  <td style="text-align:right; vertical-align:middle;">
                    <div style="background-color:rgba(255,255,255,0.15); border:1px solid rgba(255,255,255,0.25); border-radius:6px; padding:6px 12px; display:inline-block; text-align:center;">
                      <div style="font-size:10px; text-transform:uppercase; color:#bfdbfe; font-weight:600;">Data Processamento</div>
                      <div style="font-size:13px; font-weight:700; color:#ffffff;">${formatDatePt(processingDate)}</div>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Corpo do Email -->
          <tr>
            <td style="padding:28px 28px 32px 28px; font-size:14px; color:#374151;">
              <p style="margin:0 0 16px 0; font-size:15px; color:#111827;">
                Boa tarde,
              </p>
              
              <p style="margin:0 0 14px 0; line-height:1.6;">
                Segue abaixo o resumo dos recibos anulados por vendedor, agrupado por GT.
              </p>
              
              <div style="background-color:#f8fafc; border-left:4px solid #3b82f6; border-radius:4px; padding:12px 16px; margin:0 0 16px 0;">
                <p style="margin:0 0 6px 0; font-weight:600; color:#1e293b;">Para cada vendedor são apresentados:</p>
                <ul style="margin:0; padding-left:20px; color:#475569;">
                  <li style="margin-bottom:4px;">
                    <strong>Recibos anulados nos últimos 5 dias úteis</strong> (${formatDatePt(businessDaysRange.start)} a ${formatDatePt(businessDaysRange.end)});
                  </li>
                  <li>
                    <strong>Recibos anulados acumulados desde o início do ano</strong> (desde 01/01/${processingDate.getFullYear()}).
                  </li>
                </ul>
              </div>

              <p style="margin:0 0 24px 0; line-height:1.6; color:#4b5563;">
                Esta informação pretende proporcionar uma visão consolidada da atividade de anulações e facilitar o acompanhamento dos pedidos de anulação efetuados pelos comerciais.
              </p>

              <!-- ============================================== -->
              <!-- GRÁFICO 1: Top 10 Vendedores com Mais Anulações -->
              <!-- ============================================== -->
              ${
                top10Src
                  ? `
              <div style="margin:0 0 24px 0; text-align:center;">
                <div style="font-size:13px; font-weight:700; color:#1e3a8a; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:8px; text-align:left;">
                  Gráfico 1 &bull; Top 10 Vendedores com Mais Anulações
                </div>
                <img src="${top10Src}" alt="Top 10 Vendedores com Mais Anulações" width="704" style="width:100%; max-width:704px; height:auto; display:block; margin:0 auto; border-radius:10px; border:1px solid #e2e8f0; box-shadow:0 1px 3px rgba(0,0,0,0.05);" />
              </div>
              `
                  : ''
              }

              <!-- ============================================== -->
              <!-- GRÁFICO 2: Ranking GT (Todos os GTs)            -->
              <!-- ============================================== -->
              ${
                rankingGtSrc
                  ? `
              <div style="margin:0 0 28px 0; text-align:center;">
                <div style="font-size:13px; font-weight:700; color:#1e3a8a; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:8px; text-align:left;">
                  Gráfico 2 &bull; Ranking GT (Todos os GTs)
                </div>
                <img src="${rankingGtSrc}" alt="Ranking GT" width="704" style="width:100%; max-width:704px; height:auto; display:block; margin:0 auto; border-radius:10px; border:1px solid #e2e8f0; box-shadow:0 1px 3px rgba(0,0,0,0.05);" />
              </div>
              `
                  : ''
              }

              <!-- ============================================== -->
              <!-- TABELAS DETALHADAS POR GT                      -->
              <!-- ============================================== -->
              <div style="font-size:14px; font-weight:700; color:#0f172a; text-transform:uppercase; letter-spacing:0.5px; margin:28px 0 14px 0; border-top:2px solid #e2e8f0; padding-top:16px;">
                Tabelas Detalhadas por Gestor de Território (GT)
              </div>

              ${tablesHtml}

              <p style="margin:28px 0 0 0; color:#111827; font-weight:600; line-height:1.6;">
                Com os melhores cumprimentos,<br><br>
                <span style="font-weight:600; color:#111827;">Equipa AFSN</span>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Gera a versão em texto simples do email
 */
export function generateEmailPlainText(result: ProcessingResult): string {
  const { gtGroups, businessDaysRange, processingDate, kpis } = result;

  const formatDatePt = (d: Date) =>
    d.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' });

  let text = `Boa tarde,\n\n`;
  text += `Segue abaixo o resumo dos recibos anulados por vendedor, agrupado por GT.\n\n`;
  text += `Para cada vendedor são apresentados:\n\n`;
  text += `• Recibos anulados nos últimos 5 dias úteis (${formatDatePt(businessDaysRange.start)} a ${formatDatePt(businessDaysRange.end)})\n`;
  text += `• Recibos anulados acumulados desde o início do ano (desde 01/01/${processingDate.getFullYear()})\n\n`;
  text += `Esta informação pretende proporcionar uma visão consolidada da atividade de anulações e facilitar o acompanhamento dos pedidos de anulação efetuados pelos comerciais.\n\n`;

  // Gráfico 1 Texto
  text += `====================================================\n`;
  text += `GRÁFICO 1: TOP 10 VENDEDORES COM MAIS ANULAÇÕES\n`;
  text += `====================================================\n`;
  kpis.top10Vendedores.forEach((v, idx) => {
    text += `${idx + 1}. [${v.codigo}] ${v.nome} (${v.gt}) - 5d: ${v.ultimos5Dias} | Acumulado Ano: ${v.acumulado}\n`;
  });
  text += `\n`;

  // Gráfico 2 Texto
  const gts = kpis.rankingGts || kpis.top10Gts;
  text += `====================================================\n`;
  text += `GRÁFICO 2: RANKING GT (TODOS OS GTS)\n`;
  text += `====================================================\n`;
  gts.forEach((g, idx) => {
    text += `${idx + 1}. ${g.nomeGt || g.emailGt} (${g.vendedoresCount} vend.) - 5d: ${g.ultimos5Dias} | Acumulado Ano: ${g.acumulado}\n`;
  });
  text += `\n`;

  // Tabelas detalhadas
  text += `====================================================\n`;
  text += `TABELAS DETALHADAS POR GT\n`;
  text += `====================================================\n\n`;

  for (const group of gtGroups) {
    const gtDisplayName = group.nomeGt || group.emailGt;
    text += `====================================================\n`;
    text += `GT: ${gtDisplayName}\n`;
    text += `====================================================\n`;
    text += `Ranking | Código | Vendedor               | Últimos 5 Dias | Acumulado Ano\n`;
    text += `----------------------------------------------------\n`;

    for (const s of group.vendedores) {
      const rank = String(s.ranking).padEnd(7);
      const code = s.codigo.padEnd(6);
      const name = s.nomeVendedor.slice(0, 22).padEnd(22);
      const ult5 = String(s.ultimos5DiasUteis).padStart(14);
      const acum = String(s.acumuladoAno).padStart(14);
      text += `${rank} | ${code} | ${name} | ${ult5} | ${acum}\n`;
    }
    text += `----------------------------------------------------\n`;
    text += `Total ${gtDisplayName}: 5 Dias: ${group.totalUltimos5Dias} | Acumulado: ${group.totalAcumuladoAno}\n\n`;
  }

  text += `Com os melhores cumprimentos,\n\nEquipa AFSN\n`;

  return text;
}

/**
 * Monta o pacote de dados do email (TO, CC, Assunto, HTML e Plain Text)
 */
export function buildEmailData(result: ProcessingResult): EmailData {
  const to = extractToGtEmails(result.gtGroups);
  const cc = FIXED_CC_EMAILS;
  const subject = 'Resumo Semanal de Recibos Anulados';

  // Gera as imagens dos gráficos em PNG
  const top10Png =
    result.chartImages?.top10VendedoresPng ||
    generateTop10VendedoresChartImage(result.kpis.top10Vendedores);

  const rankingGtPng =
    result.chartImages?.rankingGtPng ||
    generateRankingGtChartImage(result.kpis.rankingGts || result.kpis.top10Gts);

  const htmlBody = generateEmailHtml(result, {
    top10Img: top10Png,
    rankingGtImg: rankingGtPng,
    isForEml: false
  });

  const plainTextBody = generateEmailPlainText(result);

  const chartTop10Base64 = top10Png ? top10Png.replace(/^data:image\/png;base64,/, '') : undefined;
  const chartRankingGtBase64 = rankingGtPng ? rankingGtPng.replace(/^data:image\/png;base64,/, '') : undefined;

  return {
    to,
    cc,
    subject,
    htmlBody,
    plainTextBody,
    chartTop10Base64,
    chartRankingGtBase64
  };
}

/**
 * Codifica strings UTF-8 em Base64 com quebra de linhas a 76 caracteres (RFC 2045)
 */
function encodeMimeBase64(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);
  return base64.match(/.{1,76}/g)?.join('\r\n') || base64;
}

/**
 * Quebra strings Base64 puras a 76 caracteres para compatibilidade MIME rigorosa
 */
function encodeMimeBase64Raw(base64: string): string {
  const clean = base64.replace(/\s/g, '');
  return clean.match(/.{1,76}/g)?.join('\r\n') || clean;
}

/**
 * Codifica cabeçalho de assunto conforme RFC 2047
 */
function encodeHeaderSubject(subject: string): string {
  const bytes = new TextEncoder().encode(subject);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return `=?UTF-8?B?${btoa(binary)}?=`;
}

/**
 * Gera o ficheiro .EML padrão RFC 822 com gráficos incorporados inline.
 * Utiliza o cabeçalho X-Unsent: 1 para abrir diretamente no Novo Outlook em modo de composição/rascunho
 * com o corpo HTML totalmente renderizado e os gráficos inline (Content-ID).
 */
export function generateEmlString(emailData: EmailData, result?: ProcessingResult): string {
  const boundaryMixed = `----=_NextPart_Mixed_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  const boundaryRel = `----=_NextPart_Rel_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  const dateStr = new Date().toUTCString();

  const toHeader = emailData.to.join(', ');
  const ccHeader = emailData.cc.join(', ');

  const hasCharts = Boolean(emailData.chartTop10Base64 && emailData.chartRankingGtBase64);

  // Se houver gráficos, utiliza a versão HTML com cid: e anexa as imagens inline
  let emlHtmlBody = emailData.htmlBody;
  if (result) {
    emlHtmlBody = generateEmailHtml(result, {
      isForEml: true
    });
  } else if (hasCharts) {
    // substitui data url por cid
    emlHtmlBody = emlHtmlBody
      .replace(/src="data:image\/png;base64,[^"]*Top 10[^"]*"/, 'src="cid:chart_top10_vendedores"')
      .replace(/src="data:image\/png;base64,[^"]*Ranking GT[^"]*"/, 'src="cid:chart_ranking_gt"');
  }

  if (hasCharts) {
    const lines = [
      'X-Unsent: 1',
      'From: "Controlo de Recibos Anulados" <noreply@sumolcompal.pt>',
      `To: ${toHeader}`,
      `Cc: ${ccHeader}`,
      `Subject: ${encodeHeaderSubject(emailData.subject)}`,
      `Date: ${dateStr}`,
      'MIME-Version: 1.0',
      `Content-Type: multipart/related; boundary="${boundaryRel}"`,
      '',
      'This is a multi-part message in MIME format.',
      '',
      `--${boundaryRel}`,
      'Content-Type: text/html; charset=UTF-8',
      'Content-Transfer-Encoding: base64',
      '',
      encodeMimeBase64(emlHtmlBody),
      '',
      `--${boundaryRel}`,
      'Content-Type: image/png; name="chart_top10_vendedores.png"',
      'Content-Transfer-Encoding: base64',
      'Content-ID: <chart_top10_vendedores>',
      'Content-Disposition: inline; filename="chart_top10_vendedores.png"',
      '',
      encodeMimeBase64Raw(emailData.chartTop10Base64!),
      '',
      `--${boundaryRel}`,
      'Content-Type: image/png; name="chart_ranking_gt.png"',
      'Content-Transfer-Encoding: base64',
      'Content-ID: <chart_ranking_gt>',
      'Content-Disposition: inline; filename="chart_ranking_gt.png"',
      '',
      encodeMimeBase64Raw(emailData.chartRankingGtBase64!),
      '',
      `--${boundaryRel}--`,
      ''
    ];

    return lines.join('\r\n');
  }

  // Fallback caso não haja imagens
  const lines = [
    'X-Unsent: 1',
    'From: "Controlo de Recibos Anulados" <noreply@sumolcompal.pt>',
    `To: ${toHeader}`,
    `Cc: ${ccHeader}`,
    `Subject: ${encodeHeaderSubject(emailData.subject)}`,
    `Date: ${dateStr}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${boundaryMixed}"`,
    '',
    'This is a multi-part message in MIME format.',
    '',
    `--${boundaryMixed}`,
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    encodeMimeBase64(emailData.plainTextBody),
    '',
    `--${boundaryMixed}`,
    'Content-Type: text/html; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    encodeMimeBase64(emlHtmlBody),
    '',
    `--${boundaryMixed}--`,
    ''
  ];

  return lines.join('\r\n');
}
