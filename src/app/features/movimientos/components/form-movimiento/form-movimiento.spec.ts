import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormMovimiento } from './form-movimiento';

describe('FormMovimiento', () => {
  let component: FormMovimiento;
  let fixture: ComponentFixture<FormMovimiento>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormMovimiento]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FormMovimiento);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
