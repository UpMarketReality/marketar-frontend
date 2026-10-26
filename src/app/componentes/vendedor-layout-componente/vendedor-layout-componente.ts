import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';

@Component({
  imports: [RouterOutlet, RouterLink],
  selector: 'app-vendedor-layout-componente',
  styleUrl: './vendedor-layout-componente.css',
  templateUrl: './vendedor-layout-componente.html',
})
export class VendedorLayoutComponente {}
