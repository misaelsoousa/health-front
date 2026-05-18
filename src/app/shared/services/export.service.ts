import { Injectable } from '@angular/core';
import ExcelJS from 'exceljs';

export type ExportColumn<T> = {
  header: string;
  accessor: (row: T) => string | number | null | undefined;
  width?: number;
};

export type ExportFormat = 'csv' | 'xlsx';

@Injectable({ providedIn: 'root' })
export class ExportService {
  async export<T>(format: ExportFormat, fileName: string, columns: ExportColumn<T>[], rows: T[]) {
    if (format === 'csv') {
      this.exportCsv(fileName, columns, rows);
      return;
    }

    await this.exportXlsx(fileName, columns, rows);
  }

  private exportCsv<T>(fileName: string, columns: ExportColumn<T>[], rows: T[]) {
    const headerLine = columns.map((col) => this.escapeCsv(col.header)).join(';');
    const dataLines = rows.map((row) =>
      columns.map((col) => this.escapeCsv(this.cellValue(col, row))).join(';'),
    );

    const csv = '\uFEFF' + [headerLine, ...dataLines].join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    this.downloadBlob(blob, `${fileName}.csv`);
  }

  private async exportXlsx<T>(fileName: string, columns: ExportColumn<T>[], rows: T[]) {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Dados');

    sheet.columns = columns.map((col) => ({
      header: col.header,
      key: col.header,
      width: col.width ?? 22,
    }));

    sheet.getRow(1).font = { bold: true };

    for (const row of rows) {
      const record: Record<string, string | number> = {};
      for (const col of columns) {
        record[col.header] = this.cellValue(col, row);
      }
      sheet.addRow(record);
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    this.downloadBlob(blob, `${fileName}.xlsx`);
  }

  private cellValue<T>(col: ExportColumn<T>, row: T): string | number {
    const value = col.accessor(row);
    if (value === null || value === undefined) {
      return '';
    }

    return value;
  }

  private escapeCsv(value: string | number): string {
    const stringValue = String(value);
    if (/[";\r\n]/.test(stringValue)) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }

    return stringValue;
  }

  private downloadBlob(blob: Blob, fileName: string) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
