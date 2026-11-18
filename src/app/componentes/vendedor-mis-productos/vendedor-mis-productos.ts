import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatTabLink, MatTabNav } from '@angular/material/tabs';
import { MatFormField, MatPrefix } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatSelect } from '@angular/material/select';
import { MatOption } from '@angular/material/core';
import { MatIcon } from '@angular/material/icon';
import { MatButton } from '@angular/material/button';
import { MatChip } from '@angular/material/chips';
import {
  MatCard,
  MatCardActions,
  MatCardContent,
  MatCardImage,
  MatCardTitle,
} from '@angular/material/card';

@Component({
  imports: [
    RouterLink,
    RouterLinkActive,
    MatTabNav,
    MatTabLink,
    MatFormField,
    MatPrefix,
    MatInput,
    MatSelect,
    MatOption,
    MatIcon,
    MatButton,
    MatChip,
    MatCard,
    MatCardImage,
    MatCardContent,
    MatCardTitle,
    MatCardActions,
  ],
  selector: 'app-vendedor-mis-productos',
  styleUrl: './vendedor-mis-productos.css',
  templateUrl: './vendedor-mis-productos.html',
})
export class VendedorMisProductos {}
