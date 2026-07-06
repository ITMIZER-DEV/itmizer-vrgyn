import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronLeft, ChevronRight, Download, FileSpreadsheet, FileText, Settings2 } from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchKey?: string;
  filename?: string;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchKey,
  filename = "export",
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
    },
    initialState: {
      pagination: {
        pageSize: 20,
      },
    },
  });

  const exportToExcel = () => {
    // Get visible columns and data
    const visibleColumns = table.getVisibleFlatColumns().filter(col => col.id !== 'actions');
    const headers = visibleColumns.map(col => {
        if (typeof col.columnDef.header === 'string') return col.columnDef.header;
        return col.id;
    });

    const exportData = table.getFilteredRowModel().rows.map(row => {
      const rowData: Record<string, any> = {};
      visibleColumns.forEach(col => {
        const value = row.getValue(col.id);
        const header = typeof col.columnDef.header === 'string' ? col.columnDef.header : col.id;
        rowData[header] = value;
      });
      return rowData;
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Dados");
    XLSX.writeFile(workbook, `${filename}-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    const visibleColumns = table.getVisibleFlatColumns().filter(col => col.id !== 'actions');
    
    const headers = visibleColumns.map(col => {
        if (typeof col.columnDef.header === 'string') return col.columnDef.header;
        return col.id;
    });

    const body = table.getFilteredRowModel().rows.map(row => {
      return visibleColumns.map(col => String(row.getValue(col.id) ?? '-'));
    });

    autoTable(doc, {
      head: [headers],
      body: body,
      theme: 'grid',
      headStyles: { fillColor: [255, 106, 0] }, // VR Brand Orange (#FF6A00)
      styles: { fontSize: 8 },
    });

    doc.save(`${filename}-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        {searchKey && table.getColumn(searchKey) && (
          <div className="flex-1 max-w-sm">
            <Input
              placeholder={`Buscar...`}
              value={(table.getColumn(searchKey)?.getFilterValue() as string) ?? ""}
              onChange={(event) =>
                table.getColumn(searchKey)?.setFilterValue(event.target.value)
              }
              className="max-w-sm h-8 text-xs"
            />
          </div>
        )}
        <div className="flex items-center gap-2">
          <div className="flex items-center border rounded-md p-1 bg-muted/20">
            <Button
              variant="ghost"
              size="sm"
              onClick={exportToExcel}
              className="h-8 text-xs gap-1"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-green-600" />
              Excel
            </Button>
            <div className="w-[1px] h-4 bg-border mx-1" />
            <Button
              variant="ghost"
              size="sm"
              onClick={exportToPDF}
              className="h-8 text-xs gap-1"
            >
              <FileText className="w-3.5 h-3.5 text-red-600" />
              PDF
            </Button>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-2 text-xs">
                <Settings2 className="w-3.5 h-3.5" />
                Colunas
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) => column.toggleVisibility(!!value)}
                    >
                      {typeof column.columnDef.header === 'string' ? column.columnDef.header : column.id}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="rounded-md border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/30">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} className="font-semibold text-primary/80">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="group"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  Nenhum registro encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between py-4">
        <div className="text-sm text-muted-foreground">
          Página {table.getState().pagination.pageIndex + 1} de{" "}
          {table.getPageCount()} (Total: {data.length} registros)
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="h-8"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="h-8"
          >
            Próximo
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}
