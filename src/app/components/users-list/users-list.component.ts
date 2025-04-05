// src/app/components/users-list/users-list.component.ts

import { Component, OnInit } from '@angular/core';
import { BannedUsersService } from '../../services/banned-users.service';
import { User } from '../../model/user.model';
import { Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-users-list',
  templateUrl: './users-list.component.html',
  styleUrls: ['./users-list.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule],
})
export class UsersListComponent implements OnInit {
  users$!: Observable<User[]>;
  bannedUsers$!: Observable<User[]>;
  combinedUsers$!: Observable<{ user: User; isBanned: boolean }[]>;
  emailToBan: string = ''; 
  emailToUnban: string = ''; 

  constructor(private bannedUsersService: BannedUsersService) {}

  ngOnInit(): void {

    this.users$ = this.bannedUsersService
      .getUsersStream()
      .pipe(map((users) => users.filter((user) => user.role !== 'Admin')));

    this.bannedUsers$ = this.bannedUsersService
      .getBannedUsersStream()
      .pipe(map((users) => users.filter((user) => user.role !== 'Admin')));


    this.combinedUsers$ = combineLatest([this.users$, this.bannedUsers$]).pipe(
      map(([users, bannedUsers]) => {
        const bannedEmails = new Set(bannedUsers.map((u) => u.email));
        return users
          .filter((user) => user.role !== 'Admin') 
          .map((user) => ({
            user,
            isBanned: bannedEmails.has(user.email),
          }));
      })
    );
  }


  async banUser() {
    if (!this.emailToBan) return;

    const confirmBan = confirm(
      `Are you sure you want to ban the user with email: ${this.emailToBan}?`
    );
    if (!confirmBan) return;

    try {
      await this.bannedUsersService.banUser(this.emailToBan);
      alert(`User with email ${this.emailToBan} has been banned.`);
      this.emailToBan = ''; 
    } catch (error) {
      alert(`Failed to ban user: `);
    }
  }


  async unbanUserManual() {
    if (!this.emailToUnban) return;

    const confirmUnban = confirm(
      `Are you sure you want to unban the user with email: ${this.emailToUnban}?`
    );
    if (!confirmUnban) return;

    try {
      await this.bannedUsersService.unbanUser(this.emailToUnban);
      alert(`User with email ${this.emailToUnban} has been unbanned.`);
      this.emailToUnban = ''; 
    } catch (error) {
      alert(`Failed to unban user: `);
    }
  }


  async unbanUserFromTable(email: string) {
    const confirmUnban = confirm(
      `Are you sure you want to unban the user with email: ${email}?`
    );
    if (!confirmUnban) return;

    try {
      await this.bannedUsersService.unbanUser(email);
      alert(`User with email ${email} has been unbanned.`);

    } catch (error) {
      alert(`Failed to unban user: `);
    }
  }
}
