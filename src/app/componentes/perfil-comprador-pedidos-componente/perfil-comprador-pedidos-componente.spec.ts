import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PerfilCompradorPedidosComponente } from './perfil-comprador-pedidos-componente';

describe('PerfilCompradorPedidosComponente', () => {
  let component: PerfilCompradorPedidosComponente;
  let fixture: ComponentFixture<PerfilCompradorPedidosComponente>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PerfilCompradorPedidosComponente],
    }).compileComponents();

    fixture = TestBed.createComponent(PerfilCompradorPedidosComponente);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
