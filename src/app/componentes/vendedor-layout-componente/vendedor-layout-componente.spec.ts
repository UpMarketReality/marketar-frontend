import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VendedorLayoutComponente } from './vendedor-layout-componente';

describe('VendedorLayoutComponente', () => {
  let component: VendedorLayoutComponente;
  let fixture: ComponentFixture<VendedorLayoutComponente>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VendedorLayoutComponente],
    }).compileComponents();

    fixture = TestBed.createComponent(VendedorLayoutComponente);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
