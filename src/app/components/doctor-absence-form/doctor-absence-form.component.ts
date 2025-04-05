// src/app/components/doctor-absence-form/doctor-absence-form.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbsenceListService } from '../../services/absence-list.service';
import { Absencja } from '../../model/absencja.model';
import { Observable, Subscription, forkJoin, of, throwError } from 'rxjs';
import { Auth, onAuthStateChanged } from '@angular/fire/auth';
import { switchMap, catchError, tap, map } from 'rxjs/operators';
import { MatSnackBar } from '@angular/material/snack-bar'; 

@Component({
  selector: 'app-doctor-absence-form',
  templateUrl: './doctor-absence-form.component.html',
  styleUrls: ['./doctor-absence-form.component.css'],
  standalone: true,
  imports: [CommonModule],
})
export class DoctorAbsenceFormComponent implements OnInit, OnDestroy {
  currentDate: Date = new Date();
  selectedMonth: number = this.currentDate.getMonth(); // 0-11
  selectedYear: number = this.currentDate.getFullYear();
  selectedDays: { year: number; month: number; day: number }[] = [];
  unSelectedDays: { year: number; month: number; day: number }[] = [];
  private absencesSubscription!: Subscription; 
  private authSubscription!: Subscription; 
  userId: string = '';

  constructor(
    private absenceService: AbsenceListService,
    private auth: Auth,
    private snackBar: MatSnackBar 
  ) {}

  ngOnInit(): void {

    this.authSubscription = new Observable<void>((observer) => {
      const unsubscribe = onAuthStateChanged(this.auth, (user) => {
        if (user) {
          this.userId = user.uid;
          console.log('Logged in user ID:', this.userId);
        } else {
          this.userId = '';
          console.warn('No user is logged in.');

        }
        observer.next();
      });


      return () => unsubscribe();
    }).subscribe();


    this.absencesSubscription = this.absenceService
      .getAbsencesStream()
      .subscribe({
        next: (absencje: Absencja[]) => {
          this.updateSelectedDays(absencje);
        },
        error: (error: any) => {
          console.error('Error fetching absencje:', error);
          this.snackBar.open('Error fetching absences.', 'Close', {
            duration: 3000,
          });
        },
      });

    console.log(this.selectedDays);
  }

  ngOnDestroy(): void {

    if (this.absencesSubscription) {
      this.absencesSubscription.unsubscribe();
    }
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }


  getDaysInMonth(year: number, month: number): Date[] {
    const date = new Date(year, month, 1);
    const daysInMonth: Date[] = [];
    while (date.getMonth() === month) {
      daysInMonth.push(new Date(date));
      date.setDate(date.getDate() + 1);
    }
    return daysInMonth;
  }


  nextMonth(): void {
    if (this.selectedMonth === 11) {
      this.selectedMonth = 0;
      this.selectedYear++;
    } else {
      this.selectedMonth++;
    }
  }


  prevMonth(): void {
    if (this.selectedMonth === 0) {
      this.selectedMonth = 11;
      this.selectedYear--;
    } else {
      this.selectedMonth--;
    }
  }

  getCalendarDays(): Date[] {
    return this.getDaysInMonth(this.selectedYear, this.selectedMonth);
  }


  isSelected(day: number): boolean {
    return this.selectedDays.some(
      (selected) =>
        selected.day === day &&
        selected.month === this.selectedMonth &&
        selected.year === this.selectedYear
    );
  }

d
  selectDay(day: number): void {
    const dayKey = {
      year: this.selectedYear,
      month: this.selectedMonth,
      day: day,
    };

    const isAlreadySelected = this.selectedDays.some(
      (selected) =>
        selected.day === day &&
        selected.month === this.selectedMonth &&
        selected.year === this.selectedYear
    );

    if (isAlreadySelected) {

      this.selectedDays = this.selectedDays.filter(
        (selected) =>
          !(
            selected.day === day &&
            selected.month === this.selectedMonth &&
            selected.year === this.selectedYear
          )
      );
      this.unSelectedDays.push(dayKey);
    } else {

      this.unSelectedDays = this.unSelectedDays.filter(
        (unselected) =>
          !(
            unselected.day === day &&
            unselected.month === this.selectedMonth &&
            unselected.year === this.selectedYear
          )
      );
      this.selectedDays.push(dayKey);
    }
  }


  submitAbsences(): void {
    console.log('Selected Absences: ', this.selectedDays);
    console.log('Unselected Days: ', this.unSelectedDays);

    const addObservables: Observable<any>[] = this.selectedDays.map(
      (selectedDay) => {
        const absencja = new Absencja(
          this.userId,
          new Date(selectedDay.year, selectedDay.month, selectedDay.day)
        );

        return this.absenceService.absenceExists(absencja).pipe(
          switchMap((exists: boolean) => {
            if (!exists) {
              return this.absenceService.addAbsence(absencja).pipe(
                tap(() => {
                  console.log('Absencja added:', absencja);
                  this.snackBar.open('Absence added successfully.', 'Close', {
                    duration: 3000,
                  });
                }),
                catchError((error) => {
                  console.error('Error adding absencja:', error);
                  this.snackBar.open('Error adding absence.', 'Close', {
                    duration: 3000,
                  });
                  return throwError(error);
                })
              );
            } else {
              console.log('Absencja already exists:', absencja);
              return of(null); 
            }
          })
        );
      }
    );


    const removeObservables: Observable<any>[] = this.unSelectedDays.map(
      (unselectedDay) => {
        const absencja = new Absencja(
          this.userId, 
          new Date(unselectedDay.year, unselectedDay.month, unselectedDay.day)
        );

        return this.absenceService.absenceExists(absencja).pipe(
          switchMap((exists: boolean) => {
            if (exists) {
              return this.absenceService.removeAbsence(absencja).pipe(
                tap(() => {
                  console.log('Absencja removed:', absencja);
                  this.snackBar.open('Absence removed successfully.', 'Close', {
                    duration: 3000,
                  });
                }),
                catchError((error) => {
                  console.error('Error removing absencja:', error);
                  this.snackBar.open('Error removing absence.', 'Close', {
                    duration: 3000,
                  });
                  return throwError(error);
                })
              );
            } else {
              console.log(
                'Absencja does not exist, no need to remove:',
                absencja
              );
              return of(null); 
            }
          })
        );
      }
    );


    const allObservables = [...addObservables, ...removeObservables];

    if (allObservables.length === 0) {
      console.log('No absencje to update.');
      this.snackBar.open('No absences to update.', 'Close', {
        duration: 3000,
      });
      return;
    }


    forkJoin(allObservables).subscribe({
      next: () => {
        console.log('All updates completed.');
        this.snackBar.open('All absences updated successfully.', 'Close', {
          duration: 3000,
        });

        this.selectedDays = [];
        this.unSelectedDays = [];
      },
      error: (error: any) => {
        console.error('Error during absence submission:', error);
        this.snackBar.open(
          'An error occurred while updating absences.',
          'Close',
          { duration: 3000 }
        );
      },
    });
  }


  private updateSelectedDays(absencje: Absencja[]): void {
    this.selectedDays = absencje.map((absence) => ({
      year: absence.data.getFullYear(),
      month: absence.data.getMonth(),
      day: absence.data.getDate(),
    }));
  }
}
