import { Component, OnInit } from '@angular/core';
import { DoctorListService } from '../../services/doctor-list.service';
import { CommentsListService } from '../../services/comments-list.service';
import { Lekarz } from '../../model/lekarz.model';
import { Comment } from '../../model/comment.model';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-doctor-list',
  templateUrl: './doctor-list.component.html',
  imports: [CommonModule],
  styleUrls: ['./doctor-list.component.css'],
})
export class DoctorListComponent implements OnInit {
  doctors: Lekarz[] = [];
  comments: Comment[] = [];
  user: any | null = null;

  constructor(
    private doctorService: DoctorListService,
    private commentsService: CommentsListService,
    private authService: AuthService,
    public router: Router
  ) {}

  ngOnInit(): void {

    this.doctorService.getDoctorsStream().subscribe((doctors) => {
      this.doctors = doctors;
    });


    this.commentsService.getCommentsStream().subscribe((comments) => {
      this.comments = comments;
    });


    this.authService.userData$.subscribe((userData) => {
      this.user = userData;
    });
  }

  getCommentsForDoctor(doctorId: string): Comment[] {
    return this.comments.filter((comment) => comment.lekarzId === doctorId);
  }

  viewDoctorDetails(doctorId: string): void {
    this.router.navigate(['/calendar'], { queryParams: { doctorId } });
  }
}
