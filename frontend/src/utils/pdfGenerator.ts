import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AssessmentData, ValidationResult } from '@/types/assessment';

export function generateAssessmentPDF(data: AssessmentData, adequacyReport?: any): jsPDF {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = 20;

  // Header / Cover Page
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(234, 88, 12); // Orange VR
  doc.text('RELATÓRIO DE ADEQUAÇÃO TÉCNICA', pageWidth / 2, yPos, { align: 'center' });

  yPos += 15;
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text('Sistema VR de Gestão', pageWidth / 2, yPos, { align: 'center' });

  yPos += 20;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Cliente: ${data.company.nomeFantasia || '-'}`, 14, yPos);
  yPos += 8;
  doc.text(`CNPJ: ${data.company.cnpj || '-'}`, 14, yPos);
  yPos += 8;
  doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 14, yPos);

  yPos += 20;
  doc.setFontSize(10);
  doc.text('Este documento apresenta uma análise técnica da infraestrutura atual', 14, yPos);
  yPos += 6;
  doc.text('em comparação com os requisitos homologados para o sistema VR.', 14, yPos);

  // Start adequacy report section
  yPos += 20;
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(234, 88, 12); // Orange VR
  doc.text('ANÁLISE DE ADEQUAÇÕES TÉCNICAS', 14, yPos);
  doc.setTextColor(0, 0, 0);

  if (adequacyReport) {
    yPos += 10;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const statusText = adequacyReport.summary.status === 'ok' ? 'ADEQUADO' :
      adequacyReport.summary.status === 'warning' ? 'ATENÇÃO' : 'INADEQUADO';
    doc.text(`Status Geral de Infraestrutura: ${statusText}`, 14, yPos);

    // Server Comparison Table
    if (adequacyReport.servers.length > 0) {
      yPos += 10;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Hardware de Servidores (Comparativo)', 14, yPos);

      yPos += 5;
      autoTable(doc, {
        startY: yPos,
        head: [['Item', 'Componente', 'Atual', 'Requerido', 'Status']],
        body: adequacyReport.servers.flatMap((s: any) => {
          if (s.status === 'missing') {
            return [[{ content: `${s.label} (OBRIGATÓRIO)`, styles: { fontStyle: 'bold', textColor: [220, 38, 38] } }, 'N/A', 'AUSENTE', `${s.required?.cpu || '-'} Cores / ${s.required?.ram || '-'} GB`, 'X']];
          }
          return [
            [
              { content: s.label, rowSpan: 4, styles: { valign: 'middle', fontStyle: 'bold' } },
              'Processador',
              { content: s.current.processor ? `${s.current.cpu} Cores (${s.current.processor})` : `${s.current.cpu} Cores` },
              { content: s.required.processor ? `${s.required.cpu} Cores (${s.required.processor})` : `${s.required.cpu} Cores` },
              s.comparison.cpu === 'ok' ? 'OK' : 'X'
            ],
            [
              'Sistema Op.',
              s.current.os || 'N/A',
              s.required.os || 'N/A',
              'OK'
            ],
            [
              'Memória RAM',
              `${s.current.ram} GB`,
              `${s.required.ram} GB`,
              s.comparison.ram === 'ok' ? 'OK' : 'X'
            ],
            [
              'Disco (HD/SSD)',
              `${s.current.storage} GB`,
              `${s.required.storage} GB`,
              s.comparison.storage === 'ok' ? 'OK' : 'X'
            ],
          ];
        }),
        theme: 'grid',
        headStyles: { fillColor: [234, 88, 12] },
        styles: { fontSize: 8 }
      });
      yPos = (doc as any).lastAutoTable.finalY + 10;
    }

    // Terminals Comparison Table
    if (adequacyReport.terminals.length > 0) {
      if (yPos > 220) { doc.addPage(); yPos = 20; }
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Hardware de Terminais (PDVs e Retaguarda)', 14, yPos);

      yPos += 5;
      autoTable(doc, {
        startY: yPos,
        head: [['Tipo', 'Qtd.', 'Identificação/Função', 'Componente', 'Atual', 'Mínimo', 'Status']],
        body: adequacyReport.terminals.flatMap((t: any) => [
          [
            { content: t.tipo, rowSpan: 4, styles: { valign: 'middle' } },
            { content: t.quantidade || 1, rowSpan: 4, styles: { valign: 'middle', halign: 'center', fontStyle: 'bold' } },
            { content: t.tipo === 'Retaguarda' ? (t.funcao || 'Computador') : `PDV: ${t.id.substring(0, 8)}`, rowSpan: 4, styles: { valign: 'middle' } },
            'Memória RAM',
            `${t.current.ram} GB`,
            `${t.required.ram} GB`,
            t.status.ram === 'ok' ? 'OK' : 'X'
          ],
          [
            'Processador',
            t.current.cpu || 'N/A',
            t.required.cpu || 'N/A',
            t.status.cpu === 'ok' ? 'OK' : 'X'
          ],
          [
            'Sistema Op.',
            t.current.os || 'N/A',
            t.required.os || 'N/A',
            t.status.os === 'ok' ? 'OK' : 'X'
          ],
          [
            'Disco (HD/SSD)',
            `${t.current.storage} GB`,
            `${t.required.storage} GB`,
            t.status.storage === 'ok' ? 'OK' : 'X'
          ]
        ]),
        theme: 'grid',
        headStyles: { fillColor: [234, 88, 12] },
        styles: { fontSize: 8 }
      });
      yPos = (doc as any).lastAutoTable.finalY + 10;
    }

    // Recommendations Alert
    if (adequacyReport.summary.totalIssues > 0) {
      if (yPos > 240) { doc.addPage(); yPos = 20; }
      doc.setFillColor(255, 247, 237); // Light orange bg
      doc.rect(14, yPos, pageWidth - 28, 30, 'F');
      doc.setTextColor(154, 52, 18); // Dark orange text
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('RECOMENDAÇÕES:', 18, yPos + 8);
      doc.setFont('helvetica', 'normal');
      let recPos = yPos + 15;
      if (adequacyReport.summary.status === 'error') {
        doc.text('- Realizar upgrade imediato dos itens marcados como inadequados.', 18, recPos);
        recPos += 5;
      }
      if (adequacyReport.servers.some((s: any) => s.status.ram === 'error')) {
        doc.text('- Aumentar capacidade de memória RAM para garantir estabilidade do banco.', 18, recPos);
      }
      doc.setTextColor(0, 0, 0);
    }
  } else {
    // Fallback to simple validation results if no adequacy report provided
    const errors = data.validationResults?.filter(r => r.status === 'error') || [];
    const warnings = data.validationResults?.filter(r => r.status === 'warning') || [];
    const oks = data.validationResults?.filter(r => r.status === 'ok') || [];

    yPos += 10;
    doc.setFontSize(12);
    doc.text(`Incompatíveis: ${errors.length}`, 14, yPos);
    doc.text(`Ajustes: ${warnings.length}`, 80, yPos);
    doc.text(`Adequados: ${oks.length}`, 160, yPos);

    if (errors.length > 0 || warnings.length > 0) {
      yPos += 10;
      autoTable(doc, {
        startY: yPos,
        head: [['Status', 'Item', 'Descrição']],
        body: [
          ...errors.map(e => ['❌ Incompatível', e.field, e.message]),
          ...warnings.map(w => ['⚠️ Ajuste', w.field, w.message]),
        ],
        theme: 'striped',
        headStyles: { fillColor: [239, 68, 68] },
      });
    }
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `Página ${i} de ${pageCount} | VRGYN - itmizer | ${new Date().toLocaleDateString('pt-BR')}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  return doc;
}

