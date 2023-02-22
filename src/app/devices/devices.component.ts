import { Component, OnInit } from '@angular/core';
import { Route, Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { DevicesService } from './devices.service';

@Component({
  templateUrl: './devices.component.html',
  styleUrls: ['./devices.component.scss'],
})
export class DevicesComponent implements OnInit {
  public devices$: BehaviorSubject<USBDevice[]>;

  constructor(
    private _router: Router,
    private _devicesService: DevicesService,
  ) {
    this.devices$ = _devicesService.devices$;
  }

  selectDevice(index: number) {
    this._router.navigateByUrl(`device/${index}`);
  }

  addDevice(): void {
    this._devicesService.requestDevice().subscribe();
  }

  ngOnInit(): void {}
}
