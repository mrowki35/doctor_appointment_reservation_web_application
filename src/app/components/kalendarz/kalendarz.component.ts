import {Component, OnInit, OnDestroy} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {Router} from '@angular/router';
import {Subscription} from 'rxjs';
import {MatSnackBar} from '@angular/material/snack-bar';

import {DoctorListService} from '../../services/doctor-list.service';
import {DostepnoscListService} from '../../services/dostepnosc-list.service';
import {AbsenceListService} from '../../services/absence-list.service';

import {Lekarz} from '../../model/lekarz.model';
import {Dostepnosc} from '../../model/dostepnosc.model';
import {Absencja} from '../../model/absencja.model';
import {Rezerwacja} from '../../model/rezerwacja.model';
import {ReservationListService} from '../../services/reservation-list.service';
import {Auth, onAuthStateChanged} from '@angular/fire/auth';

@Component({
  selector: 'app-kalendarz',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './kalendarz.component.html',
  styleUrls: ['./kalendarz.component.css'],
})
export class KalendarzComponent implements OnInit, OnDestroy {

  currentDate: Date = new Date();
  today: Date = new Date();
  daysOfWeek: string[] = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',
  ];
  hours: string[] = [
    '00:00',
    '00:30',
    '01:00',
    '01:30',
    '02:00',
    '02:30',
    '03:00',
    '03:30',
    '04:00',
    '04:30',
    '05:00',
    '05:30',
    '06:00',
    '06:30',
    '07:00',
    '07:30',
    '08:00',
    '08:30',
    '09:00',
    '09:30',
    '10:00',
    '10:30',
    '11:00',
    '11:30',
    '12:00',
    '12:30',
    '13:00',
    '13:30',
    '14:00',
    '14:30',
    '15:00',
    '15:30',
    '16:00',
    '16:30',
    '17:00',
    '17:30',
    '18:00',
    '18:30',
    '19:00',
    '19:30',
    '20:00',
    '20:30',
    '21:00',
    '21:30',
    '22:00',
    '22:30',
    '23:00',
    '23:30',
  ];

  selectedWeek: Date[] = [];
  doctors: Lekarz[] = [];
  private _selectedDoctorId: string = '';


  availabilityMap: Record<
    string,
    'red' | 'green' | 'grey' | 'blue' | 'yellow' | 'black' | 'light-blue'
  > = {};
  dostepnosci: Dostepnosc[] = [];
  absencje: Absencja[] = [];
  rezerwacje: Rezerwacja[] = [];


  selectedRangeDay: Date | null = null; 
  rangeStart: number | null = null; 
  rangeEnd: number | null = null; 
  userId: string = '';
  public visibleHourStartIndex = 0;
  public currentHourString: string = '';

  private subscriptions: Subscription = new Subscription();


  constructor(
    private router: Router,
    private doctorService: DoctorListService,
    private dostepnoscService: DostepnoscListService,
    private absenceService: AbsenceListService,
    private reservationListService: ReservationListService,
    private snackBar: MatSnackBar,
    private auth: Auth
  ) {
    console.log('Current date is:', this.currentDate);
    this.initializeWeek();
  }


  ngOnInit(): void {
    const now = new Date();
    this.currentHourString = now.getHours().toString().padStart(2, '0') + ':00';

    const doctorsSub = this.doctorService.getDoctorsStream().subscribe({
      next: (doctors: Lekarz[]) => {
        this.doctors = doctors;
        if (this.doctors.length > 0 && !this.selectedDoctorId) {
          this.selectedDoctorId = this.doctors[0].id;
          this.fetchDostepnosc();
          this.fetchAbsencja();
          this.fetchRezerwacje();
        }
      },
      error: (error) => {
        console.error('Error fetching doctors:', error);
      },
    });
    this.subscriptions.add(doctorsSub);

    onAuthStateChanged(this.auth, (user) => {
      if (user) {
        this.userId = user.uid;
        console.log('Logged-in User ID:', this.userId);
      } else {
        this.userId = '';
        console.warn('No user logged in');
      }
    });

    const indexOf8 = this.hours.indexOf('08:00');
    if (indexOf8 >= 0) {
      this.visibleHourStartIndex = indexOf8;
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }


  get selectedDoctorId(): string {
    return this._selectedDoctorId;
  }

  set selectedDoctorId(value: string) {
    if (this._selectedDoctorId !== value) {
      this._selectedDoctorId = value;
      console.log('Selected Doctor ID:', this._selectedDoctorId);
      this.fetchDostepnosc();
      this.fetchAbsencja();
      this.fetchRezerwacje();
    }
  }

  public goToToday(): void {
    this.currentDate = new Date();
    this.initializeWeek();
    this.buildAvailabilityMap();
  }

  get selectedDoctor(): Lekarz | undefined {
    return this.doctors.find((doc) => doc.id === this.selectedDoctorId);
  }

  public get displayedHourIndices(): number[] {
   
    const maxStartIndex = this.hours.length - 12;

    const clampedStart = Math.max(
      0,
      Math.min(this.visibleHourStartIndex, maxStartIndex)
    );


    return Array.from({length: 12}, (_, i) => i + clampedStart);
  }

  public scrollUp(): void {

    this.visibleHourStartIndex = Math.max(0, this.visibleHourStartIndex - 2);
  }


  public scrollDown(): void {

    const maxStartIndex = this.hours.length - 12;
    this.visibleHourStartIndex = Math.min(
      maxStartIndex,
      this.visibleHourStartIndex + 2
    );
  }

  fetchDostepnosc(): void {
    if (this.selectedDoctorId) {
      const dostepnoscSub = this.dostepnoscService
        .getDostepnoscStream()
        .subscribe({
          next: (dostepnosci: Dostepnosc[]) => {
            // Filter by doctor
            this.dostepnosci = dostepnosci.filter(
              (d) => d.lekarzId === this.selectedDoctorId
            );
            this.buildAvailabilityMap();
          },
          error: (error) => {
            console.error('Error fetching Dostepnosc:', error);
          },
        });
      this.subscriptions.add(dostepnoscSub);
    }
  }

  fetchRezerwacje(): void {
    if (this.selectedDoctorId) {
      const rezSub = this.reservationListService
        .getReservationsStream()
        .subscribe({
          next: (allRezerwacje: Rezerwacja[]) => {

            this.rezerwacje = allRezerwacje.filter(
              (r) => r.lekarzId === this.selectedDoctorId
            );
            this.buildAvailabilityMap();
          },
          error: (error) => {
            console.error('Error fetching Rezerwacje:', error);
          },
        });
      this.subscriptions.add(rezSub);
    }
  }

  fetchAbsencja(): void {
    if (this.selectedDoctorId) {
      const absencjaSub = this.absenceService.getAbsencesStream().subscribe({
        next: (absencje: Absencja[]) => {

          this.absencje = absencje.filter(
            (a) => a.lekarzId === this.selectedDoctorId
          );
          this.buildAvailabilityMap();
        },
        error: (error) => {
          console.error('Error fetching Absencja:', error);
        },
      });
      this.subscriptions.add(absencjaSub);
    }
  }


  private getTotalMinutes(time: { hours: number; minutes: number }): number {
    return time.hours * 60 + time.minutes;
  }

  buildAvailabilityMap(): void {

    this.selectedWeek.forEach((day) => {
      this.hours.forEach((hour) => {
        const key = this.getAvailabilityKey(day, hour);
        this.availabilityMap[key] = 'red';
      });
    });


    this.absencje.forEach((abs) => {
      const absDate = this.normalizeDate(abs.data);
      this.selectedWeek.forEach((day) => {
        const normDay = this.normalizeDate(day);
        if (normDay.getTime() === absDate.getTime()) {
          this.hours.forEach((hour) => {
            const key = this.getAvailabilityKey(day, hour);
            this.availabilityMap[key] = 'black'; 
          });
        }
      });
    });


    this.dostepnosci.forEach((avail) => {
      const availStartDate = this.normalizeDate(avail.startDate);
      const availEndDate = this.normalizeDate(avail.endDate);

      const weekStart = this.getStartOfWeek(this.currentDate);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);


      if (availEndDate < weekStart || availStartDate > weekEnd) {
        return;
      }

      this.selectedWeek.forEach((day) => {
        const normDay = this.normalizeDate(day);

        if (normDay < availStartDate || normDay > availEndDate) return;

        this.hours.forEach((hour) => {
          const slotTime = this.parseTime(hour);
          const startTime = this.parseTime(avail.startTime);
          const endTime = this.parseTime(avail.endTime);

          const slotTotalMinutes = this.getTotalMinutes(slotTime);
          const startTotalMinutes = this.getTotalMinutes(startTime);
          const endTotalMinutes = this.getTotalMinutes(endTime);

          if (
            slotTotalMinutes >= startTotalMinutes &&
            slotTotalMinutes < endTotalMinutes
          ) {
            const key = this.getAvailabilityKey(day, hour);
            if (this.availabilityMap[key] !== 'black') {
              this.availabilityMap[key] = 'green';
            }
          }
        });
      });
    });


    this.rezerwacje.forEach((rez) => {
      const resDay = this.normalizeDate(rez.data);

      const inThisWeek = this.selectedWeek.some(
        (day) => this.normalizeDate(day).getTime() === resDay.getTime()
      );
      if (!inThisWeek) return;


      const startIdx = this.hours.indexOf(rez.start);
      const endIdx = this.hours.indexOf(rez.koniec);

      for (let i = startIdx; i < endIdx; i++) {
        const key = this.getAvailabilityKey(resDay, this.hours[i]);


        if (rez.done) {
          this.availabilityMap[key] = 'grey';
        } else {
          if (rez.pacjentId === this.userId && rez.paid) {
            this.availabilityMap[key] = 'blue';
          } else if (rez.pacjentId === this.userId && !rez.paid) {
            this.availabilityMap[key] = 'light-blue';
          } else if (rez.pacjentId !== this.userId && rez.paid) {

            this.availabilityMap[key] = 'yellow';
          }
        }
      }
    });

    console.log('Availability Map:', this.availabilityMap);
  }



  initializeWeek(): void {
    const start = this.getStartOfWeek(this.currentDate);
    this.selectedWeek = Array.from({length: 7}, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      d.setHours(0, 0, 0, 0);
      return d;
    });
  }

  getStartOfWeek(date: Date): Date {
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    const start = new Date(date);
    start.setDate(diff);
    start.setHours(0, 0, 0, 0);
    return start;
  }

  navigateWeeks(direction: 'prev' | 'next'): void {
    const daysOffset = direction === 'next' ? 7 : -7;
    this.currentDate.setDate(this.currentDate.getDate() + daysOffset);
    console.log('Updated current date is:', this.currentDate);
    this.initializeWeek();
    this.buildAvailabilityMap();
  }

  parseTime(timeStr: string): { hours: number; minutes: number } {
    const [hh, mm] = timeStr.split(':').map(Number);
    return {hours: hh, minutes: mm};
  }

  normalizeDate(date: Date): Date {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  getAvailabilityKey(day: Date, hour: string): string {
    return `${day.toDateString()}-${hour}`;
  }

  getDayIndex(day: Date): number {
    const dayOfWeek = day.getDay();
    return dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  }

  onSlotClick(day: Date, hour: string): void {
    const key = this.getAvailabilityKey(day, hour);
    const color = this.availabilityMap[key];

    if (color !== 'green') {
      this.snackBar.open('Slot is not available for booking.', 'Close', {
        duration: 3000,
      });
      return;
    }


    if (
      !this.selectedRangeDay ||
      this.selectedRangeDay.getTime() !== day.getTime()
    ) {
      this.selectedRangeDay = day;
      this.rangeStart = null;
      this.rangeEnd = null;
    }

    const hourIndex = this.hours.indexOf(hour);
    if (hourIndex === -1) return;


    if (this.rangeStart === null) {
      this.rangeStart = hourIndex;
      this.rangeEnd = null; 
      return;
    }


    if (this.rangeEnd === null) {

      if (hourIndex === this.rangeStart) {

        this.rangeStart = null;
        this.rangeEnd = null;
        this.selectedRangeDay = null;
        return;
      }

      this.rangeEnd = hourIndex;
      if (this.rangeEnd < this.rangeStart) {
        [this.rangeStart, this.rangeEnd] = [this.rangeEnd, this.rangeStart];
      }

      if (!this.checkRangeAvailability(day, this.rangeStart, this.rangeEnd)) {
        this.snackBar.open(
          'Some slots in your selected range are unavailable.',
          'Close',
          {
            duration: 3000,
          }
        );
        this.rangeStart = null;
        this.rangeEnd = null;
        this.selectedRangeDay = null;
      }
      return;
    }


    this.rangeStart = hourIndex;
    this.rangeEnd = null;
    this.selectedRangeDay = day;
  }


  navigateToPatientForm(day: Date, startIndex: number, endIndex: number): void {
    const startHour = this.hours[startIndex];
    const endHour = this.hours[endIndex];
    this.router.navigate(['/patient-form'], {
      queryParams: {
        date: day.toISOString(),
        startTime: startHour,
        endTime: endHour,
        doctorId: this.selectedDoctorId,
      },
    });
  }

  makeReservation(): void {

    if (!this.selectedRangeDay || this.rangeStart === null) {

      return;
    }

    if (this.rangeEnd === null) {
      if (this.rangeStart + 1 >= this.hours.length) {
        return;
      }
      this.rangeEnd = this.rangeStart;
    }


    if (
      !this.checkRangeAvailability(
        this.selectedRangeDay,
        this.rangeStart,
        this.rangeEnd
      )
    ) {

      this.resetSelection();
      return;
    }
    this.rangeEnd = this.rangeEnd + 1;

    this.navigateToPatientForm(
      this.selectedRangeDay,
      this.rangeStart,
      this.rangeEnd
    );
  }

  private showSnackBar(msg: string): void {
    const ref = this.snackBar.open(msg, 'Close', {duration: 3000});
    ref.onAction().subscribe(() => ref.dismiss());
  }

  private resetSelection(): void {
    this.selectedRangeDay = null;
    this.rangeStart = null;
    this.rangeEnd = null;
  }


  checkRangeAvailability(
    day: Date,
    startIndex: number,
    endIndex: number
  ): boolean {
    for (let i = startIndex; i <= endIndex; i++) {
      const key = this.getAvailabilityKey(day, this.hours[i]);

      if (this.availabilityMap[key] !== 'green') {
        return false;
      }
    }
    return true;
  }

  payForReservation() {
    this.router.navigate(['/koszyk']);
  }
}
