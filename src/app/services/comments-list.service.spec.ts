import { TestBed } from '@angular/core/testing';

import { CommentsListService } from './comments-list.service';

describe('CommentsListService', () => {
  let service: CommentsListService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CommentsListService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
