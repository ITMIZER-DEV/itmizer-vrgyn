---
name: itmizer-excel-generation
description: Padrão arquitetural e diretrizes de formatação para geração, exportação e processamento de planilhas Excel (.xlsx) no ITmizer-VR (Planilhas de Migração VR, Diagnóstico de Infraestrutura, Assessments e Relatórios de Implantação).
---

# ITmizer-VR — Padrão de Geração e Processamento de Planilhas Excel (.xlsx)

Esta skill define a arquitetura, convenções visuais, validações e padrões técnicos para geração, importação e exportação de planilhas Excel no ecossistema **ITmizer-VR**.

---

## 🎯 Cenários de Uso no ITmizer-VR

1. **Migrações de Dados para VR Software**:
   - Geração de planilhas modelo de importação de cadastros (Produtos, Clientes, Fornecedores, Saldo de Estoque, Contas a Pagar/Receber).
   - Validação de layout de planilhas enviadas por clientes antes da carga no banco VR.
2. **Diagnóstico & Requisitos de Infraestrutura (`Assessment` / `InfrastructureRequirement`)**:
   - Exportação de fichas técnicas de servidores, PDVs, links de internet, licenças de SO e conformidade de hardware.
3. **Relatórios Gerenciais & Acompanhamento de Implantações (`Deployments` / `CriticalCases`)**:
   - Exportação de cronogramas de virada (go-live), status de pendências por unidade e relatórios de auditoria de credenciais.

---

## 🎨 Padrão Visual e Tipografia Corporativa

Ao gerar planilhas estilizadas (via biblioteca `xlsx` no Node.js/Frontend ou `openpyxl` em Python):

| Elemento | Código HEX | Finalidade |
| :--- | :---: | :--- |
| **Header Principal (ITmizer Navy)** | `#0F172A` | Banner superior e cabeçalhos de seções críticas |
| **Header Secundário** | `#1E293B` | Cabeçalho das colunas de tabelas |
| **Linha Zebra** | `#F8FAFC` | Linhas alternadas para máxima legibilidade |
| **Bordas** | `#E2E8F0` | Divisórias sutis entre células |
| **Status Sucesso / Concluído** | `#DCFCE7` | Fundo verde claro (Texto `#166534`) |
| **Status Alerta / Em Andamento** | `#FEF9C3` | Fundo amarelo claro (Texto `#854D0E`) |
| **Status Crítico / Pendente** | `#FEE2E2` | Fundo vermelho claro (Texto `#991B1B`) |
| **Informativo / Planejado** | `#E0F2FE` | Fundo azul claro (Texto `#075985`) |

---

## 🔢 Regras de Formatação de Células

1. **Valores Numéricos Nativos**:
   - Nunca injetar strings como `"R$ 1.500,00"` ou `"4 GB"`. Inserir valores numéricos reais (`float`/`int`) e aplicar formato de célula.
   - Moeda: `R$ #,##0.00`
   - Quantidades / Pesos: `#,##0.000`
   - Capacidade (GB/TB) ou Inteiros: `#,##0`
   - Percentuais: `0.0%`
   - Datas: `DD/MM/YYYY` ou `DD/MM/YYYY HH:MM`
2. **Limite de 31 Caracteres no Nome das Abas**:
   - O padrão OpenXML impõe limite máximo estrito de 31 caracteres para o nome de qualquer aba (worksheet). Exceder esse limite corrompe o arquivo Excel.
3. **Linhas de Grade e Painéis Congelados**:
   - Sempre manter linhas de grade ativas.
   - Congelar o painel do cabeçalho (`freeze_panes = 'A2'` ou equivalente).

---

## 🛠️ Implementação no Frontend (React + `xlsx` / `jspdf`)

No frontend do ITmizer-VR, utilize a biblioteca `xlsx` (SheetJS) já instalada para exportação de dados tabulares:

```typescript
import * as XLSX from 'xlsx';

export function exportTableToExcel(data: any[], fileName: string, sheetName = 'Dados') {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  
  const safeSheetName = sheetName.substring(0, 31);
  XLSX.utils.book_append_sheet(wb, ws, safeSheetName);
  
  XLSX.writeFile(wb, `${fileName}.xlsx`);
}
```

---

## 🛠️ Implementação Backend / Scripts Python (`openpyxl`)

Para scripts automatizados de análise de dados (ex: `read_excel.py` ou geradores de relatórios no backend):

```python
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

def build_itmizer_sheet(wb, title, headers, rows, col_types=None):
    safe_title = title[:31]
    ws = wb.create_sheet(title=safe_title)
    ws.views.sheetView[0].showGridLines = True
    
    font_header = Font(name='Segoe UI', size=10, bold=True, color='FFFFFF')
    fill_header = PatternFill(start_color='1E293B', end_color='1E293B', fill_type='solid')
    fill_zebra = PatternFill(start_color='F8FAFC', end_color='F8FAFC', fill_type='solid')
    font_data = Font(name='Segoe UI', size=9, color='0F172A')
    
    thin_border = Border(
        left=Side(style='thin', color='E2E8F0'),
        right=Side(style='thin', color='E2E8F0'),
        top=Side(style='thin', color='E2E8F0'),
        bottom=Side(style='thin', color='E2E8F0')
    )
    
    # 1. Header
    ws.append(headers)
    ws.row_dimensions[1].height = 26
    for cell in ws[1]:
        cell.font = font_header
        cell.fill = fill_header
        cell.alignment = Alignment(horizontal='center', vertical='center')
        cell.border = thin_border
        
    # 2. Rows
    for row_idx, row_data in enumerate(rows, start=2):
        ws.append(row_data)
        ws.row_dimensions[row_idx].height = 20
        is_zebra = (row_idx % 2 == 0)
        
        for col_idx, cell in enumerate(ws[row_idx]):
            cell.font = font_data
            cell.border = thin_border
            if is_zebra:
                cell.fill = fill_zebra
                
            # Formatação por tipo de coluna
            t = col_types[col_idx] if col_types and col_idx < len(col_types) else 'text'
            if t == 'money':
                cell.number_format = 'R$ #,##0.00'
                cell.alignment = Alignment(horizontal='right', vertical='center')
            elif t == 'int':
                cell.number_format = '#,##0'
                cell.alignment = Alignment(horizontal='right', vertical='center')
            elif t == 'date':
                cell.number_format = 'DD/MM/YYYY'
                cell.alignment = Alignment(horizontal='center', vertical='center')
            else:
                cell.alignment = Alignment(horizontal='left', vertical='center')
                
    # 3. Auto-fit columns
    for col in ws.columns:
        col_letter = get_column_letter(col[0].column)
        max_len = max(len(str(cell.value or '')) for cell in col)
        ws.column_dimensions[col_letter].width = max(max_len + 4, 12)
        
    ws.freeze_panes = 'A2'
    return ws
```
