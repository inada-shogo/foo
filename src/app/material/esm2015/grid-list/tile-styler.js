/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/**
 * RegExp that can be used to check whether a value will
 * be allowed inside a CSS `calc()` expression.
 */
const cssCalcAllowedValue = /^-?\d+((\.\d+)?[A-Za-z%$]?)+$/;
/**
 * Sets the style properties for an individual tile, given the position calculated by the
 * Tile Coordinator.
 * @docs-private
 */
export class TileStyler {
    constructor() {
        this._rows = 0;
        this._rowspan = 0;
    }
    /**
     * Adds grid-list layout info once it is available. Cannot be processed in the constructor
     * because these properties haven't been calculated by that point.
     *
     * @param gutterSize Size of the grid's gutter.
     * @param tracker Instance of the TileCoordinator.
     * @param cols Amount of columns in the grid.
     * @param direction Layout direction of the grid.
     */
    init(gutterSize, tracker, cols, direction) {
        this._gutterSize = normalizeUnits(gutterSize);
        this._rows = tracker.rowCount;
        this._rowspan = tracker.rowspan;
        this._cols = cols;
        this._direction = direction;
    }
    /**
     * Computes the amount of space a single 1x1 tile would take up (width or height).
     * Used as a basis for other calculations.
     * @param sizePercent Percent of the total grid-list space that one 1x1 tile would take up.
     * @param gutterFraction Fraction of the gutter size taken up by one 1x1 tile.
     * @return The size of a 1x1 tile as an expression that can be evaluated via CSS calc().
     */
    getBaseTileSize(sizePercent, gutterFraction) {
        // Take the base size percent (as would be if evenly dividing the size between cells),
        // and then subtracting the size of one gutter. However, since there are no gutters on the
        // edges, each tile only uses a fraction (gutterShare = numGutters / numCells) of the gutter
        // size. (Imagine having one gutter per tile, and then breaking up the extra gutter on the
        // edge evenly among the cells).
        return `(${sizePercent}% - (${this._gutterSize} * ${gutterFraction}))`;
    }
    /**
     * Gets The horizontal or vertical position of a tile, e.g., the 'top' or 'left' property value.
     * @param offset Number of tiles that have already been rendered in the row/column.
     * @param baseSize Base size of a 1x1 tile (as computed in getBaseTileSize).
     * @return Position of the tile as a CSS calc() expression.
     */
    getTilePosition(baseSize, offset) {
        // The position comes the size of a 1x1 tile plus gutter for each previous tile in the
        // row/column (offset).
        return offset === 0 ? '0' : calc(`(${baseSize} + ${this._gutterSize}) * ${offset}`);
    }
    /**
     * Gets the actual size of a tile, e.g., width or height, taking rowspan or colspan into account.
     * @param baseSize Base size of a 1x1 tile (as computed in getBaseTileSize).
     * @param span The tile's rowspan or colspan.
     * @return Size of the tile as a CSS calc() expression.
     */
    getTileSize(baseSize, span) {
        return `(${baseSize} * ${span}) + (${span - 1} * ${this._gutterSize})`;
    }
    /**
     * Sets the style properties to be applied to a tile for the given row and column index.
     * @param tile Tile to which to apply the styling.
     * @param rowIndex Index of the tile's row.
     * @param colIndex Index of the tile's column.
     */
    setStyle(tile, rowIndex, colIndex) {
        // Percent of the available horizontal space that one column takes up.
        let percentWidthPerTile = 100 / this._cols;
        // Fraction of the vertical gutter size that each column takes up.
        // For example, if there are 5 columns, each column uses 4/5 = 0.8 times the gutter width.
        let gutterWidthFractionPerTile = (this._cols - 1) / this._cols;
        this.setColStyles(tile, colIndex, percentWidthPerTile, gutterWidthFractionPerTile);
        this.setRowStyles(tile, rowIndex, percentWidthPerTile, gutterWidthFractionPerTile);
    }
    /** Sets the horizontal placement of the tile in the list. */
    setColStyles(tile, colIndex, percentWidth, gutterWidth) {
        // Base horizontal size of a column.
        let baseTileWidth = this.getBaseTileSize(percentWidth, gutterWidth);
        // The width and horizontal position of each tile is always calculated the same way, but the
        // height and vertical position depends on the rowMode.
        let side = this._direction === 'rtl' ? 'right' : 'left';
        tile._setStyle(side, this.getTilePosition(baseTileWidth, colIndex));
        tile._setStyle('width', calc(this.getTileSize(baseTileWidth, tile.colspan)));
    }
    /**
     * Calculates the total size taken up by gutters across one axis of a list.
     */
    getGutterSpan() {
        return `${this._gutterSize} * (${this._rowspan} - 1)`;
    }
    /**
     * Calculates the total size taken up by tiles across one axis of a list.
     * @param tileHeight Height of the tile.
     */
    getTileSpan(tileHeight) {
        return `${this._rowspan} * ${this.getTileSize(tileHeight, 1)}`;
    }
    /**
     * Calculates the computed height and returns the correct style property to set.
     * This method can be implemented by each type of TileStyler.
     * @docs-private
     */
    getComputedHeight() { return null; }
}
/**
 * This type of styler is instantiated when the user passes in a fixed row height.
 * Example `<mat-grid-list cols="3" rowHeight="100px">`
 * @docs-private
 */
