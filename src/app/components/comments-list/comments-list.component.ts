import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommentsListService } from '../../services/comments-list.service';
import { ReservationListService } from '../../services/reservation-list.service';
import { DoctorListService } from '../../services/doctor-list.service';
import { Rezerwacja } from '../../model/rezerwacja.model';
import { Comment } from '../../model/comment.model';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { Lekarz } from '../../model/lekarz.model';
import { Timestamp } from 'firebase/firestore';

@Component({
  selector: 'app-comments-list',
  templateUrl: './comments-list.component.html',
  styleUrls: ['./comments-list.component.css'],
  imports: [CommonModule, FormsModule],
})
export class CommentsListComponent implements OnInit, OnDestroy {
  comments: Comment[] = [];
  userReservations: Rezerwacja[] = [];
  doctors: Lekarz[] = [];
  selectedDoctorId: string = '';
  newComment: { content: string; rate: number } = { content: '', rate: 1 };
  private subscriptions: Subscription = new Subscription();
  userId: string = '';

  // Dodatkowe właściwości dla filtrowania
  searchContent: string = '';
  searchDoctorId: string = '';
  filteredComments: Comment[] = [];
  isAdmin: boolean = false;

  constructor(
    private commentsService: CommentsListService,
    private reservationService: ReservationListService,
    private doctorService: DoctorListService,
    public authService: AuthService
  ) {}

  ngOnInit(): void {
    this.authService.isAdmin().subscribe((adminStatus) => {
      console.log('Admin Status:', adminStatus);
      this.isAdmin = adminStatus;
    });
    const commentsSub = this.commentsService.getCommentsStream().subscribe({
      next: (comments: Comment[]) => {
        this.comments = comments;
        this.filterComments();
      },
      error: (error: any) => {
        console.error('Error fetching comments:', error);
      },
    });
    this.subscriptions.add(commentsSub);

    const reservationsSub = this.authService.userData$.subscribe((userData) => {
      if (userData) {
        this.userId = userData.uid;
        this.reservationService.getReservationsStream().subscribe({
          next: (reservations: Rezerwacja[]) => {
            this.userReservations = reservations.filter(
              (r) => r.pacjentId === this.userId && r.done
            );
          },
          error: (error: any) => {
            console.error('Error fetching reservations:', error);
          },
        });
      }
    });
    this.subscriptions.add(reservationsSub);

    const doctorsSub = this.doctorService.getDoctorsStream().subscribe({
      next: (doctors: Lekarz[]) => {
        this.doctors = doctors;
      },
      error: (error: any) => {
        console.error('Error fetching doctors:', error);
      },
    });
    this.subscriptions.add(doctorsSub);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  canComment(doctorId: string): boolean {
    return this.userReservations.some((r) => r.lekarzId === doctorId);
  }

  addComment(): void {
    if (
      !this.selectedDoctorId ||
      !this.newComment.content ||
      this.newComment.rate < 1 ||
      this.newComment.rate > 10
    ) {
      alert('Proszę wybrać lekarza i wypełnić komentarz oraz ocenę.');
      return;
    }

    const reservationId = 'some-reservation-id';

    const comment: Comment = {
      id: this.generateUniqueId(),
      reservationId: reservationId,
      lekarzId: this.selectedDoctorId,
      content: this.newComment.content,
      rate: this.newComment.rate,
      date: Timestamp.now(),
      userId: this.userId,
    };

    this.commentsService.addComment(comment).subscribe({
      next: (docRef) => {
        alert('Comment added successfully:');

        this.newComment = { content: '', rate: 1 };
      },
      error: (error: any) => {
        alert('Error adding comment:');
      },
    });
  }

  deleteComment(comment: Comment): void {
    if (confirm('Czy na pewno chcesz usunąć ten komentarz?')) {
      this.commentsService.deleteComment(comment.id).subscribe({
        next: () => {
          alert('Komentarz usunięty pomyślnie.');
        },
        error: (error: any) => {
          console.error('Error deleting comment:', error);
        },
      });
    }
  }
  private generateUniqueId(): string {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 9);
    return `${timestamp}-${randomStr}`;
  }

  filterComments(): void {
    this.filteredComments = this.comments.filter((comment) => {
      const contentMatches = this.searchContent
        ? comment.content
            .toLowerCase()
            .includes(this.searchContent.toLowerCase())
        : true;
      const doctorIdMatches = this.searchDoctorId
        ? comment.lekarzId
            .toLowerCase()
            .includes(this.searchDoctorId.toLowerCase())
        : true;

      return contentMatches && doctorIdMatches;
    });
  }

  clearFilters(): void {
    this.searchContent = '';
    this.searchDoctorId = '';
    this.filteredComments = this.comments;
  }
}
