
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

   // Makes this object to be reused for another game
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
   cellAvailable: function(row,col) {
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
   isGameComplete: function() {
      if (this.moves >= this.moveMax) {
         return true;
      }
      var winner = this.getWinner();
      if (typeof winner !== "undefined") {
         return true;
      }
      return false;
   },

   // Returns the hueristic score for this game state for the given search depth
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
   optimalMove: function(player,depth,alpha,beta) {

      if (typeof depth === "undefined") depth = 0;

      var maximizing = player === COMPUTER, minimizing = !maximizing;

      var opponent = player === PLAYER? COMPUTER : PLAYER;

      if (this.isGameComplete()) return this.scoreGrid(depth);

      for (var row=0; row<this.size; row++) {
         for (var col=0; col<this.size; col++) {
            if (this.cellAvailable(row,col)) {

               var followingMove = this.speculate(row,col,player).optimalMove(opponent,depth+1,alpha,beta);

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

   // Converts game state into acceptable hash key
   toString: function() {
      var gridStr = '';
      this.forGrid(function(row,col) {
         gridStr += (this.cellAvailable(row,col)? " " : this.getCell(row,col));
      });
      return gridStr;
   }
};


/**
 * Constructor for user interface. Turns the specified element into a game UI.
 */
function TicTacToeUI(elemId) {

   if (typeof gridSize === "undefined") {
      gridSize = 3;
   }

   this.game = new TicTacToe(gridSize);
   this.elemId = elemId;
   this.elem = document.getElementById(elemId);
   this.playerselElem;
   this.gridElem;
   this.resultElem;
   this.statusElem;
   this.heading = "Tic Tac Toe";
   this.size = 3;
   this.playerFirst;
   this.resultDelay = 1000;
   this.drawResultDelay = 1000;
   this.firstMoveDelay = 1000;
   this.computerMoveDelay = 500;

   this.createUI();
   this.selectPlayer();
}

TicTacToeUI.prototype = {

   // Construct element id for button of specified row/col
   buttonId: function buttonId(row,col) {
      return row + 'x' + col;
   },

   // Returns the button for the specified row/col
   button: function(row,col) {
      return document.getElementById(this.buttonId(row,col));
   },

   // Marks a cell for a player and updates the UI to match
   markAndUpdate: function(row,col,player) {
      this.game.setCell(row,col,player);
      this.updateUI();
   },

   // Shows an instructive status message
   setStatus: function(message) {
      this.statusElem.innerHTML = message;
   },

   // Clear the existing status message
   clearStatus: function() {
      this.setStatus('');
   },

   selectPlayer: function() {
      this.playerselElem.style.zIndex = "1";
      this.setStatus("Select who moves first.");
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
         this.showWinningMove();
         show('You Win!', this.resultDelay);
      } else if (this.game.getWinner() === COMPUTER) {
         this.showWinningMove();
         show('You Lose.', this.resultDelay);
      } else
         show("A Draw.", this.drawResultDelay);
   },

   // Called upon game completion, but before result - highlights winning line
   showWinningMove: function(show) {

      if (typeof show === "undefined") {
         show = true;
      }

      var winLine = this.game.getWinningLine();

      if (typeof winLine === "undefined") {
         return;
      }

      for (var cell=0; cell<winLine.length; cell++) {
         var winCell = winLine[cell], winButton = this.button(winCell[0],winCell[1]);
         winButton.className = show? "tttwinner" : "";
      }
   },

   // Used to hide other panes and show the game grid
   showGrid: function() {
      this.resultElem.style.zIndex = '-1';
      this.playerselElem.style.zIndex = '-1';
   },

   // Disables/enabled tic-tac-toe grid for user input
   disableUI: function (disabled) {
      this.game.forGrid(function(row,col) {
         var button = this.button(row,col);
         button.disabled = disabled || !this.game.cellAvailable(row,col);
      },this);
   },

   // Resets so it is possible to play another game
   resetGame: function() {
      this.enablePlayer(false);
      this.showWinningMove(false);
      this.game.reset();
      this.updateUI();
   },

   // Enables the grid buttons and prompts for a move.
   enablePlayer: function(enable) {
      if (enable) {
         this.disableUI(false);
         this.setStatus("Select a square.");
      } else {
         this.disableUI(true);
         this.clearStatus();
      }
   },

   // Starts the game as player or computer, valid initially and after reset
   startGame: function() {
      var playerFirst = this.playerFirst;
      PLAYER.label = playerFirst? 'X' : 'O';
      COMPUTER.label = playerFirst? 'O' : 'X';
      this.clearStatus();
      this.showGrid();
      if (!playerFirst) {
         // delay move so the user sees it happen
         var thisUI = this;
         window.setTimeout(function() {
            thisUI.computerFirstMove();
            thisUI.enablePlayer(true);
         },thisUI.firstMoveDelay);
      }
      else {
         this.enablePlayer(true);
      }
   },

   // Plays initial move for computer - random move, skips game end test
   computerFirstMove: function() {
      // We don't bother thinking or checking for game over, it's the opener.
      var randRow = parseInt(this.size * Math.random(),10);
      var randCol = parseInt(this.size * Math.random(),10);
      this.markAndUpdate(randRow,randCol,COMPUTER);
   },

   // Plays player move, then a computer move - ending game when appropriate
   makeMove: function(row,col) {

      if (this.game.isGameComplete()) {
         // This shouldn't be possible without a bug.
         alert('Game is over.')
      }

      this.markAndUpdate(row,col,PLAYER);
      if (this.game.isGameComplete()) {
         this.showResult();
         return;
      }

      this.enablePlayer(false);

      var thisUI = this;
      window.setTimeout(function() {
         var nextMove = thisUI.game.optimalMove(COMPUTER);
         thisUI.markAndUpdate(nextMove.row,nextMove.col,COMPUTER);
         if (thisUI.game.isGameComplete()) {
            thisUI.showResult();
            return;
         }
         thisUI.enablePlayer(true);
      }, thisUI.computerMoveDelay);
   },

   // Creates a click handler for specified row/col button (knows coordinates)
   createHandler: function(row,col) {
      var gameUI = this;
      return function() { gameUI.makeMove(row,col); return false; }
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
         ".tictactoe playersel": "{ position: absolute; display: table; top: 0px; z-index: 1 }",
         ".tictactoe playersel choice": "{ display: table-cell; text-align: center; vertical-align: middle; }",
         ".tictactoe playersel choice message": "{ display: block; font-size: 150%; line-height: 85px; }",
         ".tictactoe .fa": "{ display: inline-block; font-size: 100px; width: 160px; }",
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
      var playerselElem = this.playerselElem = document.createElement('playersel');
      var choiceElem = document.createElement('choice');
      var selMsgElem = document.createElement('message');
      selMsgElem.appendChild(document.createTextNode('Who starts?'));
      choiceElem.appendChild(selMsgElem);
      var playerElem = document.createElement('i');
      playerElem.onclick = function() { thisUI.playerFirst=true; thisUI.startGame(); };
      playerElem.className = "fa fa-user";
      var computerElem = document.createElement('i');
      computerElem.onclick = function() { thisUI.playerFirst=false; thisUI.startGame(); };
      computerElem.className = "fa fa-laptop";
      choiceElem.appendChild(playerElem);
      choiceElem.appendChild(computerElem);
      playerselElem.appendChild(choiceElem);
      gameElem.appendChild(playerselElem);

      var gridElem = this.gridElem = document.createElement('grid');
      this.game.forGrid(function(row,col) {
         var buttonElem = document.createElement('button');
         buttonElem.setAttribute('id', this.buttonId(row,col));
         buttonElem.setAttribute('disabled','true');
         buttonElem.onclick = this.createHandler(row,col);
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
   },

   // Convenience method for getting the X/ /O labels for game cells
   gridLabel: function(row,col) {
      var player = this.game.getCell(row,col);
      if (typeof player === "object")
         return player.label;
      return ' ';
   },

   // Causes a batch update from game model to UI buttons
   updateUI: function() {
      this.game.forGrid(function(row,col) {
         var gridLabel = this.gridLabel(row,col), button = this.button(row,col);
         button.innerHTML = gridLabel;
         if (gridLabel !== ' ') button.disabled = true;
      },this);
   }
};
