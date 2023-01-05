import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  Resolve,
  RouterStateSnapshot,
} from '@angular/router';
import { Observable } from 'rxjs';
import { DevicesService } from './devices.service';

@Injectable({
  providedIn: 'root',
})
export class DevicesResolver implements Resolve<USBDevice[]> {
  constructor(private _devicesService: DevicesService) {}

  resolve(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): USBDevice[] | Promise<USBDevice[]> | Observable<USBDevice[]> {
    return this._devicesService.refreshDevices();
  }
}
