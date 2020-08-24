/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { ElementRef } from '@angular/core';
import { ValidatorFn } from '@angular/forms';
import { DateAdapter, MatDateFormats, ThemePalette } from '@angular/material/core';
import { MatFormField } from '@angular/material/form-field';
import { MatDatepicker } from './datepicker';
import { MatDatepickerInputBase, DateFilterFn } from './datepicker-input-base';
import { MatDatepickerControl } from './datepicker-base';
/** @docs-private */
export declare const MAT_DATEPICKER_VALUE_ACCESSOR: any;
/** @docs-private */
export declare const MAT_DATEPICKER_VALIDATORS: any;
/** Directive used to connect an input to a MatDatepicker. */
export declare class MatDatepickerInput<D> extends MatDatepickerInputBase<D | null, D> implements MatDatepickerControl<D | null> {
    private _formField;
    /** The datepicker that this input is associated with. */
    set matDatepicker(datepicker: MatDatepicker<D>);
    _datepicker: MatDatepicker<D>;
    /** The minimum valid date. */
    get min(): D | null;
    set min(value: D | null);
    private _min;
    /** The maximum valid date. */
    get max(): D | null;
    set max(value: D | null);
    private _max;
    /** Function that can be used to filter out dates within the datepicker. */
    get dateFilter(): DateFilterFn<D | null>;
    set dateFilter(value: DateFilterFn<D | null>);
    private _dateFilter;
    /** The combined form control validator for this input. */
    protected _validator: ValidatorFn | null;
    constructor(elementRef: ElementRef<HTMLInputElement>, dateAdapter: DateAdapter<D>, dateFormats: MatDateFormats, _formField: MatFormField);
    /**
     * Gets the element that the datepicker popup should be connected to.
     * @return The element to connect the popup to.
     */
    getConnectedOverlayOrigin(): ElementRef;
    /** Returns the palette used by the input's form field, if any. */
    getThemePalette(): ThemePalette;
    /** Gets the value at which the calendar should start. */
    getStartValue(): D | null;
    /**
     * @deprecated
     * @breaking-change 8.0.0 Use `getConnectedOverlayOrigin` instead
     */
    getPopupConnectionElementRef(): ElementRef;
    /** Opens the associated datepicker. */
    protected _openPopup(): void;
    protected _getValueFromModel(modelValue: D | null): D | null;
    protected _assignValueToModel(value: D | null): void;
    /** Gets the input's minimum date. */
    _getMinDate(): D | null;
    /** Gets the input's maximum date. */
    _getMaxDate(): D | null;
    /** Gets the input's date filtering function. */
    protected _getDateFilter(): DateFilterFn<D | null>;
    protected _canEmitChangeEvent(): boolean;
    protected _outsideValueChanged: undefined;
    static ngAcceptInputType_value: any;
}
