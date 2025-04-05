// harmonogram.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { Auth, onAuthStateChanged } from '@angular/fire/auth';

import { AbsenceListService } from '../../services/absence-list.service';
import { DostepnoscListService } from '../../services/dostepnosc-list.service';

import { Absencja } from '../../model/absencja.model';
import { Dostepnosc } from '../../model/dostepnosc.model';

@Component({
  selector: 'app-harmonogram',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './harmonogram.component.html',
  styleUrls: ['./harmonogram.component.css'],
})
export class HarmonogramComponent implements OnInit, OnDestroy {

  absencje: Absencja[] = [];
  dostepnosci: Dostepnosc[] = [];

  userId: string = '';


  private subscriptions: Subscription = new Subscription();

  constructor(
    private auth: Auth,
    private absenceService: AbsenceListService,
    private dostepnoscService: DostepnoscListService
  ) {}

  ngOnInit(): void {

    const authSub = onAuthStateChanged(this.auth, (user) => {
      if (user) {
        this.userId = user.uid;
        console.log('Zalogowany użytkownik ID:', this.userId);
        this.fetchAbsencje();
        this.fetchDostepnosci();
      } else {
        this.userId = '';
        console.warn('Brak zalogowanego użytkownika.');

      }
    });

    this.subscriptions.add(authSub);
  }

  ngOnDestroy(): void {

    this.subscriptions.unsubscribe();
  }

  private fetchAbsencje(): void {
    const absencjeSub = this.absenceService.getAbsencesStream().subscribe({
      next: (allAbsencje: Absencja[]) => {

        this.absencje = allAbsencje.filter(
          (absencja) => absencja.lekarzId === this.userId
        );
      },
      error: (error) => {
        console.error('Błąd podczas pobierania absencji:', error);
      },
    });

    this.subscriptions.add(absencjeSub);
  }

  private fetchDostepnosci(): void {
    const dostepnosciSub = this.dostepnoscService
      .getDostepnoscStream()
      .subscribe({
        next: (allDostepnosci: Dostepnosc[]) => {

          this.dostepnosci = allDostepnosci.filter(
            (dostepnosc) => dostepnosc.lekarzId === this.userId
          );
        },
        error: (error) => {
          console.error('Błąd podczas pobierania dostępności:', error);
        },
      });

    this.subscriptions.add(dostepnosciSub);
  }
}
