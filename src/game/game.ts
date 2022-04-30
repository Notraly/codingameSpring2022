import {rn, rns, rp} from '../read';
import {Base} from "./base";
import {EntityType, Hero, Monster} from "./entity";
import {addPoint, distance, distanceSum, isEqual, Point2D} from "../utils";
import {
	Action,
	ActionCamp, ActionCampAttack, ActionControlMonster, ActionControlOpponent,
	ActionMove,
	ActionMoveToMonster,
	ActionShield,
	ActionWindMonster,
	ActionWindOpponent
} from "./action";
import {
	CampPosition,
	MANA_MINI,
	MAP_HEIGHT,
	MAP_WIDTH,
	EXTENDED_BASE,
	OPPONENT_MIND_ZONE,
	WIND_ZONE, MANA_MINI_FOR_ATTACK
} from "./commons";


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
	hero2AttackTouch: boolean[] = [];
	round: number = 0;
	attackHeroId: number = 5;
	arrivedAtInitAttackPos: boolean = false;
	windDirection: Point2D = [5939, 4019];


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
			{pos: [15358, 3514], heroId: -1},
			{pos: [12952, 4623], heroId: -1},
		]

		// this.campForAttack = [
		// 	[12144, 6728],
		// 	[12952, 4623],
		// 	[15358, 3514],
		// ]

		this.campForAttack = [
			[10323, 7373],
			// [11616, 4712],
			[11185, 4375],
			[14914, 3288],
		]

		// this.campForAttack = [
		// 	[11035, 7679],
		// 	[11035, 7679],
		// 	[11035, 7679],
		// ]

		if (isEqual(this.myBase.position, [0, 0])) {
			this.attackHeroId = 2;

			for (const {pos} of this.campPos) {
				pos[0] = MAP_WIDTH - pos[0];
				pos[1] = MAP_HEIGHT - pos[1];
			}
		} else {
			for (const attackPos of this.campForAttack) {
				attackPos[0] = MAP_WIDTH - attackPos[0];
				attackPos[1] = MAP_HEIGHT - attackPos[1];
			}

			this.windDirection[0] = MAP_WIDTH - this.windDirection[0];
			this.windDirection[1] = MAP_HEIGHT - this.windDirection[1];
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
			position: [MAP_WIDTH - this.myBase.position[0], MAP_HEIGHT - this.myBase.position[1]],
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

	/** ---------------------------------------------------------------------------------------------------------------
	 * => GET functions
	 * -------------------------------------------------------------------------------------------------------------- */

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

	getMonsterInBase(inExtendedBase: boolean = false): Monster[] {
		let monsters: Monster[] = [];
		// console.error('inExtendedBase', true);
		this.getMonsterNearBasePossible().forEach((monster) => {
			if (inExtendedBase) {
				if (distance(this.myBase.position, monster.position) < EXTENDED_BASE) {
					// console.error('monster in extended base', monster.id);
					monsters.push(monster)
				}
			} else {
				if (distance(this.myBase.position, monster.position) < 5000) {
					// console.error('monster in base', monster.id);
					monsters.push(monster)
				}
			}
		})
		return monsters;
	}

	getOpponentInBase(inExtendedBase: boolean = false): Hero[] {
		let opponents: Hero[] = [];
		// console.error('inExtendedBase', true);
		this.opponentHeroes.forEach((opponent) => {
			if (inExtendedBase) {
				if (distance(this.myBase.position, opponent.position) < EXTENDED_BASE) {
					// console.error('opponent in extended base', opponent.id);
					opponents.push(opponent)
				}
			} else {
				if (distance(this.myBase.position, opponent.position) < 5000) {
					// console.error('opponent in base', opponent.id);
					opponents.push(opponent)
				}
			}
		})
		return opponents;
	}


	getMonsterNoShieldInBase(inExtendedBase: boolean = false): Monster[] {
		let monsters: Monster[] = [];
		// console.error('inExtendedBase', true);
		this.getMonsterNearBasePossible().forEach((monster) => {
			if (monster.shieldLife === 0) {
				if (inExtendedBase) {
					if (distance(this.myBase.position, monster.position) < EXTENDED_BASE) {
						// console.error('monster in extended base', monster.id);
						monsters.push(monster)
					}
				} else {
					if (distance(this.myBase.position, monster.position) < 5000) {
						// console.error('monster in base', monster.id);
						monsters.push(monster)
					}
				}
			}
		})
		return monsters;
	}

	getOpponentNoShieldInBase(inExtendedBase: boolean = false): Hero[] {
		let opponents: Hero[] = [];
		// console.error('inExtendedBase', true);
		this.getOpponentInBase(inExtendedBase).forEach((opponent) => {
			if (opponent.shieldLife === 0) {
				// console.error('opponent in base', opponent.id);
				opponents.push(opponent)
			}
		})
		return opponents;
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

	getMonsterNoShieldInOpponentBase(inExtendedBase: boolean = false): Monster[] {
		let monsters: Monster[] = [];
		// console.error('inExtendedBase', true);
		this.monsters.forEach((monster) => {
			if (monster.shieldLife === 0) {
				if (inExtendedBase) {
					if (distance(this.opponentBase.position, monster.position) < EXTENDED_BASE) {
						// console.error('monster in opponent extended base', monster.id);
						monsters.push(monster)
					}
				} else {
					if (distance(this.opponentBase.position, monster.position) < 5000) {
						// console.error('monster in opponent base', monster.id);
						monsters.push(monster)
					}
				}
			}
		})
		return monsters;
	}

	getOpponentNoShieldInOpponentBase(inExtendedBase: boolean = false): Hero[] {
		let opponents: Hero[] = [];
		// console.error('inExtendedBase', true);
		this.opponentHeroes.forEach((opponent) => {
			if (opponent.shieldLife === 0) {
				if (inExtendedBase) {
					if (distance(this.opponentBase.position, opponent.position) < EXTENDED_BASE) {
						// console.error('opponent in opponent extended base', monster.id);
						opponents.push(opponent)
					}
				} else {
					if (distance(this.opponentBase.position, opponent.position) < 5000) {
						// console.error('opponent in opponent base', monster.id);
						opponents.push(opponent)
					}
				}
			}
		})
		return opponents;
	}

	getMonsterNoShieldNearHero(heroId: number): Monster[] {
		let monsters: Monster[] = [];
		let hero = this.getHeroById(heroId);
		console.error('hero', hero);

		this.monsters.forEach((monster) => {
			if (monster.shieldLife === 0) {
				if (distance(hero.position, monster.position) < WIND_ZONE) {
					console.error('monster in hero WIND_ZONE', monster.id);
					monsters.push(monster)
				}
			}
		})
		return monsters;
	}


	/** ---------------------------------------------------------------------------------------------------------------
	 * => COUNT functions
	 * -------------------------------------------------------------------------------------------------------------- */

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


	/** ---------------------------------------------------------------------------------------------------------------
	 * => FILL functions
	 * -------------------------------------------------------------------------------------------------------------- */

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

	fillActionWithWind() {
		let monsterInBase = this.getMonsterNoShieldInBase();
		if (monsterInBase.length >= 1) {

			monsterInBase.forEach((monster) => {
				console.error('fillActionWithWind monster', monster)
				let action = new ActionWindMonster(monster, this.windDirection);
				// console.error('fill action', action);
				this.possibleActions.push(action);
			})
		}
	}

	fillActionWithWindOpponent() {
		let opponentInBase = this.getOpponentNoShieldInBase(true);

		let direction = this.opponentBase.position;

		opponentInBase.forEach((opponent) => {
			let action = new ActionWindOpponent(opponent, direction);
			// console.error('fill action', action);
			this.possibleActions.push(action);
		})

	}

	fillActionForThisRoundShieldForMyHero(heroLeft: Hero[]): Hero[] {
		// console.error('heroLeft', heroLeft)
		let newHeroLeft = heroLeft.map((hero) => {
			// console.error('hero', hero);
			// console.error('hasBeenMindControlled', this.hasBeenMindControlled);
			// console.error('heroShield', hero.shieldLife);
			// console.error('isNearOpponentHeroNearMyBase', this.isNearOpponentHeroNearMyBase(hero));

			if (this.attackModOn && hero.id === this.attackHeroId) {
				let nearOpponnent = false;
				this.opponentHeroes.forEach((opponent) => {
						let nearOpponentDistance = distance(hero.position, opponent.position);
						// console.error('nearOpponentDistance', nearOpponentDistance);
						let heroNearBaseDistance = distance(hero.position, this.opponentBase.position);
						// console.error('heroNearBaseDistance', heroNearBaseDistance);
						if (nearOpponentDistance < OPPONENT_MIND_ZONE && heroNearBaseDistance < EXTENDED_BASE) {
							nearOpponnent = true;
							// console.error('isNearOpponentHeroNearMyBase', isNearOpponentHeroNearMyBase);
						}
					}
				);

				if (this.hasBeenMindControlled && nearOpponnent && hero.shieldLife === 0) {
					let action = new ActionShield(hero.id);
					this.logAction(action, 'H' + hero.id);
					this.actionForThisRound.push({
						action: action,
						heroId: hero.id,
					});
				} else {
					return hero;
				}
			} else {
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
			}
		}).filter(hero => hero);
		// console.error('newHeroLeft', newHeroLeft);
		return newHeroLeft;
	}

	/** ---------------------------------------------------------------------------------------------------------------
	 * => IS functions
	 * -------------------------------------------------------------------------------------------------------------- */

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

	isMyNearestHero(heroId: number, targetPosition: Point2D): boolean {
		return this.getMyNearestHeroOfPosition(targetPosition) === heroId;
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

	isOpponentHeroNearMyBase(): boolean {
		let isOpponentHeroNearMyBase = false;
		this.opponentHeroes.forEach((opponent) => {
			let opponentDistanceFromBase = distance(this.myBase.position, opponent.position);
			// console.error('opponentDistanceFromBase', opponentDistanceFromBase);
			if (opponentDistanceFromBase < EXTENDED_BASE) {
				isOpponentHeroNearMyBase = true;
				// console.error('isOpponentHeroNearMyBase', isOpponentHeroNearMyBase);
			}
		});
		return isOpponentHeroNearMyBase;
	}

	isHero2TouchInLastNRound(nbRound: number): boolean {
		let hasTouched = false;
		let indexOffset = this.round - nbRound - 1;

		if (this.round < nbRound) {
			this.hero2AttackTouch.forEach((attack) => {
				if (attack) {
					hasTouched = true;
				}
			})
		} else {
			for (let i = 0; i < nbRound; i++) {
				if (this.hero2AttackTouch[indexOffset + i] === true) {
					hasTouched = true
				}
			}
		}
		return hasTouched
	}

	/** ---------------------------------------------------------------------------------------------------------------
	 * => OTHERS functions
	 * -------------------------------------------------------------------------------------------------------------- */

	nextCampForAttacker(): Point2D {
		let heroAttack = this.getHeroById(this.attackHeroId);
		let oldCamp = this.campForAttack[0];
		let nextCamp = oldCamp;
		if (distance(heroAttack.position, oldCamp) < 200) {
			this.campForAttack.splice(0, 1);
			this.campForAttack.push(oldCamp);
			nextCamp = this.campForAttack[0];
		}
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

	updateHero2HasAttacked() {
		let hero = this.getHeroById(this.attackHeroId);
		let touchThisRound = false;

		let monsterTouch = this.monsters.map((monster) => {
			let distanceMonsterHero = distance(hero.position, monster.position);
			// console.error('distanceMonsterHero', distanceMonsterHero);

			if (distanceMonsterHero < 800) {
				touchThisRound = true;
				return monster
			}
		}).filter(monster => monster);

		// console.error('monsterTouch', monsterTouch.map(monster => monster.id));

		this.hero2AttackTouch.push(touchThisRound);

		console.error('touchThisRound', touchThisRound);
	}

	// Todo updateAttackMode

	updateAttackMode() {
		let lastMode = this.attackModOn;

		console.error('attackModOn: ', this.attackModOn);
		// console.error('lastMode:', lastMode);
		// console.error('hero2AttackTouch', this.hero2AttackTouch)

		console.error(this.myBase.mana > MANA_MINI_FOR_ATTACK)
		if (this.myBase.mana > MANA_MINI_FOR_ATTACK) {
			this.attackModOn = true;
			console.error('baseMana > attackModOn: ', this.attackModOn);
		}

		// if (this.myBase.health < 3) {
		// 	this.attackModOn = false;
		// 	console.error('baseHealth > attackModOn: ', this.attackModOn);
		// }
		//
		// let monstersInBase = this.getMonsterInBase();
		//
		// // console.error('monstersInBase', monstersInBase.map(monster => monster.id));
		// if (monstersInBase.length > 5) {
		// 	this.attackModOn = false;
		// 	// console.error('monstersInBase > attackModOn: ', this.attackModOn);
		// }

		// // console.error('isHero2TouchInLastNRound', this.isHero2TouchInLastNRound(4));
		// if (!this.isHero2TouchInLastNRound(6)) {
		// 	this.attackModOn = false;
		// 	// console.error('isHero2TouchInLastNRound > attackModOn: ', this.attackModOn);
		// }

		// console.error('isOpponentHeroNearMyBase', this.isOpponentHeroNearMyBase());
		// if(this.isOpponentHeroNearMyBase()){
		// 	this.attackModOn = false;
		// 	console.error('isOpponentHeroNearMyBase > attackModOn: ', this.attackModOn);
		// }

		// console.error('end update attackModOn: ', this.attackModOn);

		// console.error('end update isHero2TouchInLastNRound', this.isHero2TouchInLastNRound(4));
	};

	actionMoveToMonsterNearHero(heroId: number): ActionMoveToMonster {
		let actionTodo;
		let hero = this.getHeroById(heroId);
		let newMonsterPossible = this.getMonsterNoShieldNearHero(heroId);

		let newMonster = newMonsterPossible.best((monster) => Math.round(distance(monster.position, hero.position)));
		console.error('monster', newMonster);
		if (newMonster) {
			actionTodo = new ActionMoveToMonster(newMonster, heroId);
		}
		return actionTodo;
	}

	actionWindMonsterNearHero(heroId: number): ActionWindMonster {
		let actionTodo;
		let hero = this.getHeroById(heroId);
		let newMonsterPossible = this.getMonsterNoShieldNearHero(heroId);

		console.error('newMonsterPossible', newMonsterPossible);
		let newMonster = newMonsterPossible.best((monster) => Math.round(distance(monster.position, hero.position)));
		console.error('monster', newMonster);
		if (newMonster) {
			actionTodo = new ActionWindMonster(newMonster, this.windDirection);
		}
		return actionTodo;
	}

	/** ---------------------------------------------------------------------------------------------------------------
	 * game loop
	 * -------------------------------------------------------------------------------------------------------------- */
	loop() {
		this.readLoop();

		this.updateAttackMode();

		this.fillActionWithNearestMonster();

		if (this.myBase.mana > MANA_MINI) {
			this.fillActionWithWind();
			this.fillActionWithWindOpponent();
		}

		let heroLeft = this.myHeroes.map(hero => hero);

		let manaLeft = this.myBase.mana;

		if (!this.hasBeenMindControlled) {
			this.heroHasBeenMindControl();
		}

		//shield my hero if near opponent, near my base and opponent has already mind controlled one of my hero in this game
		heroLeft = this.fillActionForThisRoundShieldForMyHero(heroLeft);

		if (this.attackModOn) {
			this.attackMod();
			let attackHeroIndex = heroLeft.findIndex((hero) => hero.id === this.attackHeroId);
			heroLeft.splice(attackHeroIndex, 1);
			console.error('heroLeft after attackMod', heroLeft.map(hero => hero.id));
		}
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
						let actionTodo = action;

						if (distance(action.monster.position, this.myBase.position) > 8000) {

							let newAction = this.actionMoveToMonsterNearHero(nearestHeroId);

							if (newAction) {
								actionTodo = newAction
							}
						}

						if (distance(action.monster.position, this.myBase.position) < 3000) {
							let newActionPossible = this.actionWindMonsterNearHero(nearestHeroId);
							if (newActionPossible) {
								actionTodo = newActionPossible
							}
						}


						console.error('actionToDo', actionTodo);
						this.actionForThisRound.push({
							action: actionTodo,
							heroId: nearestHeroId,
						});

						let indexInHeroLeft = heroLeft.findIndex((hero) => hero.id === nearestHeroId);
						heroLeft.splice(indexInHeroLeft, 1);

						// console.error('action is full', this.isActionFull(action));
						if (this.isActionFull(actionTodo)) {
							let index = this.possibleActions.findIndex((possibleAction) => possibleAction.id === actionTodo.id);
							this.possibleActions.splice(index, 1);
						}

					} else if (action instanceof ActionCamp) {

						let hero = heroLeft[0];

						let newAction = this.actionMoveToMonsterNearHero(hero.id);

						if (newAction) {
							console.error('new action in actionCamp', newAction);
							this.actionForThisRound.push({
								action: newAction,
								heroId: hero.id,
							})
						} else {
							action.heroId = hero.id;
							// this.logAction(action);
							// console.error('hero id to camp:', heroId)

							action.setCamp();

							this.actionForThisRound.push({
								action: action,
								heroId: hero.id,
							})
						}
						heroLeft.splice(0, 1);
					} else if (action instanceof ActionWindMonster) {

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

								// let ratio = 1 - (WIND_ZONE / distanceL);
								//
								// let X = action.monster.position[0] + action.monster.speedVector[0] - nearestHero.position[0];
								// let Y = action.monster.position[1] + action.monster.speedVector[1] - nearestHero.position[1];
								// let newX = nearestHero.position[0] + X * ratio;
								// let newY = nearestHero.position[1] + Y * ratio;
								//
								// action.moveToBefore = [Math.round(newX), Math.round(newY)];

								action.moveToBefore = addPoint(action.monster.position, action.monster.speedVector);

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
					} else if (action instanceof ActionWindOpponent) {

						if (manaLeft - 10 > MANA_MINI) {
							if (action.heroId === -1) {
								action.heroId = this.getNearestHeroOfPositionInList(action.opponent.position, heroLeft);
							}

							// console.error('>> nearest hero id:', action.heroId);
							// console.error('action', action);
							// this.logAction(action, '>');
							let nearestHero = this.getHeroById(action.heroId);
							// console.error('nearestHero', nearestHero);

							// if distance between hero and opponent > WIND_ZONE
							let distanceL = Math.round(distance(nearestHero.position, action.opponent.position));
							// console.error('> distanceL', distanceL, 'H', nearestHero.id, 'O', action.opponent.id);

							let actionToDo;

							if (distanceL > WIND_ZONE) {
								// console.error('>> need to move', 'H', nearestHero.id);

								// let ratio = 1 - (WIND_ZONE / distanceL);
								//
								// let X = action.opponent.position[0] - nearestHero.position[0];
								// let Y = action.opponent.position[1] - nearestHero.position[1];
								// let newX = nearestHero.position[0] + X * ratio;
								// let newY = nearestHero.position[1] + Y * ratio;
								//
								// action.moveToBefore = [Math.round(newX), Math.round(newY)];

								action.moveToBefore = action.opponent.position;

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
					if (action.action.posToGo) {
						msg.push('H' + action.heroId, 't:' + action.action.monster.id, 'move:', action.action.posToGo[0] + ',' + action.action.posToGo[1]);
					} else {
						msg.push('H' + action.heroId, 'target:', action.action.monster.id);
					}

				} else if (action.action instanceof ActionWindMonster) {
					msg.push('H' + action.heroId, 'wind:', action.action.monster.id);
				} else if (action.action instanceof ActionWindOpponent) {
					msg.push('H' + action.heroId, 'wind:', action.action.opponent.id);
				} else if (action.action instanceof ActionCamp) {
					let index = action.heroId;
					if (action.heroId > 2) {
						index = action.heroId - 3;
					}
					msg.push('H' + action.heroId, 'camp: ', this.campPos[index].pos[0] + ',' + this.campPos[index].pos[1]);
				} else if (action.action instanceof ActionMove) {
					msg.push('H' + action.heroId, 'move:', action.action.posToGo[0] + ',' + action.action.posToGo[1]);
				} else if (action.action instanceof ActionControlOpponent) {
					msg.push('H' + action.heroId, '0 control:', action.action.opponentId);
				} else if (action.action instanceof ActionCampAttack) {
					msg.push('H' + action.heroId, 'camp attack:', action.action.posToGo[0] + ',' + action.action.posToGo[1]);
				}
				action.action.doAction(msg);
			})
		// .map((action) => action.action.doAction([action.heroId.toString()]))

		this.actionForThisRound = [];
		this.updateHero2HasAttacked();
	}

	/** ---------------------------------------------------------------------------------------------------------------
	 * => others others functions
	 * -------------------------------------------------------------------------------------------------------------- */

	actionScore(action: Action): number {
		let score = 0;
		if (action instanceof ActionMoveToMonster) {
			let distanceMonsterBase = distance(this.myBase.position, action.monster.position);

			if (distanceMonsterBase < 2000) {
				score += 100;
			} else if (distanceMonsterBase < 2500) {
				score += 45;
			} else if (distanceMonsterBase < 3000) {
				score += 40;
			} else if (distanceMonsterBase < 4000) {
				score += 30;
			} else if (distanceMonsterBase < 5000) {
				score += 20;
			}

		} else if (action instanceof ActionWindMonster) {
			let distanceMonsterBase = distance(this.myBase.position, action.monster.position);

			if (distanceMonsterBase < 4000) {
				score += 100;
			} else {
				score += 50;
			}
			// this.logAction(action, 'score ' + score + ' ||')
		} else if (action instanceof ActionWindOpponent) {
			let distanceMonsterBase = distance(this.myBase.position, action.opponent.position);

			if (distanceMonsterBase < 4000) {
				score += 200;
			} else {
				score += 100;
			}
			// this.logAction(action, 'score ' + score + ' ||')
		}
		this.logAction(action, 'score ' + score + ' ||')
		// console.error('score:', score);
		return score;
	}

	// Todo Attack mode for hero attackHeroId
	attackMod() {
		let attackHero = this.getHeroById(this.attackHeroId);
		// console.error('attackHero', attackHero);
		if (distance(this.campForAttack[1], attackHero.position) < 800) {
			this.arrivedAtInitAttackPos = true;
		}

		if (this.arrivedAtInitAttackPos) {
			let attackActionPossible: Action[] = [];
			//todo fill attackActionPossible

			//todo fill -> wind mob or shield
			let monsterNoShieldInOpponentBase = this.getMonsterNoShieldInOpponentBase();
			console.error('monsterNoShieldInOpponentBase', monsterNoShieldInOpponentBase);

			monsterNoShieldInOpponentBase.forEach((monster) => {
				// console.error('distance attackHero monster', distance(attackHero.position, monster.position));
				console.error('monster', monster);
				if (!monster.nearBase && this.myBase.mana > MANA_MINI_FOR_ATTACK) {
					let actionControl = new ActionControlMonster(monster.id, this.opponentBase.position);
					attackActionPossible.push(actionControl);
				} else if (monster.threatFor === 2 && this.myBase.mana > MANA_MINI_FOR_ATTACK) {
					let actionShield = new ActionShield(monster.id);
					attackActionPossible.push(actionShield);
				} else if (distance(attackHero.position, monster.position) < WIND_ZONE && this.myBase.mana > MANA_MINI_FOR_ATTACK) {
					let actionWind = new ActionWindMonster(monster, this.opponentBase.position);
					// console.error('fill attack action', action);
					attackActionPossible.push(actionWind);
				} else {
					let moveToBefore = addPoint(monster.position, monster.speedVector);

					let actionMove = new ActionMove(moveToBefore);

					attackActionPossible.push(actionMove);
				}
			});

			if (this.myBase.mana > MANA_MINI_FOR_ATTACK) {
				let monsterNoShieldNearHero = this.getMonsterNoShieldNearHero(attackHero.id);
				monsterNoShieldNearHero.forEach((monster) => {
					let actionWind = new ActionWindMonster(monster, this.opponentBase.position);
					// console.error('fill attack action', action);
					attackActionPossible.push(actionWind);
				})

				//todo fill -> mind control opponent
				let opponentNoShieldInOpponentBase = this.getOpponentNoShieldInOpponentBase();

				opponentNoShieldInOpponentBase.forEach((opponent) => {
					let action = new ActionControlOpponent(opponent.id, this.myBase.position);
					// console.error('fill attack action', action);
					attackActionPossible.push(action);
				})
			}

			//todo call score() and select best option

			// console.error('possible action attack HPA', JSON.stringify(attackActionPossible, null, '\t'));
			let actionToDo;
			if (attackActionPossible.length > 0) {
				actionToDo = attackActionPossible.best((action) => this.actionScore(action));
			}

			if (actionToDo) {
				// this.logAction(action, 'HPA:');
				this.actionForThisRound.push({action: actionToDo, heroId: this.attackHeroId});
			} else {
				//todo si rien à faire camp to next attackPos

				// console.error('attack HPA: go to camp');
				let nextCamp = this.nextCampForAttacker();
				let actionCampAttack = new ActionCampAttack(nextCamp, this.attackHeroId);
				this.actionForThisRound.push({action: actionCampAttack, heroId: this.attackHeroId});
			}
		} else {
			this.actionForThisRound.push({action: new ActionMove(this.campForAttack[1]), heroId: this.attackHeroId});
		}
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
		} else if (action instanceof ActionWindMonster) {
			console.error(initMsg, 'ActionWindMonster:', action.id, 'monster:', action.monster.id, 'heroId:', action.heroId, 'moveToBefore:', action.moveToBefore, 'nbHero:', action.nbHero);
		} else if (action instanceof ActionWindOpponent) {
			console.error(initMsg, 'ActionWindOpponent:', action.id, 'monster:', action.opponent.id, 'heroId:', action.heroId, 'moveToBefore:', action.moveToBefore, 'nbHero:', action.nbHero);
		} else if (action instanceof ActionMove) {
			console.error(initMsg, 'ActionMove:', action.id, 'posToGo:', action.posToGo);
		} else if (action instanceof ActionShield) {
			console.error(initMsg, 'ActionShield:', action.id, 'entityId:', action.entityId);
		} else if (action instanceof ActionControlOpponent) {
			console.error(initMsg, 'ActionControlOpponent:', action.id, 'opponentId:', action.opponentId, 'posToGo:', action.posToGo);
		} else if (action instanceof ActionCampAttack) {
			console.error(initMsg, 'ActionCampAttack:', action.id, 'posToGo:', action.posToGo);
		} else if (action instanceof ActionControlMonster) {
			console.error(initMsg, 'ActionControlMonster:', action.id, 'opponentId:', action.monsterId, 'posToGo:', action.posToGo);
		}
	}

}
