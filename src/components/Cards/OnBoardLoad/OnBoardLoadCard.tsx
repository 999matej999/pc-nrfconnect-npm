/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

import React, { useEffect, useRef, useState } from 'react';
import {
    Card,
    NumberInput,
    Toggle,
} from '@nordicsemiconductor/pc-nrfconnect-shared';

import { DocumentationTooltip } from '../../../features/pmicControl/npm/documentation/documentation';
import {
    type OnBoardLoad,
    type OnBoardLoadMeasurements,
    type OnBoardLoadModule,
} from '../../../features/pmicControl/npm/types';

export default ({
    onBoardLoad,
    onBoardLoadModule,
    measurements,
    measurementsSupported,
    cardLabel = 'On-Board Load',
    disabled,
}: {
    onBoardLoad: OnBoardLoad;
    onBoardLoadModule: OnBoardLoadModule;
    measurements?: OnBoardLoadMeasurements;
    measurementsSupported: boolean;
    cardLabel?: string;
    disabled: boolean;
}) => {
    const range = onBoardLoadModule.ranges.iLoad;
    const card = `OnBoardLoad`;
    const initialEnabledILoad = Math.min(Math.max(1, range.min), range.max);

    const [internalILoad, setInternalILoad] = useState(onBoardLoad.iLoad);
    const lastEnabledILoad = useRef(
        onBoardLoad.iLoad > 0 ? onBoardLoad.iLoad : initialEnabledILoad,
    );
    const [measurementRequestFailed, setMeasurementRequestFailed] =
        useState(false);
    const [now, setNow] = useState(Date.now());

    // NumberInputSliderWithUnit do not use boost.<prop> as value as we send only at on change complete
    useEffect(() => {
        setInternalILoad(onBoardLoad.iLoad);
        if (onBoardLoad.iLoad > 0) {
            lastEnabledILoad.current = onBoardLoad.iLoad;
        }
    }, [onBoardLoad]);

    useEffect(() => {
        const getMeasurements = onBoardLoadModule.get.measurements;
        if (!measurementsSupported || disabled || !getMeasurements) {
            return undefined;
        }

        let requestInFlight = false;
        let active = true;
        const refreshMeasurements = () => {
            if (active) setNow(Date.now());
            if (requestInFlight) return;

            requestInFlight = true;
            getMeasurements
                .call(onBoardLoadModule.get)
                .then(() => {
                    if (active) setMeasurementRequestFailed(false);
                })
                .catch(() => {
                    if (active) setMeasurementRequestFailed(true);
                })
                .finally(() => {
                    requestInFlight = false;
                    if (active) setNow(Date.now());
                });
        };

        refreshMeasurements();
        const interval = setInterval(refreshMeasurements, 2000);

        return () => {
            active = false;
            clearInterval(interval);
        };
    }, [disabled, measurementsSupported, onBoardLoadModule]);

    return (
        <Card
            title={
                <div className="tw-flex tw-justify-between">
                    <DocumentationTooltip card={card} item="iLoad">
                        <span>{cardLabel}</span>
                    </DocumentationTooltip>
                    <div className="d-flex">
                        <Toggle
                            label="Enabled"
                            isToggled={onBoardLoad.iLoad > 0}
                            onToggle={enabled => {
                                if (!enabled && onBoardLoad.iLoad > 0) {
                                    lastEnabledILoad.current =
                                        onBoardLoad.iLoad;
                                }
                                onBoardLoadModule.set.iLoad(
                                    enabled ? lastEnabledILoad.current : 0,
                                );
                            }}
                            disabled={disabled}
                        />
                    </div>
                </div>
            }
        >
            <NumberInput
                label={
                    <DocumentationTooltip card={card} item="iLoad">
                        <div>
                            <span>I</span>
                            <span className="subscript">LOAD</span>
                        </div>
                    </DocumentationTooltip>
                }
                unit="mA"
                disabled={disabled}
                range={range}
                value={internalILoad}
                onChange={setInternalILoad}
                onChangeComplete={value => {
                    if (value > 0) lastEnabledILoad.current = value;
                    onBoardLoadModule.set.iLoad(value);
                }}
                showSlider
            />
            {measurementsSupported && (
                <div className="tw-mt-3 tw-border-t tw-pt-3">
                    <div className="tw-mb-2 tw-text-xs tw-font-semibold">
                        Measured
                    </div>
                    {measurements ? (
                        <>
                            <div className="tw-grid tw-grid-cols-3 tw-gap-3">
                                <div>
                                    <div className="tw-text-xs">ILOAD</div>
                                    <div>
                                        {measurements.iLoad.toFixed(2)} mA
                                    </div>
                                </div>
                                <div>
                                    <div className="tw-text-xs">VLOAD</div>
                                    <div>{measurements.vLoad.toFixed(3)} V</div>
                                </div>
                                <div>
                                    <div className="tw-text-xs">TLOAD</div>
                                    <div>{measurements.tLoad.toFixed(1)} C</div>
                                </div>
                            </div>
                            {now - measurements.measuredAt > 6000 && (
                                <div className="tw-mt-2 tw-text-xs">
                                    Measurement is stale
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="tw-text-xs">
                            {disabled || measurementRequestFailed
                                ? 'Measurements unavailable'
                                : 'Reading measurements...'}
                        </div>
                    )}
                </div>
            )}
        </Card>
    );
};
