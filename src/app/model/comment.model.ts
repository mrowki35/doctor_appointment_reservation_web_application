import { user } from '@angular/fire/auth';
import { Timestamp } from 'firebase/firestore';

export class Comment {
  id: string;
  reservationId: string;
  lekarzId: string;
  content: string;
  date: Timestamp;
  rate: number;
  userId: string;
  constructor(
    id: string,
    reservationId: string,
    lekarzId: string,
    content: string,
    date: Timestamp,
    rate: number,
    userId: string
  ) {
    this.id = id;
    this.reservationId = reservationId;
    this.lekarzId = lekarzId;
    this.content = content;
    this.date = date;
    this.rate = rate;
    this.userId = userId;
  }
}
