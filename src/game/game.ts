import { r, rn, rns, rs } from '../read';
import { arrayOf } from '../utils';
import { Cell, NeighsCellByDist } from './cell';
import { DIRECTIONS, LAST_DAY, ME, OPPONENT, OwnerId, TreeSize } from './commons';
import { CellTrees, Forest } from './forest';
import { Player } from './player';
import { Tree } from './tree';
import { Action, ActionCut, ActionFeed, ActionSeed, ActionWait } from './action';

const PATH_NO_LINE2 = DIRECTIONS.map((dir) => [dir, (dir + 1) % 6]);
const PATH_NO_LINE3_1 = DIRECTIONS.map((dir) => [dir, dir, (dir + 1) % 6]);
const PATH_NO_LINE3_2 = DIRECTIONS.map((dir) => [dir, dir, (dir + 5) % 6]);
const PATH_NO_LINE3 = [...PATH_NO_LINE3_1, ...PATH_NO_LINE3_2];

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

	constructor(
		public forest: Forest,
		public day: number,
		public sunByPlayer: [number, number],
		public scoreByPlayer: [number, number],
		public isWaitByPlayer: [boolean, boolean],
	) {
	}

	clone() {
		return new GameStatus(
			this.forest.clone(),
			this.day,
			this.sunByPlayer.slice(0) as T2<number>,
			this.scoreByPlayer.slice(0) as T2<number>,
			this.isWaitByPlayer.slice(0) as T2<boolean>
		)
	}

}

/**
 * there exist only one instance of this object (it's the main object)
 */
export class Game {
	/**
	 * list of all cells sorted by here index
	 */
	cells: Cell[] = [];
	/**
	 * current day of the game
	 */
	day: number;  // the game lasts 24 days: 0-23
	me = new Player(this, ME);
	opponent = new Player(this, OPPONENT);

	/**
	 * The current forest.
	 * I suggest you to don't edit,  (clone it before do somme action)
	 */
	forest: Forest;

	/**
	 * contain list of message that be say by your personage (don't insert \n)
	 */
	msgs: string[] = []

	/**
	 * list of action that you can do
	 */
	possibleActions: Action[];

	/**
	 * methode call for init
	 */
	init() {

		/**
		 * warn: next line got many time because we wait that coding game send data
		 */
		const numberOfCells = rn(); // 37
		for (let i = 0; i < numberOfCells; i++) {
			const [index, richness, ...neighsId] = rns();
			this.cells[index] = new Cell(this, index, richness as any, neighsId);
		}
		for (let cell of this.cells) {
			cell.neighs = cell.neighsId.map((id) => this.cells[id]);
		}
		for (let cell of this.cells) {
			cell.neighsLine = DIRECTIONS.map((dir) => {
				const res: Cell[] = [cell];
				let currentCell: Cell = cell;
				while (currentCell = currentCell.neighs[dir]) {
					res.push(currentCell);
				}
				return res;
			});
			const tmp: Partial<NeighsCellByDist> = {
				lines: arrayOf(4, (_, length) => DIRECTIONS.map((dir) =>
					cell.neighsLine[dir][length]).filter(cell => cell).sortScore(cell => cell.richness)
				),
				linesIn: arrayOf(4, (_, length) => DIRECTIONS.flatMap((dir) => cell.neighsLine[dir].slice(1, length + 1)).filter(cell => cell)
				),
				notLine: [[], [], cell.navigates(PATH_NO_LINE2), cell.navigates(PATH_NO_LINE3)]
			};
			tmp.lines[0] = []
			tmp.notLineIn = [[], [], tmp.notLine[2], [...tmp.notLine[2], ...tmp.notLine[3]]];
			tmp.all = [[], tmp.lines[1], [...tmp.lines[2], ...tmp.notLine[2]], [...tmp.lines[3], ...tmp.notLine[3]]];
			tmp.allIn = [[], tmp.linesIn[1], [...tmp.linesIn[2], ...tmp.notLineIn[2]], [...tmp.linesIn[3], ...tmp.notLineIn[3]]];
			cell.neighsByDist = tmp as NeighsCellByDist;
			Object.values(cell.neighsByDist).forEach((n: Cell[][]) => n.forEach(cells => cells.sortScore(cell => cell.richness)))
		}
		this.forest = new Forest(this);
	}

	/**
	 * use for read input and update game data (day, player sun, player score, forest, possibleMoves)
	 */
	readLoop() {
		this.day = rn();
		this.forest.nutrients = rn();
		[this.me.sun, this.me.score] = rns();
		let isWaitingInt;
		[this.opponent.sun, this.opponent.score, isWaitingInt] = rns();
		this.opponent.isWaiting = isWaitingInt === 1;

		const nbTree = rn();
		this.forest.startUpdate();
		for (let i = 0; i < nbTree; i++) {
			const [cellIndex, size, ownerId, isDormantInt] = rns();
			this.forest.setTree(cellIndex, size as TreeSize, ownerId as OwnerId, isDormantInt !== 0)
		}
		this.forest.endUpdate();


		this.possibleActions = rs(rn()).map(([actionName, ...actionParam]) => {
			switch (actionName){
				case 'SEED': return new ActionSeed(...actionParam.map(Number) as T2<number>);
				case 'GROW': return new ActionFeed(...actionParam.map(Number) as T1<number>);
				case 'COMPLETE': return new ActionCut(actionParam.map(Number) as T1<number>);
				case 'WAIT': return ActionWait.instance;
			}
		});
	}

	/**
	 * game loop
	 */
	loop() {
		this.readLoop();
		this.getActionToExecute().doAction(this.msgs)
	}

	/**
	 * function caller for determinate witch action should be played
	 */
	getActionToExecute(): Action {

		this.addMessage('Hello')
		this.addMessage('world')

		const gameStatus = new GameStatus(
			this.forest,
			this.day,
			[this.opponent.sun, this.me.sun],
			[this.opponent.score, this.me.score],
			[this.opponent.isWaiting, this.me.isWaiting],
		);


		return this.possibleActions.best((action) => {
			const gameStatusAfterAction = gameStatus.clone();
			action.applyAction(gameStatusAfterAction, ME);
			return this.myCustomScorifyFunction(gameStatusAfterAction);
		})
	}

	myCustomScorifyFunction(gameStatus: GameStatus): number{
		return Math.random(); // this is probably not a good function for estimate gameStatus
	}

	getPlayer(ownerId: ME | OPPONENT) {
		return ownerId === ME ? this.me : this.opponent;
	}


	addMessage(msg: string) {
		console.error(msg);
		this.msgs.push(msg);
	}
}
