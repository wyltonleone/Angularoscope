import { Injectable } from '@angular/core';
import { BehaviorSubject, from, map, ReplaySubject, Subject, tap } from 'rxjs';
import { DevicesService } from '../devices/devices.service';

@Injectable({
  providedIn: 'root',
})
export class DeviceService {
  public readonly device$: BehaviorSubject<USBDevice | null>;

  constructor(private _devicesService: DevicesService) {
    this.device$ = new BehaviorSubject<USBDevice | null>(null);
  }

  public refreshDevice(i: number) {
    return this._devicesService.refreshDevices().pipe(
      map((devices: USBDevice[]) => {
        if (devices.length - 1 >= i) {
          const device = devices[i];

          this.device$.next(device);
          return device;
        }

        throw new Error('invalid_device');
      })
    );
  }
}
