import {Hero, Monster} from "./entity";
import {CampPosition, MAP_HEIGHT, MAP_WIDTH} from "./commons";
import {distance, isEqual, Point2D} from "../utils";

let baseId = 0;

export abstract class Action {
	public id: number;
	public nbHero?: number;

	/**
	 * print
	 */
	abstract doAction(msg?: string[])

	protected constructor() {
		baseId += 1;
		this.id = baseId
	}
}

export class ActionMoveToMonster extends Action {

	constructor(public monster: Monster, nbHero: number, public posToGo?: Point2D) {
		super();
		this.nbHero = nbHero;
	}

	doAction(msgs: string[] = []) {
		if (this.posToGo) {
			console.log('MOVE ' + this.posToGo[0] + ' ' + this.posToGo[1] + ' ' + msgs.join(' '));
		} else {

			console.log('MOVE ' + this.monster.position[0] + ' ' + this.monster.position[1] + ' ' + msgs.join(' '));
		}
		msgs.splice(0);
		return this.id;
	}

}

export class ActionCamp extends Action {
	constructor(public camp: CampPosition[], public heroId?: number) {
		super();
		this.nbHero = 1;
	}

	setCamp() {
		// console.error('camps', this.camp);
		let index = this.heroId;
		//todo go to nearest one
		if (this.heroId > 2) {
			index = this.heroId - 3;
		}
		this.camp[index].heroId = this.heroId;
	}

	leaveCamp() {
		this.camp[this.heroId].heroId = -1;
	}


	doAction(msgs: string[] = []) {
		let index = this.heroId;
		//todo go to nearest one
		if (this.heroId > 2) {
			index = this.heroId - 3;
		}
		let nearestCamp = this.camp[index];
		console.log('MOVE ' + nearestCamp.pos[0] + ' ' + nearestCamp.pos[1] + ' ' + msgs.join(' '));
		msgs.splice(0);
	}
}

export class ActionWait extends Action {
	constructor() {
		super();
		this.nbHero = 1;
	}

	doAction(msgs: string[] = []) {
		console.log('WAIT ' + ' ' + msgs.join(' '));
		msgs.splice(0);
	}
}

export class ActionWindMonster extends Action {

	constructor(public monster: Monster, public direction: Point2D, public nbHero: number = 1, public moveToBefore?: Point2D, public heroId: number = -1) {
		super();

		// this.nbHero = nbHero; TODO set nbHero if a lot of monster
	}

	doAction(msgs: string[] = []) {
		console.log('SPELL ' + 'WIND ' + this.direction[0] + ' ' + this.direction[1] + ' ' + msgs.join(' '));
		msgs.splice(0);
		return this.id;
	}
}


export class ActionWindOpponent extends Action {

	constructor(public opponent: Hero, public direction, public nbHero: number = 1, public moveToBefore?: Point2D, public heroId: number = -1) {
		super();

		// this.nbHero = nbHero; TODO set nbHero if a lot of monster
	}

	doAction(msgs: string[] = []) {
		console.log('SPELL ' + 'WIND ' + this.direction[0] + ' ' + this.direction[1] + ' ' + msgs.join(' '));
		msgs.splice(0);
		return this.id;
	}
}

export class ActionMove extends Action {
	constructor(public posToGo: Point2D) {
		super();
		this.nbHero = 1;
	}

	doAction(msgs: string[] = []) {
		console.log('MOVE ' + this.posToGo[0] + ' ' + this.posToGo[1] + ' ' + msgs.join(' '));
		msgs.splice(0);
	}

}

export class ActionShield extends Action {
	constructor(public entityId: number) {
		super();
		this.nbHero = 1;
	}

	doAction(msgs: string[] = []) {
		console.log('SPELL ' + 'SHIELD ' + this.entityId + ' ' + msgs.join(' '));
		msgs.splice(0);
	}
}

export class ActionControlOpponent extends Action {
	constructor(public opponentId: number, public posToGo: Point2D) {
		super();
		this.nbHero = 1;
	}

	doAction(msgs: string[] = []) {
		console.log('SPELL ' + 'CONTROL ' + this.opponentId + ' ' + this.posToGo[0] + ' ' + this.posToGo[1] + ' ' + msgs.join(' '));
		msgs.splice(0);
	}
}

export class ActionCampAttack extends Action {
	constructor(public posToGo: Point2D, public heroId: number) {
		super();
		this.nbHero = 1;
	}

	doAction(msgs: string[] = []) {
		console.log('MOVE ' + this.posToGo[0] + ' ' + this.posToGo[1] + ' ' + msgs.join(' '));
		msgs.splice(0);
	}

}

export class ActionControlMonster extends Action {
	constructor(public monsterId: number, public posToGo: Point2D) {
		super();
		this.nbHero = 1;
	}

	doAction(msgs: string[] = []) {
		console.log('SPELL ' + 'CONTROL ' + this.monsterId + ' ' + this.posToGo[0] + ' ' + this.posToGo[1] + ' ' + msgs.join(' '));
		msgs.splice(0);
	}
}
