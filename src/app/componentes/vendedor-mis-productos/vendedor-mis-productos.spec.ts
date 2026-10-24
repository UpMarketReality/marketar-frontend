import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VendedorMisProductos } from './vendedor-mis-productos';

describe('VendedorMisProductos', () => {
  let component: VendedorMisProductos;
  let fixture: ComponentFixture<VendedorMisProductos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VendedorMisProductos],
    }).compileComponents();

    fixture = TestBed.createComponent(VendedorMisProductos);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
