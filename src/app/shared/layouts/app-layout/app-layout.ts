import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { Sidebar } from '../../components/sidebar/sidebar';

@Component({
  selector: 'app-layout',
  imports: [RouterOutlet, Sidebar],
  templateUrl: './app-layout.html',
  styleUrl: './app-layout.css',
})
export class AppLayout {}
