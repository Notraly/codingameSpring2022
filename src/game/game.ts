import {r, rn, rns, rp} from '../read';
import {Base} from "./base";
import {EntityType, FarAwayTarget, Hero, Monster} from "./entity";
import {diff, distance, distance2, isEqual, Point2D} from "../utils";
import {Action, ActionCamp, ActionMoveToMonster, ActionWait} from "./action";
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
	campPos: CampPosition[] = [];
	actionForThisRound: { action: Action, heroId: number }[] = [];

	/**
	 * methode call for init
	 */
	init() {
		this.myBase = {
			position: rp(),
			health: undefined,
			mana: undefined
		}

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
		// console.error('nearest Monsters', nearMonsters);
		return nearMonsters;
	}

	isMyNearestHero(heroId: number, targetPosition: Point2D): boolean {
		return this.getMyNearestHeroOfPosition(targetPosition) === heroId;
	}

	getMyNearestHeroOfPosition(targetPosition: Point2D): number {
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

	getNearestHeroOfPositionInList(targetPosition: Point2D, heroList: Hero[]): number {
		let nearestHero = heroList[0];
		let nearestHeroDistance = distance(targetPosition, nearestHero.position);
		heroList.map((hero) => {
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

	countHitBeforeMonsterDeath(monster: Monster): number {
		return Math.ceil(monster.health / 2);
	}

	countRoundBeforeMonsterInBase(monster: Monster): number {
		return Math.trunc(distance(this.myBase.position, monster.position) / 400);
	}

	countHeroPerMonster(monster: Monster): number {
		let ratio = Math.round((this.countHitBeforeMonsterDeath(monster) / this.countRoundBeforeMonsterInBase(monster)) * 100) / 100;
		console.error('ratio', ratio, 'monsterId', monster.id, 'monsterHitBforeDeath', this.countHitBeforeMonsterDeath(monster), 'countRound', this.countRoundBeforeMonsterInBase(monster));
		let nbHero = 1;

		if (ratio >= 0.5) {
			nbHero = 2;
		} else if (ratio > 0.7) {
			nbHero = 3;
		}

		return nbHero;
	}

	getHighPriorityAction(): Action {
		// console.error('possible action for HPA', JSON.stringify(this.possibleActions, null, '\t'));
		let action;
		if (this.possibleActions.length > 0){
			action = this.possibleActions.best((action) => this.actionScore(action));
		}
		if (action) {
			this.logAction(action, 'HPA:');
			return action;
		} else {
			console.error('HPA: go to camp');
			return new ActionCamp(this.campPos);
		}
	}

	fillActionWithNearestMonster() {
		this.possibleActions = [];

		this.getMonsterNearBasePossible().map((monster) => {
			let heroPerMonster: number;

			this.possibleActions.push(new ActionMoveToMonster(monster, heroPerMonster ? heroPerMonster : this.countHeroPerMonster(monster)));
			// console.error(
			// 	'monster Id:', monster.id,
			// 	'hits left:', this.countHitBeforeMonsterDeath(monster),
			// 	'round left:', this.countRoundBeforeMonsterInBase(monster),
			// 	'nbHero:', this.countHeroPerMonster(monster)
			// );
		})
		console.error('possible action', JSON.stringify(this.possibleActions, null, '\t'));
	}

	isActionFull(action: Action):boolean{
		let count = action.nbHero;
		this.actionForThisRound.forEach((actionToDo) => {
			if (actionToDo.action.id === action.id){
				count--;
			}
		})
		return count === 0;
	}

	/**
	 * game loop
	 */
	loop() {
		this.readLoop();

		this.fillActionWithNearestMonster();

		let heroLeft = this.myHeroes;

		while (this.actionForThisRound.length < 3) {
			// console.error('------------------------------------')
			// console.error('heroLeft', heroLeft);
			// console.error('action for this round (begin while)', JSON.stringify(this.actionForThisRound, null, '\t'));

			let action = this.getHighPriorityAction();

			// console.error('HPA:', JSON.stringify(action, null, '\t'));


			for (let i = 0; i < action.nbHero; i++) {
				// console.error('hero left beginning for', heroLeft);
				if (heroLeft.length > 0) {

					if (action instanceof ActionMoveToMonster) {


						let nearestHeroId = this.getNearestHeroOfPositionInList(action.monster.position, heroLeft);

						console.error('nearest hero id:', nearestHeroId);

						this.actionForThisRound.push({
							action: action,
							heroId: nearestHeroId,
						});
						let indexInHeroLeft = heroLeft.findIndex((hero) => hero.id === nearestHeroId);
						heroLeft.splice(indexInHeroLeft, 1);

						// console.error('action is full', this.isActionFull(action));
						if (this.isActionFull(action)){
							let index = this.possibleActions.findIndex((possibleAction) => possibleAction.id === action.id);
							this.possibleActions.splice(index, 1);
						}

					} else if (action instanceof ActionCamp) {
						let heroId = heroLeft[0].id;
						action.heroId = heroId;
						this.logAction(action);
						console.error('hero id to camp:', heroId)

						action.setCamp();

						this.actionForThisRound.push({
							action: action,
							heroId: heroId,
						})
						heroLeft.splice(0, 1);
					}
				}
				// console.error('hero left end for', heroLeft);
				// console.error('action for this round (ends while)', (JSON.stringify(this.actionForThisRound, null, '\t')));
				console.error('action for this round (ends while):');
				this.logAction(this.actionForThisRound[0]?.action, '\theroId' + this.actionForThisRound[0]?.heroId);
				this.logAction(this.actionForThisRound[1]?.action, '\theroId' + this.actionForThisRound[1]?.heroId);
				this.logAction(this.actionForThisRound[2]?.action, '\theroId' + this.actionForThisRound[2]?.heroId);
			}
		}

		// console.error('action for this round', JSON.stringify(this.actionForThisRound, null, '\t'));

		this.actionForThisRound
			.sort((first, second) => 0 - (first.heroId > second.heroId ? -1 : 1))
			.map((action) => action.action.doAction())
			// .map((action) => action.action.doAction([action.heroId.toString()]))

		this.actionForThisRound = [];
	}

	/**
	 * function caller for determinate witch action should be played
	 */

	actionScore(action: Action): number {
		let score = 0;
		if (action instanceof ActionMoveToMonster) {
			let distanceMonsterBase = distance(this.myBase.position, action.monster.position);

			if (distanceMonsterBase < 5000) {
				score += 20
			} else if (distanceMonsterBase < 4000) {
				score += 30;
			} else if (distanceMonsterBase < 3000) {
				score += 40;
			} else if (distanceMonsterBase < 2500) {
				score += 45;
			} else if (distanceMonsterBase < 2000) {
				score += 50;
			}
		}
		// console.error('action', JSON.stringify(action, null, '\t'), 'score:', score);
		return score;
	}

	// scoreAction(action: Action, heroId: number): number {
	// 	let score = 0;
	// 	if (action instanceof ActionMoveToMonster) {
	// 		let hero = this.getHeroById(heroId);
	// 		if (this.isNearestHero(heroId, action.monster.position)) {
	// 			console.error('hero', heroId, 'is the nearest');
	//
	// 			let distanceHeroMonster = distance(hero.position, action.monster.position);
	//
	// 			if (distanceHeroMonster < 8000) {
	// 				score += 20;
	// 			} else if (distanceHeroMonster < 4000) {
	// 				score += 40;
	// 			}
	//
	// 			let distanceMonsterBase = distance(this.myBase.position, action.monster.position);
	//
	// 			if (distanceMonsterBase < 5000) {
	// 				score += 20
	// 			}
	// 			else if (distanceMonsterBase < 4000) {
	// 				score += 30;
	// 			} else if (distanceMonsterBase < 3000){
	// 				score += 40;
	// 			}
	//
	// 			if (action.nbHero > 1 && action.monster.nearBase && action.monster.threatFor){
	// 				score += 40;
	// 			}
	//
	// 		} else if (action.nbHero > 1) {
	// 			let distanceMonsterBase = distance(this.myBase.position, action.monster.position);
	//
	// 			if (distanceMonsterBase < 4000) {
	// 				score += 30;
	// 			} else if (distanceMonsterBase < 3000){
	// 				score += 40;
	// 			}
	// 		}
	// 	}
	// 	return score;
	// }

	addMessage(msg: string) {
		console.error(msg);
		//this.msgs.push(msg);
	}

	logAction(action: Action, initMsg:string = ''){
		if (action instanceof ActionCamp){
			console.error(initMsg, 'ActionCamp:', action.id, 'heroId:', action.heroId);
		} else if (action instanceof ActionMoveToMonster){
			console.error(initMsg, 'ActionMoveToMonster:', action.id, 'monster:' ,action.monster.id, 'nbHero:', action.nbHero);
		}
	}

}
