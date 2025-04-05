// doctor-form.component.ts
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { DostepnoscListService } from '../../services/dostepnosc-list.service'; 
import { Auth, onAuthStateChanged } from '@angular/fire/auth';
import { Dostepnosc } from '../../model/dostepnosc.model';

@Component({
  selector: 'app-doctor-form',
  templateUrl: './doctor-form.component.html',
  styleUrls: ['./doctor-form.component.css'],
  imports: [ReactiveFormsModule, CommonModule],
})
export class DoctorFormComponent implements OnInit {
  doctorForm: FormGroup;
  daysOfWeek: string[] = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',
  ];
  selectedDays: string[] = [];
  lekarzId: string = '';


  successMessage: string = '';
  errorMessage: string = '';
  isSubmitting: boolean = false;

  constructor(
    private fb: FormBuilder,
    private dostepnoscService: DostepnoscListService,
    private auth: Auth
  ) {
    this.doctorForm = this.fb.group({
      scheduleType: ['cyclic', Validators.required],
      startDate: [''],
      endDate: [''],
      singleDate: [''],
      startHour: ['', Validators.required],
      endHour: ['', Validators.required],
    });

    this.handleScheduleTypeChange();
  }

  ngOnInit(): void {
    onAuthStateChanged(this.auth, (user) => {
      if (user) {
        this.lekarzId = user.uid;
        console.log('Logged-in User ID:', this.lekarzId);
      } else {
        this.lekarzId = '';
        console.warn('No user logged in');
      }
    });
  }

  toggleDay(day: string): void {
    if (this.selectedDays.includes(day)) {
      this.selectedDays = this.selectedDays.filter((d) => d !== day);
    } else {
      this.selectedDays.push(day);
    }
  }

  handleScheduleTypeChange(): void {
    this.doctorForm.get('scheduleType')?.valueChanges.subscribe((type) => {
      if (type === 'cyclic') {
        this.doctorForm.get('startDate')?.setValidators(Validators.required);
        this.doctorForm.get('endDate')?.setValidators(Validators.required);
        this.doctorForm.get('singleDate')?.clearValidators();
      } else {
        this.doctorForm.get('singleDate')?.setValidators(Validators.required);
        this.doctorForm.get('startDate')?.clearValidators();
        this.doctorForm.get('endDate')?.clearValidators();
      }
      this.doctorForm.get('startDate')?.updateValueAndValidity();
      this.doctorForm.get('endDate')?.updateValueAndValidity();
      this.doctorForm.get('singleDate')?.updateValueAndValidity();
    });
  }

  async onSubmit(): Promise<void> {
    if (this.doctorForm.valid && this.lekarzId) {
      this.isSubmitting = true;
      this.successMessage = '';
      this.errorMessage = '';

      const formValue = this.doctorForm.value;

      const dostepnosc: Dostepnosc = {
        lekarzId: this.lekarzId,
        startDate:
          formValue.scheduleType === 'cyclic'
            ? new Date(formValue.startDate)
            : new Date(formValue.singleDate),
        endDate:
          formValue.scheduleType === 'cyclic'
            ? new Date(formValue.endDate)
            : new Date(formValue.singleDate),
        startTime: formValue.startHour,
        endTime: formValue.endHour,
        monday: this.selectedDays.includes('Monday'),
        tuesday: this.selectedDays.includes('Tuesday'),
        wednesday: this.selectedDays.includes('Wednesday'),
        thursday: this.selectedDays.includes('Thursday'),
        friday: this.selectedDays.includes('Friday'),
        saturday: this.selectedDays.includes('Saturday'),
        sunday: this.selectedDays.includes('Sunday'),
      };

      try {
        await this.dostepnoscService.addDostepnosc(dostepnosc);
        this.successMessage = 'Konsultacja została dodana pomyślnie.';
        this.doctorForm.reset({ scheduleType: 'cyclic' });
        this.selectedDays = [];
      } catch (error) {
        console.error('Error adding dostepnosc:', error);
        this.errorMessage =
          'Wystąpił błąd podczas dodawania konsultacji. Spróbuj ponownie.';
      } finally {
        this.isSubmitting = false;
      }
    } else {
      if (!this.lekarzId) {
        this.errorMessage =
          'Nie jesteś zalogowany. Zaloguj się, aby dodać konsultację.';
      } else {
        this.errorMessage = 'Proszę wypełnić wszystkie wymagane pola.';
      }
    }
  }
}
