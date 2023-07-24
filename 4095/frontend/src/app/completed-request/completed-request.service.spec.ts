import { TestBed } from '@angular/core/testing';

import { CompletedRequestService } from './completed-request.service';

describe('CompletedRequestService', () => {
  let service: CompletedRequestService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CompletedRequestService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
