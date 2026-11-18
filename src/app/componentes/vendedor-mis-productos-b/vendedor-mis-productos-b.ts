import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatTabLink, MatTabNav } from '@angular/material/tabs';
import { MatFormField } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatSelect } from '@angular/material/select';
import { MatIcon } from '@angular/material/icon';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardActions, MatCardContent, MatCardTitle } from '@angular/material/card';

@Component({
  imports: [
    RouterLink,
    RouterLinkActive,
    MatTabNav,
    MatTabLink,
    MatFormField,
    MatInput,
    MatSelect,
    MatIcon,
    MatButton,
    MatCard,
    MatCardTitle,
    MatCardContent,
    MatCardActions,
  ],
  selector: 'app-vendedor-mis-productos-b',
  styleUrl: './vendedor-mis-productos-b.css',
  templateUrl: './vendedor-mis-productos-b.html',
})
export class VendedorMisProductosB {}
