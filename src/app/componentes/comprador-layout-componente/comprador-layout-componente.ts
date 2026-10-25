import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  standalone: true,
  selector: 'app-comprador-layout-componente',
  styleUrl: './comprador-layout-componente.css',
  templateUrl: './comprador-layout-componente.html',
})
export class CompradorLayoutComponente {}
