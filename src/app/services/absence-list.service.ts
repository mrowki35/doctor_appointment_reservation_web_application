import { Injectable } from '@angular/core';
import {
  Firestore,
  addDoc,
  collection,
  onSnapshot,
  QuerySnapshot,
  DocumentData,
  DocumentReference,
  writeBatch,
  query,
  where,
  getDocs,
} from '@angular/fire/firestore';
import { Observable, BehaviorSubject, throwError, from, of } from 'rxjs';
import { Absencja } from '../model/absencja.model';
import {
  HttpClient,
  HttpErrorResponse,
  HttpParams,
} from '@angular/common/http';
import { environment } from '../../environments/environment';
import { catchError, map, tap, switchMap } from 'rxjs/operators';
import { SocketService } from './socket.service'; 

@Injectable({
  providedIn: 'root',
})
export class AbsenceListService {
  private collectionName = 'absencje'; 
  private absencjaCollection: any; 
  private apiBaseUrl = environment.apiBaseUrl;

  private absencjaSubject = new BehaviorSubject<Absencja[]>([]);
  public absencje$ = this.absencjaSubject.asObservable();

  constructor(
    private firestore: Firestore,
    private http: HttpClient,
    private socketService: SocketService
  ) {

    if (!environment.isMongo) {
      this.absencjaCollection = collection(this.firestore, this.collectionName);
    }


    if (environment.isMongo) {
      this.initializeMongo();
    } else {
      this.initializeFirestore();
    }
  }
 
  private initializeFirestore(): void {
    onSnapshot(
      this.absencjaCollection,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const absencje: Absencja[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          try {
            const absencja = new Absencja(
              data['lekarzId'],
              data['data'].toDate() 
            );
            absencja.id = doc.id; 
            absencje.push(absencja);
          } catch (error) {
            console.error(
              `Error creating Absencja from document ${doc.id}:`,
              error
            );
          }
        });
        this.absencjaSubject.next(absencje);
      },
      (error) => {
        console.error('Error fetching absencje from Firestore:', error);
      }
    );
  }

 
  private initializeMongo(): void {

    this.http
      .get<Absencja[]>(`${this.apiBaseUrl}/absencje`)
      .pipe(
        map((absencje) =>
          absencje.map((absencja) => ({
            ...absencja,
            data: new Date(absencja.data), 
          }))
        ),
        catchError(this.handleError<Absencja[]>('getAbsencje', []))
      )
      .subscribe({
        next: (data) => {
          this.absencjaSubject.next(data);
        },
        error: (error) => {
          console.error('Error fetching initial absencje data:', error);
        },
        complete: () => {
          console.log('Initial absencje data fetch completed.');
        },
      });


    this.socketService.listen<Absencja[]>('absencje').subscribe({
      next: (updatedAbsencje) => {
        const processedAbsencje = updatedAbsencje.map((absencja) => ({
          ...absencja,
          data: new Date(absencja.data),
        }));
        this.absencjaSubject.next(processedAbsencje);
      },
      error: (error) => {
        console.error('Error receiving real-time updates for absencje:', error);
      },
      complete: () => {
        console.log('Real-time updates for absencje stream completed.');
      },
    });
  }

  getAbsencesStream(): Observable<Absencja[]> {
    return this.absencje$;
  }


  addAbsence(absencja: Absencja): Observable<DocumentReference<DocumentData>> {
    if (environment.isMongo) {

      return this.http
        .post<DocumentReference<DocumentData>>(
          `${this.apiBaseUrl}/absencje`,
          absencja
        )
        .pipe(
          catchError(
            this.handleError<DocumentReference<DocumentData>>('addAbsence')
          )
        );
    } else {
      return from(
        addDoc(this.absencjaCollection, {
          lekarzId: absencja.lekarzId,
          data: absencja.data, 
        })
      ).pipe(
        tap((docRef) => {
          console.log('Absencja added successfully:', docRef.id);
        }),
        catchError(
          this.handleError<DocumentReference<DocumentData>>('addAbsence')
        )
      );
    }
  }

  absenceExists(absencja: Absencja): Observable<boolean> {
    if (environment.isMongo) {
      const params = new HttpParams()
        .set('lekarzId', absencja.lekarzId)
        .set('data', absencja.data.toISOString());

      return this.http
        .get<Absencja[]>(`${this.apiBaseUrl}/absencje`, { params })
        .pipe(
          map((absencje) => absencje.length > 0),
          catchError(this.handleError<boolean>('absenceExists', false))
        );
    } else {
      const absencjaQuery = query(
        this.absencjaCollection,
        where('lekarzId', '==', absencja.lekarzId),
        where('data', '==', absencja.data)
      );

      return from(getDocs(absencjaQuery)).pipe(
        map((querySnapshot) => !querySnapshot.empty),
        catchError(this.handleError<boolean>('absenceExists', false))
      );
    }
  }


  removeAbsence(absencja: Absencja): Observable<void> {
    if (environment.isMongo) {

      return this.http
        .delete<void>(`${this.apiBaseUrl}/absencje/${absencja.id}`)
        .pipe(catchError(this.handleError<void>('removeAbsence')));
    } else {
      const absencjaQuery = query(
        this.absencjaCollection,
        where('lekarzId', '==', absencja.lekarzId),
        where('data', '==', absencja.data)
      );

      return from(getDocs(absencjaQuery)).pipe(
        switchMap((querySnapshot) => {
          const batch = writeBatch(this.firestore);
          querySnapshot.forEach((doc) => {
            batch.delete(doc.ref);
          });
          return from(batch.commit());
        }),
        catchError(this.handleError<void>('removeAbsence'))
      );
    }
  }

  private handleError<T>(operation = 'operation', result?: T) {
    return (error: HttpErrorResponse | any): Observable<T> => {
      console.error(`${operation} failed:`, error); 
      return throwError(
        () => new Error(`${operation} failed: ${error.message || error}`)
      );
    };
  }
}
