/**
 * Reads a line from an input
 * @return {string} the read line
 */

declare let readline: () => string;

type T1<T> = [T];
type T2<T> = [T, T];
type T3<T> = [T, T, T];
type T4<T> = [T, T, T, T];
type T5<T> = [T, T, T, T, T];
type T6<T> = [T, T, T, T, T, T];

declare module NodeJS {
	interface Global {
		readline: () => string;
	}
}

/**
 * Prints given object to the output.
 * @param {*} object the object to print.
 */
declare function print(object: any): void;

/**
 * Prints debugging messages, without affecting game's logic.
 * @param {*} object the object to print.
 */
declare function printErr(object: any): void;

type cb<T, R> = (value: T, index: number, array: T[]) => R;

interface Array<T> {
	links: (widthFirstLast?: boolean) => [T, T][];
	// sum array of number
	sum: (initValue?: T, sumOp?: (a: T, b: T) => T) => T;
	permute: (index1: number, index2?: number) => void;
	// lick forEach but return itself
	do: <U>(callback: (value: T, index: number, array: T[]) => void, thisArg?: any) => T[];
	flatMap: <U>(callback: cb<T, U[]>, thisArg?: any) => U[];
	// remove one element
	delete: (target: T) => T[];
	// count the number of time that element exist
	count: (value: T) => number;
	chunk: (size: number) => T[][];
	maps: (<U extends Array<any>>(...callback: ((value: T, index: number, array: T[]) => any)[]) => U);
	zip: <R>(c?: cb<T, [string, R] | void | undefined | null> | R) => Record<string, R>;
	// sort number
	sortAsc: () => T[];
	// sort number
	sortDesc: () => T[];
	// return list where scorifyFc has return the bigest value
	most: (scorifyFc: (value: T, index: number, array: T[]) => number) => Most<T>;
	// return on of item where scorifyFc has return the bigest value
	best: (fc: (value: T, index: number, array: T[]) => number, end?: (max: number, value: T, index: number, array: T[]) => any) => T;
	add: (...T) => T[];
	// return element at length - 1
	last: () => T;
	// return element by using scorifyFc function form bigest to smaller
	sortScore: (callback: (value: T, index: number, array: T[]) => number) => T[]
}

interface Most<T> extends Array<T> {
	max: number;
	index: number[];
}

type int = number;
type uint = number;
type float = number;
