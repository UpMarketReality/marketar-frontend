import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PerfilCompradorDireccionComponente } from './perfil-comprador-direccion-componente';

describe('PerfilCompradorDireccionComponente', () => {
  let component: PerfilCompradorDireccionComponente;
  let fixture: ComponentFixture<PerfilCompradorDireccionComponente>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PerfilCompradorDireccionComponente],
    }).compileComponents();

    fixture = TestBed.createComponent(PerfilCompradorDireccionComponente);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
