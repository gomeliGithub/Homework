import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DownloadedFilesListComponent } from './downloaded-files-list.component';

describe('DownloadedFilesListComponent', () => {
  let component: DownloadedFilesListComponent;
  let fixture: ComponentFixture<DownloadedFilesListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DownloadedFilesListComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DownloadedFilesListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
