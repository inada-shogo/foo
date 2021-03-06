/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { OnDestroy, AfterContentInit, ChangeDetectorRef, ElementRef, OnChanges } from '@angular/core';
import { MatFormFieldControl, MatFormField } from '@angular/material/form-field';
import { ThemePalette, DateAdapter } from '@angular/material/core';
import { NgControl, ControlContainer } from '@angular/forms';
import { Subject } from 'rxjs';
import { BooleanInput } from '@angular/cdk/coercion';
import { MatStartDate, MatEndDate, MatDateRangeInputParent } from './date-range-input-parts';
import { MatDatepickerControl } from './datepicker-base';
import { DateFilterFn } from './datepicker-input-base';
import { MatDateRangePicker, MatDateRangePickerInput } from './date-range-picker';
import { DateRange } from './date-selection-model';
export declare class MatDateRangeInput<D> implements MatFormFieldControl<DateRange<D>>, MatDatepickerControl<D>, MatDateRangeInputParent<D>, MatDateRangePickerInput<D>, AfterContentInit, OnChanges, OnDestroy {
    private _changeDetectorRef;
    private _elementRef;
    private _dateAdapter;
    private _formField?;
    /** Current value of the range input. */
    get value(): DateRange<D> | null;
    /** Emits when the input's state has changed. */
    stateChanges: Subject<void>;
    /** Unique ID for the input. */
    id: string;
    /** Whether the control is focused. */
    focused: boolean;
    /** Whether the control's label should float. */
    get shouldLabelFloat(): boolean;
    /** Name of the form control. */
    controlType: string;
    /**
     * Implemented as a part of `MatFormFieldControl`.
     * Set the placeholder attribute on `matStartDate` and `matEndDate`.
     * @docs-private
     */
    get placeholder(): string;
    /** The range picker that this input is associated with. */
    get rangePicker(): MatDateRangePicker<D>;
    set rangePicker(rangePicker: MatDateRangePicker<D>);
    private _rangePicker;
    /** Whether the input is required. */
    get required(): boolean;
    set required(value: boolean);
    private _required;
    /** Function that can be used to filter out dates within the date range picker. */
    get dateFilter(): DateFilterFn<D>;
    set dateFilter(value: DateFilterFn<D>);
    private _dateFilter;
    /** The minimum valid date. */
    get min(): D | null;
    set min(value: D | null);
    private _min;
    /** The maximum valid date. */
    get max(): D | null;
    set max(value: D | null);
    private _max;
    /** Whether the input is disabled. */
    get disabled(): boolean;
    set disabled(value: boolean);
    _groupDisabled: boolean;
    /** Whether the input is in an error state. */
    get errorState(): boolean;
    /** Whether the datepicker input is empty. */
    get empty(): boolean;
    /** Value for the `aria-describedby` attribute of the inputs. */
    _ariaDescribedBy: string | null;
    /** Date selection model currently registered with the input. */
    private _model;
    /** Separator text to be shown between the inputs. */
    separator: string;
    /** Start of the comparison range that should be shown in the calendar. */
    comparisonStart: D | null;
    /** End of the comparison range that should be shown in the calendar. */
    comparisonEnd: D | null;
    _startInput: MatStartDate<D>;
    _endInput: MatEndDate<D>;
    /**
     * Implemented as a part of `MatFormFieldControl`.
     * TODO(crisbeto): change type to `AbstractControlDirective` after #18206 lands.
     * @docs-private
     */
    ngControl: NgControl | null;
    /** Emits when the input's state changes. */
    _stateChanges: Subject<void>;
    constructor(_changeDetectorRef: ChangeDetectorRef, _elementRef: ElementRef<HTMLElement>, control: ControlContainer, _dateAdapter: DateAdapter<D>, _formField?: MatFormField | undefined);
    /**
     * Implemented as a part of `MatFormFieldControl`.
     * @docs-private
     */
    setDescribedByIds(ids: string[]): void;
    /**
     * Implemented as a part of `MatFormFieldControl`.
     * @docs-private
     */
    onContainerClick(): void;
    ngAfterContentInit(): void;
    ngOnChanges(): void;
    ngOnDestroy(): void;
    /** Gets the date at which the calendar should start. */
    getStartValue(): D | null;
    /** Gets the input's theme palette. */
    getThemePalette(): ThemePalette;
    /** Gets the element to which the calendar overlay should be attached. */
    getConnectedOverlayOrigin(): ElementRef;
    /** Gets the value that is used to mirror the state input. */
    _getInputMirrorValue(): string;
    /** Whether the input placeholders should be hidden. */
    _shouldHidePlaceholders(): boolean;
    /** Handles the value in one of the child inputs changing. */
    _handleChildValueChange(): void;
    /** Opens the date range picker associated with the input. */
    _openDatepicker(): void;
    /** Whether the separate text should be hidden. */
    _shouldHideSeparator(): boolean;
    /** Gets the value for the `aria-labelledby` attribute of the inputs. */
    _getAriaLabelledby(): string | null;
    /**
     * @param obj The object to check.
     * @returns The given object if it is both a date instance and valid, otherwise null.
     */
    private _getValidDateOrNull;
    /** Re-runs the validators on the start/end inputs. */
    private _revalidate;
    /** Registers the current date selection model with the start/end inputs. */
    private _registerModel;
    static ngAcceptInputType_required: BooleanInput;
    static ngAcceptInputType_disabled: BooleanInput;
}
