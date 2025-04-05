import { TestBed } from '@angular/core/testing';

import { AbsenceListService } from './absence-list.service';

describe('AbsenceListService', () => {
  let service: AbsenceListService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AbsenceListService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
