import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DoctorAbsenceFormComponent } from './doctor-absence-form.component';

describe('DoctorAbsenceFormComponent', () => {
  let component: DoctorAbsenceFormComponent;
  let fixture: ComponentFixture<DoctorAbsenceFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DoctorAbsenceFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DoctorAbsenceFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
