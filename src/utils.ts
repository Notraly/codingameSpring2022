
export type Point2D = [number, number];

export function isEqual(a: Point2D, b: Point2D){
	return a[0]===b[0] && a[1]===b[1];
}

/**
 * check if object is a function
 * @param functionToCheck
 */
export function isFunction(functionToCheck) {
	return functionToCheck && {}.toString.call(functionToCheck) === '[object Function]';
}

/**
 * transpose a 2d array
 */
export function transposeArray<T>(array: T[][]): T[][] {
	return array[0].map((col, i) => array.map(row => row[i]));
}

/**
 * Create array for him length and value was define bay function or by a default value
 * Example:
 * arrayOf(3, 'ABC') => ['ABC', 'ABC', 'ABC']
 * arrayOf(4, (val, i)=>i*i) => [0,1,4,9]
 * @param size
 * @param defaultValue
 */
export function arrayOf<T = number>(size: number, defaultValue?: ((empty: {}, index: number) => T) | T): T[] {
	return Array.from({length: size}, (isFunction(defaultValue) ? defaultValue : (v, i) => defaultValue === undefined ? i : defaultValue) as any);
}

/**
 * generate a string by using function or repetition
 * Example:
 * strOf(5, '+') => '+++++'
 * strOf(4, (val, i)=>(i).toString()) => '0123':
 * strOf(3, 'ABC') => 'ABCABCABC'
 * @param size
 * @param defaultValue
 */
export function strOf(size: number, defaultValue?: ((empty: {}, index: number) => string) | string): string {
	return arrayOf(size,defaultValue).join('');
}

export function map<T, U>(v: T, fc: (v: T) => U): U {
	return fc(v);
}

/**
 * Check if point is in polygon
 * @param point
 * @param polygon
 */
export function inPolygon(point: Point2D, polygon: Point2D[]) {
	// ray-casting algorithm based on
	// http://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html

	let [x, y] = point;

	let inside = false;
	for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
		let xi = polygon[i][0], yi = polygon[i][1];
		let xj = polygon[j][0], yj = polygon[j][1];

		let intersect = ((yi > y) != (yj > y))
			&& (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
		if (intersect) inside = !inside;
	}

	return inside;
}

/**
 * Return Vector(A,B) or B-A
 */
export function diff(a: Point2D, b: Point2D): Point2D {
	return [b[0] - a[0], b[1] - a[1]];
}

/**
 * return |A|² or |AB|²
 */
export function distance2(a: Point2D, b: Point2D = [0, 0]): number {
	const [dx, dy] = diff(a, b);
	return dx * dx + dy * dy;
}

/**
 * return |A| or |AB|
 */
export function distance(a: Point2D, b: Point2D = [0, 0]): number {
	return Math.sqrt(distance2(a, b));
}

export function isOrthogonal(a: Point2D, b: Point2D): boolean {
	return a[0] * b[0] + a[1] * b[1] === 0;
}

/**
 * Distance Manhattan
 * return |Ax|+|Ay| or |Ax-Bx|+|Ay-By|
 */
export function distanceSum(a: Point2D, b: Point2D = [0, 0]): number {
	return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]);
}

/**
 * Distance chebyshev
 * @param a
 * @param b
 */
export function distanceMax(a: Point2D, b: Point2D = [0, 0]): number {
	return Math.max(Math.abs(a[0] - b[0]), Math.abs(a[1] - b[1]));
}

export function tap<T>(value: T, callback: (T) => void) {
	callback(value);
	return value;
}

/**
 * return the sum of 2 point
 * @param a
 * @param b
 */
export function addPoint(a: Point2D, b: Point2D): Point2D {
	return [a[0] + b[0], a[1] + b[1]];
}
