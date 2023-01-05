import { Injectable } from '@angular/core';
import { BehaviorSubject, from, tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class DevicesService {
  public readonly devices$: BehaviorSubject<USBDevice[]>;

  constructor() {
    const devices = new Array();
    this.devices$ = new BehaviorSubject(devices);
  }

  public requestDevice() {
    return from(
      navigator.usb.requestDevice({
        filters: [],
      })
    ).pipe(tap(() => this.refreshDevices().subscribe()));
  }

  public refreshDevices() {
    return from(navigator.usb.getDevices()).pipe(
      tap((devices) => {
        this.devices$.next(devices);
      })
    );
  }
}
