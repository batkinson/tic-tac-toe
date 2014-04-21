
/**
 * Constructor for a player object.
 */
function Player(label) {
   this.label = label;
}

Player.prototype = {
   toString: function() {
      return this.label;
   }
};


// Players
var PLAYER = new Player('X'), COMPUTER = new Player('O');


/**
 * Constructor for a game object. This contains all logic for tic-tac-toe.
 */
function TicTacToe(size,lastState) {
   this.size = size;
   this.difficultyLevels = { Easy: this.getRandomMove, Normal: this.getHeuristicMove, Hard: this.getOptimalMove };
   this.nextMove = this.getOptimalMove;
   if (typeof lastState !== "undefined") {
      // shallow copy for move speculation (state space search)
      this.moveMax = lastState.moveMax;
      this.grid = lastState.grid.slice(0);
      this.lines = lastState.lines;
      this.moves = lastState.moves;
   } else {
      // Normal game initialization
      this.moveMax = this.size * this.size;
      this.grid = new Array(this.moveMax);
      this.lines = new Array();
      this.moves = 0;
      this.init();
   }
}

TicTacToe.prototype = {

   init: function() {

      // Build index of horizontal and vertical win lines
      for (var i=0; i<this.size; i++) {
         var row = new Array(this.size), col = new Array(this.size);
         for (var j=0; j<this.size; j++) {
            row[j] = [i,j];
            col[j] = [j,i];
         }
         this.lines.push(row);
         this.lines.push(col);
      }

      // Add diagonal win lines to the index
      var diag1 = new Array(this.size), diag2 = new Array(this.size);
      for (var i=0; i<this.size; i++) {
         diag1[i] = [i,i];
         diag2[i] = [this.size-(i+1),i];
      }
      this.lines.push(diag1);
      this.lines.push(diag2);
   },

   // Makes this object reusable for another game
   reset: function() {
      this.moves = 0;
      for (var cell=0; cell<this.grid.length; cell++)
         this.grid[cell] = undefined;
      this.winningLine = undefined;
      this.winner = undefined;
   },

   // Marks a cell with the player who selected it (a move)
   setCell: function(row,col,player) {
      this.grid[row * this.size + col] = player;
      this.moves++;
   },

   // Returns the player who owns the specified cell
   getCell: function(row,col) {
      return this.grid[row * this.size + col];
   },

   // Convenience method for whether a cell can be played
   isCellAvailable: function(row,col) {
      return typeof this.getCell(row,col) === "undefined";
   },

   // Convenience method for working with cell grid
   forGrid: function(gridfn,thisObj) {
      if (typeof thisObj === "undefined") thisObj = this;
      for (var row=0; row<this.size; row++)
         for (var col=0; col<this.size; col++)
            gridfn.call(thisObj,row,col);
   },

   // Returns the coordinates for the cells that won the game
   getWinningLine: function() {
      return this.lines[this.winningLine];
   },

   // Returns the opponent to the specified player
   getOpponent: function(player) {
      return player === PLAYER? COMPUTER : PLAYER;
   },

   // Returns the player that won the game
   getWinner: function() {

      if (typeof this.winner !== "undefined")
         return this.winner;

      var winningLine;

      linescan:
      for (var l=0; l<this.lines.length; l++) {
         var line = this.lines[l], winner = undefined;
         for (var c=0; c<this.size; c++) {
            var cell = line[c], cellVal = this.getCell(cell[0],cell[1]);
            if (typeof cellVal === "undefined") {
               continue linescan;
            } else if (typeof winner === "undefined") {
               winner = cellVal;
               winningLine = l;
            } else if (cellVal !== winner){
               continue linescan;
            }
         }
         this.winningLine = winningLine;
         return winner;
      }
   },

   // Returns whether is completed, either someone won or moves were exhausted
   isGameOver: function() {
      if (this.moves >= this.moveMax) {
         return true;
      }
      var winner = this.getWinner();
      if (typeof winner !== "undefined") {
         return true;
      }
      return false;
   },

   // Returns a randomly generated move.
   getRandomMove: function() {
      var row, col;
      do {
         row = parseInt(Math.random()*this.size);
         col = parseInt(Math.random()*this.size);
      } while(!this.isCellAvailable(row,col));
      return { row: row, col: col };
   },

   // Returns a hueristic-based move for the specified player
   getHeuristicMove: function(player) {

      var movesByMarkCount = { };
      movesByMarkCount[PLAYER] = [];
      movesByMarkCount[COMPUTER] = [];

      // Capture a move for each player, for each mark count (if one exists)
      for (var linei=0; linei<this.lines.length; linei++) {
         var line = this.lines[linei], count = { }, availableCell = undefined;
         count[PLAYER] = 0;
         count[COMPUTER] = 0;
         for (var celli=0; celli<line.length; celli++) {
            var cell = line[celli], row = cell[0], col = cell[1];
            if (this.isCellAvailable(row,col)) {
               availableCell = cell;
            } else {
               var mark = this.getCell(row,col);
               count[mark]++;
            }
         }

         // Skip lines with no available move
         if (typeof availableCell === "undefined") continue;

         for (player in count) {
            movesByMarkCount[player][count[player]] = { row: availableCell[0], col: availableCell[1] };
         }
      }

      var move, opponent = this.getOpponent(player);

      // Pick move in line with highest mark count, priority to win over block
      for (var len=this.size-1; len>=0; len--) {
         if (len in movesByMarkCount[player]) {
            return movesByMarkCount[player][len];
         } else if (len in movesByMarkCount[opponent]) {
            return movesByMarkCount[opponent][len];
         }
      }
   },

   // Returns a hueristic score for this game state for the given search depth
   scoreGrid: function(depth) {
      var winner = this.getWinner();
      if (typeof winner === "undefined") return 0;
      if (winner === PLAYER) return depth-10; // non-positive
      if (winner === COMPUTER) return 10-depth; // non-negative
   },

   // Returns a game state based on this one, with the specified move played
   speculate: function(row,col,player) {
      var specState = new TicTacToe(this.size, this);
      specState.setCell(row,col,player);
      return specState;
   },

   // Returns optimal next move for the specified player for this game state
   // This is a variant of minimax with alpha-beta pruning for better speed
   getOptimalMove: function(player,depth,alpha,beta) {

      if (typeof depth === "undefined") depth = 0;

      var maximizing = player === COMPUTER, minimizing = !maximizing;

      var opponent = this.getOpponent(player);

      if (this.isGameOver()) return this.scoreGrid(depth);

      for (var row=0; row<this.size; row++) {
         for (var col=0; col<this.size; col++) {
            if (this.isCellAvailable(row,col)) {

               var followingMove = this.speculate(row,col,player).getOptimalMove(opponent,depth+1,alpha,beta);

               if (typeof followingMove === 'number') {
                  move = { score: followingMove, row: row, col: col };
               } else {
                  move = { score: followingMove.score, row: row, col: col };
               }

               var noAlpha = typeof alpha === "undefined", noBeta = typeof beta === "undefined";

               if (maximizing && (noAlpha || move.score > alpha.score)) {
                  alpha = move;
                  if (!noBeta && beta.score <= alpha.score) return alpha;
               }
               else if (minimizing && (noBeta || move.score < beta.score)) {
                  beta = move;
                  if (!noAlpha && beta.score <= alpha.score) return beta;
               }
            }
         }
      }

      if (maximizing) return alpha; else return beta;
   },

   setDifficulty: function(level) {
      this.nextMove = this.difficultyLevels[level];
   },

   // Converts game state into acceptable hash key
   toString: function() {
      var gridStr = '';
      this.forGrid(function(row,col) {
         gridStr += (this.isCellAvailable(row,col)? " " : this.getCell(row,col));
      });
      return gridStr;
   }
};


