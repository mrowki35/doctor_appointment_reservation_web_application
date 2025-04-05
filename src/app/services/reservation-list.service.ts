import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  CollectionReference,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  deleteDoc,
  QuerySnapshot,
  DocumentData,
  DocumentReference,
  query,
  where,
  getDocs,
} from '@angular/fire/firestore';
import { Observable, throwError, BehaviorSubject, from } from 'rxjs';
import { Rezerwacja } from '../model/rezerwacja.model';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { SocketService } from './socket.service';

@Injectable({
  providedIn: 'root',
})
export class ReservationListService {
  private collectionName = 'rezerwacje';
  private reservationsCollection: CollectionReference<Rezerwacja>;
  private apiBaseUrl = environment.apiBaseUrl;

  private reservationsSubject = new BehaviorSubject<Rezerwacja[]>([]);
  public reservations$ = this.reservationsSubject.asObservable();

  constructor(
    private firestore: Firestore,
    private http: HttpClient,
    private socketService: SocketService
  ) {
    this.reservationsCollection = collection(
      this.firestore,
      this.collectionName
    ) as CollectionReference<Rezerwacja>;

    if (environment.isMongo) {
      this.initializeMongo();
    } else {
      console.log('initialized Firestore');
      this.initializeFirestore();
    }
  }


