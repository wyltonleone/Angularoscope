import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DeviceComponent } from './device/device.component';
import { DeviceResolver } from './device/device.resolver';
import { DevicesComponent } from './devices/devices.component';
import { DevicesResolver } from './devices/devices.resolver';

const routes: Routes = [
  {
    path: '',
    component: DevicesComponent,
    resolve: {
      devices: DevicesResolver,
    },
  },
  {
    path: 'device/:id',
    component: DeviceComponent,
    resolve: {
      device: DeviceResolver,
    },
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
