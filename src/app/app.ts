import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {HeaderComponente} from './componentes/header-componente/header-componente';

@Component({
  imports: [RouterOutlet,HeaderComponente],
  standalone: true,
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  protected readonly title = signal('frontendMarketar');
}
