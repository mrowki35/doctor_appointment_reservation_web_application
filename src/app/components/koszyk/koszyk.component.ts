import { Component, OnDestroy, OnInit } from '@angular/core';
import { ReservationListService } from '../../services/reservation-list.service';
import { Rezerwacja } from '../../model/rezerwacja.model';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-koszyk',
  templateUrl: './koszyk.component.html',
  styleUrls: ['./koszyk.component.css'],
  imports: [CommonModule],
})
export class KoszykComponent implements OnInit, OnDestroy {
  reservations: Rezerwacja[] = [];
  private subscription: Subscription = new Subscription();
  userId: string = '';

  constructor(
    private reservationService: ReservationListService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {

    const userSub = this.authService.userData$.subscribe((userData) => {
      if (userData) {
        this.userId = userData.uid;
        this.fetchReservations();
      }
    });
    this.subscription.add(userSub);
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  fetchReservations(): void {
    const rezSub = this.reservationService
      .getReservationsStream()
      .subscribe((reservations: Rezerwacja[]) => {

        this.reservations = reservations.filter(
          (r) => r.pacjentId === this.userId && !r.paid
        );
      });
    this.subscription.add(rezSub);
  }


  markAsPaid(reservation: Rezerwacja): void {
    this.reservationService.markAsPaid(reservation).subscribe({
      next: () => {
        alert('Rezerwacja została oznaczona jako opłacona.');
      },
      error: (error: any) => {
        console.error('Error marking reservation as paid:', error);
        alert('Wystąpił błąd podczas oznaczania rezerwacji jako opłaconej.');
      },
    });
  }

  deleteReservation(reservation: Rezerwacja): void {
    if (confirm('Czy na pewno chcesz usunąć tę rezerwację?')) {
      this.reservationService.deleteReservationById(reservation.id).subscribe({
        next: () => {

        },
        error: (error: any) => {
          console.error('Error deleting reservation:', error);
          alert('Wystąpił błąd podczas usuwania rezerwacji.');
        },
      });
    }
  }
}