/**
 * Constructor for object that manages screen visibility.
 */
function ScreenManager(background) {

   this.background = background;
   this.others = new Array();
   for (var i=1; i<arguments.length; i++) {
      this.others.push(arguments[i]);
   }
}

ScreenManager.prototype = {

   showDefault: function() {
      this.background.style.zIndex = 0;
      for (var i=0; i<this.others.length; i++) {
         this.others[i].style.zIndex = -1;
      }
   },

   show: function(element) {
      element.style.zIndex = element === this.background? 0 : 1;
      for (var i=0; i<this.others.length; i++) {
         var overscreen = this.others[i];
         if (overscreen !== element) overscreen.style.zIndex = -1;
      }
   }
};


/**
 * Constructor for user interface. Turns the specified element into a game UI.
 */
function TicTacToeUI(elemId) {

   this.size = 3;
   this.game = new TicTacToe(this.size);
   this.elemId = elemId;
   this.elem = document.getElementById(elemId);
   this.difficultyElem;
   this.playerselElem;
   this.gridElem;
   this.resultElem;
   this.screenManager;
   this.statusElem;
   this.heading = "Tic Tac Toe";
   this.playerFirst;
   this.resultDelay = 1000;
   this.drawResultDelay = 1000;
   this.firstMoveDelay = 1000;
   this.computerMoveDelay = 500;

   this.createUI();
   this.showDifficultySelect();
}

