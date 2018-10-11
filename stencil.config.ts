import { Config } from '@stencil/core';

export const config: Config = {
  namespace: 'pwned-password',
  outputTargets:[
    {
      type: 'dist'
    },
    {
      type: 'www'
    }
  ]
};
