import {rn, rns, rp} from '../read';
import {Base} from "./base";
import {EntityType, Hero, Monster} from "./entity";
import {addPoint, distance, isEqual, Point2D} from "../utils";
import {
	Action,
	ActionCamp,
	ActionCampAttack,
	ActionControlMonster,
	ActionControlOpponent,
	ActionMove,
	ActionMoveToMonster,
	ActionShield,
	ActionWindMonster,
	ActionWindOpponent
} from "./action";
import {
	CampPosition,
	EXTENDED_BASE,
	HERO_ZONE,
	INIT_CAMP_ATTACK,
	MANA_ECO_FOR_ATTACK,
	MANA_MINI,
	MANA_MINI_FOR_ATTACK,
	MAP_HEIGHT,
	MAP_WIDTH,
	OPPONENT_MIND_ZONE,
	OPPONENT_WIND_FORCE_ZONE,
	WIND_ZONE
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
	hasBeenWind = false;
	attackHasBeenMindControlled = false;
	attackHasBeenWind = false;
	attackModOn = false;
	hero2AttackTouch: boolean[] = [];
	round: number = 0;
	attackHeroId: number = 5;
	arrivedAtInitAttackPos: boolean = false;
	windDirection: Point2D = [5939, 4019];
	heroOldPosById: Point2D[];
	// attackOrdePoint: Point2D = [2212, 6802];
	attackOrdePoint: Point2D = [13790, 1134];
	attackFinalOrdePoint: Point2D = [12549, 6896];
	arrivedAtOrdePoint: boolean = false;
	arrivedAtFinalOrdePoint: boolean = false;
	attackWindDone: number = 0;
	attackStay: boolean = false;

	attackEcoOn: boolean = true;
	attackEcoCamp: Point2D[] = [
		[8787, 4431],
		[6557, 6942],
		[11035, 1546]
	];

	attackRepeat: number = 1;

	hasSeenRedMonster: boolean = false;

	manaMiniForAttack: number = MANA_MINI_FOR_ATTACK;

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
		];

		// this.campForAttack = [
		// 	[12144, 6728],
		// 	[12952, 4623],
		// 	[15358, 3514],
		// ]

		this.campForAttack = INIT_CAMP_ATTACK;

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

			this.attackOrdePoint = this.flipPosition(this.attackOrdePoint);

		} else {
			for (const attackPos of this.campForAttack) {
				attackPos[0] = MAP_WIDTH - attackPos[0];
				attackPos[1] = MAP_HEIGHT - attackPos[1];
			}

			this.windDirection = this.flipPosition(this.windDirection);
			// this.windDirection[0] = MAP_WIDTH - this.windDirection[0];
			// this.windDirection[1] = MAP_HEIGHT - this.windDirection[1];

			this.attackFinalOrdePoint = this.flipPosition(this.attackFinalOrdePoint);
		}

		this.heroesPerPlayer = rn();

		this.heroOldPosById = [
			this.myBase.position,
			this.myBase.position,
			this.myBase.position,
		]
	}

	flipPosition(pos: Point2D): Point2D {
		let px = MAP_WIDTH - pos[0];
		let py = MAP_HEIGHT - pos[1];
		return [px, py];
	}

	/**
	 * use for read input and update game data
	 */
	readLoop() {
		this.round++;
		this.myHeroes = [];
		this.opponentHeroes = [];
		this.monsters = [];

		if (isEqual(this.myBase.position, [0, 0])) {
			if (this.round < 30) {
				this.campPos = [
					{pos: [9611, 7529], heroId: -1},
					{pos: [14272, 1471], heroId: -1},
					{pos: [12952, 4623], heroId: -1},
				];
				for (const {pos} of this.campPos) {
					pos[0] = MAP_WIDTH - pos[0];
					pos[1] = MAP_HEIGHT - pos[1];
				}
			} else {
				this.campPos = [
					{pos: [12144, 6728], heroId: -1},
					{pos: [15358, 3514], heroId: -1},
					{pos: [12952, 4623], heroId: -1},
				];
				for (const {pos} of this.campPos) {
					pos[0] = MAP_WIDTH - pos[0];
					pos[1] = MAP_HEIGHT - pos[1];
				}
			}
		} else {
			if (this.round < 30) {
				this.campPos = [
					{pos: [9611, 7529], heroId: -1},
					{pos: [14272, 1471], heroId: -1},
					{pos: [12952, 4623], heroId: -1},
				]
			} else {
				this.campPos = [
					{pos: [12144, 6728], heroId: -1},
					{pos: [15358, 3514], heroId: -1},
					{pos: [12952, 4623], heroId: -1},
				]
			}
		}


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

			if (!this.hasSeenRedMonster){
				if (type === EntityType.MONSTER && health > 18){
					this.hasSeenRedMonster = true;
				}
			}

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

		if (this.round === 1) {
			this.myHeroes.forEach((hero) => {
				let id = hero.id;
				if (hero.id > 3) {
					id = hero.id - 3;
				}
				this.heroOldPosById[id] = hero.position;
			});
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

	getOpponentHeroById(heroId: number): Hero {
		const res = this.opponentHeroes.find((hero) => hero.id === heroId);
		if (!res) {
			console.error(this.opponentHeroes.map(hero => hero.id));
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

	getMonsterInOpponentBase(inExtendedBase: boolean = false): Monster[] {
		let monsters: Monster[] = [];
		// console.error('inExtendedBase', true);
		this.getMonsterNearBasePossible().forEach((monster) => {
			if (inExtendedBase) {
				if (distance(this.opponentBase.position, monster.position) < EXTENDED_BASE) {
					// console.error('monster in extended base', monster.id);
					monsters.push(monster)
				}
			} else {
				if (distance(this.opponentBase.position, monster.position) < 5000) {
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
		// console.error('hero', hero);

		this.monsters.forEach((monster) => {
			if (monster.shieldLife === 0) {
				if (distance(hero.position, monster.position) < WIND_ZONE) {
					// console.error('monster in hero WIND_ZONE', monster.id);
					monsters.push(monster)
				}
			}
		})
		return monsters;
	}

	getMonsterNearHero(heroId: number): Monster[] {
		let monsters: Monster[] = [];
		let hero = this.getHeroById(heroId);
		// console.error('hero', hero);

		this.monsters.forEach((monster) => {
			if (distance(hero.position, monster.position) < HERO_ZONE) {
				// console.error('monster in hero HERO_ZONE', monster.id);
				monsters.push(monster)
			}

		})
		return monsters;
	}

	getOldPosForHeroId(heroId: number): Point2D {
		let id = heroId;
		if (heroId > 3) {
			id = heroId - 3;
		}
		return this.heroOldPosById[id];
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
		if (monsterInBase.length >= 1 && this.round > 90) {

			monsterInBase.forEach((monster) => {
				// console.error('fillActionWithWind monster', monster)
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

	fillActionWithControlOpponent() {
		//todo fill -> mind control opponent
		let opponentNoShieldInMyBase = this.getOpponentNoShieldInBase();
		// console.error('opponentNoShieldInMyBase', opponentNoShieldInMyBase);
		opponentNoShieldInMyBase.forEach((opponent) => {
			let action = new ActionControlOpponent(opponent.id, this.opponentBase.position);
			// console.error('fill action', action);
			this.possibleActions.push(action);
		});
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
						if (nearOpponentDistance < OPPONENT_MIND_ZONE) {
							nearOpponnent = true;
							// console.error('isNearOpponentHeroNearMyBase', isNearOpponentHeroNearMyBase);
						}
					}
				);

				if ((this.attackHasBeenMindControlled || (this.attackHasBeenWind && this.myBase.mana > 90)) && nearOpponnent && hero.shieldLife === 0) {
					let action = new ActionShield(hero.id);
					this.logAction(action, 'H' + hero.id);
					this.actionForThisRound.push({
						action: action,
						heroId: hero.id,
					});
				} else if (this.round > 180 && nearOpponnent && hero.shieldLife === 0) {
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
				if ((this.hasBeenMindControlled) && this.isNearOpponentHeroNearMyBase(hero) && hero.shieldLife === 0) {
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

	nextCampForAttacker(camp: Point2D[]): Point2D {
		let heroAttack = this.getHeroById(this.attackHeroId);
		let oldCamp = camp[0];
		let nextCamp = oldCamp;
		if (distance(heroAttack.position, oldCamp) < 200) {
			camp.splice(0, 1);
			camp.push(oldCamp);
			nextCamp = camp[0];
		}
		// console.error('next camp for attacker:', nextCamp);
		return nextCamp;
	}

	heroHasBeenMindControl() {
		this.myHeroes.forEach((hero) => {
			if (hero.isControlled && hero.id != this.attackHeroId) {
				this.hasBeenMindControlled = true;
				console.error('hasBeenMindControlled', this.hasBeenMindControlled);
			} else if (hero.isControlled && hero.id != this.attackHeroId) {
				this.attackHasBeenMindControlled = true;
				console.error('attackHasBeenMindControlled', this.attackHasBeenMindControlled);
			}
		});
	}


	heroHasBeenWind() {
		this.myHeroes.forEach((hero) => {
			let heroOldPos = this.getOldPosForHeroId(hero.id);
			// console.error('hero pos', hero.position, 'hero old pos', heroOldPos);
			let distanceDiff = distance(hero.position, heroOldPos);
			// console.error('distanceDiff', distanceDiff)
			if (distanceDiff > OPPONENT_WIND_FORCE_ZONE && hero.id != this.attackHeroId) {
				this.hasBeenWind = true;
				// console.error('hasBeenWind', this.hasBeenWind);
			} else if (distanceDiff > OPPONENT_WIND_FORCE_ZONE && hero.id === this.attackHeroId) {
				this.attackHasBeenWind = true;
				console.error('attackHasBeenWind', this.attackHasBeenWind);
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

		// console.error('touchThisRound', touchThisRound);
	}

	updateAttackMode() {
		let lastMode = this.attackModOn;
		this.attackModOn = true;

		if (this.getMonsterInBase().length > 3){
			this.manaMiniForAttack = 40;
		} else {
			this.manaMiniForAttack = MANA_MINI_FOR_ATTACK;
		}

		// console.error('attackModOn: ', this.attackModOn);
		// console.error('lastMode:', lastMode);
		// console.error('hero2AttackTouch', this.hero2AttackTouch)

		// console.error(this.myBase.mana > this.manaMiniForAttack)
		// if (this.myBase.mana > this.manaMiniForAttack) {
		// 	this.attackModOn = true;
		// 	console.error('baseMana > attackModOn: ', this.attackModOn);
		// }

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
		// console.error('monster', newMonster);
		if (newMonster) {
			actionTodo = new ActionMoveToMonster(newMonster, heroId);
		}
		return actionTodo;
	}

	actionWindMonsterNearHero(heroId: number): ActionWindMonster {
		let actionTodo;
		let hero = this.getHeroById(heroId);
		let newMonsterPossible = this.getMonsterNoShieldNearHero(heroId);

		// console.error('newMonsterPossible', newMonsterPossible);
		let newMonster = newMonsterPossible.best((monster) => Math.round(distance(monster.position, hero.position)));
		// console.error('monster', newMonster);
		if (newMonster) {
			actionTodo = new ActionWindMonster(newMonster, this.windDirection);
		}
		return actionTodo;
	}

	setOldPosForHeroId(heroId: number) {
		let id = heroId;
		if (heroId > 3) {
			id = heroId - 3;
		}
		let heroIndex = this.myHeroes.findIndex((hero) => hero.id === heroId);
		this.heroOldPosById[id] = this.myHeroes[heroIndex].position;
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
			this.fillActionWithControlOpponent();
		}

		let heroLeft = this.myHeroes.map(hero => hero);

		let manaLeft = this.myBase.mana;

		if (!this.hasBeenMindControlled) {
			this.heroHasBeenMindControl();
		}

		// console.error('hasBeenWind', this.hasBeenWind);
		if (!this.hasBeenWind) {
			this.heroHasBeenWind();
		}

		// heroLeft.forEach((hero) => {
		// 	console.error('hero left', hero.id, 'pos', hero.position, 'old pos', this.getOldPosForHeroId(hero.id));
		// })

		//shield my hero if near opponent, near my base and opponent has already mind controlled one of my hero in this game
		heroLeft = this.fillActionForThisRoundShieldForMyHero(heroLeft);

		if (this.attackModOn) {
			let attackHeroIndex = heroLeft.findIndex((hero) => hero.id === this.attackHeroId);
			if (attackHeroIndex != -1) {
				this.attackMod(manaLeft);
				heroLeft.splice(attackHeroIndex, 1);
			}
			// console.error('heroLeft after attackMod', heroLeft.map(hero => hero.id));
		}

		// console.error('possibleActions:');
		// this.possibleActions.map((action)=> this.logAction(action));

		while (this.actionForThisRound.length < 3) {
			// console.error('------------------------------------')
			// console.error('heroLeft', heroLeft.map(hero => hero.id));
			// console.error('action for this round (begin while)', JSON.stringify(this.actionForThisRound, null, '\t'));

			let action = this.getHighPriorityAction();

			// this.logAction(action, 'HPA:')

			for (let i = 0; i < action.nbHero; i++) {
				// console.error('hero left beginning for', heroLeft);
				if (heroLeft.length > 0) {


					if (action instanceof ActionMoveToMonster) {


						let nearestHeroId = this.getNearestHeroOfPositionInList(action.monster.position, heroLeft);

						// console.error('nearest hero id:', nearestHeroId);
						let actionTodo = action;

						if (distance(action.monster.position, this.myBase.position) > 7000) {

							let newAction = this.actionMoveToMonsterNearHero(nearestHeroId);

							if (newAction) {
								actionTodo = newAction
							}
						}

						if (distance(action.monster.position, this.myBase.position) < 3000 && manaLeft - 10 > MANA_MINI) {
							let newActionPossible = this.actionWindMonsterNearHero(nearestHeroId);
							if (newActionPossible) {
								actionTodo = newActionPossible
								manaLeft -= 10;
							}
						}

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
							// console.error('new action in actionCamp', newAction);
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
							console.error('ActionWindMonster: not enough mana, mana :', this.myBase.mana, 'manaLeft:', manaLeft);
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
							console.error('ActionWindOpponent: not enough mana, mana :', this.myBase.mana, 'manaLeft:', manaLeft);
						}
					} else if (action instanceof ActionControlOpponent) {
						if (manaLeft - 10 > MANA_MINI) {

							let opponent = this.getOpponentHeroById(action.opponentId);

							let actionTodo = action;

							if (action.heroId === -1) {
								actionTodo.heroId = this.getNearestHeroOfPositionInList(opponent.position, heroLeft);
							}

							// console.error('>> nearest hero id:', action.heroId);
							// console.error('action', action);
							// this.logAction(action, '>');
							let nearestHero = this.getHeroById(actionTodo.heroId);
							// console.error('nearestHero', nearestHero);

							let distanceOpponentHero = distance(opponent.position, nearestHero.position)


							if (distanceOpponentHero > OPPONENT_MIND_ZONE) {
								let actionIndex = this.possibleActions.findIndex((possibleAction) => possibleAction.id === action.id);
								this.possibleActions.splice(actionIndex, 1);
								console.error('ActionControlOpponent: distanceOpponentHero > OPPONENT_MIND_ZONE :', distanceOpponentHero);
							} else {
								this.actionForThisRound.push({
									action: actionTodo,
									heroId: actionTodo.heroId,
								});

								manaLeft -= 10;

								let heroLeftIndex = heroLeft.findIndex((possibleHero) => possibleHero.id === nearestHero.id);
								heroLeft.splice(heroLeftIndex, 1);
							}

						} else {
							let actionIndex = this.possibleActions.findIndex((possibleAction) => possibleAction.id === action.id);
							this.possibleActions.splice(actionIndex, 1);
							console.error('ActionControlOpponent: not enough mana, mana :', this.myBase.mana, 'manaLeft:', manaLeft);
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
				this.setOldPosForHeroId(action.heroId);
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
				if (action.monster.shieldLife > 0) {
					score += 100;
				}
			} else if (distanceMonsterBase < 4000) {
				score += 30;
			} else if (distanceMonsterBase < 5000) {
				score += 20;
			} else if (distanceMonsterBase < 6000) {
				score += 10;
			}

		} else if (action instanceof ActionWindMonster) {
			let distanceMonsterBase = distance(this.myBase.position, action.monster.position);

			if (distanceMonsterBase < 4000) {
				score += 100;
			} else {
				score += 50;
			}
		} else if (action instanceof ActionWindOpponent) {
			let distanceOpponentBase = distance(this.myBase.position, action.opponent.position);

			if (distanceOpponentBase < 4000) {
				score += 200;
			} else {
				score += 100;
			}
		}
		this.logAction(action, 'score ' + score + ' ||')
		return score;
	}


	attackMod(manaLeft: number) {
		let attackHero = this.getHeroById(this.attackHeroId);
		// console.error('attackHero', attackHero);

		// console.error('attack eco on', this.attackEcoOn);

		let camp: Point2D[];
		if (this.attackEcoOn) {
			camp = this.attackEcoCamp;
		} else {
			camp = this.campForAttack;
		}

		if (distance(camp[1], attackHero.position) < 800) {
			this.arrivedAtInitAttackPos = true;
			// console.error('arrivedAtInitAttackPos', this.arrivedAtInitAttackPos);
		}

		if (this.arrivedAtInitAttackPos) {
			// console.error('camp for Attack', camp);

			let attackActionPossible: Action[] = [];

			// console.error('attack > stay:', this.attackStay);
			// console.error('attack > round:', this.round);
			// console.error('attack > op health:', this.opponentBase.health);

			if (this.attackStay && this.attackRepeat === 1 && this.round > 160 && this.opponentBase.health >= 2){
				this.attackStay = false;
				this.arrivedAtOrdePoint = false;
				this.attackRepeat--;
				this.attackOrdePoint = [11073, 1171];

				if (isEqual(this.myBase.position, [0,0])){
					this.attackOrdePoint = this.flipPosition(this.attackOrdePoint);
				}
			}

			if (this.attackEcoOn) {
				let monsterNearHero = this.getMonsterNearHero(this.attackHeroId);
				monsterNearHero.forEach((monster) => {
					let moveTo = addPoint(monster.position, monster.speedVector);
					let actionMoveToMonster = new ActionMoveToMonster(monster, 1, moveTo);

					attackActionPossible.push(actionMoveToMonster);
				})

				if (this.round > 110) {
					this.attackEcoOn = false

					console.error('attack eco on', this.attackEcoOn);
				} else if (this.round > 105 && this.myBase.health <= 2) {
					this.attackEcoOn = false;

					console.error('attack eco on', this.attackEcoOn);

				} else if (this.myBase.health > 2) {
					if (manaLeft > MANA_ECO_FOR_ATTACK && this.hasSeenRedMonster) {
						this.attackEcoOn = false
						console.error('attack eco on', this.attackEcoOn);
					}
				}


			} else {
				// todo go to attackOrdePoint

				if (distance(this.attackOrdePoint, attackHero.position) < 800) {
					this.arrivedAtOrdePoint = true;
					console.error('arrivedAtOrdePoint', this.arrivedAtOrdePoint);
				}

				if (!this.arrivedAtOrdePoint) {
					console.error('go to attackOrdePoint');
					let moveToAction = new ActionMove(this.attackOrdePoint);
					attackActionPossible.push(moveToAction);
					// this.logAction(moveToAction, 'attack');
					this.arrivedAtFinalOrdePoint = false;

				} else {

					// todo move to attackFinalOrdePoint

					console.error('go to attackOrdeFinalPoint');

					if (!this.arrivedAtFinalOrdePoint && distance(this.attackFinalOrdePoint, attackHero.position) < 800) {
						this.arrivedAtFinalOrdePoint = true;
						// console.error('arrivedAtFinalOrdePoint', this.arrivedAtFinalOrdePoint);
					} else {
						this.arrivedAtFinalOrdePoint = false;
					}

					if (!this.arrivedAtFinalOrdePoint) {

						// todo control mob near me

						let monsterNearHero = this.getMonsterNearHero(this.attackHeroId);

						monsterNearHero.forEach((monster) => {
							if (!monster.isControlled && monster.threatFor != 2 && manaLeft - 10 > this.manaMiniForAttack) {
								let actionControlMonster = new ActionControlMonster(monster.id, this.opponentBase.position);
								attackActionPossible.push(actionControlMonster);
								// this.logAction(actionControlMonster, 'attack');
							}
						});

						if (attackActionPossible.length === 0) {
							let actionMoveToFinalOrdePoint = new ActionMove(this.attackFinalOrdePoint);
							attackActionPossible.push(actionMoveToFinalOrdePoint);
							// this.logAction(actionMoveToFinalOrdePoint, 'attack');
						}

					} else {

						this.attackStay = true;
						console.error('attackStay', this.attackStay);

						// todo bubble or mind control all mob near me

						let monsterNearHero = this.getMonsterNearHero(this.attackHeroId);
						monsterNearHero.forEach((monster) => {
							if (monster.threatFor != 2 && !monster.isControlled && monster.shieldLife === 0 && manaLeft - 10 > this.manaMiniForAttack) {
								let actionControlMonster = new ActionControlMonster(monster.id, this.opponentBase.position);
								attackActionPossible.push(actionControlMonster);
								// this.logAction(actionControlMonster, 'attack');
							} else if (monster.shieldLife === 0 && manaLeft - 10 > this.manaMiniForAttack) {
								// if (this.attackWindDone != 2) {
								// 	let actionWind = new ActionWindMonster(monster, this.opponentBase.position);
								// 	attackActionPossible.push(actionWind);
								// 	this.logAction(actionWind, 'attack');
								// 	this.attackWindDone++;
								// } else {
								// 	let actionShieldMonster = new ActionShield(monster.id);
								// 	attackActionPossible.push(actionShieldMonster);
								// 	this.logAction(actionShieldMonster, 'attack');
								// }

								if (distance(monster.position, this.opponentBase.position) > 6000){
									if (distance(monster.position, attackHero.position) < WIND_ZONE){
										let actionWind = new ActionWindMonster(monster, this.opponentBase.position);
										attackActionPossible.push(actionWind);
										// this.logAction(actionWind, 'attack');
										this.attackWindDone++;
									}
								} else {
									let actionShieldMonster = new ActionShield(monster.id);
									attackActionPossible.push(actionShieldMonster);
									// this.logAction(actionShieldMonster, 'attack');
								}

							}
						});
					}
				}
			}


			// console.error('possible action attack HPA', JSON.stringify(attackActionPossible, null, '\t'));
			let actionToDo;
			if (attackActionPossible.length > 0) {
				actionToDo = attackActionPossible.best((action) => this.actionScore(action));
			}

			// console.error('actionToDo attack', actionToDo);

			if (actionToDo) {
				// this.logAction(actionToDo, 'HPA attack:');
				this.actionForThisRound.push({action: actionToDo, heroId: this.attackHeroId});
			} else {
				attackActionPossible = [];

				let monsterNoShieldNearHero = this.getMonsterNoShieldNearHero(attackHero.id);
				monsterNoShieldNearHero.forEach((monster) => {
					if (manaLeft - 10 > this.manaMiniForAttack) {
						let actionWind = new ActionWindMonster(monster, this.opponentBase.position);

						// console.error('fill attack action', action);
						attackActionPossible.push(actionWind);
					}
				});
				let actionToDo;
				if (attackActionPossible.length > 0) {
					actionToDo = attackActionPossible.best((action) => this.actionScore(action));
				} else {
					let nextCamp;
					if (this.attackStay) {
						nextCamp = this.attackFinalOrdePoint;
					} else {
						// console.error('attack HPA: go to camp');
						nextCamp = this.nextCampForAttacker(camp);
					}


					actionToDo = new ActionCampAttack(nextCamp, this.attackHeroId);
				}
				if (actionToDo) {
					this.actionForThisRound.push({action: actionToDo, heroId: this.attackHeroId});
				}

			}
		} else {
			this.actionForThisRound.push({action: new ActionMove(camp[1]), heroId: this.attackHeroId});
		}
	}

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
