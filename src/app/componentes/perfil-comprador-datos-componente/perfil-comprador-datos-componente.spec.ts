import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PerfilCompradorDatosComponente } from './perfil-comprador-datos-componente';

describe('PerfilCompradorDatosComponente', () => {
  let component: PerfilCompradorDatosComponente;
  let fixture: ComponentFixture<PerfilCompradorDatosComponente>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PerfilCompradorDatosComponente],
    }).compileComponents();

    fixture = TestBed.createComponent(PerfilCompradorDatosComponente);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