export async function downloadPDF(data: AssessmentData, adequacyReport?: any) {
  const doc = generateAssessmentPDF(data, adequacyReport);
  const fileName = `adequacao_tecnica_${data.company.nomeFantasia?.replace(/\s+/g, '_') || 'cliente'}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
}

// New function: Generate complete validation PDF for client review
export function generateValidationPDF(data: AssessmentData): jsPDF {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPos = 20;

  // Helper function to check if we need a new page
  const checkNewPage = (spaceNeeded = 20) => {
    if (yPos + spaceNeeded > pageHeight - 20) {
      doc.addPage();
      yPos = 20;
      return true;
    }
    return false;
  };

  // Cover Page
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(234, 88, 12); // Orange VR
  doc.text('VALIDAÇÃO DE INFRAESTRUTURA', pageWidth / 2, yPos, { align: 'center' });

  yPos += 15;
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text('Sistema VR de Gestão', pageWidth / 2, yPos, { align: 'center' });

  yPos += 25;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('DADOS DO CLIENTE', 14, yPos);

  yPos += 10;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Nome Fantasia: ${data.company.nomeFantasia || '-'}`, 14, yPos);
  yPos += 6;
  doc.text(`CNPJ: ${data.company.cnpj || '-'}`, 14, yPos);
  yPos += 6;
  doc.text(`Endereço: ${data.company.endereco || '-'}`, 14, yPos);
  yPos += 6;
  doc.text(`Contato: ${data.company.contatoNome || '-'} (${data.company.contatoFuncao || '-'})`, 14, yPos);
  yPos += 6;
  doc.text(`E-mail: ${data.company.contatoEmail || '-'}`, 14, yPos);
  yPos += 6;
  doc.text(`Celular: ${data.company.contatoCelular || '-'}`, 14, yPos);

  // Project Information
  yPos += 15;
  checkNewPage(40);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(234, 88, 12);
  doc.text('INFORMAÇÕES DO PROJETO', 14, yPos);
  doc.setTextColor(0, 0, 0);

  yPos += 10;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Escopo de Implantação: ${data.projeto?.escopoImplantacao || '-'}`, 14, yPos);
  yPos += 6;
  doc.text(`Quantidade de Horas: ${data.projeto?.quantidadeHoras || '-'}`, 14, yPos);
  yPos += 6;
  doc.text(`Total de Lojas: ${data.company.lojaTotalLojas || 1}`, 14, yPos);
  yPos += 6;
  doc.text(`Executivo de Vendas: ${data.company.executivoVendas || '-'}`, 14, yPos);
  yPos += 6;
  doc.text(`Consultor VR: ${data.company.consultorVR || '-'}`, 14, yPos);

  // Servers Section
  if (data.servers && data.servers.length > 0) {
    yPos += 15;
    checkNewPage(60);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(234, 88, 12);
    doc.text('SERVIDORES', 14, yPos);
    doc.setTextColor(0, 0, 0);

    yPos += 8;
    autoTable(doc, {
      startY: yPos,
      head: [['Tipo', 'Sistema Op.', 'Processador', 'RAM', 'Disco Total', 'Disco Livre']],
      body: data.servers.map((s: any) => [
        s.tipo?.toUpperCase() || '-',
        s.sistemaOperacional || '-',
        s.processador || '-',
        s.memoriaRam || '-',
        s.discoTotal || '-',
        s.discoLivre || '-'
      ]),
      theme: 'grid',
      headStyles: { fillColor: [234, 88, 12], textColor: [255, 255, 255] },
      styles: { fontSize: 9 },
      alternateRowStyles: { fillColor: [245, 245, 245] }
    });
    yPos = (doc as any).lastAutoTable.finalY + 10;
  }

  // PDVs Section
  if (data.pdvs && data.pdvs.length > 0) {
    checkNewPage(60);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(234, 88, 12);
    doc.text('PONTOS DE VENDA (PDVs)', 14, yPos);
    doc.setTextColor(0, 0, 0);

    yPos += 8;
    autoTable(doc, {
      startY: yPos,
      head: [['Qtd.', 'Sistema Op.', 'Processador', 'RAM', 'Disco', 'NFC-e', 'S@T']],
      body: data.pdvs.map((p: any) => [
        p.quantidade || 1,
        p.sistemaOperacional || '-',
        p.processador || '-',
        p.memoriaRam || '-',
        p.disco || '-',
        p.usaNfce ? 'Sim' : 'Não',
        p.usaNfce && p.satAtivo ? `${p.satMarca || ''} ${p.satModelo || ''}`.trim() : '-'
      ]),
      theme: 'grid',
      headStyles: { fillColor: [234, 88, 12], textColor: [255, 255, 255] },
      styles: { fontSize: 9 },
      alternateRowStyles: { fillColor: [245, 245, 245] }
    });
    yPos = (doc as any).lastAutoTable.finalY + 10;
  }

  // Backoffice Section
  if (data.backoffice && data.backoffice.length > 0) {
    checkNewPage(60);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(234, 88, 12);
    doc.text('RETAGUARDA', 14, yPos);
    doc.setTextColor(0, 0, 0);

    yPos += 8;
    autoTable(doc, {
      startY: yPos,
      head: [['Qtd.', 'Função/Setor', 'Sistema Op.', 'Processador', 'RAM', 'Disco']],
      body: data.backoffice.map((b: any) => [
        b.quantidade || 1,
        b.funcao || '-',
        b.sistemaOperacional || '-',
        b.processador || '-',
        b.memoriaRam || '-',
        b.disco || '-'
      ]),
      theme: 'grid',
      headStyles: { fillColor: [234, 88, 12], textColor: [255, 255, 255] },
      styles: { fontSize: 9 },
      alternateRowStyles: { fillColor: [245, 245, 245] }
    });
    yPos = (doc as any).lastAutoTable.finalY + 10;
  }

  // Network Section
  checkNewPage(80);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(234, 88, 12);
  doc.text('INFRAESTRUTURA DE REDE', 14, yPos);
  doc.setTextColor(0, 0, 0);

  yPos += 10;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Firewall: ${data.network.firewall ? 'Sim' : 'Não'}`, 14, yPos);
  yPos += 6;
  doc.text(`Proxy: ${data.network.proxy ? 'Sim' : 'Não'}`, 14, yPos);
  yPos += 6;
  doc.text(`Antivírus nos PDVs: ${data.network.antivirusPdv ? 'Sim' : 'Não'}`, 14, yPos);
  yPos += 6;
  doc.text(`PDV no Domínio: ${data.network.pdvNoDominio ? 'Sim' : 'Não'}`, 14, yPos);
  yPos += 6;
  doc.text(`Tipo de Conexão PDV: ${data.network.tipoConexaoPdv || '-'}`, 14, yPos);

  if (data.network.links && data.network.links.length > 0) {
    yPos += 10;
    autoTable(doc, {
      startY: yPos,
      head: [['Tipo', 'Provedor', 'Velocidade', 'IP Fixo']],
      body: data.network.links.map((l: any) => [
        l.tipo || '-',
        l.provedor || '-',
        l.velocidade ? `${l.velocidade} Mbps` : '-',
        l.ipFixo ? 'Sim' : 'Não'
      ]),
      theme: 'grid',
      headStyles: { fillColor: [234, 88, 12], textColor: [255, 255, 255] },
      styles: { fontSize: 9 },
      alternateRowStyles: { fillColor: [245, 245, 245] }
    });
    yPos = (doc as any).lastAutoTable.finalY + 10;
  }

  // Systems Section
  checkNewPage(60);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(234, 88, 12);
  doc.text('SISTEMAS E INTEGRAÇÕES', 14, yPos);
  doc.setTextColor(0, 0, 0);

  yPos += 10;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Sistema PDV Atual: ${data.systems.sistemaPdvAtual || 'Nenhum'}`, 14, yPos);
  yPos += 6;
  doc.text(`Banco de Dados: ${data.systems.bancoTipo || 'Não especificado'}`, 14, yPos);
  yPos += 6;
  doc.text(`Hospedagem do Banco: ${data.systems.bancoHospedagem || '-'}`, 14, yPos);
  yPos += 6;
  doc.text(`Acesso às Credenciais: ${data.systems.acessoCredenciais ? 'Sim' : 'Não'}`, 14, yPos);
  yPos += 6;
  doc.text(`Acesso ao Backup: ${data.systems.acessoBackup ? 'Sim' : 'Não'}`, 14, yPos);
  yPos += 10;
  doc.text(`Integração CRM: ${data.systems.integracaoCrm ? 'Sim' : 'Não'}`, 14, yPos);
  yPos += 6;
  doc.text(`Integração E-commerce: ${data.systems.integracaoEcommerce ? 'Sim' : 'Não'}`, 14, yPos);
  yPos += 6;
  doc.text(`Integração M-commerce: ${data.systems.integracaoMcommerce ? 'Sim' : 'Não'}`, 14, yPos);

  // Customizações e Homologações com quebra de linha
  if (data.systems.customizacoesNecessarias) {
    yPos += 10;
    checkNewPage(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Customizações Necessárias:', 14, yPos);
    yPos += 6;
    doc.setFont('helvetica', 'normal');
    const customLines = doc.splitTextToSize(data.systems.customizacoesNecessarias, pageWidth - 28);
    doc.text(customLines, 14, yPos);
    yPos += customLines.length * 5;
  }

  if (data.systems.homologacoesNecessarias) {
    yPos += 6;
    checkNewPage(20);
    doc.setFont('helvetica', 'bold');
    doc.text('Homologações Necessárias:', 14, yPos);
    yPos += 6;
    doc.setFont('helvetica', 'normal');
    const homolLines = doc.splitTextToSize(data.systems.homologacoesNecessarias, pageWidth - 28);
    doc.text(homolLines, 14, yPos);
    yPos += homolLines.length * 5;
  }

  // Footer on all pages
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(
      `Validação de Infraestrutura | Página ${i} de ${pageCount} | ${new Date().toLocaleDateString('pt-BR')}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  }

  return doc;
}

export async function downloadValidationPDF(data: AssessmentData) {
  const doc = generateValidationPDF(data);
  const fileName = `validacao_${data.company.nomeFantasia?.replace(/\s+/g, '_') || 'cliente'}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
}
