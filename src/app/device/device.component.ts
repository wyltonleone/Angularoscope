import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
} from '@angular/core';
import { ActivatedRoute, Route, Router } from '@angular/router';
import { BehaviorSubject, ReplaySubject, Subject } from 'rxjs';
import { DeviceService } from './device.service';
import { pack, unpackFrom } from 'python-struct';
import { Buffer } from 'buffer';

import {
  Chart,
  ChartConfiguration,
  ChartData,
  ChartEvent,
  ChartOptions,
  ChartType,
} from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { XLSXService } from './xlsx.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import html2canvas from 'html2canvas';
import { downloadZip } from 'client-zip';

@Component({
  templateUrl: './device.component.html',
  styleUrls: ['./device.component.scss'],
})
export class DeviceComponent implements OnInit {
  public device!: USBDevice;
  public btag = 0;

  @ViewChild(BaseChartDirective) chart: BaseChartDirective | undefined;

  public firstData$: BehaviorSubject<any>;
  public secondData$: BehaviorSubject<any>;
  public thirdData$: BehaviorSubject<any>;
  public fourthData$: BehaviorSubject<any>;

  public lineChartLabels: Array<number>;

  public barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    scales: {},
    animation: {
      duration: 0,
    },
  };

  public barChartType: ChartType = 'line';

  public scatterChartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: true,
    animation: {
      duration: 0,
    },
    showLine: true,
    scales: {
      x: {
        type: 'linear', // MANDATORY TO SHOW YOUR POINTS! (THIS IS THE IMPORTANT BIT)
        display: true, // mandatory
        position: 'bottom',
      },
      y: {
        type: 'linear', // MANDATORY TO SHOW YOUR POINTS! (THIS IS THE IMPORTANT BIT)
        display: true, // mandatory
        position: 'bottom',
      },
    },
  };

  public barChartData: ChartData<'line'> = {
    labels: [],
    datasets: [
      { data: [], label: 'Canal 1' },
      { data: [], label: 'Canal 2' },
    ],
  };

  public x: Array<number>;

  public y: Array<number>;

  public z: Array<number>;

  public frequency: number = 0;

  @ViewChild('graphs')
  graphs!: ElementRef<HTMLCanvasElement>;

  constructor(
    private _router: Router,
    private _changeDetectorRef: ChangeDetectorRef,
    private _activatedRoute: ActivatedRoute,
    private _xlsxService: XLSXService,
    private _formBuilder: FormBuilder
  ) {
    this.x = new Array();
    this.y = new Array();
    this.z = new Array();

    this.firstData$ = new BehaviorSubject([]);
    this.secondData$ = new BehaviorSubject([]);
    this.thirdData$ = new BehaviorSubject([]);
    this.fourthData$ = new BehaviorSubject([]);

    const length = 2507 - 11;

    const z = new Array<number>(length);
    for (let index = 0; index < z.length; index++) {
      z[index] = index;
    }

    this.lineChartLabels = z;
  }

  public rmsVoltageCH1: number = 0;
  public rmsVoltageCH2: number = 0;

  async start() {
    await this.device.open();
    await this.device.selectConfiguration(1);
    let interfaceNumber = 0;
    let errorCount = 0;

    while (errorCount < 10) {
      try {
        await this.device.claimInterface(interfaceNumber);
        console.log(interfaceNumber);
        break;
      } catch (error) {
        errorCount++;
        interfaceNumber++;
        console.log(interfaceNumber);
      }
    }
   

    await this.send('DESE 1');
    await this.send('*ESE 1');
    await this.send('*SRE 32');
    await this.send('HEAD 0');
    await this.send('DAT INIT');
    await this.send('*IDN?');

    for (;;) {
      await this.send('CH1:SCA?;:CH2:SCA?;:HOR:MAI:SCA?');
      const scales = (await this.receive()).toString().split(';');

      await this.send('DAT:SOU CH1;:CURV?');
      const pointsCH1 = (await this.receive()).slice(0, -4);

      await this.send('DAT:SOU CH2;:CURV?');
      const pointsCH2 = (await this.receive()).slice(0, -4);

      await this.send(
        'MEASU:MEAS1?;:MEASU:MEAS1:VAL?;:MEASU:MEAS2?;:MEASU:MEAS2:VAL?;:MEASU:MEAS3?;:MEASU:MEAS3:VAL?;:MEASU:MEAS4?;:MEASU:MEAS4:VAL?;:MEASU:MEAS5?;:MEASU:MEAS5:VAL?'
      );
      const measures = (await this.receive()).toString().split(';');

      this.frequency = parseFloat(measures[19]).toFixed(3) as any;

      const voltageCH1 = parseFloat(measures[3]);
      const voltageCH2 = parseFloat(measures[7]);

      this.rmsVoltageCH1 = parseFloat(measures[11]);
      this.rmsVoltageCH2 = parseFloat(measures[15]);

      const jump = 10;

      this.x = new Array(pointsCH1.length - jump);
      this.y = new Array(pointsCH2.length - jump);
      this.z = new Array(pointsCH1.length - jump);

      var max = {} as any;
      var min = {} as any;

      for (let i = 0; i < this.x.length; i++) {
        this.x[i] = pointsCH1.readInt8(i + jump);

        if (max.ch1 == undefined) {
          max.ch1 = this.x[i];
        }

        if (min.ch1 == undefined) {
          min.ch1 = this.x[i];
        }

        if (this.x[i] > max.ch1) {
          max.ch1 = this.x[i];
        }

        if (this.x[i] < min.ch1) {
          min.ch1 = this.x[i];
        }

        this.y[i] = pointsCH2.readInt8(i + jump);

        if (max.ch2 == undefined) {
          max.ch2 = this.y[i];
        }

        if (min.ch2 == undefined) {
          min.ch2 = this.y[i];
        }

        if (this.y[i] > max.ch2) {
          max.ch2 = this.y[i];
        }

        if (this.y[i] < min.ch2) {
          min.ch2 = this.y[i];
        }

        this.z[i] = i;
      }

      for (let i = 0; i < this.x.length; i++) {
        this.x[i] =
          ((this.x[i] - min.ch1) / (max.ch1 - min.ch1) - 0.5) * voltageCH1;
        this.y[i] =
          ((this.y[i] - min.ch2) / (max.ch2 - min.ch2) - 0.5) * voltageCH2;
      }

      const I = this.eletricalCurrent;
      var group = [];

      for (let index = 0; index < this.x.length; index++) {
        group.push({
          x: this.x[index],
          y: this.y[index],
        });
      }

      this.thirdData$.next([
        {
          label: `Canal 1 x Canal 2 (Área: ${this.calcPolygonArea(
            group
          )} J/m³)`,
          data: group,
          pointRadius: 0,
          tension: 0,
          borderWidth: 1.5,
          backgroundColor: '#373F51',
          borderColor: '#373F51',
        },
      ]);

      const H = this.H;
      const B = this.B;

      group = [];

      for (let index = 0; index < B.length; index++) {
        group.push({
          x: H[index],
          y: B[index],
        });
      }

      this.fourthData$.next([
        {
          data: group,
          pointRadius: 0,
          tension: 0.5,
          borderWidth: 1.5,
          label: `B x H (Área: ${this.calcPolygonArea(
            group
          )} J/m³)    (H_MAX: ${Math.max(...H).toFixed(
            2
          )} A/m B_MAX: ${Math.max(...B).toFixed(3)} T)`,
          spanGaps: false,
          borderJoinStyle: 'bevel',
          backgroundColor: '#74C191',
          borderColor: '#74C191',
        },
      ]);

      this.secondData$.next([
        {
          data: I,
          label: `Corrente Resistor 1 (I_MAX: ${this.maxValue(I).toFixed(3)})`,
          radius: 0.02,
          backgroundColor: '#EB3030',
          borderColor: '#EB3030',
        },
      ]);

      this.firstData$.next([
        {
          data: this.x,
          label: `Canal 1 (P.a.P: ${(
            this.maxValue(this.x) + Math.abs(this.minValue(this.x))
          ).toFixed(3)}, RMS: ${this.rmsVoltageCH1.toFixed(
            3
          )}, MAX: ${this.maxValue(this.x).toFixed(3)})`,
          radius: 0.02,
          backgroundColor: '#FF8800',
          borderColor: '#FF8800',
        },
        {
          data: this.y,
          label: `Canal 2 (P.a.P: ${(
            this.maxValue(this.y) + Math.abs(this.minValue(this.y))
          ).toFixed(3)}, RMS: ${this.rmsVoltageCH2.toFixed(
            3
          )}, MAX: ${this.maxValue(this.y).toFixed(3)})`,
          radius: 0.02,
          backgroundColor: '#1F93E1',
          borderColor: '#1F93E1',
        },
      ]);

      this._changeDetectorRef.detectChanges();
      await this.sleep(10);
    }
  }

  public bForm = this._formBuilder.group({
    N: [600, [Validators.required]],
    A: [9 * 10 ** -4, [Validators.required]],
    R: [22, [Validators.required]],
    C: [0.0001, [Validators.required]],
  });

  get B(): Array<number> {
    const { N, A, R, C } = this.bForm.value;

    const B = new Array(this.y.length);

    for (let i = 0; i < B.length; i++) {
      B[i] = (this.y[i] * C! * R!) / (N! * A!);
    }

    return B;
  }

  public hForm = this._formBuilder.group({
    R: [10, [Validators.required]],
    N: [600, [Validators.required]],
    L: [0.38, [Validators.required]],
  });

  get H(): Array<number> {
    const { N, R, L } = this.hForm.value;

    const H = new Array(this.x.length);

    for (let i = 0; i < H.length; i++) {
      H[i] = (N! * this.x[i]) / (L! * R!);
    }

    return H;
  }

  get eletricalCurrent(): Array<number> {
    const { R } = this.hForm.value;
    const I = new Array(this.x.length);

    for (let i = 0; i < I.length - 1; i++) {
      I[i] = this.x[i] / R!;
    }

    return I;
  }

  downloadData(object: any) {
    const array = new Array();

    for (var [key, value] of Object.entries(object)) {
      const valueArray = value as Array<any>;

      for (let index = 0; index < valueArray.length; index++) {
        if (array[index] == undefined) {
          array[index] = {};
        }

        array[index][key] = valueArray[index];
      }
    }

    this._xlsxService.save(array);
  }

  getBlobData(object: any) {
    const array = new Array();

    for (var [key, value] of Object.entries(object)) {
      const valueArray = value as Array<any>;

      for (let index = 0; index < valueArray.length; index++) {
        if (array[index] == undefined) {
          array[index] = {};
        }

        array[index][key] = valueArray[index];
      }
    }

    return this._xlsxService.getBlob(array);
  }

  maxValue(arr: Array<number>) {
    var max = arr[0];

    for (const value of arr) {
      if (value != undefined && value > max) {
        max = value;
      }
    }

    return max;
  }

  minValue(arr: Array<number>) {
    var min = arr[0];

    for (const value of arr) {
      if (value != undefined && value < min) {
        min = value;
      }
    }

    return min;
  }

  downloadFirstData() {
    this.downloadData({
      canal1: this.x,
      canal2: this.y,
    });
  }

  downloadSecondData() {
    this.downloadData({
      corrente: this.eletricalCurrent,
    });
  }

  downloadFourthData() {
    this.downloadData({
      B: this.B,
      H: this.H,
    });
  }

  sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  public coleta$ = new BehaviorSubject({
    Frequência: new Array<any>(),
    'Pico a Pico Vp': new Array<any>(),
    'RMS Vp': new Array<any>(),
    'MAX Vp': new Array<any>(),
    'Pico a Pico Vs': new Array<any>(),
    'RMS Vs': new Array<any>(),
    'MAX Vs': new Array<any>(),
    Plots: new Array<any>(),
    Tensoes: new Array<any>(),
    Correntes: new Array<any>(),
    Campos: new Array<any>(),
    Length: 0,
  });

  clearColeta() {
    this.coleta$.next({
      Frequência: new Array<any>(),
      'Pico a Pico Vp': new Array<any>(),
      'RMS Vp': new Array<any>(),
      'MAX Vp': new Array<any>(),
      'Pico a Pico Vs': new Array<any>(),
      'RMS Vs': new Array<any>(),
      'MAX Vs': new Array<any>(),
      Plots: new Array<any>(),
      Tensoes: new Array<any>(),
      Correntes: new Array<any>(),
      Campos: new Array<any>(),
      Length: 0,
    });
  }

  public coletas = 0;

  ngOnInit(): void {
    this.device = this._activatedRoute.snapshot.data['device'];
    this.start();

    this.coleta$.subscribe((value) => {
      this.coletas = value.Length;
      this._changeDetectorRef.markForCheck();
    });

    document.addEventListener(
      'keydown',
      async (event) => {
        const keyName = event.key;

        if (keyName == 'l') {
          this.clearColeta();
        }

        if (keyName == 'c') {
          const canvas = await html2canvas(document.querySelector('#graphs')!);
          const coleta = this.coleta$.value;

          const canvasBlob = (await new Promise((resolve) =>
            canvas.toBlob(resolve)
          )) as any;

          const now = new Date().toISOString();

          coleta.Plots.push({
            name: `${now}/plots.jpeg`,
            lastModified: new Date(),
            input: canvasBlob,
          });

          coleta.Frequência.push(this.frequency);

          coleta['Pico a Pico Vp'].push(
            (this.maxValue(this.x) + Math.abs(this.minValue(this.x))).toFixed(3)
          );

          coleta['RMS Vp'].push(this.rmsVoltageCH1);
          coleta['MAX Vp'].push(this.maxValue(this.x).toFixed(3));
          coleta['Pico a Pico Vs'].push(
            (this.maxValue(this.y) + Math.abs(this.minValue(this.y))).toFixed(3)
          );
          coleta['RMS Vs'].push(this.rmsVoltageCH2);
          coleta['MAX Vs'].push(this.maxValue(this.y).toFixed(3));

          coleta.Tensoes.push({
            name: `${now}/tensoes.xlsx`,
            lastModified: new Date(),
            input: this.getBlobData({
              canal1: this.x,
              canal2: this.y,
            }),
          });

          coleta.Correntes.push({
            name: `${now}/corrente.xlsx`,
            lastModified: new Date(),
            input: this.getBlobData({
              corrente: this.eletricalCurrent,
            }),
          });

          coleta.Campos.push({
            name: `${now}/campos.xlsx`,
            lastModified: new Date(),
            input: this.getBlobData({
              B: this.B,
              H: this.H,
            }),
          });

          coleta.Length++;

          this.coleta$.next(coleta);
        }

        if (keyName == 's') {
          const coleta = this.coleta$.value;

          const blob = await downloadZip([
            ...coleta.Plots,
            ...coleta.Tensoes,
            ...coleta.Correntes,
            ...coleta.Campos,
            {
              name: 'dados.xlsx',
              lastModified: new Date(),
              input: this.getBlobData({
                Frequência: coleta.Frequência,
                'Pico a Pico Vp': coleta['Pico a Pico Vp'],
                'RMS Vp': coleta['RMS Vp'],
                'MAX Vp': coleta['MAX Vp'],
                'Pico a Pico Vs': coleta['Pico a Pico Vs'],
                'RMS Vs': coleta['RMS Vs'],
                'MAX Vs': coleta['MAX Vs'],
              }),
            },
          ]).blob();

          // make and click a temporary link to download the Blob
          const link = document.createElement('a');
          link.href = URL.createObjectURL(blob);
          link.download = `${new Date().toISOString()}.zip`;
          link.click();
        }
      },
      false
    );
  }

  calcPolygonArea(vertices: any) {
    var total = 0;

    for (var i = 0, l = vertices.length; i < l; i++) {
      var addX = vertices[i].x;
      var addY = vertices[i == vertices.length - 1 ? 0 : i + 1].y;
      var subX = vertices[i == vertices.length - 1 ? 0 : i + 1].x;
      var subY = vertices[i].y;

      total += addX * addY * 0.5;
      total -= subX * subY * 0.5;
    }

    return Math.abs(total).toFixed(2);
  }

  getBuffer(message: string) {
    const size = message.length;
    this.btag = (this.btag % 255) + 1;

    return Buffer.concat([
      pack('BBBx', 1, this.btag, ~this.btag & 0xff),
      pack('<LBxxx', size, 1),
      Buffer.from(message),
      Buffer.alloc((4 - (size % 4)) % 4),
    ]);
  }

  get secondBuffer() {
    this.btag = (this.btag % 255) + 1;
    return Buffer.concat([
      pack('BBBx', 2, this.btag, ~this.btag & 0xff),
      pack('<LBxxx', 1024, 0),
    ]);
  }

  toBuffer(ab: ArrayBuffer) {
    const buf = Buffer.alloc(ab.byteLength);
    const view = new Uint8Array(ab);
    for (let i = 0; i < buf.length; ++i) {
      buf[i] = view[i];
    }
    return buf;
  }

  async receive() {
    var stop = 0;
    var result = Buffer.alloc(0);

    while (stop == 0) {
      await this.device.transferOut(6, this.secondBuffer);
      const transferIn = await this.device.transferIn(5, 1036);

      if (transferIn.data) {
        const buffer = this.toBuffer(transferIn.data.buffer);
        const unpack = unpackFrom('<LBxxx', buffer, true, 4) as any;
        const size = unpack[0];
        stop = unpack[1];

        result = Buffer.concat([result, buffer.slice(12, size + 12)]);
      }
    }

    return result;
  }

  async send(message: string) {
    await this.device.transferOut(6, this.getBuffer(message));
  }

  back() {
    this._router.navigate(['../'], {
      relativeTo: this._activatedRoute,
    });
  }
}
