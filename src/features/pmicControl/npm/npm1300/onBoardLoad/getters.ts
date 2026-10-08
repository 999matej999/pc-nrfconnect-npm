/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import { type NpmEventEmitter } from '../../pmicHelpers';
import { type OnBoardLoadMeasurements } from '../../types';

export const parseOnBoardLoadMeasurements = (
    response: string,
): Omit<OnBoardLoadMeasurements, 'measuredAt'> => {
    const values: Partial<Omit<OnBoardLoadMeasurements, 'measuredAt'>> = {};
    const measurementPattern =
        /\b(tload|iload|vload)\s*=\s*([+-]?(?:\d+(?:\.\d*)?|\.\d+))\s*(C|mA|V)\b/gi;
    let match = measurementPattern.exec(response);

    while (match) {
        const value = Number.parseFloat(match[2]);
        const key = match[1].toLowerCase();
        const unit = match[3].toLowerCase();
        const expectedUnit = {
            tload: 'c',
            iload: 'ma',
            vload: 'v',
        }[key];

        if (!expectedUnit || unit !== expectedUnit) {
            throw new Error('Invalid on-board load measurement unit');
        }

        switch (key) {
            case 'iload':
                values.iLoad = value;
                break;
            case 'vload':
                values.vLoad = value;
                break;
            case 'tload':
                values.tLoad = value;
                break;
        }
        match = measurementPattern.exec(response);
    }

    if (
        values.iLoad === undefined ||
        values.vLoad === undefined ||
        values.tLoad === undefined ||
        !Number.isFinite(values.iLoad) ||
        !Number.isFinite(values.vLoad) ||
        !Number.isFinite(values.tLoad)
    ) {
        throw new Error('Invalid on-board load measurement response');
    }

    return {
        iLoad: values.iLoad,
        vLoad: values.vLoad,
        tLoad: values.tLoad,
    };
};

export class OnBoardLoadGet {
    constructor(
        private sendCommand: (
            command: string,
            onSuccess?: (response: string, command: string) => void,
            onError?: (response: string, command: string) => void,
        ) => void,
        private eventEmitter: NpmEventEmitter,
    ) {}

    all() {
        this.iLoad();
    }

    iLoad() {
        this.sendCommand(`cc_sink level get`);
    }

    measurements() {
        return new Promise<void>((resolve, reject) => {
            this.sendCommand(
                `cc_sink measurements get`,
                response => {
                    try {
                        this.eventEmitter.emit(
                            'onOnBoardLoadMeasurementsUpdate',
                            {
                                ...parseOnBoardLoadMeasurements(response),
                                measuredAt: Date.now(),
                            } satisfies OnBoardLoadMeasurements,
                        );
                        resolve();
                    } catch (error) {
                        reject(error);
                    }
                },
                response => reject(new Error(response)),
            );
        });
    }
}
