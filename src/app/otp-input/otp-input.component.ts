import { Component, ElementRef, Input, QueryList, ViewChildren, isDevMode } from '@angular/core';
import { AbstractControl, ControlValueAccessor, FormArray, FormControl, NG_VALIDATORS, NG_VALUE_ACCESSOR, ValidationErrors } from '@angular/forms';

function getFormArray(size:number):FormArray{
  const arr =[];
  for (let i = 0; i < size; i++) {
    arr.push( new FormControl(''));
  }
  return new FormArray(arr);
}

@Component({
  selector: 'app-otp-input',
  templateUrl: './otp-input.component.html',
  styleUrls: ['./otp-input.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: OtpInputComponent,
      multi: true,
    },
      {
        provide: NG_VALIDATORS,
        useExisting: OtpInputComponent,
        multi: true,
      },
  ],
})
export class OtpInputComponent implements ControlValueAccessor {

  @Input() set size(size:number){
    this.inputs = getFormArray(size);
    this.#size = size;

  }

  @ViewChildren('inputEl') inputEls!: QueryList<ElementRef<HTMLInputElement>>;
  #scheduledFocus:number | null = null;
  #size= 4;
  inputs = getFormArray(this.#size);
  onChange?: (value: string) => void;
  onTouched ?: () => void;

  
  writeValue(value: string): void {
    if (isDevMode() && value?.length) {
      throw new Error('Otp input is not supposed to be prefilled with data');
    }
  
    // Reset all input values
    this.inputs.setValue(new Array(this.#size).fill(''));
  }
  registerOnChange(fn: any): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }
  setDisabledState?(isDisabled: boolean): void {
    if (isDisabled) {
      this.inputs.disable();
    } else {
      this.inputs.enable();
    }
  }
  handleInput(){
    console.log('input function call');
    this.#updateWiredValue();
    if(this.#scheduledFocus !== null){
     this.#focusInput(this.#scheduledFocus);
     this.#scheduledFocus = null;
    }
  }

  handleKeyPress(e: KeyboardEvent, idx: number) {
    console.log('keypress call');
    const isDigit = /\d/.test(e.key);
    // Safari fires Cmd + V through keyPress event as well
    // so we need to handle it here and let it through
    if (e.key === 'v' && e.metaKey) return true;


    //if user inputs digit  & we are not on the last input we want to 
    //advance the focus
    if (isDigit && idx + 1 < this.#size) this.#scheduledFocus = idx + 1;

    //if users deseelcts an input that already has a value we should clear
    // it so that it does not have more than one value
    if (isDigit && this.inputs.controls[idx].value) this.inputs.controls[idx].setValue('');
    console.log('keypress scheduled focus',this.#scheduledFocus);
    return isDigit;
  }
  handleKeyDown(e:KeyboardEvent ,idx:number){
    if(e.key === 'Backspace' || e.key === 'Delete'){
      if(idx > 0) this.#scheduledFocus = idx - 1
    }
  }
  handleFocus(e:FocusEvent){
    //select previously entered value to replace with new input.
     (e.target as HTMLInputElement).select();
  }

  handlePaste(e: ClipboardEvent, idx: number) {
    e.preventDefault();

    if (idx !== 0) {
      // If the target input is not the first one - ignore
      return;
    }

    const pasteData = e.clipboardData?.getData('text');
    const regex = new RegExp(`\\d{${this.#size}}`);

    if (!pasteData || !regex.test(pasteData)) {
      // If there is nothing to be pasted or the pasted data does not
      // comply with the required format - ignore the event
      return;
    }

    for (let i = 0; i < pasteData.length; i++) {
      this.inputs.controls[i].setValue(pasteData[i]);
    }

    this.#focusInput(this.inputEls.length - 1);
    this.#updateWiredValue();
    // this.onTouched();
  }

  #focusInput(idx: number) {
   setTimeout(()=>{ this.inputEls.get(idx)?.nativeElement.focus()})
  }
  #updateWiredValue() {
    setTimeout(()=>{this.onChange?.(this.inputs.value.join(''))});
  }
  validate(control: AbstractControl<string, string>): ValidationErrors | null {
    if (!control.value || control.value.length < this.#size) {
      return {
        otpInput: 'Value is incorrect',
      };
    }
  
    return null;
  }
 
 
 
}
