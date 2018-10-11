import {Component, ComponentInterface, Element, Event, EventEmitter, Prop, State, Watch} from '@stencil/core';
import sha1 from 'crypto-js/sha1';

@Component({
  tag:      'pwned-password',
  styleUrl: 'pwned-password.css',
  shadow:   false
})
export class pwnedPassword implements ComponentInterface {
  @Element() el: HTMLElement;
  
  /**
   * Emitted when a result is received from api.pwnedpasswords.com
   */
  @Event() pwnedPasswordFound!: EventEmitter<number>;
  
  @Prop() minlength: number;
  @Prop() name: string;
  @Prop() pattern: string;
  @Prop() placeholder: string;
  
  @State() lastHash: string;
  @State() totalPwned: number;
  
  async makeRequest(password: any) {
    const data = await fetch('https://api.pwnedpasswords.com/range/' + password.substring(0, 5));
    const data_1 = await data.text();
    const results = data_1.split('\n');
    return results.map(row => ({
      suffix: row.split(':')[0],
      count:  parseInt(row.split(':')[1], 10)
    }));
  }
  
  async check(event) {
    try {
      let password = sha1(event.target.value).toString().toUpperCase();
      if (password != this.lastHash) {
        this.lastHash = password;
        let results = (await this.makeRequest(password)).filter(row => row.suffix === password.substring(5));
        this.totalPwned = (results.length > 0) ? results[0].count : 0;
      }
    } catch (e) {
    
    }
  }
  
  @Watch('totalPwned')
  emitTotal() {
    this.pwnedPasswordFound.emit(this.totalPwned);
  }
  
  hostData() {
    return {
      ['data-pwned']: this.totalPwned
    };
  }
  
  render() {
    return [
      <input
        minLength={this.minlength}
        name={this.name}
        pattern={this.pattern}
        placeholder={this.placeholder}
        required={true}
        type={'password'}
        autocomplete="current-password"
        onBlur={(e) => this.check(e)}/>];
    
  }
}