export class FixedTileStyler extends TileStyler {
    constructor(fixedRowHeight) {
        super();
        this.fixedRowHeight = fixedRowHeight;
    }
    init(gutterSize, tracker, cols, direction) {
        super.init(gutterSize, tracker, cols, direction);
        this.fixedRowHeight = normalizeUnits(this.fixedRowHeight);
        if (!cssCalcAllowedValue.test(this.fixedRowHeight)) {
            throw Error(`Invalid value "${this.fixedRowHeight}" set as rowHeight.`);
        }
    }
    setRowStyles(tile, rowIndex) {
        tile._setStyle('top', this.getTilePosition(this.fixedRowHeight, rowIndex));
        tile._setStyle('height', calc(this.getTileSize(this.fixedRowHeight, tile.rowspan)));
    }
    getComputedHeight() {
        return [
            'height', calc(`${this.getTileSpan(this.fixedRowHeight)} + ${this.getGutterSpan()}`)
        ];
    }
    reset(list) {
        list._setListStyle(['height', null]);
        if (list._tiles) {
            list._tiles.forEach(tile => {
                tile._setStyle('top', null);
                tile._setStyle('height', null);
            });
        }
    }
}
/**
 * This type of styler is instantiated when the user passes in a width:height ratio
 * for the row height.  Example `<mat-grid-list cols="3" rowHeight="3:1">`
 * @docs-private
 */
export class RatioTileStyler extends TileStyler {
    constructor(value) {
        super();
        this._parseRatio(value);
    }
    setRowStyles(tile, rowIndex, percentWidth, gutterWidth) {
        let percentHeightPerTile = percentWidth / this.rowHeightRatio;
        this.baseTileHeight = this.getBaseTileSize(percentHeightPerTile, gutterWidth);
        // Use padding-top and margin-top to maintain the given aspect ratio, as
        // a percentage-based value for these properties is applied versus the *width* of the
        // containing block. See http://www.w3.org/TR/CSS2/box.html#margin-properties
        tile._setStyle('marginTop', this.getTilePosition(this.baseTileHeight, rowIndex));
        tile._setStyle('paddingTop', calc(this.getTileSize(this.baseTileHeight, tile.rowspan)));
    }
    getComputedHeight() {
        return [
            'paddingBottom', calc(`${this.getTileSpan(this.baseTileHeight)} + ${this.getGutterSpan()}`)
        ];
    }
    reset(list) {
        list._setListStyle(['paddingBottom', null]);
        list._tiles.forEach(tile => {
            tile._setStyle('marginTop', null);
            tile._setStyle('paddingTop', null);
        });
    }
    _parseRatio(value) {
        const ratioParts = value.split(':');
        if (ratioParts.length !== 2) {
            throw Error(`mat-grid-list: invalid ratio given for row-height: "${value}"`);
        }
        this.rowHeightRatio = parseFloat(ratioParts[0]) / parseFloat(ratioParts[1]);
    }
}
/**
 * This type of styler is instantiated when the user selects a "fit" row height mode.
 * In other words, the row height will reflect the total height of the container divided
 * by the number of rows.  Example `<mat-grid-list cols="3" rowHeight="fit">`
 *
 * @docs-private
 */
