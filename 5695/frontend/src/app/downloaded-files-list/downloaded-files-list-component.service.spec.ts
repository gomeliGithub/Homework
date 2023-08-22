import { TestBed } from '@angular/core/testing';

import { DownloadedFilesListComponentService } from './downloaded-files-list-component.service';

describe('DownloadedFilesListComponentService', () => {
  let service: DownloadedFilesListComponentService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DownloadedFilesListComponentService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
