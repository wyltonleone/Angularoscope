import { Injectable } from '@angular/core';
import {
  ActivatedRoute,
  ActivatedRouteSnapshot,
  Resolve,
  Router,
  RouterStateSnapshot,
} from '@angular/router';
import { from, Observable, tap } from 'rxjs';
import { DeviceService } from './device.service';

@Injectable({
  providedIn: 'root',
})
export class DeviceResolver implements Resolve<USBDevice> {
  constructor(
    private _router: Router,
    private _activatedRoute: ActivatedRoute,
    private _deviceService: DeviceService
  ) {}

  resolve(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): USBDevice | Promise<USBDevice> | Observable<USBDevice> {
    const id = parseInt(route.paramMap.get('id')!);
    return this._deviceService.refreshDevice(id).pipe(
      tap({
        next: (device: USBDevice) => {},
        error: (error: any) => {
          this._router.navigate(['../'], {
            relativeTo: this._activatedRoute,
          });
        },
      })
    );
  }
}
