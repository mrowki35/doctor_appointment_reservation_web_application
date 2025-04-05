import { TestBed } from '@angular/core/testing';

import { BannedUsersService } from './banned-users.service';

describe('BannedUsersService', () => {
  let service: BannedUsersService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BannedUsersService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
