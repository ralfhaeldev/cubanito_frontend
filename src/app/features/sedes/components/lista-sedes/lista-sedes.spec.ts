import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListaSedes } from './lista-sedes';

describe('ListaSedes', () => {
  let component: ListaSedes;
  let fixture: ComponentFixture<ListaSedes>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ListaSedes]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ListaSedes);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
