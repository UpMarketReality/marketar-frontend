import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponente } from '../header-componente/header-componente';

@Component({
  imports: [RouterOutlet, HeaderComponente],
  standalone: true,
  selector: 'app-general-layout-componente',
  styleUrl: './general-layout-componente.css',
  templateUrl: './general-layout-componente.html',
})
export class GeneralLayoutComponente {}

