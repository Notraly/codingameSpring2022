import {rn, rns, rp} from '../read';
import {Base} from "./base";
import {EntityType, FarAwayTarget, Hero, Monster} from "./entity";
import {diff, distance, Point2D} from "../utils";
import {Action, ActionMove} from "./action";

/**
 * Contain all information about stat of game
 * Usfule for save many status of game.
 * Usage example:
 * const action1 = new Action...(...);
 * const action2 = new Action...(...);
 * const status1 = game.status.clone();
 * const status2 = game.status.clone();
 * action1.applyAction(action1);
 * action2.applyAction(action2);
 * const bestStatus = myFunctionThatFindBestStatus([status1,status2])
 * if(bestStatus === status1){
 *     action1.doAction();
 * }else{
 *     action1.doAction();
 * }
 */
export class GameStatus {

	constructor() {
	}

	clone() {
		return new GameStatus(
		)
	}

}

/**
 * there exist only one instance of this object (it's the main object)
 */
export class Game {
	myBase: Base;
	opponentBase: Base;
	heroesPerPlayer: number;
	entityCount: number;
	monsters: Monster[] = [];
	myHeroes: Hero[] = [];
	opponentHeroes: Hero[] = [];
	possibleActions: Action[] = [];

	/**
	 * methode call for init
	 */
	init() {
		this.myBase = {
			position: rp(),
			health: undefined,
			mana: undefined
		}
		this.heroesPerPlayer = rn();
	}

	/**
	 * use for read input and update game data
	 */
	readLoop() {
		this.myHeroes = [];
		this.opponentHeroes = [];
		this.monsters = [];

		let temp: number[] = rns();
		this.myBase = {
			...this.myBase,
			health: temp[0],
			mana: temp[1]
		}

		temp = rns();
		this.opponentBase = {
			position: undefined,
			health: temp[0],
			mana: temp[1]
		}
		this.entityCount = rn();

		console.error('myBase:', this.myBase);
		console.error('opponentBase:', this.opponentBase);
		console.error('entityCount:', this.entityCount);

		for (let i = 0; i < this.entityCount; i++) {

			let data = rns()

			let id = data[0];
			let type: EntityType = data[1];
			let position: Point2D = [data[2],data[3]];
			let shieldLife = data[4];
			let isControlled = !!data[5];
			let health = data[6];
			let speedVector: Point2D = [data[7],data[8]];
			let nearBase = !!data[9];
			let threatFor = data[10];

			switch (type) {
				case EntityType.MONSTER:
					this.monsters.push(
						{
							id,
							type,
							position,
							shieldLife,
							isControlled,
							health,
							speedVector,
							nearBase,
							threatFor,
						}
					);

					break;
				case EntityType.MY_HEROES:
					this.myHeroes.push(
						{
							id,
							type,
							position,
							shieldLife,
							isControlled,
						}
					)
					break;
				case EntityType.OPPONENT_HEROES:
					this.opponentHeroes.push(
						{
							id,
							type,
							position,
							shieldLife,
							isControlled,
						}
					);
					break;
			}
		}
	}

	getMonsterNearBasePossible(): Monster[]{
		let nearMonsters = [];
		this.monsters.forEach((monster: Monster) => {
			if (monster.threatFor === 1){
				nearMonsters.push(monster);
			}
		})
		return nearMonsters;
	}

	getActionToExecute(heroId: number): Action {
		return this.possibleActions.best((action) => {
			return this.scoreAction(action, heroId);
		});
	}

	scoreAction(action: Action, heroId: number): number{
		let score = 0;
		if (action instanceof ActionMove){

			if (heroId === action.heroId){
				let hero = this.myHeroes.find((hero) => hero.id === action.heroId);
				if (distance(hero.position, action.positionToGo) < 10000){
					score += 5;
				}
				if (distance(this.myBase.position, action.positionToGo) < 4000){
					score += 10;
				}
			}
		}
		return score;
	}

	getNearestHeroOfPosition(targetPosition:Point2D): number{
		let nearestHero = this.myHeroes[0];
		let nearestHeroDistance = distance(targetPosition, nearestHero.position);
		this.myHeroes.map((hero) => {
			let possibleHeroDistance = distance(targetPosition, hero.position);
			if(possibleHeroDistance < nearestHeroDistance){
				nearestHero = hero;
				nearestHeroDistance = possibleHeroDistance;
			}
		})
		return nearestHero.id;
	}

	/**
	 * game loop
	 */
	loop() {
		this.readLoop();

		this.getMonsterNearBasePossible().map((monster) => {
			this.possibleActions.push(new ActionMove(monster.position, this.getNearestHeroOfPosition(monster.position)));
		})

		// TODO if myHero pos > cercle rayon 8000 : ramener hero au centre de ce cercle

		this.myHeroes.map((hero) => {
			if(this.getActionToExecute(hero.id)){
				let id = this.getActionToExecute(hero.id)?.doAction();
				this.possibleActions.splice(this.possibleActions.findIndex((action) => action.id === id), 1)
			} else {
				console.log('MOVE 3263 2588');
				console.log('WAIT');

				// TODO if wait : wait sur le cercle de la base
			}
		})


		// let indexOfAction = this.possibleActions.findIndex((action) => action.id === actionId)
		// this.possibleActions.splice(indexOfAction, 1);

	}

	/**
	 * function caller for determinate witch action should be played
	 */



	addMessage(msg: string) {
		console.error(msg);
		//this.msgs.push(msg);
	}
}
