import { Component, Prop, Element, State } from '@stencil/core';
import sha1 from 'crypto-js/sha1';

@Component({
  tag: 'pwned-password',
  styleUrl: 'pwned-password.css',
  shadow: false
})
export class pwnedPassword {
  @Element() el: HTMLElement;
  @Prop() errorMessage: string = 'Password appeared $COUNT times in one or more data breaches.';
  @Prop() inputName: string = 'password';
  @Prop() inputPlaceholder?: string;
  @Prop() inputClass?: string;
  @Prop() inputPattern?: string;
  @Prop() inputId?: string;
  @Prop() inputMinLength?: number;
  @State() isChecking: boolean = false;
  lastHash: string;
  input: HTMLInputElement;
  form: HTMLFormElement;
  submitButton: HTMLButtonElement;
  originalOnSubmit: any;
  retrySubmit: boolean = false;

  componentDidLoad() {
    this.input = this.el.querySelector('input');
    this.form = this.input.form;
    this.submitButton = (this.form.querySelector('[type="submit"]') as HTMLButtonElement);
    this.originalOnSubmit = this.form.onsubmit;
    const self = this;
    this.form.onsubmit = (e) => {
      e.preventDefault();
      if (self.form.checkValidity() && self.isChecking == false) {
        self.form.onsubmit = self.originalOnSubmit;
        self.form.submit();
      } else if (self.isChecking) {
        setTimeout(function () {
          self.submitButton.click();
        }, 1);
      }
    }
  }

  makeRequest(password: any) {
    return fetch('https://api.pwnedpasswords.com/range/' + password.substring(0, 5))
      .then(data => data.text())
      .then(data => data.split('\n'))
      .then(results =>
        results.map(row => ({
          suffix: row.split(':')[0],
          count: parseInt(row.split(':')[1], 10),
        })),
    );
  }

  check(event) {
    let password = sha1(event.target.value).toString().toUpperCase();
    if (password != this.lastHash && this.form.checkValidity()) {
      this.lastHash = password;
      this.isChecking = true;
      this.makeRequest(password).then(results => results.filter(row => row.suffix === password.substring(5)))
        .then(results => {
          let message = (results.length > 0) ? this.errorMessage.split('$COUNT').join('' + results[0].count + '') : '';
          this.input.setCustomValidity(message);
          this.form.reportValidity();
          this.el.setAttribute('data-count', '' + ((results.length > 0) ? results[0].count : 0) + '');
          this.isChecking = false;
        }).catch(err => {
          console.error('error from haveibeenpwned.com', err);
          this.isChecking = false;
        });
    }
  }

  clear() {
    this.input.setCustomValidity('');
    this.el.removeAttribute('data-count');
  }

  render() {
    return (
      <input type="password"
        name={this.inputName}
        placeholder={this.inputPlaceholder}
        class={this.inputClass}
        id={this.inputId}
        pattern={this.inputPattern}
        minLength={this.inputMinLength}
        required
        onInput={() => this.clear()}
        onBlur={(event) => this.check(event)} />
    );
  }
}
