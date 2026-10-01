import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  CriticalCase,
  CRITICAL_CASE_CATEGORY_LABELS,
  CRITICAL_CASE_STATUS_LABELS,
} from '@/types/criticalCase';

export interface ReportFilters {
  startDate?: string;
  endDate?: string;
  clientName?: string;
  statusLabel?: string;
  includeEvolucoes?: boolean;
}

/**
 * Gera PDF completo de um único Caso Crítico com seu histórico de evoluções
 */
export function generateSingleCriticalCasePDF(caseItem: CriticalCase) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = 20;

  // Header
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(234, 88, 12); // Laranja ITMIZER / VR
  doc.text('ITMIZER VR - SUPORTE TÉCNICO', 14, yPos);

  yPos += 7;
  doc.setFontSize(14);
  doc.setTextColor(30, 41, 59);
  doc.text('Dossiê de Caso Crítico & Acompanhamento', 14, yPos);

  yPos += 4;
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(14, yPos, pageWidth - 14, yPos);

  // Informações Gerais em Tabela
  yPos += 8;
  autoTable(doc, {
    startY: yPos,
    head: [['Campo', 'Informação']],
    body: [
      ['Cliente', `${caseItem.client?.nomeFantasia || '-'} (CNPJ: ${caseItem.client?.cnpj || '-'})`],
      ['Status do Caso', CRITICAL_CASE_STATUS_LABELS[caseItem.status] || caseItem.status],
      [
        'Categorias',
        caseItem.categories?.map((c) => CRITICAL_CASE_CATEGORY_LABELS[c] || c).join(', ') || 'Nenhuma',
      ],
      ['Data de Registro', new Date(caseItem.createdAt).toLocaleString('pt-BR')],
      ['Responsável', caseItem.responsavel?.profile?.fullName || caseItem.responsavel?.email || 'Suporte Técnico'],
      ['Link do Drive', caseItem.client?.driveLink || 'Não informado'],
      ['Participantes', caseItem.participantes || 'Não informado'],
    ],
    theme: 'striped',
    headStyles: { fillColor: [234, 88, 12], textColor: [255, 255, 255], fontStyle: 'bold' },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 40 },
      1: { cellWidth: 'auto' },
    },
    styles: { fontSize: 9 },
  });

  yPos = (doc as any).lastAutoTable.finalY + 8;

  // Observações Iniciais / Histórico
  if (caseItem.observacoes) {
    autoTable(doc, {
      startY: yPos,
      head: [['OBSERVAÇÕES E HISTÓRICO DA OCORRÊNCIA']],
      body: [[caseItem.observacoes]],
      theme: 'plain',
      headStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 4 },
    });
    yPos = (doc as any).lastAutoTable.finalY + 8;
  }

  // Próximos Passos
  if (caseItem.proximosPassos) {
    autoTable(doc, {
      startY: yPos,
      head: [['PLANO DE AÇÃO E PRÓXIMOS PASSOS']],
      body: [[caseItem.proximosPassos]],
      theme: 'plain',
      headStyles: { fillColor: [254, 243, 199], textColor: [146, 64, 14], fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 4 },
    });
    yPos = (doc as any).lastAutoTable.finalY + 10;
  }

  // Histórico de Evoluções e Acompanhamentos
  const acompanhamentos = caseItem.acompanhamentos || [];
  if (acompanhamentos.length > 0) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(234, 88, 12);
    doc.text(`HISTÓRICO DE EVOLUÇÕES & ATENDIMENTOS (${acompanhamentos.length})`, 14, yPos);
    yPos += 4;

    const acompRows = acompanhamentos.map((acomp) => [
      new Date(acomp.data).toLocaleDateString('pt-BR'),
      acomp.tipo,
      acomp.user?.profile?.fullName || acomp.user?.email || 'Analista',
      acomp.descricao + (acomp.proximosPassos ? `\n\nPróximos Passos: ${acomp.proximosPassos}` : ''),
      acomp.statusNovo ? CRITICAL_CASE_STATUS_LABELS[acomp.statusNovo] : '-',
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['Data', 'Tipo', 'Autor', 'Descrição do Atendimento / Ata', 'Status']],
      body: acompRows,
      theme: 'grid',
      headStyles: { fillColor: [51, 65, 85], textColor: [255, 255, 255], fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 22, fontSize: 8 },
        1: { cellWidth: 26, fontSize: 8, fontStyle: 'bold' },
        2: { cellWidth: 28, fontSize: 8 },
        3: { cellWidth: 'auto', fontSize: 8 },
        4: { cellWidth: 22, fontSize: 8 },
      },
      styles: { fontSize: 8, cellPadding: 3 },
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;
  }

  // Rodapé com data e numeração de página
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Gerado pelo Itmizer VR em ${new Date().toLocaleString('pt-BR')} — Página ${i} de ${pageCount}`,
      14,
      doc.internal.pageSize.getHeight() - 10
    );
  }

  const filename = `Caso_Critico_${caseItem.client?.nomeFantasia?.replace(/[^a-zA-Z0-9]/g, '_') || 'Cliente'}_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}

/**
 * Gera Relatório Geral de Casos Críticos e Evoluções por Período
 */
