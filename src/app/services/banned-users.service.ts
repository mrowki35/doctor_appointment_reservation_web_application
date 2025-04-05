import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  getDocs,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';

import { User } from '../model/user.model'; 

@Injectable({
  providedIn: 'root',
})
export class BannedUsersService {
  private collectionName = 'users';
  private bannedUsersCollectionName = 'bannedusers';

  constructor(private firestore: Firestore) {}

  getUsersStream(): Observable<User[]> {
    const userCollection = collection(this.firestore, this.collectionName);

    return new Observable((observer) => {
      const unsubscribe = onSnapshot(userCollection, (snapshot) => {
        const users: User[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          const user = new User(data['email'], data['role']);
          users.push(user);
        });
        observer.next(users);
      });


      return () => unsubscribe();
    });
  }

  getBannedUsersStream(): Observable<User[]> {
    const bannedCollection = collection(
      this.firestore,
      this.bannedUsersCollectionName
    );

    return new Observable((observer) => {
      const unsubscribe = onSnapshot(bannedCollection, (snapshot) => {
        const users: User[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          const user = new User(data['email'], data['role']);
          users.push(user);
        });
        observer.next(users);
      });


      return () => unsubscribe();
    });
  }

  async banUser(email: string): Promise<void> {
    try {

      const usersCollection = collection(this.firestore, this.collectionName);

      const q = query(usersCollection, where('email', '==', email));

      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        throw new Error(`No user found with email: ${email}`);
      }

      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data() as User;

      await deleteDoc(doc(this.firestore, this.collectionName, userDoc.id));

      const bannedUsersCollection = collection(
        this.firestore,
        this.bannedUsersCollectionName
      );

      await setDoc(doc(bannedUsersCollection, userDoc.id), {
        email: userData.email,
        role: userData.role,
      });

      console.log(`User with email ${email} has been banned.`);
    } catch (error) {
      console.error('Error banning user:', error);
      throw error; 
    }
  }


  async unbanUser(email: string): Promise<void> {
    try {
      const bannedUsersCollection = collection(
        this.firestore,
        this.bannedUsersCollectionName
      );

      const q = query(bannedUsersCollection, where('email', '==', email));

      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        throw new Error(`No banned user found with email: ${email}`);
      }

      const bannedUserDoc = querySnapshot.docs[0];
      const userData = bannedUserDoc.data() as User;

      await deleteDoc(
        doc(this.firestore, this.bannedUsersCollectionName, bannedUserDoc.id)
      );

      const usersCollection = collection(this.firestore, this.collectionName);

      await setDoc(doc(usersCollection, bannedUserDoc.id), {
        email: userData.email,
        role: userData.role,
      });

      console.log(`User with email ${email} has been unbanned.`);
    } catch (error) {
      console.error('Error unbanning user:', error);
      throw error; 
    }
  }
}