export class FitTileStyler extends TileStyler {
    setRowStyles(tile, rowIndex) {
        // Percent of the available vertical space that one row takes up.
        let percentHeightPerTile = 100 / this._rowspan;
        // Fraction of the horizontal gutter size that each column takes up.
        let gutterHeightPerTile = (this._rows - 1) / this._rows;
        // Base vertical size of a column.
        let baseTileHeight = this.getBaseTileSize(percentHeightPerTile, gutterHeightPerTile);
        tile._setStyle('top', this.getTilePosition(baseTileHeight, rowIndex));
        tile._setStyle('height', calc(this.getTileSize(baseTileHeight, tile.rowspan)));
    }
    reset(list) {
        if (list._tiles) {
            list._tiles.forEach(tile => {
                tile._setStyle('top', null);
                tile._setStyle('height', null);
            });
        }
    }
}
/** Wraps a CSS string in a calc function */
function calc(exp) {
    return `calc(${exp})`;
}
/** Appends pixels to a CSS string if no units are given. */
function normalizeUnits(value) {
    return value.match(/([A-Za-z%]+)$/) ? value : `${value}px`;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGlsZS1zdHlsZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvbWF0ZXJpYWwvZ3JpZC1saXN0L3RpbGUtc3R5bGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQU1IOzs7R0FHRztBQUNILE1BQU0sbUJBQW1CLEdBQUcsK0JBQStCLENBQUM7QUFRNUQ7Ozs7R0FJRztBQUNILE1BQU0sT0FBZ0IsVUFBVTtJQUFoQztRQUVFLFVBQUssR0FBVyxDQUFDLENBQUM7UUFDbEIsYUFBUSxHQUFXLENBQUMsQ0FBQztJQWlJdkIsQ0FBQztJQTdIQzs7Ozs7Ozs7T0FRRztJQUNILElBQUksQ0FBQyxVQUFrQixFQUFFLE9BQXdCLEVBQUUsSUFBWSxFQUFFLFNBQWlCO1FBQ2hGLElBQUksQ0FBQyxXQUFXLEdBQUcsY0FBYyxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQzlDLElBQUksQ0FBQyxLQUFLLEdBQUcsT0FBTyxDQUFDLFFBQVEsQ0FBQztRQUM5QixJQUFJLENBQUMsUUFBUSxHQUFHLE9BQU8sQ0FBQyxPQUFPLENBQUM7UUFDaEMsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUM7UUFDbEIsSUFBSSxDQUFDLFVBQVUsR0FBRyxTQUFTLENBQUM7SUFDOUIsQ0FBQztJQUVEOzs7Ozs7T0FNRztJQUNILGVBQWUsQ0FBQyxXQUFtQixFQUFFLGNBQXNCO1FBQ3pELHNGQUFzRjtRQUN0RiwwRkFBMEY7UUFDMUYsNEZBQTRGO1FBQzVGLDBGQUEwRjtRQUMxRixnQ0FBZ0M7UUFDaEMsT0FBTyxJQUFJLFdBQVcsUUFBUSxJQUFJLENBQUMsV0FBVyxNQUFNLGNBQWMsSUFBSSxDQUFDO0lBQ3pFLENBQUM7SUFHRDs7Ozs7T0FLRztJQUNILGVBQWUsQ0FBQyxRQUFnQixFQUFFLE1BQWM7UUFDOUMsc0ZBQXNGO1FBQ3RGLHVCQUF1QjtRQUN2QixPQUFPLE1BQU0sS0FBSyxDQUFDLENBQUMsQ0FBQyxD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RSxJQUFJLENBQUMsQ0FBQztnQkFDNUIsSUFBSSxDQUFDLFNBQVMsQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDakMsQ0FBQyxDQUFDLENBQUM7U0FDSjtJQUNILENBQUM7Q0FDRjtBQUdELDRDQUE0QztBQUM1QyxTQUFTLElBQUksQ0FBQyxHQUFXO0lBQ3ZCLE9BQU8sUUFBUSxHQUFHLEdBQUcsQ0FBQztBQUN4QixDQUFDO0FBR0QsNERBQTREO0FBQzVELFNBQVMsY0FBYyxDQUFDLEtBQWE7SUFDbkMsT0FBTyxLQUFLLENBQUMsS0FBSyxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEdBQUcsS0FBSyxJQUFJLENBQUM7QUFDN0QsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgTExDIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge1F1ZXJ5TGlzdH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQge01hdEdyaWRUaWxlfSBmcm9tICcuL2dyaWQtdGlsZSc7XG5pbXBvcnQge1RpbGVDb29yZGluYXRvcn0gZnJvbSAnLi90aWxlLWNvb3JkaW5hdG9yJztcblxuLyoqXG4gKiBSZWdFeHAgdGhhdCBjYW4gYmUgdXNlZCB0byBjaGVjayB3aGV0aGVyIGEgdmFsdWUgd2lsbFxuICogYmUgYWxsb3dlZCBpbnNpZGUgYSBDU1MgYGNhbGMoKWAgZXhwcmVzc2lvbi5cbiAqL1xuY29uc3QgY3NzQ2FsY0FsbG93ZWRWYWx1ZSA9IC9eLT9cXGQrKChcXC5cXGQrKT9bQS1aYS16JSRdPykrJC87XG5cbi8qKiBPYmplY3QgdGhhdCBjYW4gYmUgc3R5bGVkIGJ5IHRoZSBgVGlsZVN0eWxlcmAuICovXG5leHBvcnQgaW50ZXJmYWNlIFRpbGVTdHlsZVRhcmdldCB7XG4gIF9zZXRMaXN0U3R5bGUoc3R5bGU6IFtzdHJpbmcsIHN0cmluZyB8IG51bGxdIHwgbnVsbCk6IHZvaWQ7XG4gIF90aWxlczogUXVlcnlMaXN0PE1hdEdyaWRUaWxlPjtcbn1cblxuLyoqXG4gKiBTZXRzIHRoZSBzdHlsZSBwcm9wZXJ0aWVzIGZvciBhbiBpbmRpdmlkdWFsIHRpbGUsIGdpdmVuIHRoZSBwb3NpdGlvbiBjYWxjdWxhdGVkIGJ5IHRoZVxuICogVGlsZSBDb29yZGluYXRvci5cbiAqIEBkb2NzLXByaXZhdGVcbiAqL1xuZXhwb3J0IGFic3RyYWN0IGNsYXNzIFRpbGVTdHlsZXIge1xuICBfZ3V0dGVyU2l6ZTogc3RyaW5nO1xuICBfcm93czogbnVtYmVyID0gMDtcbiAgX3Jvd3NwYW46IG51bWJlciA9IDA7XG4gIF9jb2xzOiBudW1iZXI7XG4gIF9kaXJlY3Rpb246IHN0cmluZztcblxuICAvKipcbiAgICogQWRkcyBncmlkLWxpc3QgbGF5b3V0IGluZm8gb25jZSBpdCBpcyBhdmFpbGFibGUuIENhbm5vdCBiZSBwcm9jZXNzZWQgaW4gdGhlIGNvbnN0cnVjdG9yXG4gICAqIGJlY2F1c2UgdGhlc2UgcHJvcGVydGllcyBoYXZlbid0IGJlZW4gY2FsY3VsYXRlZCBieSB0aGF0IHBvaW50LlxuICAgKlxuICAgKiBAcGFyYW0gZ3V0dGVyU2l6ZSBTaXplIG9mIHRoZSBncmlkJ3MgZ3V0dGVyLlxuICAgKiBAcGFyYW0gdHJhY2tlciBJbnN0YW5jZSBvZiB0aGUgVGlsZUNvb3JkaW5hdG9yLlxuICAgKiBAcGFyYW0gY29scyBBbW91bnQgb2YgY29sdW1ucyBpbiB0aGUgZ3JpZC5cbiAgICogQHBhcmFtIGRpcmVjdGlvbiBMYXlvdXQgZGlyZWN0aW9uIG9mIHRoZSBncmlkLlxuICAgKi9cbiAgaW5pdChndXR0ZXJTaXplOiBzdHJpbmcsIHRyYWNrZXI6IFRpbGVDb29yZGluYXRvciwgY29sczogbnVtYmVyLCBkaXJlY3Rpb246IHN0cmluZyk6IHZvaWQge1xuICAgIHRoaXMuX2d1dHRlclNpemUgPSBub3JtYWxpemVVbml0cyhndXR0ZXJTaXplKTtcbiAgICB0aGlzLl9yb3dzID0gdHJhY2tlci5yb3dDb3VudDtcbiAgICB0aGlzLl9yb3dzcGFuID0gdHJhY2tlci5yb3dzcGFuO1xuICAgIHRoaXMuX2NvbHMgPSBjb2xzO1xuICAgIHRoaXMuX2RpcmVjdGlvbiA9IGRpcmVjdGlvbjtcbiAgfVxuXG4gIC8qKlxuICAgKiBDb21wdXRlcyB0aGUgYW1vdW50IG9mIHNwYWNlIGEgc2luZ2xlIDF4MSB0aWxlIHdvdWxkIHRha2UgdXAgKHdpZHRoIG9yIGhlaWdodCkuXG4gICAqIFVzZWQgYXMgYSBiYXNpcyBmb3Igb3RoZXIgY2FsY3VsYXRpb25zLlxuICAgKiBAcGFyYW0gc2l6ZVBlcmNlbnQgUGVyY2VudCBvZiB0aGUgdG90YWwgZ3JpZC1saXN0IHNwYWNlIHRoYXQgb25lIDF4MSB0aWxlIHdvdWxkIHRha2UgdXAuXG4gICAqIEBwYXJhbSBndXR0ZXJGcmFjdGlvbiBGcmFjdGlvbiBvZiB0aGUgZ3V0dGVyIHNpemUgdGFrZW4gdXAgYnkgb25lIDF4MSB0aWxlLlxuICAgKiBAcmV0dXJuIFRoZSBzaXplIG9mIGEgMXgxIHRpbGUgYXMgYW4gZXhwcmVzc2lvbiB0aGF0IGNhbiBiZSBldmFsdWF0ZWQgdmlhIENTUyBjYWxjKCkuXG4gICAqL1xuICBnZXRCYXNlVGlsZVNpemUoc2l6ZVBlcmNlbnQ6IG51bWJlciwgZ3V0dGVyRnJhY3Rpb246IG51bWJlcik6IHN0cmluZyB7XG4gICAgLy8gVGFrZSB0aGUgYmFzZSBzaXplIHBlcmNlbnQgKGFzIHdvdWxkIGJlIGlmIGV2ZW5seSBkaXZpZGluZyB0aGUgc2l6ZSBiZXR3ZWVuIGNlbGxzKSxcbiAgICAvLyBhbmQgdGhlbiBzdWJ0cmFjdGluZyB0aGUgc2l6ZSBvZiBvbmUgZ3V0dGVyLiBIb3dldmVyLCBzaW5jZSB0aGVyZSBhcmUgbm8gZ3V0dGVycyBvbiB0aGVcbiAgICAvLyBlZGdlcywgZWFjaCB0aWxlIG9ubHkgdXNlcyBhIGZyYWN0aW9uIChndXR0ZXJTaGFyZSA9IG51bUd1dHRlcnMgLyBudW1DZWxscykgb2YgdGhlIGd1dHRlclxuICAgIC8vIHNpemUuIChJbWFnaW5lIGhhdmluZyBvbmUgZ3V0dGVyIHBlciB0aWxlLCBhbmQgdGhlbiBicmVha2luZyB1cCB0aGUgZXh0cmEgZ3V0dGVyIG9uIHRoZVxuICAgIC8vIGVkZ2UgZXZlbmx5IGFtb25nIHRoZSBjZWxscykuXG4gICAgcmV0dXJuIGAoJHtzaXplUGVyY2VudH0lIC0gKCR7dGhpcy5fZ3V0dGVyU2l6ZX0gKiAke2d1dHRlckZyYWN0aW9ufSkpYDtcbiAgfVxuXG5cbiAgLyoqXG4gICAqIEdldHMgVGhlIGhvcml6b250YWwgb3IgdmVydGljYWwgcG9zaXRpb24gb2YgYSB0aWxlLCBlLmcuLCB0aGUgJ3RvcCcgb3IgJ2xlZnQnIHByb3BlcnR5IHZhbHVlLlxuICAgKiBAcGFyYW0gb2Zmc2V0IE51bWJlciBvZiB0aWxlcyB0aGF0IGhhdmUgYWxyZWFkeSBiZWVuIHJlbmRlcmVkIGluIHRoZSByb3cvY29sdW1uLlxuICAgKiBAcGFyYW0gYmFzZVNpemUgQmFzZSBzaXplIG9mIGEgMXgxIHRpbGUgKGFzIGNvbXB1dGVkIGluIGdldEJhc2VUaWxlU2l6ZSkuXG4gICAqIEByZXR1cm4gUG9zaXRpb24gb2YgdGhlIHRpbGUgYXMgYSBDU1MgY2FsYygpIGV4cHJlc3Npb24uXG4gICAqL1xuICBnZXRUaWxlUG9zaXRpb24oYmFzZVNpemU6IHN0cmluZywgb2Zmc2V0OiBudW1iZXIpOiBzdHJpbmcge1xuICAgIC8vIFRoZSBwb3NpdGlvbiBjb21lcyB0aGUgc2l6ZSBvZiBhIDF4MSB0aWxlIHBsdXMgZ3V0dGVyIGZvciBlYWNoIHByZXZpb3VzIHRpbGUgaW4gdGhlXG4gICAgLy8gcm93L2NvbHVtbiAob2Zmc2V0KS5cbiAgICByZXR1cm4gb2Zmc2V0ID09PSAwID8gJzAnIDogY2FsYyhgKCR7YmFzZVNpemV9ICsgJHt0aGlzLl9ndXR0ZXJTaXplfSkgKiAke29mZnNldH1gKTtcbiAgfVxuXG5cbiAgLyoqXG4gICAqIEdldHMgdGhlIGFjdHVhbCBzaXplIG9mIGEgdGlsZSwgZS5nLiwgd2lkdGggb3IgaGVpZ2h0LCB0YWtpbmcgcm93c3BhbiBvciBjb2xzcGFuIGludG8gYWNjb3VudC5cbiAgICogQHBhcmFtIGJhc2VTaXplIEJhc2Ugc2l6ZSBvZiBhIDF4MSB0aWxlIChhcyBjb21wdXRlZCBpbiBnZXRCYXNlVGlsZVNpemUpLlxuICAgKiBAcGFyYW0gc3BhbiBUaGUgdGlsZSdzIHJvd3NwYW4gb3IgY29sc3Bhbi5cbiAgICogQHJldHVybiBTaXplIG9mIHRoZSB0aWxlIGFzIGEgQ1NTIGNhbGMoKSBleHByZXNzaW9uLlxuICAgKi9cbiAgZ2V0VGlsZVNpemUoYmFzZVNpemU6IHN0cmluZywgc3BhbjogbnVtYmVyKTogc3RyaW5nIHtcbiAgICByZXR1cm4gYCgke2Jhc2VTaXplfSAqICR7c3Bhbn0pICsgKCR7c3BhbiAtIDF9ICogJHt0aGlzLl9ndXR0ZXJTaXplfSlgO1xuICB9XG5cblxuICAvKipcbiAgICogU2V0cyB0aGUgc3R5bGUgcHJvcGVydGllcyB0byBiZSBhcHBsaWVkIHRvIGEgdGlsZSBmb3IgdGhlIGdpdmVuIHJvdyBhbmQgY29sdW1uIGluZGV4LlxuICAgKiBAcGFyYW0gdGlsZSBUaWxlIHRvIHdoaWNoIHRvIGFwcGx5IHRoZSBzdHlsaW5nLlxuICAgKiBAcGFyYW0gcm93SW5kZXggSW5kZXggb2YgdGhlIHRpbGUncyByb3cuXG4gICAqIEBwYXJhbSBjb2xJbmRleCBJbmRleCBvZiB0aGUgdGlsZSdzIGNvbHVtbi5cbiAgICovXG4gIHNldFN0eWxlKHRpbGU6IE1hdEdyaWRUaWxlLCByb3dJbmRleDogbnVtYmVyLCBjb2xJbmRleDogbnVtYmVyKTogdm9pZCB7XG4gICAgLy8gUGVyY2VudCBvZiB0aGUgYXZhaWxhYmxlIGhvcml6b250YWwgc3BhY2UgdGhhdCBvbmUgY29sdW1uIHRha2VzIHVwLlxuICAgIGxldCBwZXJjZW50V2lkdGhQZXJUaWxlID0gMTAwIC8gdGhpcy5fY29scztcblxuICAgIC8vIEZyYWN0aW9uIG9mIHRoZSB2ZXJ0aWNhbCBndXR0ZXIgc2l6ZSB0aGF0IGVhY2ggY29sdW1uIHRha2VzIHVwLlxuICAgIC8vIEZvciBleGFtcGxlLCBpZiB0aGVyZSBhcmUgNSBjb2x1bW5zLCBlYWNoIGNvbHVtbiB1c2VzIDQvNSA9IDAuOCB0aW1lcyB0aGUgZ3V0dGVyIHdpZHRoLlxuICAgIGxldCBndXR0ZXJXaWR0aEZyYWN0aW9uUGVyVGlsZSA9ICh0aGlzLl9jb2xzIC0gMSkgLyB0aGlzLl9jb2xzO1xuXG4gICAgdGhpcy5zZXRDb2xTdHlsZXModGlsZSwgY29sSW5kZXgsIHBlcmNlbnRXaWR0aFBlclRpbGUsIGd1dHRlcldpZHRoRnJhY3Rpb25QZXJUaWxlKTtcbiAgICB0aGlzLnNldFJvd1N0eWxlcyh0aWxlLCByb3dJbmRleCwgcGVyY2VudFdpZHRoUGVyVGlsZSwgZ3V0dGVyV2lkdGhGcmFjdGlvblBlclRpbGUpO1xuICB9XG5cbiAgLyoqIFNldHMgdGhlIGhvcml6b250YWwgcGxhY2VtZW50IG9mIHRoZSB0aWxlIGluIHRoZSBsaXN0LiAqL1xuICBzZXRDb2xTdHlsZXModGlsZTogTWF0R3JpZFRpbGUsIGNvbEluZGV4OiBudW1iZXIsIHBlcmNlbnRXaWR0aDogbnVtYmVyLFxuICAgICAgICAgICAgICAgZ3V0dGVyV2lkdGg6IG51bWJlcikge1xuICAgIC8vIEJhc2UgaG9yaXpvbnRhbCBzaXplIG9mIGEgY29sdW1uLlxuICAgIGxldCBiYXNlVGlsZVdpZHRoID0gdGhpcy5nZXRCYXNlVGlsZVNpemUocGVyY2VudFdpZHRoLCBndXR0ZXJXaWR0aCk7XG5cbiAgICAvLyBUaGUgd2lkdGggYW5kIGhvcml6b250YWwgcG9zaXRpb24gb2YgZWFjaCB0aWxlIGlzIGFsd2F5cyBjYWxjdWxhdGVkIHRoZSBzYW1lIHdheSwgYnV0IHRoZVxuICAgIC8vIGhlaWdodCBhbmQgdmVydGljYWwgcG9zaXRpb24gZGVwZW5kcyBvbiB0aGUgcm93TW9kZS5cbiAgICBsZXQgc2lkZSA9IHRoaXMuX2RpcmVjdGlvbiA9PT0gJ3J0bCcgPyAncmlnaHQnIDogJ2xlZnQnO1xuICAgIHRpbGUuX3NldFN0eWxlKHNpZGUsIHRoaXMuZ2V0VGlsZVBvc2l0aW9uKGJhc2VUaWxlV2lkdGgsIGNvbEluZGV4KSk7XG4gICAgdGlsZS5fc2V0U3R5bGUoJ3dpZHRoJywgY2FsYyh0aGlzLmdldFRpbGVTaXplKGJhc2VUaWxlV2lkdGgsIHRpbGUuY29sc3BhbikpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDYWxjdWxhdGVzIHRoZSB0b3RhbCBzaXplIHRha2VuIHVwIGJ5IGd1dHRlcnMgYWNyb3NzIG9uZSBheGlzIG9mIGEgbGlzdC5cbiAgICovXG4gIGdldEd1dHRlclNwYW4oKTogc3RyaW5nIHtcbiAgICByZXR1cm4gYCR7dGhpcy5fZ3V0dGVyU2l6ZX0gKiAoJHt0aGlzLl9yb3dzcGFufSAtIDEpYDtcbiAgfVxuXG4gIC8qKlxuICAgKiBDYWxjdWxhdGVzIHRoZSB0b3RhbCBzaXplIHRha2VuIHVwIGJ5IHRpbGVzIGFjcm9zcyBvbmUgYXhpcyBvZiBhIGxpc3QuXG4gICAqIEBwYXJhbSB0aWxlSGVpZ2h0IEhlaWdodCBvZiB0aGUgdGlsZS5cbiAgICovXG4gIGdldFRpbGVTcGFuKHRpbGVIZWlnaHQ6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgcmV0dXJuIGAke3RoaXMuX3Jvd3NwYW59ICogJHt0aGlzLmdldFRpbGVTaXplKHRpbGVIZWlnaHQsIDEpfWA7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyB0aGUgdmVydGljYWwgcGxhY2VtZW50IG9mIHRoZSB0aWxlIGluIHRoZSBsaXN0LlxuICAgKiBUaGlzIG1ldGhvZCB3aWxsIGJlIGltcGxlbWVudGVkIGJ5IGVhY2ggdHlwZSBvZiBUaWxlU3R5bGVyLlxuICAgKiBAZG9jcy1wcml2YXRlXG4gICAqL1xuICBhYnN0cmFjdCBzZXRSb3dTdHlsZXModGlsZTogTWF0R3JpZFRpbGUsIHJvd0luZGV4OiBudW1iZXIsIHBlcmNlbnRXaWR0aDogbnVtYmVyLFxuICAgICAgICAgICAgICAgICAgICAgICAgZ3V0dGVyV2lkdGg6IG51bWJlcik6IHZvaWQ7XG5cbiAgLyoqXG4gICAqIENhbGN1bGF0ZXMgdGhlIGNvbXB1dGVkIGhlaWdodCBhbmQgcmV0dXJucyB0aGUgY29ycmVjdCBzdHlsZSBwcm9wZXJ0eSB0byBzZXQuXG4gICAqIFRoaXMgbWV0aG9kIGNhbiBiZSBpbXBsZW1lbnRlZCBieSBlYWNoIHR5cGUgb2YgVGlsZVN0eWxlci5cbiAgICogQGRvY3MtcHJpdmF0ZVxuICAgKi9cbiAgZ2V0Q29tcHV0ZWRIZWlnaHQoKTogW3N0cmluZywgc3RyaW5nXSB8IG51bGwgeyByZXR1cm4gbnVsbDsgfVxuXG4gIC8qKlxuICAgKiBDYWxsZWQgd2hlbiB0aGUgdGlsZSBzdHlsZXIgaXMgc3dhcHBlZCBvdXQgd2l0aCBhIGRpZmZlcmVudCBvbmUuIFRvIGJlIHVzZWQgZm9yIGNsZWFudXAuXG4gICAqIEBwYXJhbSBsaXN0IEdyaWQgbGlzdCB0aGF0IHRoZSBzdHlsZXIgd2FzIGF0dGFjaGVkIHRvLlxuICAgKiBAZG9jcy1wcml2YXRlXG4gICAqL1xuICBhYnN0cmFjdCByZXNldChsaXN0OiBUaWxlU3R5bGVUYXJnZXQpOiB2b2lkO1xufVxuXG5cbi8qKlxuICogVGhpcyB0eXBlIG9mIHN0eWxlciBpcyBpbnN0YW50aWF0ZWQgd2hlbiB0aGUgdXNlciBwYXNzZXMgaW4gYSBmaXhlZCByb3cgaGVpZ2h0LlxuICogRXhhbXBsZSBgPG1hdC1ncmlkLWxpc3QgY29scz1cIjNcIiByb3dIZWlnaHQ9XCIxMDBweFwiPmBcbiAqIEBkb2NzLXByaXZhdGVcbiAqL1xuZXhwb3J0IGNsYXNzIEZpeGVkVGlsZVN0eWxlciBleHRlbmRzIFRpbGVTdHlsZXIge1xuXG4gIGNvbnN0cnVjdG9yKHB1YmxpYyBmaXhlZFJvd0hlaWdodDogc3RyaW5nKSB7IHN1cGVyKCk7IH1cblxuICBpbml0KGd1dHRlclNpemU6IHN0cmluZywgdHJhY2tlcjogVGlsZUNvb3JkaW5hdG9yLCBjb2xzOiBudW1iZXIsIGRpcmVjdGlvbjogc3RyaW5nKSB7XG4gICAgc3VwZXIuaW5pdChndXR0ZXJTaXplLCB0cmFja2VyLCBjb2xzLCBkaXJlY3Rpb24pO1xuICAgIHRoaXMuZml4ZWRSb3dIZWlnaHQgPSBub3JtYWxpemVVbml0cyh0aGlzLmZpeGVkUm93SGVpZ2h0KTtcblxuICAgIGlmICghY3NzQ2FsY0FsbG93ZWRWYWx1ZS50ZXN0KHRoaXMuZml4ZWRSb3dIZWlnaHQpKSB7XG4gICAgICB0aHJvdyBFcnJvcihgSW52YWxpZCB2YWx1ZSBcIiR7dGhpcy5maXhlZFJvd0hlaWdodH1cIiBzZXQgYXMgcm93SGVpZ2h0LmApO1xuICAgIH1cbiAgfVxuXG4gIHNldFJvd1N0eWxlcyh0aWxlOiBNYXRHcmlkVGlsZSwgcm93SW5kZXg6IG51bWJlcik6IHZvaWQge1xuICAgIHRpbGUuX3NldFN0eWxlKCd0b3AnLCB0aGlzLmdldFRpbGVQb3NpdGlvbih0aGlzLmZpeGVkUm93SGVpZ2h0LCByb3dJbmRleCkpO1xuICAgIHRpbGUuX3NldFN0eWxlKCdoZWlnaHQnLCBjYWxjKHRoaXMuZ2V0VGlsZVNpemUodGhpcy5maXhlZFJvd0hlaWdodCwgdGlsZS5yb3dzcGFuKSkpO1xuICB9XG5cbiAgZ2V0Q29tcHV0ZWRIZWlnaHQoKTogW3N0cmluZywgc3RyaW5nXSB7XG4gICAgcmV0dXJuIFtcbiAgICAgICdoZWlnaHQnLCBjYWxjKGAke3RoaXMuZ2V0VGlsZVNwYW4odGhpcy5maXhlZFJvd0hlaWdodCl9ICsgJHt0aGlzLmdldEd1dHRlclNwYW4oKX1gKVxuICAgIF07XG4gIH1cblxuICByZXNldChsaXN0OiBUaWxlU3R5bGVUYXJnZXQpIHtcbiAgICBsaXN0Ll9zZXRMaXN0U3R5bGUoWydoZWlnaHQnLCBudWxsXSk7XG5cbiAgICBpZiAobGlzdC5fdGlsZXMpIHtcbiAgICAgIGxpc3QuX3RpbGVzLmZvckVhY2godGlsZSA9PiB7XG4gICAgICAgIHRpbGUuX3NldFN0eWxlKCd0b3AnLCBudWxsKTtcbiAgICAgICAgdGlsZS5fc2V0U3R5bGUoJ2hlaWdodCcsIG51bGwpO1xuICAgICAgfSk7XG4gICAgfVxuICB9XG59XG5cblxuLyoqXG4gKiBUaGlzIHR5cGUgb2Ygc3R5bGVyIGlzIGluc3RhbnRpYXRlZCB3aGVuIHRoZSB1c2VyIHBhc3NlcyBpbiBhIHdpZHRoOmhlaWdodCByYXRpb1xuICogZm9yIHRoZSByb3cgaGVpZ2h0LiAgRXhhbXBsZSBgPG1hdC1ncmlkLWxpc3QgY29scz1cIjNcIiByb3dIZWlnaHQ9XCIzOjFcIj5gXG4gKiBAZG9jcy1wcml2YXRlXG4gKi9cbmV4cG9ydCBjbGFzcyBSYXRpb1RpbGVTdHlsZXIgZXh0ZW5kcyBUaWxlU3R5bGVyIHtcblxuICAvKiogUmF0aW8gd2lkdGg6aGVpZ2h0IGdpdmVuIGJ5IHVzZXIgdG8gZGV0ZXJtaW5lIHJvdyBoZWlnaHQuICovXG4gIHJvd0hlaWdodFJhdGlvOiBudW1iZXI7XG4gIGJhc2VUaWxlSGVpZ2h0OiBzdHJpbmc7XG5cbiAgY29uc3RydWN0b3IodmFsdWU6IHN0cmluZykge1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy5fcGFyc2VSYXRpbyh2YWx1ZSk7XG4gIH1cblxuICBzZXRSb3dTdHlsZXModGlsZTogTWF0R3JpZFRpbGUsIHJvd0luZGV4OiBudW1iZXIsIHBlcmNlbnRXaWR0aDogbnVtYmVyLFxuICAgICAgICAgICAgICAgZ3V0dGVyV2lkdGg6IG51bWJlcik6IHZvaWQge1xuICAgIGxldCBwZXJjZW50SGVpZ2h0UGVyVGlsZSA9IHBlcmNlbnRXaWR0aCAvIHRoaXMucm93SGVpZ2h0UmF0aW87XG4gICAgdGhpcy5iYXNlVGlsZUhlaWdodCA9IHRoaXMuZ2V0QmFzZVRpbGVTaXplKHBlcmNlbnRIZWlnaHRQZXJUaWxlLCBndXR0ZXJXaWR0aCk7XG5cbiAgICAvLyBVc2UgcGFkZGluZy10b3AgYW5kIG1hcmdpbi10b3AgdG8gbWFpbnRhaW4gdGhlIGdpdmVuIGFzcGVjdCByYXRpbywgYXNcbiAgICAvLyBhIHBlcmNlbnRhZ2UtYmFzZWQgdmFsdWUgZm9yIHRoZXNlIHByb3BlcnRpZXMgaXMgYXBwbGllZCB2ZXJzdXMgdGhlICp3aWR0aCogb2YgdGhlXG4gICAgLy8gY29udGFpbmluZyBibG9jay4gU2VlIGh0dHA6Ly93d3cudzMub3JnL1RSL0NTUzIvYm94Lmh0bWwjbWFyZ2luLXByb3BlcnRpZXNcbiAgICB0aWxlLl9zZXRTdHlsZSgnbWFyZ2luVG9wJywgdGhpcy5nZXRUaWxlUG9zaXRpb24odGhpcy5iYXNlVGlsZUhlaWdodCwgcm93SW5kZXgpKTtcbiAgICB0aWxlLl9zZXRTdHlsZSgncGFkZGluZ1RvcCcsIGNhbGModGhpcy5nZXRUaWxlU2l6ZSh0aGlzLmJhc2VUaWxlSGVpZ2h0LCB0aWxlLnJvd3NwYW4pKSk7XG4gIH1cblxuICBnZXRDb21wdXRlZEhlaWdodCgpOiBbc3RyaW5nLCBzdHJpbmddIHtcbiAgICByZXR1cm4gW1xuICAgICAgJ3BhZGRpbmdCb3R0b20nLCBjYWxjKGAke3RoaXMuZ2V0VGlsZVNwYW4odGhpcy5iYXNlVGlsZUhlaWdodCl9ICsgJHt0aGlzLmdldEd1dHRlclNwYW4oKX1gKVxuICAgIF07XG4gIH1cblxuICByZXNldChsaXN0OiBUaWxlU3R5bGVUYXJnZXQpIHtcbiAgICBsaXN0Ll9zZXRMaXN0U3R5bGUoWydwYWRkaW5nQm90dG9tJywgbnVsbF0pO1xuXG4gICAgbGlzdC5fdGlsZXMuZm9yRWFjaCh0aWxlID0+IHtcbiAgICAgIHRpbGUuX3NldFN0eWxlKCdtYXJnaW5Ub3AnLCBudWxsKTtcbiAgICAgIHRpbGUuX3NldFN0eWxlKCdwYWRkaW5nVG9wJywgbnVsbCk7XG4gICAgfSk7XG4gIH1cblxuICBwcml2YXRlIF9wYXJzZVJhdGlvKHZhbHVlOiBzdHJpbmcpOiB2b2lkIHtcbiAgICBjb25zdCByYXRpb1BhcnRzID0gdmFsdWUuc3BsaXQoJzonKTtcblxuICAgIGlmIChyYXRpb1BhcnRzLmxlbmd0aCAhPT0gMikge1xuICAgICAgdGhyb3cgRXJyb3IoYG1hdC1ncmlkLWxpc3Q6IGludmFsaWQgcmF0aW8gZ2l2ZW4gZm9yIHJvdy1oZWlnaHQ6IFwiJHt2YWx1ZX1cImApO1xuICAgIH1cblxuICAgIHRoaXMucm93SGVpZ2h0UmF0aW8gPSBwYXJzZUZsb2F0KHJhdGlvUGFydHNbMF0pIC8gcGFyc2VGbG9hdChyYXRpb1BhcnRzWzFdKTtcbiAgfVxufVxuXG4vKipcbiAqIFRoaXMgdHlwZSBvZiBzdHlsZXIgaXMgaW5zdGFudGlhdGVkIHdoZW4gdGhlIHVzZXIgc2VsZWN0cyBhIFwiZml0XCIgcm93IGhlaWdodCBtb2RlLlxuICogSW4gb3RoZXIgd29yZHMsIHRoZSByb3cgaGVpZ2h0IHdpbGwgcmVmbGVjdCB0aGUgdG90YWwgaGVpZ2h0IG9mIHRoZSBjb250YWluZXIgZGl2aWRlZFxuICogYnkgdGhlIG51bWJlciBvZiByb3dzLiAgRXhhbXBsZSBgPG1hdC1ncmlkLWxpc3QgY29scz1cIjNcIiByb3dIZWlnaHQ9XCJmaXRcIj5gXG4gKlxuICogQGRvY3MtcHJpdmF0ZVxuICovXG5leHBvcnQgY2xhc3MgRml0VGlsZVN0eWxlciBleHRlbmRzIFRpbGVTdHlsZXIge1xuICBzZXRSb3dTdHlsZXModGlsZTogTWF0R3JpZFRpbGUsIHJvd0luZGV4OiBudW1iZXIpOiB2b2lkIHtcbiAgICAvLyBQZXJjZW50IG9mIHRoZSBhdmFpbGFibGUgdmVydGljYWwgc3BhY2UgdGhhdCBvbmUgcm93IHRha2VzIHVwLlxuICAgIGxldCBwZXJjZW50SGVpZ2h0UGVyVGlsZSA9IDEwMCAvIHRoaXMuX3Jvd3NwYW47XG5cbiAgICAvLyBGcmFjdGlvbiBvZiB0aGUgaG9yaXpvbnRhbCBndXR0ZXIgc2l6ZSB0aGF0IGVhY2ggY29sdW1uIHRha2VzIHVwLlxuICAgIGxldCBndXR0ZXJIZWlnaHRQZXJUaWxlID0gKHRoaXMuX3Jvd3MgLSAxKSAvIHRoaXMuX3Jvd3M7XG5cbiAgICAvLyBCYXNlIHZlcnRpY2FsIHNpemUgb2YgYSBjb2x1bW4uXG4gICAgbGV0IGJhc2VUaWxlSGVpZ2h0ID0gdGhpcy5nZXRCYXNlVGlsZVNpemUocGVyY2VudEhlaWdodFBlclRpbGUsIGd1dHRlckhlaWdodFBlclRpbGUpO1xuXG4gICAgdGlsZS5fc2V0U3R5bGUoJ3RvcCcsIHRoaXMuZ2V0VGlsZVBvc2l0aW9uKGJhc2VUaWxlSGVpZ2h0LCByb3dJbmRleCkpO1xuICAgIHRpbGUuX3NldFN0eWxlKCdoZWlnaHQnLCBjYWxjKHRoaXMuZ2V0VGlsZVNpemUoYmFzZVRpbGVIZWlnaHQsIHRpbGUucm93c3BhbikpKTtcbiAgfVxuXG4gIHJlc2V0KGxpc3Q6IFRpbGVTdHlsZVRhcmdldCkge1xuICAgIGlmIChsaXN0Ll90aWxlcykge1xuICAgICAgbGlzdC5fdGlsZXMuZm9yRWFjaCh0aWxlID0+IHtcbiAgICAgICAgdGlsZS5fc2V0U3R5bGUoJ3RvcCcsIG51bGwpO1xuICAgICAgICB0aWxlLl9zZXRTdHlsZSgnaGVpZ2h0JywgbnVsbCk7XG4gICAgICB9KTtcbiAgICB9XG4gIH1cbn1cblxuXG4vKiogV3JhcHMgYSBDU1Mgc3RyaW5nIGluIGEgY2FsYyBmdW5jdGlvbiAqL1xuZnVuY3Rpb24gY2FsYyhleHA6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBgY2FsYygke2V4cH0pYDtcbn1cblxuXG4vKiogQXBwZW5kcyBwaXhlbHMgdG8gYSBDU1Mgc3RyaW5nIGlmIG5vIHVuaXRzIGFyZSBnaXZlbi4gKi9cbmZ1bmN0aW9uIG5vcm1hbGl6ZVVuaXRzKHZhbHVlOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gdmFsdWUubWF0Y2goLyhbQS1aYS16JV0rKSQvKSA/IHZhbHVlIDogYCR7dmFsdWV9cHhgO1xufVxuXG4iXX0=