import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PerfilCompradorCotizacionesComponente } from './perfil-comprador-cotizaciones-componente';

describe('PerfilCompradorCotizacionesComponente', () => {
  let component: PerfilCompradorCotizacionesComponente;
  let fixture: ComponentFixture<PerfilCompradorCotizacionesComponente>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PerfilCompradorCotizacionesComponente],
    }).compileComponents();

    fixture = TestBed.createComponent(PerfilCompradorCotizacionesComponente);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
