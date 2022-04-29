import {rn, rns, rp} from '../read';
import {Base} from "./base";
import {EntityType, Hero, Monster} from "./entity";
import {addPoint, distance, isEqual, Point2D} from "../utils";
import {Action, ActionCamp, ActionMove, ActionMoveToMonster, ActionShield, ActionWind} from "./action";
import {
	CampPosition,
	MANA_MINI,
	MAP_HEIGHT,
	MAP_WIDTH,
	EXTENDED_BASE,
	OPPONENT_MIND_ZONE,
	WIND_ZONE
} from "./commons";

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
	campForAttack: Point2D[] = [];
	hasBeenMindControlled = false;
	attackModOn = false;
	attackTouchEveryFourRound: {count: number, nbRound: number};
	round: number = 0;

	/**
	 * methode call for init
	 */
	init() {
		this.myBase = {
			position: rp(),
			health: undefined,
			mana: undefined
		}
		this.campPos = [
			{pos: [12144, 6728], heroId: -1},
			{pos: [12952, 4623], heroId: -1},
			{pos: [15358, 3514], heroId: -1}
		]

		this.campForAttack = [
			[9312, 1096],
			[8000, 4131],
			[5658, 5780],
			[2510, 6249]
		]

		if (isEqual(this.myBase.position, [0, 0])) {
			for (const {pos} of this.campPos) {
				pos[0] = MAP_WIDTH - pos[0];
				pos[1] = MAP_HEIGHT - pos[1];
			}
			for (const attackPos of this.campForAttack) {
				attackPos[0] = MAP_WIDTH - attackPos[0];
				attackPos[1] = MAP_HEIGHT - attackPos[1];
			}
		}

		this.heroesPerPlayer = rn();
	}

	/**
	 * use for read input and update game data
	 */
	readLoop() {
		this.round++;
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
		const res = this.myHeroes.find((hero) => hero.id === heroId);
		if (!res) {
			console.error(this.myHeroes.map(hero => hero.id));
		}
		return res;
	}

	countHitBeforeMonsterDeath(monster: Monster): number {
		return Math.ceil(monster.health / 2);
	}

	countRoundBeforeMonsterInBase(monster: Monster): number {
		return Math.trunc(distance(this.myBase.position, monster.position) / 400);
	}

	countHeroPerMonster(monster: Monster): number {
		let ratio = Math.round((this.countHitBeforeMonsterDeath(monster) / this.countRoundBeforeMonsterInBase(monster)) * 100) / 100;
		// console.error('ratio', ratio, 'monsterId', monster.id, 'monsterHitBforeDeath', this.countHitBeforeMonsterDeath(monster), 'countRound', this.countRoundBeforeMonsterInBase(monster));
		let nbHero = 1;

		if (ratio >= 1) {
			nbHero = 2;
		} else if (ratio > 2) {
			nbHero = 0;
		}
		return nbHero;
	}

	getHighPriorityAction(): Action {
		// console.error('possible action for HPA', JSON.stringify(this.possibleActions, null, '\t'));
		let action;
		if (this.possibleActions.length > 0) {
			action = this.possibleActions.best((action) => this.actionScore(action));
		}
		if (action) {
			// this.logAction(action, 'HPA:');
			return action;
		} else {
			// console.error('HPA: go to camp');
			return new ActionCamp(this.campPos);
		}
	}

	fillActionWithNearestMonster() {
		this.possibleActions = [];

		this.getMonsterNearBasePossible().map((monster) => {
			let distanceFromBase = distance(monster.position, this.myBase.position);
			if (distanceFromBase < EXTENDED_BASE) {
				let posToGo = addPoint(monster.position, monster.speedVector);
				this.possibleActions.push(new ActionMoveToMonster(monster, this.countHeroPerMonster(monster), posToGo));
			} else {
				this.possibleActions.push(new ActionMoveToMonster(monster, this.countHeroPerMonster(monster)));
			}

			// console.error(
			// 	'monster Id:', monster.id,
			// 	'hits left:', this.countHitBeforeMonsterDeath(monster),
			// 	'round left:', this.countRoundBeforeMonsterInBase(monster),
			// 	'nbHero:', this.countHeroPerMonster(monster)
			// );
		})
		// console.error('possible action', JSON.stringify(this.possibleActions, null, '\t'));
	}

	isActionFull(action: Action, nbHero?: number): boolean {
		let count;
		if (nbHero) {
			count = nbHero;
		} else {
			count = action.nbHero;
		}
		this.actionForThisRound.forEach((actionToDo) => {
			if (actionToDo.action.id === action.id) {
				count--;
			}
		})
		return count === 0;
	}

	getMonsterInBase(inExtendedBase: boolean = false): Monster[] {
		let monsters: Monster[] = [];
		this.getMonsterNearBasePossible().forEach((monster) => {
			if (inExtendedBase){
				if (distance(this.myBase.position, monster.position) < EXTENDED_BASE) {
					monsters.push(monster)
				}
			} else {
				if (distance(this.myBase.position, monster.position) < 5000) {
					monsters.push(monster)
				}
			}
		})
		return monsters;
	}

	fillActionWithWind() {
		let monsterInBase = this.getMonsterInBase();
		if (monsterInBase.length >= 2) {

			let direction = [5939, 4019];
			if (!isEqual(this.myBase.position, [0, 0])) {
				direction[0] = MAP_WIDTH - direction[0];
				direction[1] = MAP_HEIGHT - direction[1];
			}

			monsterInBase.forEach((monster) => {
				let action = new ActionWind(monster, direction);
				// console.error('fill action', action);
				this.possibleActions.push(action);
			})
		}
	}

	nextCampForAttacker(): Point2D {
		let oldCamp = this.campForAttack[0];
		this.campForAttack.splice(0, 1);
		this.campForAttack.push(oldCamp);
		let nextCamp = this.campForAttack[0];
		console.error('next camp for attacker:', nextCamp);
		return nextCamp;
	}

	heroHasBeenMindControl() {
		this.myHeroes.forEach((hero) => {
			if (hero.isControlled) {
				this.hasBeenMindControlled = true;
				console.error('hasBeenMindControlled', this.hasBeenMindControlled);
			}
		});
	}

	isNearOpponentHeroNearMyBase(hero: Hero): boolean {
		let isNearOpponentHeroNearMyBase = false;
		// console.error('opponent heroes', this.opponentHeroes);
		this.opponentHeroes.forEach((opponent) => {
				let nearOpponentDistance = distance(hero.position, opponent.position);
				// console.error('nearOpponentDistance', nearOpponentDistance);
				let heroNearBaseDistance = distance(hero.position, this.myBase.position);
				// console.error('heroNearBaseDistance', heroNearBaseDistance);
				if (nearOpponentDistance < OPPONENT_MIND_ZONE && heroNearBaseDistance < EXTENDED_BASE) {
					isNearOpponentHeroNearMyBase = true;
					// console.error('isNearOpponentHeroNearMyBase', isNearOpponentHeroNearMyBase);
				}
			}
		)
		return isNearOpponentHeroNearMyBase;
	}

	fillActionForThisRoundShieldForMyHero(heroLeft: Hero[]): Hero[] {
		// console.error('heroLeft', heroLeft)
		let newHeroLeft = heroLeft.map((hero) => {
			// console.error('hero', hero);
			if (this.hasBeenMindControlled && this.isNearOpponentHeroNearMyBase(hero) && hero.shieldLife === 0) {
				let action = new ActionShield(hero.id);
				this.logAction(action, 'H' + hero.id);
				this.actionForThisRound.push({
					action: action,
					heroId: hero.id,
				});
			} else {
				return hero;
			}
		}).filter(hero => hero);
		// console.error('newHeroLeft', newHeroLeft);
		return newHeroLeft;
	}

	//hero that attack is always id 2
	updateCountEnoughAttackTouch(){
		if (this.attackModOn){
			let hero = this.getHeroById(2);

			let monsterTouch = this.monsters.map((monster) => {
				let distanceMonsterHero = distance(hero.position, monster.position);
				if (distanceMonsterHero < 800){
					this.attackTouchEveryFourRound.count++;
					return monster
				}
			}).filter(monster => monster);

			this.attackTouchEveryFourRound.nbRound++;

			if (this.attackTouchEveryFourRound.nbRound === 4){
				this.attackTouchEveryFourRound = {
					count: 0,
					nbRound: 0,
				}
			}
		}
	}

	// Todo Attack mode for hero id 2

	// Todo updateAttackMode
	
	// updateAttackMode(): boolean{
	// 	if (this.myBase.health < 3) {
	// 		this.attackModOn = false;
	// 	}
	//
	// 	if (this.getMonsterInBase(true).length > 4) {
	// 		this.attackModOn = false
	// 	}
	//
	// 	if ()
	// };

	/**
	 * game loop
	 */
	loop() {
		this.readLoop();

		this.fillActionWithNearestMonster();

		if (this.myBase.mana > MANA_MINI) {
			this.fillActionWithWind();
		}

		let heroLeft = this.myHeroes.map(hero => hero);

		let manaLeft = this.myBase.mana;

		if (!this.hasBeenMindControlled) {
			this.heroHasBeenMindControl();
		}

		//shield my hero if near opponent, near my base and opponent has already mind controlled one of my hero in this game
		heroLeft = this.fillActionForThisRoundShieldForMyHero(heroLeft);

		while (this.actionForThisRound.length < 3) {
			// console.error('------------------------------------')
			// console.error('heroLeft', heroLeft.map(hero => hero.id));
			// console.error('action for this round (begin while)', JSON.stringify(this.actionForThisRound, null, '\t'));

			let action = this.getHighPriorityAction();

			// console.error('HPA:', JSON.stringify(action, null, '\t'));


			for (let i = 0; i < action.nbHero; i++) {
				// console.error('hero left beginning for', heroLeft);
				if (heroLeft.length > 0) {


					if (action instanceof ActionMoveToMonster) {


						let nearestHeroId = this.getNearestHeroOfPositionInList(action.monster.position, heroLeft);

						// console.error('nearest hero id:', nearestHeroId);

						this.actionForThisRound.push({
							action: action,
							heroId: nearestHeroId,
						});
						let indexInHeroLeft = heroLeft.findIndex((hero) => hero.id === nearestHeroId);
						heroLeft.splice(indexInHeroLeft, 1);

						// console.error('action is full', this.isActionFull(action));
						if (this.isActionFull(action)) {
							let index = this.possibleActions.findIndex((possibleAction) => possibleAction.id === action.id);
							this.possibleActions.splice(index, 1);
						}

					} else if (action instanceof ActionCamp) {
						let heroId = heroLeft[0].id;
						action.heroId = heroId;
						// this.logAction(action);
						// console.error('hero id to camp:', heroId)

						action.setCamp();

						this.actionForThisRound.push({
							action: action,
							heroId: heroId,
						})
						heroLeft.splice(0, 1);
					} else if (action instanceof ActionWind) {

						if (manaLeft - 10 > MANA_MINI) {
							if (action.heroId === -1) {
								action.heroId = this.getNearestHeroOfPositionInList(action.monster.position, heroLeft);
							}

							// console.error('>> nearest hero id:', action.heroId);
							// console.error('action', action);
							// this.logAction(action, '>');
							let nearestHero = this.getHeroById(action.heroId);
							// console.error('nearestHero', nearestHero);

							// if distance between hero and monster > WIND_ZONE
							let distanceL = Math.round(distance(nearestHero.position, action.monster.position));
							// console.error('> distanceL', distanceL, 'H', nearestHero.id, 'M', action.monster.id);

							let actionToDo;

							if (distanceL > WIND_ZONE) {
								// console.error('>> need to move', 'H', nearestHero.id);

								let ratio = 1 - (WIND_ZONE / distanceL);

								let X = action.monster.position[0] + action.monster.speedVector[0] - nearestHero.position[0];
								let Y = action.monster.position[1] + action.monster.speedVector[1] - nearestHero.position[1];
								let newX = nearestHero.position[0] + X * ratio;
								let newY = nearestHero.position[1] + Y * ratio;

								action.moveToBefore = [Math.round(newX), Math.round(newY)];

								actionToDo = new ActionMove(action.moveToBefore);

								this.actionForThisRound.push({
									action: actionToDo,
									heroId: nearestHero.id,
								})
							} else {
								actionToDo = action;

								this.actionForThisRound.push({
									action: actionToDo,
									heroId: nearestHero.id,
								})

								manaLeft -= 10;
							}

							let heroLeftIndex = heroLeft.findIndex((possibleHero) => possibleHero.id === nearestHero.id);
							heroLeft.splice(heroLeftIndex, 1);

							if (actionToDo instanceof ActionMove) {
								// console.error('action ' + actionToDo.id + ' is full ?', this.isActionFull(actionToDo, action.nbHero));
								if (this.isActionFull(actionToDo, action.nbHero)) {
									let index = this.possibleActions.findIndex((possibleAction) => possibleAction.id === action.id);
									this.possibleActions.splice(index, 1);
								}
							} else {
								// console.error('action ' + actionToDo.id + ' is full ?', this.isActionFull(actionToDo));
								if (this.isActionFull(actionToDo)) {
									let index = this.possibleActions.findIndex((possibleAction) => possibleAction.id === actionToDo.id);
									this.possibleActions.splice(index, 1);
								}
							}


							// console.error('/!\\ heroLeft', heroLeft.map(hero => hero.id));

						} else {
							let actionIndex = this.possibleActions.findIndex((possibleAction) => possibleAction.id === action.id);
							this.possibleActions.splice(actionIndex, 1);
							console.error('not enough mana, mana :', this.myBase.mana, 'manaLeft:', manaLeft);
						}
					}
				}

				// console.error('tempo action for this round (ends while):');
				// this.actionForThisRound.forEach((actionFor) => {
				// 	this.logAction(actionFor.action, '\theroId ' + actionFor.heroId);
				// })
			}
		}

		console.error('action for this round');
		this.actionForThisRound.forEach((actionFor) => {
			this.logAction(actionFor.action, '\theroId ' + actionFor.heroId);
		})

		this.actionForThisRound
			.sort((first, second) => 0 - (first.heroId > second.heroId ? -1 : 1))
			.map((action) => {
				let msg = [];
				if (action.action instanceof ActionMoveToMonster) {
					if (action.action.posToGo){
						msg.push('H' + action.heroId, 't:' + action.action.monster.id, 'move:', action.action.posToGo[0] + ',' + action.action.posToGo[1]);
					} else {
						msg.push('H' + action.heroId, 'target:', action.action.monster.id);
					}

				} else if (action.action instanceof ActionWind) {
					msg.push('H' + action.heroId, 'wind:', action.action.monster.id);
				} else if (action.action instanceof ActionCamp) {
					let index = action.heroId;
					if (action.heroId > 2) {
						index = action.heroId - 3;
					}
					msg.push('H' + action.heroId, 'camp: ', this.campPos[index].pos[0] + ',' + this.campPos[index].pos[1]);
				} else if (action.action instanceof ActionMove) {
					msg.push('H' + action.heroId, 'move:', action.action.posToGo[0] + ',' + action.action.posToGo[1]);
				}
				action.action.doAction(msg);
			})
		// .map((action) => action.action.doAction([action.heroId.toString()]))

		this.actionForThisRound = [];
		this.updateCountEnoughAttackTouch();
	}

	/**
	 * function caller for determinate witch action should be played
	 */

	actionScore(action: Action): number {
		let score = 0;
		if (action instanceof ActionMoveToMonster) {
			let distanceMonsterBase = distance(this.myBase.position, action.monster.position);

			if (distanceMonsterBase < 2000) {
				score += 50;
			} else if (distanceMonsterBase < 2500) {
				score += 45;
			} else if (distanceMonsterBase < 3000) {
				score += 40;
			} else if (distanceMonsterBase < 4000) {
				score += 30;
			} else if (distanceMonsterBase < 5000) {
				score += 20;
			}

			// Todo action wind prioritaire
		} else if (action instanceof ActionWind) {
			let distanceMonsterBase = distance(this.myBase.position, action.monster.position);

			if (distanceMonsterBase < 4000) {
				score += 100
			} else {
				score += 50
			}


		}
		// this.logAction(action, 'score ' + score + ' ||')
		// console.error('score:', score);
		return score;
	}

	// Todo faire fonctionner cette fonction

	// nearestPointOnCircle(B: Point2D): Point2D {
	// 	let A = this.myBase.position;
	// 	const radius = 5000;
	//
	// 	let denominateur = Math.sqrt((B[0] - A[0]) * (B[0] - A[0]) + (B[1] - A[1]) * (B[1] - A[1]));
	//
	// 	let resX = A[0] + (radius * (B[0] - A[0]) / denominateur);
	// 	let resY = A[1] + (radius * (B[1] - A[1]) / denominateur);
	//
	// 	return [resX, resY];
	// }

	addMessage(msg: string) {
		console.error(msg);
		//this.msgs.push(msg);
	}

	logAction(action: Action, initMsg: string = '') {
		if (action instanceof ActionCamp) {
			console.error(initMsg, 'ActionCamp:', action.id, 'heroId:', action.heroId);
		} else if (action instanceof ActionMoveToMonster) {
			console.error(initMsg, 'ActionMoveToMonster:', action.id, 'monster:', action.monster.id, 'nbHero:', action.nbHero, 'posToGo', action?.posToGo);
		} else if (action instanceof ActionWind) {
			console.error(initMsg, 'ActionWind:', action.id, 'monster:', action.monster.id, 'heroId:', action.heroId, 'moveToBefore:', action.moveToBefore, 'nbHero:', action.nbHero);
		} else if (action instanceof ActionMove) {
			console.error(initMsg, 'ActionMove:', action.id, 'posToGo:', action.posToGo);
		} else if (action instanceof ActionShield) {
			console.error(initMsg, 'ActionShield:', action.id, 'entityId:', action.entityId);
		}
	}

}
