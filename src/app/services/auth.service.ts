import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import {
  Auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  user as firebaseUser,
} from '@angular/fire/auth';
import {
  Firestore,
  doc,
  setDoc,
  getDoc,
  collection,
  getDocs,
  query,
  where,
} from '@angular/fire/firestore';
import { isPlatformBrowser } from '@angular/common';
import {
  BehaviorSubject,
  Observable,
  of,
  switchMap,
  map,
  tap,
  firstValueFrom,
} from 'rxjs';

import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {

  private userDataSubject = new BehaviorSubject<any>(null);
  userData$: Observable<any>;

  constructor(
    private auth: Auth,
    private firestore: Firestore,
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    if (!environment.isMongo) {

      this.userData$ = firebaseUser(this.auth).pipe(
        switchMap((user) => {
          if (user) {
            return this.getUserRole(user.email || '').pipe(
              switchMap((role) => {
                if (isPlatformBrowser(this.platformId)) {
                  const userData = { uid: user.uid, email: user.email, role };
                  localStorage.setItem('user', JSON.stringify(userData));
                }
                return of({ uid: user.uid, email: user.email, role });
              })
            );
          } else {
            if (isPlatformBrowser(this.platformId)) {
              localStorage.removeItem('user');
            }
            return of(null);
          }
        })
      );


      this.userData$.subscribe();
    } else {
      this.userData$ = this.userDataSubject.asObservable();

      if (isPlatformBrowser(this.platformId)) {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          this.userDataSubject.next(JSON.parse(storedUser));
        } else {
          this.userDataSubject.next(null);
        }
      }
    }
  }

  async registerViaFirestore(
    email: string,
    password: string,
    role: string = 'Pacjent'
  ) {
    const userCredential = await createUserWithEmailAndPassword(
      this.auth,
      email,
      password
    );
    await setDoc(doc(this.firestore, 'users', userCredential.user.uid), {
      email: email,
      role: role,
    });
    return userCredential;
  }


  loginViaFirestore(email: string, password: string) {
    return signInWithEmailAndPassword(this.auth, email, password);
  }


  registerViaApi(
    email: string,
    password: string,
    role: string = 'Pacjent'
  ): Observable<any> {
    const url = `${environment.apiBaseUrl}/register`;
    return this.http.post(url, { email, password, role }).pipe(
      tap((response: any) => {
        const userData = {
          token: response.token,
          email: response.email,
          role: response.role,
          uid: response.userId,
        };
        localStorage.setItem('user', JSON.stringify(userData));
        this.userDataSubject.next(userData);
      })
    );
  }


  loginViaApi(email: string, password: string): Observable<any> {
    const url = `${environment.apiBaseUrl}/login`;
    return this.http.post(url, { email, password }).pipe(
      tap((response: any) => {
        const userData = {
          token: response.token,
          email: response.email,
          role: response.role,
          uid: response.userId,
        };
        localStorage.setItem('user', JSON.stringify(userData));
        this.userDataSubject.next(userData);
      })
    );
  }
 
  async register(email: string, password: string) {
    if (environment.isMongo) {

      return this.registerViaApi(email, password, 'Pacjent').toPromise();
    } else {
      return this.registerViaFirestore(email, password, 'Pacjent');
    }
  }

  async registerDoctor(email: string, password: string) {
    if (environment.isMongo) {
      return this.registerViaApi(email, password, 'Lekarz').toPromise();
    } else {
      return this.registerViaFirestore(email, password, 'Lekarz');
    }
  }

  async registerAdmin(email: string, password: string) {
    if (environment.isMongo) {
      return this.registerViaApi(email, password, 'Admin').toPromise();
    } else {
      return this.registerViaFirestore(email, password, 'Admin');
    }
  }


  login(email: string, password: string): Promise<any> {
    if (environment.isMongo) {
      return firstValueFrom(this.loginViaApi(email, password));
    } else {

      return signInWithEmailAndPassword(this.auth, email, password);
    }
  }


  logout(): Promise<void> {
    if (environment.isMongo) {
      localStorage.removeItem('user');
      this.userDataSubject.next(null);
      return Promise.resolve();
    } else {
      return signOut(this.auth);
    }
  }

  isAdmin(): Observable<boolean> {
    return this.userData$.pipe(
      map((user) => {
        const isAdmin = user?.role === 'Admin';
        console.log('Is Admin:', isAdmin);
        return isAdmin;
      })
    );
  }

  getUserRole(email: string): Observable<string> {
    console.log('Fetching role for email:', email);

    const usersCollection = collection(this.firestore, 'users');
    const q = query(usersCollection, where('email', '==', email));

    return new Observable<string>((observer) => {
      getDocs(q)
        .then((snapshot) => {
          if (!snapshot.empty) {
            const docSnap = snapshot.docs[0];
            const userRole = docSnap.data()['role'];
            console.log('Fetched user from Firestore:', docSnap.data());
            console.log('Assigned role:', userRole);
            observer.next(userRole);
            observer.complete();
          } else {
            console.log(
              'No user found with email, assigning default role: Pacjent'
            );
            observer.next('Pacjent');
            observer.complete();
          }
        })
        .catch((err) => {
          console.error('Error fetching user role:', err);
          observer.next('Pacjent');
          observer.complete();
        });
    });
  }

  async setUserRole(uid: string, role: string) {
    const userDoc = doc(this.firestore, 'users', uid);
    await setDoc(userDoc, { role }, { merge: true });
  }

  getPatientReservations(uid: string): Observable<any[]> {
    const reservationsCollection = collection(this.firestore, 'reservations');
    const q = query(reservationsCollection, where('pacjentId', '==', uid));
    return new Observable<any[]>((observer) => {
      getDocs(q)
        .then((snapshot) => {
          const reservations: any[] = [];
          snapshot.forEach((doc) => {
            reservations.push({ id: doc.id, ...doc.data() });
          });
          observer.next(reservations);
          observer.complete();
        })
        .catch((err) => {
          console.error('Error fetching patient reservations:', err);
          observer.next([]);
          observer.complete();
        });
    });
  }

  getAllPatients(): Observable<any[]> {
    const usersCollection = collection(this.firestore, 'users');
    const q = query(usersCollection, where('role', '==', 'Pacjent'));
    return new Observable<any[]>((observer) => {
      getDocs(q)
        .then((snapshot) => {
          const patients: any[] = [];
          snapshot.forEach((doc) => {
            patients.push({ uid: doc.id, ...doc.data() });
          });
          observer.next(patients);
          observer.complete();
        })
        .catch((err) => {
          console.error('Error fetching patients:', err);
          observer.next([]);
          observer.complete();
        });
    });
  }
}
