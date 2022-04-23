import {Point2D} from "../utils";
import {Monster} from "./entity";

let baseId = 0;

export abstract class Action {
	public id: number;

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

	constructor(public monster: Monster, public nbHero: number) {
		super();
	}

	doAction(msgs: string[] = []){
		console.log('MOVE ' + this.monster.position[0] + ' ' + this.monster.position[1] + ' ' + msgs.join(' '));
		msgs.splice(0);
		this.nbHero--;

		return this.id;
	}

}

export class ActionWait extends Action {
	constructor(public heroId: number) {
		super();
	}

	doAction(msgs: string[] = []){
		console.log('WAIT ' + ' ' + msgs.join(' '));
		msgs.splice(0);
	}
}
