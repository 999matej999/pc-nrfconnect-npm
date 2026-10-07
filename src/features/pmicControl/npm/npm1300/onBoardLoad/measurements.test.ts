/*
 * Copyright (c) 2026 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import { parseOnBoardLoadMeasurements } from './getters';

describe('On-board load measurement parser', () => {
    test('parses measured current, voltage, and temperature', () => {
        expect(
            parseOnBoardLoadMeasurements(
                'tload=33.687500 C\niload=99.300000 mA\nvload=3.740190 V',
            ),
        ).toStrictEqual({
            tLoad: 33.6875,
            iLoad: 99.3,
            vLoad: 3.74019,
        });
    });

    test('accepts fields in a different order', () => {
        expect(
            parseOnBoardLoadMeasurements(
                'vload=3.74 V, iload=99.3 mA, tload=33.6 C',
            ),
        ).toStrictEqual({
            tLoad: 33.6,
            iLoad: 99.3,
            vLoad: 3.74,
        });
    });

    test('rejects incomplete measurement responses', () => {
        expect(() =>
            parseOnBoardLoadMeasurements('iload=99.3 mA vload=3.74 V'),
        ).toThrow('Invalid on-board load measurement response');
    });

    test('rejects values with mismatched units', () => {
        expect(() =>
            parseOnBoardLoadMeasurements(
                'tload=33.6 C iload=99.3 V vload=3.74 mA',
            ),
        ).toThrow('Invalid on-board load measurement unit');
    });
});