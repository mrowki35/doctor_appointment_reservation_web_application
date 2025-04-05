import { Component } from '@angular/core';
import { DoctorListService } from '../../services/doctor-list.service';
import { Lekarz } from '../../model/lekarz.model';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-register-doctor',
  imports: [FormsModule, CommonModule],
  templateUrl: './register-doctor.component.html',
  styleUrls: ['./register-doctor.component.css'],
})
export class RegisterDoctorComponent {

  newDoctor: Lekarz = {
    id: '', 
    imie: '',
    nazwisko: '',
    specjalizacja: '',
  };


  message: string = '';
  isError: boolean = false;

  constructor(
    private doctorService: DoctorListService,
    private router: Router
  ) {}


  private generateId(): string {
    const timestamp = Date.now().toString(); 
    const randomValue = Math.random().toString(36).substring(2, 8); 
    return `DOC-${timestamp}-${randomValue}`; 
  }

  registerDoctor(): void {
    if (
      this.newDoctor.imie &&
      this.newDoctor.nazwisko &&
      this.newDoctor.specjalizacja
    ) {
 
      this.newDoctor.id = this.generateId();

      this.doctorService
        .registerDoctor(this.newDoctor)
        .then(() => {
          this.message = `Doctor registered successfully with ID: ${this.newDoctor.id}`;
          this.isError = false;

          this.newDoctor = {
            id: '',
            imie: '',
            nazwisko: '',
            specjalizacja: '',
          };
        })
        .catch((error) => {
          this.message =
            'An error occurred while registering the doctor. Please try again.';
          this.isError = true;
          console.error('Registration error:', error);
        });
    } else {
      this.message = 'Please fill out all fields.';
      this.isError = true;
    }
  }
}
