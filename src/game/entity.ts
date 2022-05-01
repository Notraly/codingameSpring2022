import {Point2D} from "../utils";

export enum EntityType {
	MONSTER,
	MY_HEROES,
	OPPONENT_HEROES
}

export interface Entity {
	id: number;
	type: EntityType;
	position: Point2D;
	shieldLife: number;
	isControlled: boolean;
}

export enum FarAwayTarget {
	NO_BASE,
	MY_BASE,
	OPPONENT_BASE,
}
export enum NearBaseTarget {
	MY_BASE = 1,
	OPPONENT_BASE = 2,
}

export interface Monster extends Entity {
	health: number;
	speedVector: Point2D;
	nearBase: boolean;
	threatFor: FarAwayTarget | NearBaseTarget;
}

export interface Hero extends Entity {}
