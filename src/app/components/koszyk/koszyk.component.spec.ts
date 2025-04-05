import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KoszykComponent } from './koszyk.component';

describe('KoszykComponent', () => {
  let component: KoszykComponent;
  let fixture: ComponentFixture<KoszykComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KoszykComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(KoszykComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
