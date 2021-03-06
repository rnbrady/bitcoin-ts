/* eslint-disable functional/no-expression-statement, @typescript-eslint/no-magic-numbers */
import test from 'ava';
import { testProp } from 'ava-fast-check';
import * as fc from 'fast-check';

import {
  Bech32DecodingError,
  bech32PaddedToBin,
  binToBech32Padded,
  binToUtf8,
  BitRegroupingError,
  isBech32,
  regroupBits,
} from '../lib';

test('regroupBits', (t) => {
  t.deepEqual(
    regroupBits({ bin: [255, 255], resultWordLength: 5, sourceWordLength: 8 }),
    [31, 31, 31, 16]
  );
  t.deepEqual(
    regroupBits({ bin: [256], resultWordLength: 5, sourceWordLength: 8 }),
    BitRegroupingError.integerOutOfRange
  );
  t.deepEqual(
    regroupBits({
      bin: [31, 31, 31, 17],
      padding: false,
      resultWordLength: 8,
      sourceWordLength: 5,
    }),
    BitRegroupingError.requiresDisallowedPadding
  );
  t.deepEqual(
    regroupBits({
      bin: [0],
      padding: false,
      resultWordLength: 8,
      sourceWordLength: 5,
    }),
    BitRegroupingError.hasDisallowedPadding
  );
});

test('isBech32', (t) => {
  t.deepEqual(isBech32(''), true);
  t.deepEqual(isBech32('qq'), true);
  t.deepEqual(isBech32('qqq'), false);
  t.deepEqual(isBech32('qqqq'), true);
  t.deepEqual(isBech32('qqqqq'), true);
  t.deepEqual(isBech32('qqqqqq'), false);
  t.deepEqual(isBech32('lu'), true);
  t.deepEqual(isBech32('20'), true);
  t.deepEqual(isBech32('1u'), false);
  // cspell: disable-next-line
  t.deepEqual(isBech32('qqqsyqc'), true);
  // cspell: disable-next-line
  t.deepEqual(isBech32(':qqqsyqc'), false);
});

test('binToBech32Padded', (t) => {
  t.deepEqual(binToBech32Padded(Uint8Array.of(0)), 'qq');
  t.deepEqual(binToBech32Padded(Uint8Array.of(255)), 'lu');
  // cspell: disable-next-line
  t.deepEqual(binToBech32Padded(Uint8Array.of(0, 1, 2, 3)), 'qqqsyqc');
});

test('bech32PaddedToBin', (t) => {
  t.deepEqual(bech32PaddedToBin('qqq'), Bech32DecodingError.notBech32Padded);
  t.deepEqual(bech32PaddedToBin('qq'), Uint8Array.of(0));
  t.deepEqual(
    bech32PaddedToBin('20'),
    BitRegroupingError.requiresDisallowedPadding
  );
  t.deepEqual(bech32PaddedToBin('lu'), Uint8Array.of(255));
  // cspell: disable-next-line
  t.deepEqual(bech32PaddedToBin('qqqsyqc'), Uint8Array.of(0, 1, 2, 3));
});

const maxUint8Number = 255;
const fcUint8Array = (minLength: number, maxLength: number) =>
  fc
    .array(fc.integer(0, maxUint8Number), minLength, maxLength)
    .map((a) => Uint8Array.from(a));
const maxBinLength = 100;

testProp(
  '[fast-check] bech32PaddedToBin <-> binToBech32Padded',
  [fcUint8Array(0, maxBinLength)],
  (input) =>
    binToBech32Padded(
      bech32PaddedToBin(binToBech32Padded(input)) as Uint8Array
    ) === binToBech32Padded(input)
);

testProp(
  '[fast-check] binToBech32Padded -> isBech32',
  [fcUint8Array(0, maxBinLength)],
  (input) => isBech32(binToBech32Padded(input))
);

testProp(
  '[fast-check] isBech32: matches round trip results',
  [fcUint8Array(0, maxBinLength)],
  (input) => {
    const maybeBech32 = binToUtf8(input);
    const tryBin = bech32PaddedToBin(maybeBech32);
    const skip = true;
    return typeof tryBin === 'string'
      ? skip
      : binToBech32Padded(tryBin) === maybeBech32;
  }
);
