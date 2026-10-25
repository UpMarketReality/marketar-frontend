import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { PerfilCompradorDatosComponente } from '../perfil-comprador-datos-componente/perfil-comprador-datos-componente';

@Component({
  imports: [RouterLink, RouterLinkActive],
  standalone: true,
  selector: 'app-header-componente',
  styleUrl: './header-componente.css',
  templateUrl: './header-componente.html',
})
export class HeaderComponente {
  protected readonly PerfilCompradorDatosComponente = PerfilCompradorDatosComponente;
}
