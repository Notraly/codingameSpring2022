import {rn, rns, rp} from '../read';
import {Base} from "./base";
import {EntityType, FarAwayTarget, Hero, Monster} from "./entity";
import {diff, distance, distance2, isEqual, Point2D} from "../utils";
import {Action, ActionMoveToMonster} from "./action";
import {CampPosition} from "./commons";

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
	campPos: CampPosition[] = []

	/**
	 * methode call for init
	 */
	init() {
		this.myBase = {
			position: rp(),
			health: undefined,
			mana: undefined
		}

		console.error(this.myBase.position)

		if (isEqual(this.myBase.position, [0, 0])) {
			this.campPos = [
				{pos: [1379, 4753], heroId: -1},
				{pos: [3522, 3368], heroId: -1},
				{pos: [4713, 1181], heroId: -1}
			]
		} else {
			this.campPos = [
				{pos: [12766, 7848], heroId: -1},
				{pos: [13740, 5727], heroId: -1},
				{pos: [15926, 4277], heroId: -1}
			]
		}

		console.error(this.campPos);

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

		// console.error('myBase:', this.myBase);
		// console.error('opponentBase:', this.opponentBase);
		// console.error('entityCount:', this.entityCount);

		for (let i = 0; i < this.entityCount; i++) {

			let data = rns()

			let id = data[0];
			let type: EntityType = data[1];
			let position: Point2D = [data[2], data[3]];
			let shieldLife = data[4];
			let isControlled = !!data[5];
			let health = data[6];
			let speedVector: Point2D = [data[7], data[8]];
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

	/**
	 * Useful functions
	 */
	getMonsterNearBasePossible(): Monster[] {
		let nearMonsters = [];
		this.monsters.forEach((monster: Monster) => {
			if (monster.threatFor === 1) {
				nearMonsters.push(monster);
			}
		})
		return nearMonsters;
	}

	isNearestHero(heroId: number, targetPosition: Point2D): boolean {
		return this.getNearestHeroOfPosition(targetPosition) === heroId;
	}

	getNearestHeroOfPosition(targetPosition: Point2D): number {
		let nearestHero = this.myHeroes[0];
		let nearestHeroDistance = distance(targetPosition, nearestHero.position);
		this.myHeroes.map((hero) => {
			let possibleHeroDistance = distance(targetPosition, hero.position);
			if (possibleHeroDistance < nearestHeroDistance) {
				nearestHero = hero;
				nearestHeroDistance = possibleHeroDistance;
			}
		})
		return nearestHero.id;
	}

	getHeroById(heroId: number): Hero {
		return this.myHeroes.find((hero) => hero.id === heroId);
	}

	goToNearestCampPos(heroId: number, msgs: string[] = []): void {

		let nearestCamp = this.campPos[heroId];
		console.log('MOVE ' + nearestCamp.pos[0] + ' ' + nearestCamp.pos[1] + ' ' + msgs.join(' '));
		msgs.splice(0);

		// let hero = this.getHeroById(heroId);
		// let nearestCampId = this.campPos.findIndex((camp) => camp.heroId === -1);
		// let oldCampId = this.campPos.findIndex((camp) => camp.heroId === heroId);
		//
		// // console.error('nearestCamp id', nearestCampId);
		// // console.error('oldCamp id', oldCampId);
		//
		// if (oldCampId != -1 && this.campPos[oldCampId].pos != hero.position) {
		// 	console.log('MOVE ' + this.campPos[oldCampId].pos[0] + ' ' + this.campPos[oldCampId].pos[1] + ' ' + msgs.join(' '));
		// 	msgs.splice(0);
		// } else {
		// 	for (let i = 0; i < 3; i++) {
		// 		// console.error('camp heroId', this.campPos[i].heroId);
		// 		if (this.campPos[i].heroId === -1) {
		//
		// 			// console.error('nearestCamp id:', nearestCampId);
		//
		// 			let oldDistance = oldCampId != -1 ? distance(this.campPos[oldCampId].pos, hero.position) : 20000;
		// 			let newDistance = distance(this.campPos[i].pos, hero.position);
		//
		// 			if (newDistance < oldDistance) {
		//
		// 				oldCampId = nearestCampId;
		// 				nearestCampId = i;
		//
		// 				// console.error('new nearestCamp id:', nearestCampId)
		// 			}
		// 		}
		//
		// 		if (this.campPos[i].heroId === heroId) {
		// 			console.log('MOVE ' + this.campPos[i].pos[0] + ' ' + this.campPos[i].pos[1] + ' ' + msgs.join(' '));
		// 			msgs.splice(0);
		// 		}
		//
		// 		// console.error('------------------------------------------');
		//
		// 	}
		//
		// 	// console.error('hero id', heroId);
		// 	// console.error('nearestCamp id', nearestCampId);
		// 	// console.error('oldCamp id', oldCampId);
		//
		// 	let nearestCamp = this.campPos[nearestCampId];
		// 	this.campPos[nearestCampId].heroId = heroId;
		// 	this.campPos[oldCampId].heroId = -1;
		//
		// 	// console.error('camps', this.campPos);
		//
		// 	console.log('MOVE ' + nearestCamp.pos[0] + ' ' + nearestCamp.pos[1] + ' ' + msgs.join(' '));
		// 	msgs.splice(0);
		//
		// }
	}

	countHitBeforeMonsterDeath(monster: Monster): number {
		return monster.health / 2;
	}

	countRoundBeforeMonsterInBase(monster: Monster) {
		return Math.trunc(distance(this.myBase.position, monster.position) / 400);
	}

	countHeroPerMonster(monster: Monster): number {
		let ratio = this.countRoundBeforeMonsterInBase(monster) / this.countHitBeforeMonsterDeath(monster);
		if (ratio > 1.5) {
			return 2;
		}
		if (ratio > 2) {
			return 3;
		}
		return 1;

	}

	/**
	 * game loop
	 */
	loop() {
		this.readLoop();

		this.myHeroes.map((hero) => {

		})

		this.getMonsterNearBasePossible().map((monster) => {
			let heroPerMonster: number;

			let oldActionId = this.possibleActions.findIndex((action) => {
				if ( action instanceof ActionMoveToMonster ){
					heroPerMonster = action.nbHero;
					return action.monster.id === monster.id;
				}
			});

			if (oldActionId) {
				this.possibleActions.splice(oldActionId, 1);
			}

			this.possibleActions.push(new ActionMoveToMonster(monster, heroPerMonster ? heroPerMonster : this.countHeroPerMonster(monster)));
			console.error(
				'monster Id:', monster.id,
				'hits left:', this.countHitBeforeMonsterDeath(monster),
				'round left:', this.countRoundBeforeMonsterInBase(monster),
				'nbHero:', this.countHeroPerMonster(monster)
			);
		})

		this.myHeroes.map((hero) => {
			if (this.getActionToExecute(hero.id)) {
				// console.error('heroId: ', hero.id);
				// console.error('action: ', this.getActionToExecute(hero.id))

				let id = this.getActionToExecute(hero.id)?.doAction();
				let idInlist = this.possibleActions.findIndex((action) => action.id === id);
				let action = this.possibleActions[idInlist];
				console.error('action choosed', action);
				console.error('-------------------------------------')
				if (action instanceof ActionMoveToMonster) {
					if (action.nbHero === 0) {
						this.possibleActions.splice(this.possibleActions.findIndex((action) => action.id === id), 1);
					}
				}

				let oldCampId = this.campPos.findIndex((camp) => camp.heroId === hero.id)
				// console.error('oldCampId', oldCampId);
				if (oldCampId != -1) {
					this.campPos[oldCampId].heroId = -1;
				}
			} else {
				// console.error('heroId: ', hero.id);
				this.goToNearestCampPos(hero.id);
			}
			// console.error('******************************************');
		})

	}

	/**
	 * function caller for determinate witch action should be played
	 */

	scoreAction(action: Action, heroId: number): number {
		let score = 0;
		if (action instanceof ActionMoveToMonster) {
			let hero = this.getHeroById(heroId);
			if (this.isNearestHero(heroId, action.monster.position)) {
				console.error('hero is the nearest');

				let distanceHeroMonster = distance(hero.position, action.monster.position);

				if (distanceHeroMonster < 8000) {
					score += 20;
				} else if (distanceHeroMonster < 4000) {
					score += 40;
				}

				let distanceMonsterBase = distance(this.myBase.position, action.monster.position);

				if (distanceMonsterBase < 5000) {
					score += 20
				}
				else if (distanceMonsterBase < 4000) {
					score += 30;
				} else if (distanceMonsterBase < 3000){
					score += 40;
				}

				if (action.nbHero > 1 && action.monster.nearBase && action.monster.threatFor){
					score += 40;
				}

			} else if (action.nbHero > 1) {
				let distanceMonsterBase = distance(this.myBase.position, action.monster.position);

				if (distanceMonsterBase < 4000) {
					score += 30;
				} else if (distanceMonsterBase < 3000){
					score += 40;
				}
			}
			console.error('hero id:', heroId, 'action:', action);
			console.error('action score: ', score);
			console.error('----------------------------------')
		}
		return score;
	}

	getActionToExecute(heroId: number): Action {
		return this.possibleActions.best((action) => {
			return this.scoreAction(action, heroId);
		});
	}


	addMessage(msg: string) {
		console.error(msg);
		//this.msgs.push(msg);
	}
}
