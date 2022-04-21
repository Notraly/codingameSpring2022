import { arrayOf } from '../utils';

/**
 * This file contain type and constant that is given gy game definition
 */

export enum Direction {
	EST = 0,
	NORD_EST = 1,
	NORD_OUEST = 2,
	OUEST = 3,
	SUD_OUEST = 4,
	SUD_EST = 5
}

export type TreeSize = 0 | 1 | 2 | 3

export const DIRECTIONS: Direction[] = arrayOf(6, ((empty, index) => index));

export const ME = 1 as const;
export const OPPONENT = 0 as const;
export type ME = typeof ME;
export type OPPONENT = typeof OPPONENT;
export type OwnerId = ME | OPPONENT;

export const LAST_DAY = 23;

export const BONUS_BY_RICHNESS = [0, 0, 2, 4];
export const SUN_COST_BY_SIZE = [1, 3, 7, 4];
export const MIN_SUN_COST_BY_SIZE = [15, 14, 11, 4];
