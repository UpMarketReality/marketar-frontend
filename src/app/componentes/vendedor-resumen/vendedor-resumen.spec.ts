import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VendedorResumen } from './vendedor-resumen';

describe('VendedorResumen', () => {
  let component: VendedorResumen;
  let fixture: ComponentFixture<VendedorResumen>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VendedorResumen],
    }).compileComponents();

    fixture = TestBed.createComponent(VendedorResumen);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
