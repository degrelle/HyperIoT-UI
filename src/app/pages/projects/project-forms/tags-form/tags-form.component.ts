import { Component, OnInit, Injector, ViewChild } from '@angular/core';
import { ProjectFormEntity } from '../project-form-entity';
import { I18n } from '@ngx-translate/i18n-polyfill';
import { ElementRef } from '@angular/core';
import { AssetTag, AssetstagsService } from '@hyperiot/core';
import { FormGroup } from '@angular/forms';
import { SelectOption } from '@hyperiot/components';
import { Router } from '@angular/router';
import { HytModalConfService } from 'src/app/services/hyt-modal-conf.service';

export enum TagStatus {
  Default = 0,
  Loaded = 1,
  Error = -1
}

@Component({
  selector: 'hyt-tags-form',
  templateUrl: './tags-form.component.html',
  styleUrls: ['./tags-form.component.scss']
})
export class TagsFormComponent extends ProjectFormEntity implements OnInit {

  projectId: number;

  tagStatus: TagStatus = TagStatus.Default;

  tags: AssetTag[] = [];

  allTags: AssetTag[] = [];

  // filter/sort logic

  filteredTags: AssetTag[] = [];

  filteringForm: FormGroup;

  sortOptions: SelectOption[] = [
    { value: 'none', label: 'None' },
    { value: 'alfabetic-increasing', label: 'A-Z' },
    { value: 'alfabetic-decreasing', label: 'Z-A' },
    { value: 'date-increasing', label: 'Oldest' },
    { value: 'date-decreasing', label: 'Newest' }
  ];

  valueFilter = {
    search: '',
    sort: ''
  };

  constructor(
    injector: Injector,
    @ViewChild('form', { static: true }) formView: ElementRef,
    private i18n: I18n,
    private router: Router,
    private assetsTagService: AssetstagsService,
    private modalService: HytModalConfService
  ) {
    super(injector, i18n, formView);
    this.formTitle = 'Project Tags';
    this.showSave = false;
    this.hideDelete = true;
    this.projectId = +this.router.url.split('/')[2];
  }

  ngOnInit() {
    this.filteringForm = this.formBuilder.group({});

    this.assetsTagService.findAllAssetTag().subscribe(
      (res: AssetTag[]) => {
        this.allTags = res;
        this.filteredTags = [...this.allTags];
        this.tagStatus = TagStatus.Loaded;
      },
      err => {
        this.tagStatus = TagStatus.Error;
      }
    );
  }

  tagCreated(tag: AssetTag) {
    console.log(tag)
    if (this.allTags.some(t => t.id === tag.id)) {
      this.allTags.find(t => t.id === tag.id).name = tag.name;
    } else {
      this.allTags.push(tag);
    }
    this.search();
  }

  openTagModal(tag?: AssetTag) {
    this.modalService.open('hyt-add-tag-modal', { projectId: this.projectId, tag });
  }

  delete(tag: AssetTag): void {
    this.assetsTagService.deleteAssetTag(tag.id).subscribe(
      res => {
        this.allTags = this.allTags.filter(t => t.id !== tag.id);
        this.search();
      },
      err => {
        //TODO error modal
      }
    );
  }

  // filter/sort logic

  onChangeInputSearch() {
    this.valueFilter.search = this.filteringForm.value.textFilter;
    this.search();
  }

  onChangeSelectSort() {
    this.valueFilter.sort = this.filteringForm.value.sort;
    this.sort();
  }

  search() {

    if (this.valueFilter.search && this.valueFilter.search !== '') {
      if (this.valueFilter.search.split('*').length > 18) {
        this.filteredTags = [];
      } else {
        const reg = new RegExp(this.valueFilter.search.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.+').replace(/\?/g, '.'), 'i');
        this.filteredTags = this.allTags.filter(el => (el.name.match(reg)));
        this.sort();
      }
    } else {
      this.filteredTags = [...this.allTags];
      this.sort();
    }

  }

  sort() {
    switch (this.valueFilter.sort) {

      case 'none':
        this.filteredTags.sort((a, b) => {
          if (a.id > b.id) { return -1; }
          if (a.id < b.id) { return 1; }
          return 0;
        });
        break;

      case 'alfabetic-increasing':
        this.filteredTags.sort((a, b) => {
          if (a.name.toLocaleLowerCase() < b.name.toLocaleLowerCase()) { return -1; }
          if (a.name.toLocaleLowerCase() > b.name.toLocaleLowerCase()) { return 1; }
          return 0;
        });
        break;

      case 'alfabetic-decreasing':
        this.filteredTags.sort((a, b) => {
          if (a.name.toLocaleLowerCase() > b.name.toLocaleLowerCase()) { return -1; }
          if (a.name.toLocaleLowerCase() < b.name.toLocaleLowerCase()) { return 1; }
          return 0;
        });
        break;

      case 'date-increasing':
        this.filteredTags.sort((a, b) => {
          if (a.id < b.id) { return -1; }
          if (a.id > b.id) { return 1; }
          return 0;
        });
        break;

      case 'date-decreasing':
        this.filteredTags.sort((a, b) => {
          if (a.id > b.id) { return -1; }
          if (a.id < b.id) { return 1; }
          return 0;
        });
        break;

      default:
        break;

    }
  }

}