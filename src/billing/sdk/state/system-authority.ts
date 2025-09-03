import BN from 'bn.js';

interface ISystemAuthority {
  bump: number;
  rentLamports: BN;
}

export class SystemAuthority {
  private state: ISystemAuthority;

  constructor(data: ISystemAuthority) {
    this.state = data;
  }
}
