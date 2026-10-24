import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VendedorGestorDePedidos } from './vendedor-gestor-de-pedidos';

describe('VendedorGestorDePedidos', () => {
  let component: VendedorGestorDePedidos;
  let fixture: ComponentFixture<VendedorGestorDePedidos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VendedorGestorDePedidos],
    }).compileComponents();

    fixture = TestBed.createComponent(VendedorGestorDePedidos);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
