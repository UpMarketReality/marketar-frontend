
import { Component } from '@angular/core';
import {
  RouterLink,
  RouterLinkActive,
  RouterOutlet
} from '@angular/router';

@Component({
  selector: 'app-vendedor-layout-componente',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive
  ],
  styleUrl: './vendedor-layout-componente.css',
  templateUrl: './vendedor-layout-componente.html',
})
export class VendedorLayoutComponente { }
