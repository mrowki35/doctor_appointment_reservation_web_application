import { TestBed } from '@angular/core/testing';

import { DostepnoscListService } from './dostepnosc-list.service';

describe('DostepnoscListService', () => {
  let service: DostepnoscListService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DostepnoscListService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
