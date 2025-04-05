// admin.component.ts
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Configuration } from '../../model/configuration.model'; 


@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css'],
})
export class AdminComponent implements OnInit {

  configuration: Configuration = {
    loginPersistence: 'LOCAL', 
    database: 'FIREBASE',
  };


  persistenceOptions: Array<{
    label: string;
    value: 'LOCAL' | 'SESSION' | 'NONE';
  }> = [
    { label: 'Local (Default)', value: 'LOCAL' },
    { label: 'Session', value: 'SESSION' },
    { label: 'None', value: 'NONE' },
  ];

  databaseOptions: Array<{ label: string; value: 'FIREBASE' | 'MONGODB' }> = [
    { label: 'Firebase', value: 'FIREBASE' },
    { label: 'MongoDB', value: 'MONGODB' },
  ];



  ngOnInit(): void {

    /* this.configService.getConfiguration().subscribe(
      (config: Configuration) => {
        if (config) {
          this.configuration = config;
        }
      },
      (error: any) => {
        console.error('Error fetching configuration:', error);
      }
    );
    */
  }


  updateConfiguration(): void {
    /* this.configService.updateConfiguration(this.configuration).subscribe(
      (response: any) => {
        alert('Configuration updated successfully!');
      },
      (error: any) => {
        console.error('Error updating configuration:', error);
        alert('Failed to update configuration. Please try again.');
      }
    );
    */
  }
}
