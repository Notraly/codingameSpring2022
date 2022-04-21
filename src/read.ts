import { arrayOf, Point2D } from './utils';

/**
 * read one or many line
 */
export function r(): string;
export function r(nb: number): string[];
export function r(nb?: number): string|string[] {
	if(nb !== undefined){
		return arrayOf(nb,()=>r());
	}
	let line = readline();
	if (line === "DEBUG"){
		line = r();
		debugger;
	}
	return line;
}

/**
 * read one or many line (line is a list of char (string[]))
 */
export function rc(): string[];
export function rc(nb: number): string[][];
export function rc(nb?: number): string[]|string[][]{
	if(nb !== undefined){
		return arrayOf(nb,()=>rc());
	}
	return [...r()];
}

/**
 * read one or many line splited by space (line is a list of word (string[]))
 */
export function rs(): string[];
export function rs(nb: number): string[][];
export function rs(nb?: number): string[]|string[][] {
	if(nb !== undefined){
		return arrayOf(nb,()=>rs());
	}
	return r().split(' ');
}

/**
 * read one line that is number
 * return the number in this line
 */
export function rn(): number {
	return Number(r());
}

/**
 * read one line that contains numbers spaced by a space char
 */
export function rns(): number[] {
	return rs().map(Number);
}

/**
 * read one line that contains 2 number spaced bar space char
 * return the 2d point wher x is first number and y the second one.
 */
export function rp(): Point2D {
	return rns() as Point2D;
}
