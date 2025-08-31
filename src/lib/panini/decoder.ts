export type Constraint = {
  type: 'regex' | 'token-mask' | 'grammar';
  pattern?: RegExp;
  allowedTokens?: number[];
};

export type DecoderState = {
  step: number;
  partial: string;
};

export interface ConstrainedDecoder {
  apply(state: DecoderState, constraints: Constraint[]): DecoderState;
}

export class NoopDecoder implements ConstrainedDecoder {
  apply(state: DecoderState): DecoderState { return state; }
}

