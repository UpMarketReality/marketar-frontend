import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VendedorMisProductosB } from './vendedor-mis-productos-b';

describe('VendedorMisProductosB', () => {
  let component: VendedorMisProductosB;
  let fixture: ComponentFixture<VendedorMisProductosB>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VendedorMisProductosB],
    }).compileComponents();

    fixture = TestBed.createComponent(VendedorMisProductosB);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
