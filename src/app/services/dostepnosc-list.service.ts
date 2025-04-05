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
} from '@angular/fire/firestore';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { Dostepnosc } from '../model/dostepnosc.model'; 
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { catchError, map } from 'rxjs/operators';
import { SocketService } from './socket.service';

@Injectable({
  providedIn: 'root',
})
export class DostepnoscListService {
  private collectionName = 'dostepnosci'; 
  private dostepnosciCollection: CollectionReference<Dostepnosc>;
  private apiBaseUrl = environment.apiBaseUrl;

  // BehaviorSubject to hold the current list of Dostepnosc
  private dostepnosciSubject = new BehaviorSubject<Dostepnosc[]>([]);
  public dostepnosci$ = this.dostepnosciSubject.asObservable();

  constructor(
    private firestore: Firestore,
    private http: HttpClient,
    private socketService: SocketService
  ) {
    this.dostepnosciCollection = collection(
      this.firestore,
      this.collectionName
    ) as CollectionReference<Dostepnosc>;


    if (environment.isMongo) {
      console.log('initialized mongo');
      this.initializeMongo();
    } else {
      this.initializeFirestore();
    }
  }


  private initializeFirestore() {
    const unsubscribe = onSnapshot(
      this.dostepnosciCollection,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const dostepnosci: Dostepnosc[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          try {
            const dostepnosc = new Dostepnosc(
              data['lekarzId'],
              data['startDate'].toDate(), 
              data['endDate'].toDate(),
              data['startTime'],
              data['endTime'],
              data['monday'],
              data['tuesday'],
              data['wednesday'],
              data['thursday'],
              data['friday'],
              data['saturday'],
              data['sunday']
            );

            dostepnosci.push(dostepnosc);
          } catch (error) {
            console.error(
              `Error creating Dostepnosc from document ${doc.id}:`,
              error
            );
          }
        });
        this.dostepnosciSubject.next(dostepnosci);
      },
      (error) => {
        console.error('Error fetching dostepnosci from Firestore:', error);
      }
    );
  }


  private initializeMongo() {
    this.http
      .get<Dostepnosc[]>(`${this.apiBaseUrl}/dostepnosc`)
      .pipe(catchError(this.handleError<Dostepnosc[]>('getDostepnosci', [])))
      .subscribe({
        next: (data) => {
          this.dostepnosciSubject.next(data);
        },
        error: (error) => {
          console.error('Error fetching initial dostepnosci data:', error);
        },
        complete: () => {
          console.log('Initial dostepnosci data fetch completed.');
        },
      });

    this.socketService.listen<Dostepnosc[]>('dostepnosc').subscribe({
      next: (updatedDostepnosci) => {
        this.dostepnosciSubject.next(updatedDostepnosci);
      },
      error: (error) => {
        console.error(
          'Error receiving real-time updates for dostepnosc:',
          error
        );
      },
      complete: () => {
        console.log('Real-time updates for dostepnosc stream completed.');
      },
    });
  }


  addDostepnosc(
    dostepnosc: Dostepnosc
  ): Promise<DocumentReference<DocumentData>> | Observable<any> {
    if (environment.isMongo) {
      return this.http
        .post(`${this.apiBaseUrl}/dostepnosc`, dostepnosc)
        .pipe(catchError(this.handleError<any>('addDostepnosc')));
    } else {
      return addDoc(
        this.dostepnosciCollection,
        this.dostepnoscToFirestore(dostepnosc)
      )
        .then((docRef) => {
          console.log('Dostepnosc added with ID:', docRef.id);
          return docRef;
        })
        .catch((error) => {
          console.error('Error adding Dostepnosc:', error);
          throw error;
        });
    }
  }

  private dostepnoscToFirestore(dostepnosc: Dostepnosc): any {
    return {
      lekarzId: dostepnosc.lekarzId,
      startDate: dostepnosc.startDate,
      endDate: dostepnosc.endDate,
      startTime: dostepnosc.startTime,
      endTime: dostepnosc.endTime,
      monday: dostepnosc.monday,
      tuesday: dostepnosc.tuesday,
      wednesday: dostepnosc.wednesday,
      thursday: dostepnosc.thursday,
      friday: dostepnosc.friday,
      saturday: dostepnosc.saturday,
      sunday: dostepnosc.sunday,
    };
  }

  getDostepnoscStream(): Observable<Dostepnosc[]> {
    return this.dostepnosci$;
  }

  getDostepnoscById(id: string): Observable<Dostepnosc | null> {
    if (environment.isMongo) {
      return this.http
        .get<Dostepnosc>(`${this.apiBaseUrl}/dostepnosc/${id}`)
        .pipe(
          map((dostepnosc) => dostepnosc || null),
          catchError(
            this.handleError<Dostepnosc | null>('getDostepnoscById', null)
          )
        );
    } else {
      const dostepnoscDocRef = doc(
        this.firestore,
        `${this.collectionName}/${id}`
      );
      return new Observable<Dostepnosc | null>((observer) => {
        const unsubscribe = onSnapshot(
          dostepnoscDocRef,
          (docSnapshot) => {
            if (docSnapshot.exists()) {
              const data = docSnapshot.data();
              const dostepnosc = new Dostepnosc(
                data['lekarzId'],
                data['startDate'].toDate(),
                data['endDate'].toDate(),
                data['startTime'],
                data['endTime'],
                data['monday'],
                data['tuesday'],
                data['wednesday'],
                data['thursday'],
                data['friday'],
                data['saturday'],
                data['sunday']
              );

              observer.next(dostepnosc);
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


  updateDostepnosc(
    id: string,
    dostepnosc: Partial<Dostepnosc>
  ): Observable<any> {
    if (environment.isMongo) {
      return this.http
        .put(`${this.apiBaseUrl}/dostepnosc/${id}`, dostepnosc)
        .pipe(catchError(this.handleError<any>('updateDostepnosc')));
    } else {
      const dostepnoscDocRef = doc(
        this.firestore,
        `${this.collectionName}/${id}`
      );
      return new Observable((observer) => {
        updateDoc(dostepnoscDocRef, dostepnosc)
          .then(() => {
            observer.next({ message: 'Dostepnosc updated successfully' });
            observer.complete();
          })
          .catch((error) => {
            console.error('Error updating Dostepnosc:', error);
            observer.error(error);
          });
      });
    }
  }

  deleteDostepnosc(id: string): Observable<any> {
    if (environment.isMongo) {
  
      return this.http
        .delete(`${this.apiBaseUrl}/dostepnosc/${id}`)
        .pipe(catchError(this.handleError<any>('deleteDostepnosc')));
    } else {
      const dostepnoscDocRef = doc(
        this.firestore,
        `${this.collectionName}/${id}`
      );
      return new Observable((observer) => {
        deleteDoc(dostepnoscDocRef)
          .then(() => {
            observer.next({ message: 'Dostepnosc deleted successfully' });
            observer.complete();
          })
          .catch((error) => {
            console.error('Error deleting Dostepnosc:', error);
            observer.error(error);
          });
      });
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
