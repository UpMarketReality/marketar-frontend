import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CompradorLayoutComponente } from './comprador-layout-componente';

describe('CompradorLayoutComponente', () => {
  let component: CompradorLayoutComponente;
  let fixture: ComponentFixture<CompradorLayoutComponente>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CompradorLayoutComponente],
    }).compileComponents();

    fixture = TestBed.createComponent(CompradorLayoutComponente);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
