import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FormSede } from './form-sede';

describe('FormSede', () => {
  let component: FormSede;
  let fixture: ComponentFixture<FormSede>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormSede]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FormSede);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
