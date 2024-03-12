import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogLoaderComponent } from './dialog-loader.component';

describe('DialogLoaderComponent', () => {
  let component: DialogLoaderComponent;
  let fixture: ComponentFixture<DialogLoaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DialogLoaderComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(DialogLoaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
