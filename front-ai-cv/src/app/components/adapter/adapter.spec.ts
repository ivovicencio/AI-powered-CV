import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Adapter } from './adapter';

describe('Adapter', () => {
  let component: Adapter;
  let fixture: ComponentFixture<Adapter>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Adapter],
    }).compileComponents();

    fixture = TestBed.createComponent(Adapter);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
