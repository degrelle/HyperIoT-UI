import { Component, OnInit, ViewEncapsulation, HostListener } from '@angular/core';
import { ToggleSidebarService } from 'src/app/services/toggleSidebar/toggle-sidebar.service';

@Component({
  selector: 'hyt-topbar',
  templateUrl: './topbar.component.html',
  styleUrls: ['./topbar.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class TopbarComponent implements OnInit {

  public winInnerWidth: any;
  isShow : boolean = false;
  mobileBreakPoint: number = 991;

  constructor(private toggleSidebarService: ToggleSidebarService) { }

  @HostListener('window:resize', ['$event'])
  
  onResize(event) {
    
    this.winInnerWidth = event.target.innerWidth;
    
    if(this.winInnerWidth > this.mobileBreakPoint && this.isShow === true) {

      this.isShow = false;

    }

  }

  ngOnInit():void {

    this.winInnerWidth = window.innerWidth;

    if(this.winInnerWidth > this.mobileBreakPoint && this.isShow === true) {

      this.isShow = false;

    }

  }

  toggleMenu() {
    this.toggleSidebarService.changeSidebarStatus();
    this.isShow = !this.isShow;
  }

}
