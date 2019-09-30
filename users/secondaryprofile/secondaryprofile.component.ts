import { Component, OnInit, Inject, ChangeDetectorRef } from '@angular/core';
import { FormGroup, FormBuilder, Validators, AbstractControl } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material';
import { Floor, IGetUser, ISPDoctor, ISPDepartment, ISPLevel, IUserResponse, ISPProfile, ISPCreate } from '../_model/IUsers';
import { UsersService } from '../_service/users.service';
import { ActionType, AlertMessageService } from '../../_services/alertMessageService';
import { TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';
import * as _ from 'lodash';
import { IUserUpdateDto, ITokenInfo, AppConfig } from '../../_helpers/app.config';

import { Validator, ValidatorFn} from '@angular/forms';

@Component({
  selector: 'app-secondaryprofile',
  templateUrl: './secondaryprofile.component.html',
  styleUrls: ['./secondaryprofile.component.scss']
})
export class SecondaryProfileComponent implements OnInit {

  usersForm: FormGroup;
  totalLevels: ISPLevel[] = [];
  doctorsList: ISPDoctor[] = [];
  newDoctorsList: ISPDoctor[] = [];
  totalDoctors: ISPDoctor[] = [];
  totalDepartements: ISPDepartment[] = [];
  _doctorAction = false;
  filterFloorGroup = [];
  filterDeptGroup = [];
  loading: boolean = true;
  _editProfile: ISPProfile[] = [];
  _tokenInfo: IUserUpdateDto;
  floorName: string = '';
  doctorName: string = '';
  deptName: string = '';
  buildName: string = '';
  totalname;

  constructor(public dialogRef: MatDialogRef<SecondaryProfileComponent>, @Inject(MAT_DIALOG_DATA) public userdata: IGetUser, private alertMessage: AlertMessageService, private router: Router, private translate: TranslateService, private fb: FormBuilder,
    private profileService: UsersService, private appconfig: AppConfig, private cdref: ChangeDetectorRef) {
    let tokenData = this.appconfig.getTokenInfo() as ITokenInfo;
    if (tokenData)
      this._tokenInfo = tokenData.tokenSub;

    if (!(this._tokenInfo && tokenData))
      this.router.navigate(['401']);

  }

  ngOnInit() {
    this.usersForm = this.fb.group({
      department: [null],
      level: [null,],
      doctor: [null],
    });
    if (this._tokenInfo)
      this.getProfileByNurse();
  }
  getProfileByNurse() {
    this.loading = true;
    console.log('getProfileByNurse_Request=>', this.userdata.userId);
    this.profileService.getProfileByNurse(this.userdata.userId).subscribe((response: ISPProfile[]) => {
      console.log('getProfileByNurse_Response=>', response);
      if (response) {
        this._editProfile = response;
        if (this._editProfile.length == 0) {
          this.usersForm.get('level').setValidators(Validators.required);
          this.usersForm.get('level').updateValueAndValidity();
        }

        this.getFloorsWithDeptsAndDoctorsByFacilitateId();
      } else {
        this.loading = false;
        this._editProfile = [];
      }

    }, error => {
      let message = error.error.messages as string
      let errorMessage = error.status == 404 ? this.translate.instant('ActionNames.errorResponse') : message ? message : error.message;
      console.log("Failed :: ", JSON.stringify(error));
      this.showAlert(errorMessage, ActionType.ERROR, error.status);
      this.loading = false;
    });
  }

  getFloorsWithDeptsAndDoctorsByFacilitateId() {
    this.loading = true;
    console.log("getFloorsWithDeptsAndDoctorsByFacilitateId_Request=>");

    this.profileService.getFloorsWithDeptsAndDoctorsByFacilitateId().subscribe((result: ISPLevel[]) => {
      console.log("getFloorsWithDeptsAndDoctorsByFacilitateId_Response=>", result);
      if (result.length != 0) {
        this.totalLevels = result.filter(x => x.buildId != 0);

        console.log("totalLevels=>", this.totalLevels);


        this.totalLevels.forEach(levelObj => {
          levelObj.departments.forEach(deptObj => {
            deptObj.doctors.forEach(dObj => {
              dObj.buildId = levelObj.buildId;
              dObj.floorId = levelObj.floorId;
              dObj.floorName = levelObj.floorName;
              dObj.deptId = deptObj.deptId;
              dObj.deptName = deptObj.deptName;
              dObj.drId = dObj.userId;
              dObj.nurseId = this.userdata.userId;
            });
            deptObj.floorName = levelObj.floorName;
          });
        });
        console.log("totalLevels after iteration=>", this.totalLevels);

        if (this._editProfile.length > 0) {
          let selFloors = this.totalLevels.filter(x => this._editProfile.findIndex(y => y.floorId == x.floorId) != -1);

          this.usersForm.get('level').setValue(selFloors.length > 0 ? selFloors : null);
          console.log('selFloors=>', selFloors);
          this.levelSelection(selFloors, false);
        }
      }
      else {
        this.totalLevels = [];
        this.alertMessage.showAlert(this.translate.instant('usersModule.createSecondaryProfile.noDataLevelError'), ActionType.FAILED);
      }
      this.loading = false;
    }, err => {
      this.totalLevels = [];
      let message = err.error.messages as string
      let errorMessage = err.status == 404 ? this.translate.instant('ActionNames.errorResponse') : message ? message : err.message;
      console.log("Failed :: ", JSON.stringify(err));
      this.showAlert(errorMessage, ActionType.ERROR, err.status);
      this.loading = false;
    });
  }
  levelSelection(floors: any, action?: boolean) {
    console.log('sel floors=>', floors);
    this.totalDepartements = [];
    this.filterFloorGroup = [];
    this.filterDeptGroup = [];

    if (floors.length > 0) {
      this.usersForm.get('department').setValidators(Validators.required);
      this.usersForm.get('department').updateValueAndValidity();

      this.usersForm.get('doctor').setValidators(Validators.required);
      this.usersForm.get('doctor').updateValueAndValidity();


      this.filterFloorGroup = this.totalLevels.filter(x => floors.findIndex(y => y.floorId == x.floorId) != -1);
      console.log('filterFloorGroup=>', this.filterFloorGroup);
      this.buildName = ''
      this.buildName = floors[0].buildName;

      this.floorName = ''
      this.floorName = floors[0].floorName;
      floors.forEach(element => {
        let arr = this.totalLevels.filter(x => x.floorId == element.floorId)[0].departments;
        this.totalDepartements = _.concat(this.totalDepartements, arr);
      });
      console.log('this.totalDepartements=>', this.totalDepartements);
      console.log('this.usersForm.value.department=>', this.usersForm.value.department);

      if (this.usersForm.value.department) {
        let selDepts = this.usersForm.value.department;
        selDepts = this.totalDepartements.filter(x => selDepts.findIndex(y => y.deptId == x.deptId) != -1);
        if (selDepts.length > 0) {
          this.usersForm.get('department').setValue(selDepts);
          this.selectDepartMent(selDepts, false);
        } else {
          this.usersForm.get('department').setValue(null);
          this.usersForm.get('doctor').setValue(null);
        }

      } else if (this._editProfile.length > 0) {
        let selDepts = this.totalDepartements.filter(x => this._editProfile.findIndex(y => y.deptId == x.deptId) != -1);

        if (selDepts.length > 0) {
          this.usersForm.get('department').setValue(selDepts);
          this.selectDepartMent(this.usersForm.value.department, false);
        } else
          this.usersForm.get('department').setValue(null);

      }

    } else {
      this.usersForm.get('level').setValue(null);
      this.usersForm.get('department').setValue(null);
      this.usersForm.get('doctor').setValue(null);
      this.usersForm.get('department').clearValidators();
      this.usersForm.get('doctor').clearValidators();
      this.usersForm.get('department').updateValueAndValidity();
      this.usersForm.get('doctor').updateValueAndValidity();
      this.doctorsList = [];
      this.filterFloorGroup = [];
      this.filterDeptGroup = [];
    }
  }
  selectDepartMent(depts: any, action: boolean) {
    console.log('depts=>', depts);

    this.doctorsList = [];

    if (depts.length > 0) {
      this.usersForm.get('doctor').setValidators(Validators.required);
      this.usersForm.get('doctor').updateValueAndValidity();
      console.log('this.totalDepartements=>', this.totalDepartements);


      this.filterDeptGroup = this.totalDepartements.filter(x => depts.findIndex(y => y == x) != -1);
      console.log('filterDeptGroup=>', this.filterDeptGroup);
      this.deptName = depts[0].deptName;
      console.log("deptName=>", this.deptName)

      depts.forEach(element => {
        let arr = this.totalDepartements.filter(x => x == element)[0].doctors;
        this.doctorsList = _.concat(this.doctorsList, arr);
      });
      console.log('doctorsList=>', this.doctorsList);

      if (this.usersForm.value.doctor) {
        let doctors: ISPDoctor[] = this.usersForm.value.doctor;
        doctors = doctors.filter(x => this.doctorsList.findIndex(y => y == x) != -1);
        this.usersForm.get('doctor').setValue(doctors.length > 0 ? doctors : null);
        if (doctors.length > 0) {
          let firstname = doctors[0].firstname;
          let lastname = doctors[0].lastname;
          let totalname = firstname.concat(lastname);
          console.log("totalname=>", totalname);

          this.doctorName = totalname;
        }
      } else if (this._editProfile.length > 0) {

        console.log('_editProfile=>', this._editProfile);

        let selDoctors = this.doctorsList.filter(x => this._editProfile.findIndex(y => y.drId == x.drId && y.deptId == x.deptId) != -1);
        this.usersForm.get('doctor').setValue(selDoctors.length > 0 ? selDoctors : null);
        if (selDoctors.length > 0) {
          let firstname = selDoctors[0].firstname;
          let lastname = selDoctors[0].lastname;
          let totalname = firstname.concat(lastname);
          this.doctorName = totalname;
          console.log("selDoctors_totalName=>", totalname);

        }
      }
    } else {
      this.usersForm.get('department').setValue(null);
      this.usersForm.get('doctor').setValue(null);
      this.usersForm.get('doctor').clearValidators();
      this.usersForm.get('doctor').updateValueAndValidity();
      this.filterDeptGroup = [];
      this.doctorsList = [];
    }
  }
  selectedDoctor(doctors) {

    if (doctors) {
      let doctorselected: ISPDoctor[] = [];
      doctorselected = this.usersForm.value.doctor;
      if (doctorselected.length > 0) {
        console.log("doctorname=>", doctorselected)
        let firstname = doctorselected[0].firstname
        let lastname = doctorselected[0].lastname
        this.totalname = firstname.concat(lastname)
        console.log("selectedDoctortotalName", this.totalname);

        this.doctorName = this.totalname;
      }
      console.log('this.doctorName=>', this.doctorName);
    }
    else {
      this.doctorsList = [];
    }
  }
  createSecondaryProfile() {
    this.loading = true;
    console.log('result=>', this.usersForm.value);
    let reqData = {
      nurseId: this.userdata.userId,
      profileInfo: this.usersForm.value.doctor != null ? _.map(this.usersForm.value.doctor, res => _.pick(res, ["buildId", "deptId", "drId", "floorId", "nurseId"])) : []//this.usersForm.value.doctor
    } as ISPCreate;
    console.log('createSecondaryProfile_Request=>', reqData);

    this.profileService.createSecondaryProfile(reqData).subscribe((response: IUserResponse) => {
      console.log('createSecondaryProfile_Response=>', response);
      if (response) {
        this.alertMessage.showAlert(response.messages, ActionType.SUCCESS);
        this.dialogRef.close();
      } else {
        this.alertMessage.showAlert(response.messages, ActionType.FAILED);
      }
      this.loading = false;
    }, error => {
      let message = error.error.messages as string
      let errorMessage = error.status == 404 ? this.translate.instant('ActionNames.errorResponse') : message ? message : error.message;
      console.log("Failed :: ", JSON.stringify(error));
      this.showAlert(errorMessage, ActionType.ERROR, error.status);
      this.loading = false;
    });
  }
  showAlert(error: any, action: ActionType, status: number = 0) {
    if (status == 401)
      this.router.navigate(['401']);
    else setTimeout(() => this.alertMessage.showAlert(error, action));
  }
 
  ngAfterViewInit() {
    this.cdref.detectChanges();
  }

  isRequiredField(field: string) {
    const form_field = this.usersForm.get(field);
    console.log("form_field ==>", form_field);
    if (!form_field.validator) {
      return false;
    }
    const validator = form_field.validator({} as AbstractControl);
    console.log("Validator ==>", validator);
    return (validator && validator.required);
  }


}

