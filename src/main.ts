import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

if (environment.production) {
  enableProdMode();
}

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.error(err));

import {Component} from '@angular/core';

/**
 * @title Basic buttons
 */
@Component({
  selector: 'button-overview-example',
  templateUrl: 'button-overview-example.html',
  styleUrls: ['button-overview-example.css'],
})
export class ButtonOverviewExample {}