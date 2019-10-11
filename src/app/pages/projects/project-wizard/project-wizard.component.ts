import { Component, OnInit, ViewChild, Injectable } from '@angular/core';
import { HProject, HDevice, HPacket, Rule } from '@hyperiot/core';
import { Router, CanDeactivate } from '@angular/router';
import { Subject } from 'rxjs';
import { ProjectWizardService } from 'src/app/services/projectWizard/project-wizard.service';

@Injectable({
  providedIn: 'root',
})
export class ProjectWizardCanDeactivate implements CanDeactivate<ProjectWizardComponent>{
  canDeactivate(com: ProjectWizardComponent) {
    if (com.hProject == null || com.finishOpen)
      return true;
    else {
      com.deactivateModal = true;
      return com.canDeactivate$;
    }
  }
}

@Component({
  selector: 'hyt-project-wizard',
  templateUrl: './project-wizard.component.html',
  styleUrls: ['./project-wizard.component.scss']
})
export class ProjectWizardComponent implements OnInit {

  @ViewChild('stepper', { static: false }) stepper;

  hProject: HProject;
  // hDevices: HDevice[] = [];
  hPackets: HPacket[] = [];
  rules: Rule[] = [];
  events: Rule[] = [];

  projectValidated: boolean = false;
  devicesValidated: boolean = false;
  packetsValidated: boolean = false;
  fieldsValidated: boolean = false;
  enrichmentValidated: boolean = false;
  statisticsValidated: boolean = false;
  eventsValidated: boolean = false;

  ovpOpen: boolean = false;
  finishOpen: boolean = false;

  constructor(
    private router: Router,
    private wizardService: ProjectWizardService
  ) { }

  ngOnInit() {
    this.wizardService.hDevices$.subscribe(
      (res: HDevice[]) => {
        if (res && res.length != 0)
          this.devicesValidated = true;
        else
          this.devicesValidated = false;
      }
    );
    this.wizardService.hPackets$.subscribe(
      (res: HPacket[]) => {
        if (res && res.length != 0){
          this.packetsValidated = true;
          this.fieldsValidated = true;
        }
        else{
          this.packetsValidated = false;
          this.fieldsValidated = false;
        }
      }
    );
  }

  updateProject(proj: HProject) {
    if (proj) {
      this.hProject = proj;
      this.projectValidated = true;
    }
    setTimeout(() => {
      this.stepper.next();
    }, 0);
  }

  openOptionModal() {
    this.ovpOpen = true;
    this.enrichmentValidated = true;
    this.statisticsValidated = true;
    this.eventsValidated = true;
  }

  closeOptionModal() {
    this.ovpOpen = false;
  }

  openFinishModal() {
    this.ovpOpen = false;
    this.finishOpen = true;
  }

  closeFinishModal() {
    this.finishOpen = false;
  }

  goToStepByIndex(index: number) {
    this.stepper.changeStep(index);
    this.closeOptionModal();
  }

  goToDashboard() {
    this.router.navigate(['/dashboards']);
  }

  goToProjectWizard() {
    this.router.navigate(['/projects']);
  }

  stepChanged(event) {
    this.wizardService.stepChanged(event.selectedIndex);
  }

  //Deactivation logic

  canDeactivate$: Subject<boolean> = new Subject<boolean>();

  deactivateModal: boolean = false;

  deactivate(cd: boolean): void {
    this.deactivateModal = false;
    this.canDeactivate$.next(cd);
  }

}