  private initializeFirestore() {
    onSnapshot(
      this.reservationsCollection,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const reservations: Rezerwacja[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          try {
            const reservation = new Rezerwacja(
              data['data'].toDate(), 
              data['start'],
              data['koniec'],
              data['lekarzId'],
              data['id'],
              data['pacjentId'],
              data['typ_konsultacji'],
              data['informacje'],
              data['paid'],
              data['done'],
              data['cancelled']
            );

            reservations.push(reservation);
          } catch (error) {
            console.error(
              `Error creating Rezerwacja from document ${doc.id}:`,
              error
            );
          }
        });
        this.reservationsSubject.next(reservations);
      },
      (error) => {
        console.error('Error fetching reservations from Firestore:', error);
      }
    );

  
  }


  private initializeMongo() {
    this.http
      .get<Rezerwacja[]>(`${this.apiBaseUrl}/rezerwacje`)
      .pipe(catchError(this.handleError<Rezerwacja[]>('getReservations', [])))
      .subscribe({
        next: (data) => {
          this.reservationsSubject.next(data);
        },
        error: (error) => {
          console.error('Error fetching initial reservations data:', error);
        },
        complete: () => {
          console.log('Initial reservations data fetch completed.');
        },
      });

    this.socketService.listen<Rezerwacja[]>('rezerwacje').subscribe({
      next: (updatedReservations) => {
        this.reservationsSubject.next(updatedReservations);
      },
      error: (error) => {
        console.error(
          'Error receiving real-time updates for reservations:',
          error
        );
      },
      complete: () => {
        console.log('Real-time updates for reservations stream completed.');
      },
    });
  }

  getReservationsStream(): Observable<Rezerwacja[]> {
    return this.reservations$;
  }

  addReservation(
    reservation: Rezerwacja
  ): Observable<DocumentReference<DocumentData>> | Observable<any> {
    if (environment.isMongo) {
      return this.http
        .post(`${this.apiBaseUrl}/rezerwacje`, reservation)
        .pipe(catchError(this.handleError<any>('addReservation')));
    } else {
      const reservationData = this.rezerwacjaToFirestore(reservation);
      return from(addDoc(this.reservationsCollection, reservationData)).pipe(
        tap((docRef) => {
          console.log('Reservation added with ID:', docRef.id);
        }),
        catchError(
          this.handleError<DocumentReference<DocumentData>>('addReservation')
        )
      );
    }
  }

  private rezerwacjaToFirestore(reservation: Rezerwacja): any {
    return {
      data: reservation.data, 
      start: reservation.start, 
      koniec: reservation.koniec, 
      lekarzId: reservation.lekarzId,
      id: reservation.id, 
      pacjentId: reservation.pacjentId, 
      typ_konsultacji: reservation.typ_konsultacji, 
      informacje: reservation.informacje, 
      paid: reservation.paid,
      done: reservation.done, 
      cancelled: reservation.cancelled, 
    };
  }

  getReservationById(id: string): Observable<Rezerwacja | null> {
    if (environment.isMongo) {
      return this.http
        .get<Rezerwacja>(`${this.apiBaseUrl}/rezerwacje/${id}`)
        .pipe(
          map((reservation) => reservation || null),
          catchError(
            this.handleError<Rezerwacja | null>('getReservationById', null)
          )
        );
    } else {
      const reservationDocRef = doc(
        this.firestore,
        `${this.collectionName}/${id}`
      );
      return new Observable<Rezerwacja | null>((observer) => {
        const unsubscribe = onSnapshot(
          reservationDocRef,
          (docSnapshot) => {
            if (docSnapshot.exists()) {
              const data = docSnapshot.data();
              const reservation = new Rezerwacja(
                data['data'].toDate(),
                data['start'],
                data['koniec'],
                data['lekarzId'],
                data['id'],
                data['pacjentId'],
                data['typ_konsultacji'],
                data['informacje'],
                data['paid'],
                data['done'],
                data['cancelled']
              );

              observer.next(reservation);
            } else {
              observer.next(null);
            }
          },
          (error) => {
            observer.error(error);
          }
        );

        return () => unsubscribe();
      });
    }
  }

  markAsPaid(reservation: Rezerwacja): Observable<any> {
    if (environment.isMongo) {
      return this.http
        .put(`${this.apiBaseUrl}/rezerwacje/${reservation.id}`, { paid: true })
        .pipe(catchError(this.handleError<any>('markAsPaid')));
    } else {
      const reservationsCollection = collection(
        this.firestore,
        this.collectionName
      );
      const reservationQuery = query(
        reservationsCollection,
        where('id', '==', reservation.id)
      );

      return from(getDocs(reservationQuery)).pipe(
        switchMap((querySnapshot) => {
          if (querySnapshot.empty) {
            throw new Error(`No reservation found with ID: ${reservation.id}`);
          }

          const updatePromises: Promise<void>[] = [];
          querySnapshot.forEach((docSnapshot) => {
            const reservationDoc = doc(
              this.firestore,
              this.collectionName,
              docSnapshot.id
            );
            updatePromises.push(updateDoc(reservationDoc, { paid: true }));
          });

          return from(Promise.all(updatePromises));
        }),
        tap(() => {
          console.log(`Reservation marked as paid: ${reservation.id}`);
        }),
        catchError(this.handleError<any>('markAsPaid'))
      );
    }
  }


  deleteReservationById(id: string): Observable<any> {
    if (environment.isMongo) {
      return this.http
        .delete(`${this.apiBaseUrl}/rezerwacje/${id}`)
        .pipe(catchError(this.handleError<any>('deleteReservationById')));
    } else {
      const reservationsCollection = collection(
        this.firestore,
        this.collectionName
      );
      const reservationQuery = query(
        reservationsCollection,
        where('id', '==', id)
      );

      return from(getDocs(reservationQuery)).pipe(
        switchMap((querySnapshot) => {
          if (querySnapshot.empty) {
            throw new Error(`No reservation found with ID: ${id}`);
          }

          const deletePromises: Promise<void>[] = [];
          querySnapshot.forEach((docSnapshot) => {
            const reservationDocRef = doc(
              this.firestore,
              this.collectionName,
              docSnapshot.id
            );
            deletePromises.push(deleteDoc(reservationDocRef));
          });

          return from(Promise.all(deletePromises));
        }),
        tap(() => {
          console.log(`Reservation(s) with ID ${id} successfully deleted.`);
        }),
        catchError(this.handleError<any>('deleteReservationById'))
      );
    }
  }

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: HttpErrorResponse): Observable<T> => {
      console.error(`${operation} failed: ${error.message}`);
      return throwError(
        () => new Error(`${operation} failed: ${error.message}`)
      );
    };
  }
}
