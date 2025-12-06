export class InvitationToken {
  private constructor(private readonly _value: string) {
    if (!_value || _value.trim().length === 0) {
      throw new Error('Invitation token cannot be empty');
    }
    if (_value.length < 16) {
      throw new Error('Invitation token must be at least 16 characters');
    }
  }

  static create(value: string): InvitationToken {
    return new InvitationToken(value);
  }

  static generate(): InvitationToken {
    const token = `${Date.now()}_${Math.random().toString(36).substr(2, 16)}_${Math.random().toString(36).substr(2, 16)}`;
    return new InvitationToken(token);
  }

  get value(): string {
    return this._value;
  }

  equals(other: InvitationToken): boolean {
    return this._value === other._value;
  }
}