export function generateCriticalCasesReportPDF(cases: CriticalCase[], filters: ReportFilters) {
  const doc = new jsPDF('landscape');
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = 18;

  // Cabeçalho Principal
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(234, 88, 12);
  doc.text('ITMIZER VR - RELATÓRIO DE CASOS CRÍTICOS & EVOLUÇÕES', 14, yPos);

  yPos += 7;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);

  const periodoStr =
    filters.startDate || filters.endDate
      ? `Período: ${filters.startDate ? new Date(filters.startDate).toLocaleDateString('pt-BR') : 'Início'} até ${filters.endDate ? new Date(filters.endDate).toLocaleDateString('pt-BR') : 'Hoje'}`
      : 'Período: Histórico Completo';

  const filtroClienteStr = filters.clientName ? ` | Cliente: ${filters.clientName}` : '';
  const filtroStatusStr = filters.statusLabel ? ` | Status: ${filters.statusLabel}` : '';

  doc.text(`${periodoStr}${filtroClienteStr}${filtroStatusStr} | Total de Casos: ${cases.length}`, 14, yPos);

  yPos += 4;
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(14, yPos, pageWidth - 14, yPos);

  // Tabela Principal de Casos Críticos
  yPos += 6;
  const tableRows = cases.map((c) => [
    new Date(c.createdAt).toLocaleDateString('pt-BR'),
    c.client?.nomeFantasia || '-',
    CRITICAL_CASE_STATUS_LABELS[c.status] || c.status,
    c.categories?.map((cat) => CRITICAL_CASE_CATEGORY_LABELS[cat] || cat).join(', ') || '-',
    c.participantes || '-',
    c.observacoes || '-',
    c.proximosPassos || '-',
    c.acompanhamentos?.length ? `${c.acompanhamentos.length} ação(ões)` : '0',
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [['Data', 'Cliente', 'Status', 'Categorias', 'Participantes', 'Observações', 'Próximos Passos', 'Evoluções']],
    body: tableRows,
    theme: 'striped',
    headStyles: { fillColor: [234, 88, 12], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 20, fontSize: 7.5 },
      1: { cellWidth: 35, fontSize: 7.5, fontStyle: 'bold' },
      2: { cellWidth: 22, fontSize: 7.5 },
      3: { cellWidth: 35, fontSize: 7 },
      4: { cellWidth: 30, fontSize: 7 },
      5: { cellWidth: 'auto', fontSize: 7 },
      6: { cellWidth: 40, fontSize: 7 },
      7: { cellWidth: 18, fontSize: 7.5, halign: 'center' },
    },
    styles: { cellPadding: 2.5 },
  });

  yPos = (doc as any).lastAutoTable.finalY + 10;

  // Se solicitado, incluir lista detalhada de evoluções e acompanhamentos do período
  if (filters.includeEvolucoes) {
    const allEvolucoes: Array<{
      data: string;
      cliente: string;
      tipo: string;
      autor: string;
      descricao: string;
      proximosPassos: string;
      statusNovo: string;
    }> = [];

    cases.forEach((c) => {
      (c.acompanhamentos || []).forEach((ac) => {
        allEvolucoes.push({
          data: ac.data,
          cliente: c.client?.nomeFantasia || '-',
          tipo: ac.tipo,
          autor: ac.user?.profile?.fullName || ac.user?.email || 'Analista',
          descricao: ac.descricao,
          proximosPassos: ac.proximosPassos || '-',
          statusNovo: ac.statusNovo ? CRITICAL_CASE_STATUS_LABELS[ac.statusNovo] : '-',
        });
      });
    });

    if (allEvolucoes.length > 0) {
      if (yPos > doc.internal.pageSize.getHeight() - 40) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(234, 88, 12);
      doc.text(`REGISTRO DE TODAS AS EVOLUÇÕES & ACOMPANHAMENTOS (${allEvolucoes.length})`, 14, yPos);
      yPos += 5;

      const evolucoesRows = allEvolucoes.map((e) => [
        new Date(e.data).toLocaleDateString('pt-BR'),
        e.cliente,
        e.tipo,
        e.autor,
        e.descricao,
        e.proximosPassos,
        e.statusNovo,
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [['Data', 'Cliente', 'Tipo', 'Autor', 'Descrição do Atendimento', 'Próximos Passos', 'Status Atualizado']],
        body: evolucoesRows,
        theme: 'grid',
        headStyles: { fillColor: [51, 65, 85], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
        columnStyles: {
          0: { cellWidth: 20, fontSize: 7.5 },
          1: { cellWidth: 35, fontSize: 7.5, fontStyle: 'bold' },
          2: { cellWidth: 25, fontSize: 7.5 },
          3: { cellWidth: 30, fontSize: 7.5 },
          4: { cellWidth: 'auto', fontSize: 7 },
          5: { cellWidth: 40, fontSize: 7 },
          6: { cellWidth: 22, fontSize: 7.5 },
        },
        styles: { cellPadding: 2.5 },
      });
    }
  }

  // Numeração de páginas
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Relatório Gerencial Itmizer VR — Emitido em ${new Date().toLocaleString('pt-BR')} — Página ${i} de ${pageCount}`,
      14,
      doc.internal.pageSize.getHeight() - 8
    );
  }

  const filename = `Relatorio_Casos_Criticos_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}
