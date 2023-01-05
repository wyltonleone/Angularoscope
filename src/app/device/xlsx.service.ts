import { Injectable } from '@angular/core';

import * as XLSX from 'xlsx';
import * as FileSaver from 'file-saver';

@Injectable({
  providedIn: 'root',
})
export class XLSXService {
  private readonly mimeType =
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';

  private readonly extension = '.xlsx';

  private get name() {
    const date = new Date();
    return `${date.getDay()}${date.getMonth()}${date.getFullYear()}${date.getTime()}`;
  }

  public save(array: Array<any>) {
    const ws = XLSX.utils.json_to_sheet(array);
    const wb = { Sheets: { data: ws }, SheetNames: ['data'] };
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: this.mimeType });
    FileSaver.saveAs(data, this.name + this.extension);
  }
}
