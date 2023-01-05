import { Device, webusb } from 'usb';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ComponentFixtureNoNgZone } from '@angular/core/testing';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  public device!: USBDevice;

  constructor(private router: Router) {}

  ngOnInit(): void {}

  async requestDevice() {
    const device = await navigator.usb.requestDevice({
      filters: [{ vendorId: 1689 }],
    });

    await device.open();

    await device.selectConfiguration(1);
    await device.claimInterface(0);

    this.device = device;
    this.router.navigateByUrl('plot');
  }
}
