/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import { BooleanInput } from '@angular/cdk/coercion';
import { InjectionToken } from '@angular/core';
import { CanDisable, CanDisableCtor } from '../common-behaviors/disabled';
/** @docs-private */
declare class MatOptgroupBase {
}
declare const _MatOptgroupMixinBase: CanDisableCtor & typeof MatOptgroupBase;
/**
 * Injection token that can be used to reference instances of `MatOptgroup`. It serves as
 * alternative token to the actual `MatOptgroup` class which could cause unnecessary
 * retention of the class and its component metadata.
 */
export declare const MAT_OPTGROUP: InjectionToken<MatOptgroup>;
/**
 * Component that is used to group instances of `mat-option`.
 */
export declare class MatOptgroup extends _MatOptgroupMixinBase implements CanDisable {
    /** Label for the option group. */
    label: string;
    /** Unique id for the underlying label. */
    _labelId: string;
    static ngAcceptInputType_disabled: BooleanInput;
}
export {};
