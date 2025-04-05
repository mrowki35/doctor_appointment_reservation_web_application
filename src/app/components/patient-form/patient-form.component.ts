import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReservationListService } from '../../services/reservation-list.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Auth, onAuthStateChanged } from '@angular/fire/auth';
import { Rezerwacja } from '../../model/rezerwacja.model';
import { Pacjent } from '../../model/pacjent.model';
import { AuthService } from '../../services/auth.service';
import { Subscription } from 'rxjs';
import { DoctorListService } from '../../services/doctor-list.service';
import { Lekarz } from '../../model/lekarz.model';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-patient-form',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './patient-form.component.html',
  styleUrls: ['./patient-form.component.css'],
})
export class PatientFormComponent implements OnInit {
  patientData = {
    name: '',
    surname: '',
    sex: '',
    age: null,
    additionalInfo: '',
    purpose: '',
  };

  selectedDate: string = '';
  selectedStartTime: string = '';
  selectedEndTime: string = '';
  selectedDoctorId: string = '';
  userId: string = '';

  doctors: Lekarz[] = []; 
  selectedDoctor: Lekarz | null = null;

  purposes = ['Consultation', 'Follow-up', 'Prescription', 'Routine Checkup'];
  private subscription: Subscription = new Subscription();
  constructor(
    private reservationService: ReservationListService,
    private route: ActivatedRoute,
    private router: Router,
    private doctorService: DoctorListService,
    private auth: Auth,
    private authService: AuthService
  ) {}

  ngOnInit(): void {

    this.subscription.add(
      this.route.queryParams.subscribe((params) => {
        this.selectedDate = params['date'] || '';
        this.selectedStartTime = params['startTime'] || '00:00';
        this.selectedEndTime = params['endTime'] || '00:30';
        this.selectedDoctorId = params['doctorId'] || '';
        console.log('Otrzymana Data:', this.selectedDate);
        console.log('Otrzymany Start Time:', this.selectedStartTime);
        console.log('Otrzymany End Time:', this.selectedEndTime);
        console.log('Otrzymany Doctor ID:', this.selectedDoctorId);
        this.fetchSelectedDoctor();
      })
    );

    this.subscription.add(
      this.authService.userData$.subscribe((userData) => {
        if (userData) {
          this.userId = userData.uid;
          console.log('ID Zalogowanego Użytkownika:', this.userId);
        }
      })
    );
  }
  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
  fetchSelectedDoctor(): void {
    if (this.selectedDoctorId) {
      this.subscription.add(
        this.doctorService.getDoctorsStream().subscribe((doctors: Lekarz[]) => {
          this.selectedDoctor =
            doctors.find((doc) => doc.id === this.selectedDoctorId) || null;
          if (!this.selectedDoctor) {
            console.warn('Lekarz o podanym ID nie został znaleziony.');
          }
        })
      );
    }
    if (!environment.isMongo) {
      onAuthStateChanged(this.auth, (user) => {
        if (user) {
          this.userId = user.uid;
          console.log('Logged-in User ID:', this.userId);
        } else {
          this.userId = '';
          console.warn('No user logged in');
        }
      });
    }
  }

  generateUniqueId(): string {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 9);
    return `${timestamp}-${randomStr}`;
  }

  onSubmit(): void {
    console.log('Patient Data:', this.patientData);
    console.log('Appointment Date:', this.selectedDate);
    console.log('Start Time:', this.selectedStartTime);
    console.log('End Time:', this.selectedEndTime);
    console.log('Doctor ID:', this.selectedDoctorId);

    const newReservation = new Rezerwacja(
      new Date(this.selectedDate), 
      this.selectedStartTime,
      this.selectedEndTime, 
      this.selectedDoctorId.toString(),
      this.generateUniqueId(),
      this.userId, 
      this.patientData.purpose,
      this.patientData.additionalInfo, 
      false, 
      false,
      false
      
    );


    this.reservationService.addReservation(newReservation).subscribe({
      next: (response) => {
        alert('Reservation successfully created!');
        this.router.navigate(['/main-page-component']);
      },
      error: (error: any) => {
        console.error('Error adding reservation:', error);
        alert('Error creating reservation. Please try again.');
      },
    });
  }
}
