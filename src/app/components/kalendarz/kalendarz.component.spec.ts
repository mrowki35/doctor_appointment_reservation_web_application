import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KalendarzComponent } from './kalendarz.component';

describe('KalendarzComponent', () => {
  let component: KalendarzComponent;
  let fixture: ComponentFixture<KalendarzComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KalendarzComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(KalendarzComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