TicTacToeUI.prototype = {

   // Construct element id for button of specified row/col
   getButtonId: function getButtonId(row,col) {
      return row + 'x' + col;
   },

   // Returns the button for the specified row/col
   getButton: function(row,col) {
      return document.getElementById(this.getButtonId(row,col));
   },

   // Convenience method for getting the X/ /O labels for game cells
   getCellValue: function(row,col) {
      var player = this.game.getCell(row,col);
      if (typeof player === "object")
         return player.label;
      return ' ';
   },

   // Causes a batch update from game model to UI buttons
   updateGrid: function() {
      this.game.forGrid(function(row,col) {
         var cellValue = this.getCellValue(row,col), button = this.getButton(row,col);
         button.innerHTML = cellValue;
         if (cellValue !== ' ') button.disabled = true;
      },this);
   },

   // Marks a cell for a player and updates the UI to match
   markCell: function(row,col,player) {
      this.game.setCell(row,col,player);
      this.updateGrid();
   },

   // Shows an instructive status message
   setStatus: function(message) {
      this.statusElem.innerHTML = message;
   },

   // Clear the existing status message
   clearStatus: function() {
      this.setStatus('');
   },

   // Causes the difficulty selection screen to display
   showDifficultySelect: function() {
      this.screenManager.show(this.difficultyElem);
      this.setStatus("Select opponent difficulty level.");
   },

   // Causes the player selection screen to display
   showPlayerSelect: function() {
      this.screenManager.show(this.playerselElem);
      this.setStatus("Select who moves first.");
   },

   showGrid: function() {
      this.clearStatus();
      this.screenManager.show(this.gridElem);
   },

   // Called upon game completion, shows the game result
   showResult: function() {

      this.setStatus("Game over.");

      var thisUI = this;
      var show = function(text, delay) {
         window.setTimeout(function() {
            thisUI.resultElem.innerHTML = '<message>' + text + '</message>';
            thisUI.resultElem.style.zIndex = "1";
            thisUI.setStatus("Click to play again.");
         },delay);
      };

      if (this.game.getWinner() === PLAYER) {
         this.highlightWinningMove();
         show('You Win!', this.resultDelay);
      } else if (this.game.getWinner() === COMPUTER) {
         this.highlightWinningMove();
         show('You Lose.', this.resultDelay);
      } else
         show("A Draw.", this.drawResultDelay);
   },

   // Called upon game completion, but before result - highlights winning line
   highlightWinningMove: function(show) {

      if (typeof show === "undefined") {
         show = true;
      }

      var winLine = this.game.getWinningLine();

      if (typeof winLine === "undefined") {
         return;
      }

      for (var cell=0; cell<winLine.length; cell++) {
         var winCell = winLine[cell], winButton = this.getButton(winCell[0],winCell[1]);
         winButton.className = show? "tttwinner" : "";
      }
   },

   // Disables/enabled tic-tac-toe grid for user input
   disableGrid: function (disabled) {
      this.game.forGrid(function(row,col) {
         var button = this.getButton(row,col);
         button.disabled = disabled || !this.game.isCellAvailable(row,col);
      },this);
   },

   // Enables the grid buttons and prompts for a move.
   promptPlayerMove: function(enable) {
      if (enable) {
         this.disableGrid(false);
         this.setStatus("Select a square.");
      } else {
         this.disableGrid(true);
         this.clearStatus();
      }
   },

   // Resets so it is possible to play another game
   resetGame: function() {
      this.promptPlayerMove(false);
      this.highlightWinningMove(false);
      this.game.reset();
      this.updateGrid();
   },

   // Starts the game as player or computer, valid initially and after reset
   startGame: function() {
      var playerFirst = this.playerFirst;
      PLAYER.label = playerFirst? 'X' : 'O';
      COMPUTER.label = playerFirst? 'O' : 'X';
      this.showGrid();
      if (!playerFirst) {
         // delay move so the user sees it happen
         var thisUI = this;
         window.setTimeout(function() {
            thisUI.makeFirstMoveAsComputer();
            thisUI.promptPlayerMove(true);
         },thisUI.firstMoveDelay);
      }
      else {
         this.promptPlayerMove(true);
      }
   },

   // Plays initial move for computer - random move, skips game end test
   makeFirstMoveAsComputer: function() {
      // We don't bother thinking or checking for game over, it's the opener.
      var randomMove = this.game.getRandomMove();
      this.markCell(randomMove.row,randomMove.col,COMPUTER);
   },

   // Performs a player move, then a computer move - ending game when appropriate
   playRound: function(row,col) {

      if (this.game.isGameOver()) {
         // This shouldn't be possible without a bug.
         alert('Game is over.')
      }

      this.markCell(row,col,PLAYER);
      if (this.game.isGameOver()) {
         this.showResult();
         return;
      }

      this.promptPlayerMove(false);

      var thisUI = this;
      window.setTimeout(function() {
         var nextMove = thisUI.game.nextMove(COMPUTER);
         thisUI.markCell(nextMove.row,nextMove.col,COMPUTER);
         if (thisUI.game.isGameOver()) {
            thisUI.showResult();
            return;
         }
         thisUI.promptPlayerMove(true);
      }, thisUI.computerMoveDelay);
   },

   // Creates a click handler for specified row/col button (knows coordinates)
   createGridHandler: function(row,col) {
      var gameUI = this;
      return function() { gameUI.playRound(row,col); }
   },

   // Creates a click handler for specified difficulty level
   createDifficultyHandler: function(level) {
      var gameUI = this, game = this.game;
      return function() { game.setDifficulty(level); gameUI.showPlayerSelect(); };
   },

   // Creates a click handler for player select
   createPlayerHandler: function(playerFirst) {
      var gameUI = this;
      return function() { gameUI.playerFirst=playerFirst; gameUI.startGame(); };
   },

   // Builds and attaches HTML/CSS based UI using DOM
   createUI: function() {

      var thisUI = this; // For click handling closures

      // Add a new style element to document
      var newStyle = document.createElement('style');
      document.getElementsByTagName('head')[0].appendChild(newStyle);

      // Get the stylesheet we just created
      var sheet = document.styleSheets[document.styleSheets.length - 1];

      var rules = {
         ".tictactoe": "{ font-family: 'Rokkitt', serif; font-size: 200%; color: black; }",
         ".tictactoe heading, .tictactoe status": "{ display: block; text-align: center; }",
         ".tictactoe heading": "{ line-height: 96px; }",
         ".tictactoe status": "{ line-height: 84px; font-size: 75%; }",
         ".tictactoe game": "{ display: block; position: relative; width: 320px; height: 300px; }",
         ".tictactoe game > *": "{ background-color: white; width: 320px; height: 300px; }",
         ".tictactoe playersel, .tictactoe difficultysel": "{ position: absolute; display: table; top: 0px; }",
         ".tictactoe difficultysel": "{ z-index: 1; }",
         ".tictactoe level": "{ display: block; line-height: 140%; font-size: 130%; }",
         ".tictactoe choice": "{ display: table-cell; text-align: center; vertical-align: middle; }",
         ".tictactoe choice message": "{ display: block; font-size: 150%; line-height: 85px; }",
         ".tictactoe playersel .fa": "{ display: inline-block; font-size: 100px; width: 160px; }",
         ".tictactoe grid": "{ position: absolute; top: 0px; display: block; text-align: center; }",
         ".tictactoe result ": "{ display: table; position: absolute; top: 0px; z-index: -1; font-size: 150%; opacity: .9; }",
         ".tictactoe result message": "{ display: table-cell; text-align: center; vertical-align: middle; }",
         ".tictactoe button.tttwinner": "{ background-color: #F2F760; transition: background-color .5s; -webkit-transition: background-color .5s; -o-transition: background-color .5s; -moz-transition: background-color .5s;}",
         ".tictactoe button:focus": "{ outline: none; }",
         ".tictactoe button": "{ width: 100px; height: 100px; font-size: 72px; vertical-align: top; color: black; background: none; border: none; }",
         ".tictactoe grid > button:nth-of-type(3n+1)": "{ border-right: 5px solid black; }",
         ".tictactoe grid > button:nth-of-type(3n+3)": "{ border-left: 5px solid black; }",
         ".tictactoe grid > button:nth-of-type(-n+3)": "{ border-bottom: 5px solid black; }",
         ".tictactoe grid > button:nth-last-of-type(-n+3)": "{ border-top: 5px solid black; }"
      };

      // Adds style rules in browser-specific way
      for (selector in rules) {
         if (sheet.insertRule)
            sheet.insertRule(selector + rules[selector], sheet.cssRules.length);
         else
            sheet.addRule(selector, rules[selector]);
      }

      // Create and add heading section
      var headingElem = document.createElement('heading');
      headingElem.appendChild(document.createTextNode(this.heading));
      this.elem.appendChild(headingElem);

      // Create and add game section
      var gameElem = document.createElement('game');

      var difficultyElem = this.difficultyElem = document.createElement('difficultysel');
      var choiceElem1 = document.createElement('choice');
      var diffMsgElem = document.createElement('message');
      diffMsgElem.appendChild(document.createTextNode('Difficulty?'));
      choiceElem1.appendChild(diffMsgElem);
      for (var level in this.game.difficultyLevels) {
         var levelElem = document.createElement('level');
         levelElem.appendChild(document.createTextNode(level));
         levelElem.onclick = this.createDifficultyHandler(level);
         choiceElem1.appendChild(levelElem);
      }
      difficultyElem.appendChild(choiceElem1);
      gameElem.appendChild(difficultyElem);

      var playerselElem = this.playerselElem = document.createElement('playersel');
      var choiceElem2 = document.createElement('choice');
      var selMsgElem = document.createElement('message');
      selMsgElem.appendChild(document.createTextNode('Who starts?'));
      choiceElem2.appendChild(selMsgElem);
      var playerElem = document.createElement('i');
      playerElem.onclick = this.createPlayerHandler(true);
      playerElem.className = "fa fa-user";
      var computerElem = document.createElement('i');
      computerElem.onclick = this.createPlayerHandler(false);
      computerElem.className = "fa fa-laptop";
      choiceElem2.appendChild(playerElem);
      choiceElem2.appendChild(computerElem);
      playerselElem.appendChild(choiceElem2);
      gameElem.appendChild(playerselElem);

      var gridElem = this.gridElem = document.createElement('grid');
      this.game.forGrid(function(row,col) {
         var buttonElem = document.createElement('button');
         buttonElem.setAttribute('id', this.getButtonId(row,col));
         buttonElem.setAttribute('disabled','true');
         buttonElem.onclick = this.createGridHandler(row,col);
         gridElem.appendChild(buttonElem);
         if (col == this.size-1) gridElem.appendChild(document.createElement('br'));
      },this);
      gameElem.appendChild(gridElem);

      var resultElem = this.resultElem = document.createElement('result');
      resultElem.onclick = function() {
         thisUI.resetGame();
         thisUI.playerFirst = !thisUI.playerFirst;
         thisUI.startGame(thisUI.playerFirst);
      };
      gameElem.appendChild(resultElem);

      // Bless root element with tictactoe class and add game section
      this.elem.className += " tictactoe";
      this.elem.appendChild(gameElem);

      // Create and add status section
      var statusElem = this.statusElem = document.createElement('status');
      this.elem.appendChild(statusElem);

      // Create a screen manager so we can easily manage screen visibility
      this.screenManager = new ScreenManager(this.gridElem,this.playerselElem,this.resultElem,this.difficultyElem);
   }
};
