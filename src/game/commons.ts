import {Point2D} from "../utils";

export interface CampPosition {
	pos: Point2D;
	heroId: number;
}

export const MANA_MINI = 20;
export const MANA_MINI_FOR_ATTACK = 20;
export const MANA_ECO_FOR_ATTACK = 180;

export const WIND_ZONE = 1200;
export const HERO_ZONE = 2200;


export const MAP_WIDTH = 17630;
export const MAP_HEIGHT = 9000;

export const OPPONENT_MIND_ZONE = 2200;
export const OPPONENT_WIND_FORCE_ZONE = 2200;
export const EXTENDED_BASE = 7000;

export const INIT_CAMP_ATTACK: Point2D[] = [
	[10323, 7373],
	[11504, 7542],
	[16226, 2551],
]
