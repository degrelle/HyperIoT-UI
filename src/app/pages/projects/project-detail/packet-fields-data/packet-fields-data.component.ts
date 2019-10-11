import { Component, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { FormBuilder } from '@angular/forms';

import { Subscription, Observable } from 'rxjs';

import { HpacketsService, HPacket, HPacketField } from '@hyperiot/core';
import { ProjectDetailEntity, LoadingStatusEnum } from '../project-detail-entity';

import { Option } from '@hyperiot/components';
import { Node, HytTreeViewEditableComponent } from '@hyperiot/components/lib/hyt-tree-view-editable/hyt-tree-view-editable.component';
import { PacketFieldService } from 'src/app/services/projectWizard/packet-field.service';
import { MatDialog } from '@angular/material';
import { DeleteConfirmDialogComponent } from 'src/app/components/dialogs/delete-confirm-dialog/delete-confirm-dialog.component';

@Component({
  selector: 'hyt-packet-fields-data',
  templateUrl: './packet-fields-data.component.html',
  styleUrls: ['./packet-fields-data.component.scss']
})
export class PacketFieldsDataComponent extends ProjectDetailEntity implements OnDestroy {
  @ViewChild('treeViewFields', { static: false }) treeViewFields: HytTreeViewEditableComponent;
  private routerSubscription: Subscription;
  private activatedRouteSubscription: Subscription;
  private packetId: number;

  fieldMultiplicityOptions: Option[] = Object.keys(HPacketField.MultiplicityEnum)
    .map((k) => ({ label: k, value: k }));

  fieldTypeOptions: Option[] = Object.keys(HPacketField.TypeEnum)
    .map((k) => ({ label: k, value: k }));

  packet: HPacket = {} as HPacket;
  packetList: HPacket[] = [];
  currentField: HPacketField;

  packetTree = [] as Node[];

  constructor(
    formBuilder: FormBuilder,
    @ViewChild('form', { static: true }) formView: ElementRef,
    private hPacketService: HpacketsService,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private dialog: MatDialog
  ) {
    super(formBuilder, formView);
    this.hideDelete = true;
    this.routerSubscription = this.router.events.subscribe((rl) => {
      if (rl instanceof NavigationEnd) {
        this.packetId = +(activatedRoute.snapshot.params.packetId);
        this.loadData();
      }
    });
    this.activatedRouteSubscription = this.activatedRoute.params.subscribe(routeParams => {
      this.currentField = null;
      this.packetId = +(activatedRoute.snapshot.params.packetId);
      this.loadData();
    });
  }

  ngOnDestroy() {
    this.routerSubscription.unsubscribe();
    this.activatedRouteSubscription.unsubscribe();
  }

  // ProjectDetailEntity interface
  save(successCallback, errorCallback) {
    this.savePacket(successCallback, errorCallback);
  }
  /*
  delete(successCallback, errorCallback) {
    // TODO: ....
  }
  */
  cancel() {
    this.showCancel = false;
    this.currentField = null;
  }

  // fields treeview methods

  addField(e) {
    console.log('addField', e);
    this.currentField = { parentField: e.data } as HPacketField;
    this.showCancel = true;
    this.loadFormData();
  }

  removeField(e) {
    console.log('removeField', e);
    this.openDeleteDialog(e.data.id);
  }

  editField(e) {
    this.currentField = e.data;
    this.showCancel = true;
    this.loadFormData();
  }

  cancelField(e) {
    console.log('cancelField', e);
  }

  private loadData() {
    this.hPacketService.findHPacket(this.packetId).subscribe((p: HPacket) => {
      this.packet = p;
      this.treeView().focus({ id: p.id, type: 'packet-fields' });
      this.hPacketService.findTreeFields(this.packetId).subscribe(res => {
        this.packetTree = this.createFieldsTree(res);
        if (this.treeViewFields) {
          this.treeViewFields.refresh(this.packetTree, this.packet.name);
        }
        this.resetForm();
      });
    });
  }

  private createFieldsTree(nodes: any) {
    if (nodes == null) return null;
    return nodes.map((pf: HPacketField) => ({
      data: pf,
      root: false,
      name: pf.name,
      lom: pf.multiplicity,
      type: pf.type,
      children: (pf.type === HPacketField.TypeEnum.OBJECT)
                ? this.createFieldsTree(pf.innerFields) : null
    }));
  }

  private savePacket(successCallback, errorCallback) {
    this.loadingStatus = LoadingStatusEnum.Saving;
    this.resetErrors();
    this.currentField.name = this.form.get('fieldName').value;
    this.currentField.description = this.form.get('fieldDescription').value;
    this.currentField.multiplicity = this.form.get('fieldMultiplicity').value;
    this.currentField.type = this.form.get('fieldType').value;
    let saveObservable: Observable<any>;
    if (this.currentField.id > 0) {
      saveObservable = this.hPacketService
        .updateHPacketField(this.packet.id, this.currentField);
    } else {
      saveObservable = this.hPacketService
        .addHPacketField(this.packet.id, this.currentField);
    }
    saveObservable.subscribe((res) => {
      this.currentField = null; // closes the field editing form
      this.showCancel = false;
      this.loadData(); // refresh data and treeview
      this.loadingStatus = LoadingStatusEnum.Ready;
      successCallback && successCallback(res);
    }, (err) => {
      this.setErrors(err);
      errorCallback && errorCallback(err);
    });
  }

  private loadFormData() {
    this.form.get('fieldName').setValue(this.currentField.name);
    this.form.get('fieldDescription').setValue(this.currentField.description);
    this.form.get('fieldMultiplicity').setValue(this.currentField.multiplicity);
    this.form.get('fieldType').setValue(this.currentField.type);
    this.resetForm();
  }

  private openDeleteDialog(fieldId: number) {
    const dialogRef = this.dialog.open(DeleteConfirmDialogComponent, {
      data: {title: 'Delete item?', message: 'This operation cannot be undone.'}
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result === 'delete') {
console.log('DELETE', fieldId);
        this.hPacketService.deleteHPacketField(fieldId).subscribe(
          res => {
            console.log(res)
            this.loadData();
          },
          err => {
            console.log(err)
            // TODO: report error!
          }
        );
      }
    });
  }
}