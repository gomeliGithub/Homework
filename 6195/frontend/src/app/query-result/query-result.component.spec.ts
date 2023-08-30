import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SelectQueryResultComponent } from './select-query-result.component';

describe('SelectQueryResultComponent', () => {
  let component: SelectQueryResultComponent;
  let fixture: ComponentFixture<SelectQueryResultComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SelectQueryResultComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SelectQueryResultComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
