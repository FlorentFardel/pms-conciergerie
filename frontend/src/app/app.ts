import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PropertiesListComponent } from './features/properties/properties-list/list';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, PropertiesListComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class AppComponent {
  title = 'pms-frontend';
}