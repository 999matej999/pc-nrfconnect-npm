/*
 * Copyright (c) 2026 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import { helpers } from '../../tests/helpers';
import { setupMocksWithShellParser } from './helpers';

describe('PMIC 1300 - On-board load', () => {
    const { mockEnqueueRequest, mockOnBoardLoadMeasurementsUpdate, pmic } =
        setupMocksWithShellParser();

    beforeEach(() => {
        jest.clearAllMocks();
        mockEnqueueRequest.mockImplementation(
            helpers.registerCommandCallbackSuccess,
        );
    });

    test('Sets active load with cc_sink command', async () => {
        await pmic.onBoardLoadModule?.set.iLoad(1);

        expect(mockEnqueueRequest).toHaveBeenCalledWith(
            'cc_sink level set 1',
            expect.anything(),
            undefined,
            true,
        );
    });

    test('Reads measured active-load values', async () => {
        const response =
            'tload=33.687500 C\niload=99.300000 mA\nvload=3.740190 V';
        mockEnqueueRequest.mockImplementation((command, callbacks) => {
            callbacks?.onSuccess(response, command);
            return Promise.resolve();
        });

        await pmic.onBoardLoadModule?.get.measurements?.();

        expect(mockEnqueueRequest).toHaveBeenCalledWith(
            'cc_sink measurements get',
            expect.anything(),
            undefined,
            true,
        );
        expect(mockOnBoardLoadMeasurementsUpdate).toHaveBeenCalledWith(
            expect.objectContaining({
                tLoad: 33.6875,
                iLoad: 99.3,
                vLoad: 3.74019,
                measuredAt: expect.any(Number),
            }),
        );
    });
});

export {};
