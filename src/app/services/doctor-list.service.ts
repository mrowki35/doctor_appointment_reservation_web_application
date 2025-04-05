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
} from '@angular/fire/firestore';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { Lekarz } from '../model/lekarz.model';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { catchError, map } from 'rxjs/operators';
import { SocketService } from './socket.service';

@Injectable({
  providedIn: 'root',
})
export class DoctorListService {
  private collectionName = 'doctors'; 
  private doctorsCollection: CollectionReference<Lekarz>;
  private apiBaseUrl = environment.apiBaseUrl;

  private doctorsSubject = new BehaviorSubject<Lekarz[]>([]);
  public doctors$ = this.doctorsSubject.asObservable();

  constructor(
    private firestore: Firestore,
    private http: HttpClient,
    private socketService: SocketService
  ) {
    this.doctorsCollection = collection(
      this.firestore,
      this.collectionName
    ) as CollectionReference<Lekarz>;

    if (environment.isMongo) {
      this.initializeMongo();
    } else {
      this.initializeFirestore();
    }
  }


  private initializeFirestore() {
    const unsubscribe = onSnapshot(
      this.doctorsCollection,
      (snapshot) => {
        const doctors: Lekarz[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          doctors.push({
            id: data['id'],
            imie: data['imie'],
            nazwisko: data['nazwisko'],
            specjalizacja: data['specjalizacja'],
          });
        });
        this.doctorsSubject.next(doctors);
      },
      (error) => {
        console.error('Error fetching doctors from Firestore:', error);
      }
    );

   
  }
 private initializeMongo() {

    this.http
      .get<Lekarz[]>(`${this.apiBaseUrl}/lekarz`)
      .pipe(catchError(this.handleError<Lekarz[]>('getDoctors', [])))
      .subscribe({
        next: (data) => {
          this.doctorsSubject.next(data);
        },
        error: (error) => {
          console.error('Error fetching initial doctors data:', error);
        },
        complete: () => {
          console.log('Initial doctors data fetch completed.');
        },
      });
    this.socketService.listen<Lekarz[]>('lekarz').subscribe({
      next: (updatedDoctors) => {
        this.doctorsSubject.next(updatedDoctors);
      },
      error: (error) => {
        console.error('Error receiving real-time updates:', error);
      },
      complete: () => {
        console.log('Real-time updates stream completed.');
      },
    });
  }


  registerDoctor(doctor: Lekarz): Promise<any> {
    if (environment.isMongo) {
      return this.http.post(`${this.apiBaseUrl}/lekarz`, doctor).toPromise();
    } else {
      return addDoc(this.doctorsCollection, doctor)
        .then((docRef) => {
          console.log('Doctor registered with ID:', docRef.id);
          return docRef;
        })
        .catch((error) => {
          console.error('Error registering doctor:', error);
          throw error;
        });
    }
  }


  getDoctorById(id: string): Observable<Lekarz | null> {
    if (environment.isMongo) {
      return this.http.get<Lekarz>(`${this.apiBaseUrl}/lekarz/${id}`).pipe(
        map((doctor) => doctor || null),
        catchError(this.handleError<Lekarz | null>('getDoctorById', null))
      );
    } else {
      const doctorDocRef = doc(this.firestore, `${this.collectionName}/${id}`);
      return new Observable((observer) => {
        const unsubscribe = onSnapshot(
          doctorDocRef,
          (docSnapshot) => {
            if (docSnapshot.exists()) {
              const data = docSnapshot.data();
              const doctor: Lekarz = {
                id: docSnapshot.id,
                imie: data['imie'],
                nazwisko: data['nazwisko'],
                specjalizacja: data['specjalizacja'],
              };
              observer.next(doctor);
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


  updateDoctor(id: string, doctor: Partial<Lekarz>): Observable<any> {
    if (environment.isMongo) {
      return this.http
        .put(`${this.apiBaseUrl}/lekarz/${id}`, doctor)
        .pipe(catchError(this.handleError<any>('updateDoctor')));
    } else {
      const doctorDocRef = doc(this.firestore, `${this.collectionName}/${id}`);
      return new Observable((observer) => {
        updateDoc(doctorDocRef, doctor)
          .then(() => {
            observer.next({ message: 'Doctor updated successfully' });
            observer.complete();
          })
          .catch((error) => {
            console.error('Error updating doctor:', error);
            observer.error(error);
          });
      });
    }
  }


  deleteDoctor(id: string): Observable<any> {
    if (environment.isMongo) {
      return this.http
        .delete(`${this.apiBaseUrl}/lekarz/${id}`)
        .pipe(catchError(this.handleError<any>('deleteDoctor')));
    } else {
      const doctorDocRef = doc(this.firestore, `${this.collectionName}/${id}`);
      return new Observable((observer) => {
        deleteDoc(doctorDocRef)
          .then(() => {
            observer.next({ message: 'Doctor deleted successfully' });
            observer.complete();
          })
          .catch((error) => {
            console.error('Error deleting doctor:', error);
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

  getDoctorsStream(): Observable<Lekarz[]> {
    return this.doctors$;
  }
}
