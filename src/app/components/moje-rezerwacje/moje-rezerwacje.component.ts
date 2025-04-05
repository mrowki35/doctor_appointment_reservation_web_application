// moje-rezerwacje.component.ts

import { Component, OnInit } from '@angular/core';
import { ReservationListService } from '../../services/reservation-list.service';
import { CommentsListService } from '../../services/comments-list.service'; 
import { Rezerwacja } from '../../model/rezerwacja.model';
import { Comment } from '../../model/comment.model';
import { Timestamp } from '@angular/fire/firestore';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Auth, onAuthStateChanged } from '@angular/fire/auth';
import { MatSnackBar } from '@angular/material/snack-bar'; 
import { MatDialog } from '@angular/material/dialog';
import { environment } from '../../../environments/environment';
import { Subscription } from 'rxjs/internal/Subscription';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-moje-rezerwacje',
  templateUrl: './moje-rezerwacje.component.html',
  styleUrls: ['./moje-rezerwacje.component.css'],
  imports: [CommonModule, FormsModule],
})
export class MojeRezerwacjeComponent implements OnInit {
  reservations: Rezerwacja[] = [];
  isCommentDialogOpen = false;
  currentReservationId: string = '';
  currentReservationDoctorId: string = '';
  userId: string = '';
  private subscription: Subscription = new Subscription();
  commentData = {
    rate: 1,
    content: '',
  };

  constructor(
    private reservationService: ReservationListService,
    private commentsService: CommentsListService,
    private auth: Auth,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    if (!environment.isMongo) {
      onAuthStateChanged(this.auth, (user) => {
        if (user) {
          this.userId = user.uid;
          console.log('Logged-in User ID:', this.userId);
          this.reservationService
            .getReservationsStream()
            .subscribe((reservations) => {

              this.reservations = reservations.filter(
                (rez) => rez.pacjentId === this.userId
              );
            });
        } else {
          this.userId = '';
          console.warn('No user logged in');
          this.reservationService
            .getReservationsStream()
            .subscribe((reservations) => {

              this.reservations = reservations.filter(
                (rez) => rez.pacjentId === this.userId
              );
            });
        }
      });
    } else {
      this.subscription.add(
        this.authService.userData$.subscribe((userData) => {
          if (userData) {
            this.userId = userData.uid;
            console.log('ID Zalogowanego Użytkownika:', this.userId);
            this.reservationService
              .getReservationsStream()
              .subscribe((reservations) => {

                this.reservations = reservations.filter(
                  (rez) => rez.pacjentId === this.userId
                );
              });
          }
        })
      );
    }
  }

  openCommentDialog(reservation: Rezerwacja): void {
    this.isCommentDialogOpen = true;
    this.currentReservationId = reservation.id;
    this.currentReservationDoctorId = reservation.lekarzId;
  }

  closeCommentDialog(): void {
    this.isCommentDialogOpen = false;
    this.commentData = {
      rate: 1,
      content: '',
    };
  }

  generateUniqueId(): string {
    const timestamp = Date.now().toString(36);
    const randomNum = Math.random().toString(36).substr(2, 9); 
    return `${timestamp}-${randomNum}`;
  }

  submitComment(): void {
    if (!this.currentReservationId || !this.currentReservationDoctorId) {
      this.snackBar.open(
        'Błąd: brak identyfikatora rezerwacji lub lekarza.',
        'Close',
        { duration: 3000 }
      );
      return;
    }

    const newComment: Comment = {
      id: this.generateUniqueId(), 
      reservationId: this.currentReservationId,
      lekarzId: this.currentReservationDoctorId,
      content: this.commentData.content.trim(), 
      date: Timestamp.now(),
      rate: this.commentData.rate,
      userId: this.userId,
    };

e
    this.commentsService;
    this.commentsService.addComment(newComment).subscribe({
      next: (docRef) => {
        console.log('Comment added successfully:', newComment);
        this.snackBar.open('Komentarz dodany pomyślnie!', 'Close', {
          duration: 3000,
        });
        this.closeCommentDialog();
      },
      error: (error: any) => {
        console.error('Error adding comment:', error);
        this.snackBar.open(
          'Błąd podczas dodawania komentarza. Spróbuj ponownie.',
          'Close',
          { duration: 3000 }
        );
      },
    });
  }

  isCommentFormValid(): boolean {
    return (
      this.commentData.rate >= 1 &&
      this.commentData.rate <= 10 &&
      this.commentData.content.trim().length > 0
    );
  }

 
  cancelReservation(reservation: Rezerwacja): void {

    const confirmation = confirm(
      `Czy na pewno chcesz anulować rezerwację o ID ${reservation.id}?`
    );

    if (confirmation) {
      this.reservationService.deleteReservationById(reservation.id).subscribe({
        next: () => {
          this.snackBar.open(
            `Rezerwacja ${reservation.id} została anulowana.`,
            'Close',
            { duration: 3000 }
          );

        },
        error: (error: any) => {
          console.error('Error canceling reservation:', error);
          this.snackBar.open(
            'Błąd podczas anulowania rezerwacji. Spróbuj ponownie.',
            'Close',
            { duration: 3000 }
          );
        },
      });
    }
  }
}
