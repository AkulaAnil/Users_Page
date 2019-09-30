import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SecondaryProfileComponent } from './secondaryprofile.component';

describe('SecondaryProfileComponent', () => {
  let component: SecondaryProfileComponent;
  let fixture: ComponentFixture<SecondaryProfileComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SecondaryProfileComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SecondaryProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
