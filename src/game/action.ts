import {Point2D} from "../utils";

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

export class ActionMove extends Action {

	constructor(public positionToGo: Point2D, public heroId: number) {
		super();
	}

	doAction(msgs: string[] = []){
		console.log('MOVE ' + this.positionToGo[0] + ' ' + this.positionToGo[1] + ' ' + msgs.join(' '));
		msgs.splice(0);
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
