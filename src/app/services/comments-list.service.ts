// comments-list.service.ts
import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  CollectionReference,
  onSnapshot,
  addDoc,
  setDoc,
  deleteDoc,
  doc,
  QuerySnapshot,
  DocumentData,
  getDocs,
  query,
  where,
  writeBatch,
  DocumentReference,
} from '@angular/fire/firestore';
import { Observable, throwError, BehaviorSubject, from } from 'rxjs';
import { Comment } from '../model/comment.model';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { catchError, map, tap } from 'rxjs/operators';
import { SocketService } from './socket.service';

@Injectable({
  providedIn: 'root',
})
export class CommentsListService {
  private collectionName = 'comments'; 
  private commentsCollection: CollectionReference<Comment>;
  private apiBaseUrl = environment.apiBaseUrl;

  private commentsSubject = new BehaviorSubject<Comment[]>([]);
  public comments$ = this.commentsSubject.asObservable();

  constructor(
    private firestore: Firestore,
    private http: HttpClient,
    private socketService: SocketService
  ) {
    this.commentsCollection = collection(
      this.firestore,
      this.collectionName
    ) as CollectionReference<Comment>;

    if (environment.isMongo) {
      this.initializeMongo();
    } else {
      this.initializeFirestore();
    }
  }


  private initializeFirestore() {
    onSnapshot(
      this.commentsCollection,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const comments: Comment[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          try {
            const comment = new Comment(
              data['id'],
              data['reservationId'],
              data['lekarzId'],
              data['content'],
              data['date'], 
              data['rate'],
              data['userId']
            );

            comments.push(comment);
          } catch (error) {
            console.error(
              `Error creating Comment from document ${doc.id}:`,
              error
            );
          }
        });
        this.commentsSubject.next(comments);
      },
      (error) => {
        console.error('Error fetching comments from Firestore:', error);
      }
    );

  }


  private initializeMongo() {
    this.http
      .get<Comment[]>(`${this.apiBaseUrl}/comments`)
      .pipe(catchError(this.handleError<Comment[]>('getComments', [])))
      .subscribe({
        next: (data) => {
          this.commentsSubject.next(data);
        },
        error: (error) => {
          console.error('Error fetching initial comments data:', error);
        },
        complete: () => {
          console.log('Initial comments data fetch completed.');
        },
      });

    this.socketService.listen<Comment[]>('comments').subscribe({
      next: (updatedComments) => {
        this.commentsSubject.next(updatedComments);
      },
      error: (error) => {
        console.error('Error receiving real-time updates for comments:', error);
      },
      complete: () => {
        console.log('Real-time updates for comments stream completed.');
      },
    });
  }


  getCommentsStream(): Observable<Comment[]> {
    return this.comments$;
  }


  addComment(
    comment: Comment
  ): Observable<any> | Observable<DocumentReference<DocumentData>> {
    if (environment.isMongo) {

      return this.http
        .post(`${this.apiBaseUrl}/comments`, comment)
        .pipe(catchError(this.handleError<any>('addComment')));
    } else {
      const commentDocRef = doc(
        this.firestore,
        this.collectionName,
        comment.id
      );
      return from(
        setDoc(commentDocRef, {
          id: comment.id,
          reservationId: comment.reservationId,
          lekarzId: comment.lekarzId,
          content: comment.content,
          date: comment.date, 
          rate: comment.rate,
          userId: comment.userId,
        })
      ).pipe(
        tap(() => {
          console.log('Comment added successfully:', comment.id);
        }),
        catchError(
          this.handleError<DocumentReference<DocumentData>>('addComment')
        )
      );
    }
  }


  removeComment(commentId: string): Observable<void> {
    if (environment.isMongo) {
      return this.http
        .delete(`${this.apiBaseUrl}/comments/${commentId}`)
        .pipe(catchError(this.handleError<any>('removeComment')));
    } else {
      const commentDoc = doc(
        this.firestore,
        `${this.collectionName}/${commentId}`
      );
      return new Observable<void>((observer) => {
        deleteDoc(commentDoc)
          .then(() => {
            console.log('Comment removed successfully:', commentId);
            observer.next();
            observer.complete();
          })
          .catch((error) => {
            console.error('Error removing comment:', error);
            observer.error(error);
          });
      }).pipe(catchError(this.handleError<any>('removeComment')));
    }
  }

  getAllComments(): Observable<Comment[]> {
    return this.getCommentsStream();
  }

  deleteComment(commentId: string): Observable<void> {
    return this.removeComment(commentId);
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
