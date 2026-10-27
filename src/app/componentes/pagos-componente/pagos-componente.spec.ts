import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PagosComponente } from './pagos-componente';

describe('PagosComponente', () => {
  let component: PagosComponente;
  let fixture: ComponentFixture<PagosComponente>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PagosComponente],
    }).compileComponents();

    fixture = TestBed.createComponent(PagosComponente);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
