
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
var PLAYER = new Player('X');
var COMPUTER = new Player('O');


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
         var row = new Array(this.size);
         var col = new Array(this.size);
         for (var j=0; j<this.size; j++) {
            row[j] = [i,j];
            col[j] = [j,i];
         }
         this.lines.push(row);
         this.lines.push(col);
      }

      // Add diagonal win lines to the index
      var diag1 = new Array(this.size);
      var diag2 = new Array(this.size);
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
         var line = this.lines[l];
         var winner = undefined;
         for (var c=0; c<this.size; c++) {
            var cell = line[c];
            var cellVal = this.getCell(cell[0],cell[1]);
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

      if (typeof depth === "undefined") {
         depth = 0;
      }

      var maximizing = player === COMPUTER;
      var minimizing = !maximizing;

      var opponent = player === PLAYER? COMPUTER : PLAYER;

      if (this.isGameComplete()) {
         return this.scoreGrid(depth);
      }

      movescan:
      for (var row=0; row<this.size; row++) {
         for (var col=0; col<this.size; col++) {

            if (this.cellAvailable(row,col)) {

               var followingMove = this.speculate(row,col,player).optimalMove(opponent,depth+1,alpha,beta);

               if (typeof followingMove === 'number')
                  move = { score: followingMove, row: row, col: col };
               else
                  move = { score: followingMove.score, row: row, col: col };

               var alphaExists = typeof alpha !== "undefined";
               var betaExists = typeof beta !== "undefined";

               if (maximizing && (!alphaExists || move.score > alpha.score)) {
                  alpha = move;
                  if (betaExists && beta.score <= alpha.score)
                     break movescan;
               }
               else if (minimizing && (!betaExists || move.score < beta.score)) {
                  beta = move;
                  if (alphaExists && beta.score <= alpha.score)
                     break movescan;
               }
            }

         }
      }

      if (maximizing)
         return alpha;
      else
         return beta;
   },

   // Converts game state into a form usable for hash keys
   toString: function() {
      var gridStr = '';
      for (var row = 0; row<this.size; row++) {
         for (var col = 0; col<this.size; col++) {
            gridStr += (this.cellAvailable(row,col)? " " : this.getCell(row,col));
         }
      }
      return gridStr;
   }
};


/**
 * Constructor for form object. Turns the specified element into a game UI.
 */
function TicTacToeForm(elemId) {

   if (typeof gridSize === "undefined") {
      gridSize = 3;
   }

   this.game = new TicTacToe(gridSize);
   this.elemId = elemId;
   this.elem = document.getElementById(elemId);
   this.formElem;
   this.resultElem;
   this.statusElem;
   this.heading = "Tic Tac Toe";
   this.size = 3;
   this.playerFirst = true;
   this.resultDelay = 1000;
   this.drawResultDelay = 1000;
   this.firstMoveDelay = 1000;
   this.computerMoveDelay = 500;

   this.createUI();

   // First time around, human player starts the game
   this.startGame(true);
}

TicTacToeForm.prototype = {

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

   // Called upon game completion, shows the game result
   showResult: function() {

      this.setStatus("Game over.");

      var thisForm = this;
      var show = function(text, delay) {
         window.setTimeout(function() {
            thisForm.resultElem.innerHTML = '<message>' + text + '</message>';
            thisForm.resultElem.style.zIndex = "1";
            thisForm.setStatus("Click to play again.");
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
         var winCell = winLine[cell];
         var winButton = this.button(winCell[0],winCell[1]);
         winButton.className = show? "tttwinner" : "";
      }
   },

   // Used to hide the game result (if showing) and show the game grid form 
   showForm: function() {
      this.resultElem.style.zIndex = '-1';
   },

   // Disables/enabled tic-tac-toe grid for user input
   disableUI: function (disabled) {
      for (var row=0; row<this.game.size; row++) {
         for (var col=0; col<this.game.size; col++) {
            var button = this.button(row,col);
            button.disabled = disabled || !this.game.cellAvailable(row,col);
         }
      }
   },

   // Resets the game form so it is possible to play another game
   resetGame: function() {
      this.enablePlayer(false);
      this.showWinningMove(false);
      this.game.reset();
      this.updateUI();
      this.showForm();
   },

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
   startGame: function(playerFirst) {
      PLAYER.label = playerFirst? 'X' : 'O';
      COMPUTER.label = playerFirst? 'O' : 'X';
      if (!playerFirst) {
         // delay move so the user sees it happen
         var thisForm = this;
         window.setTimeout(function() {
            thisForm.computerFirstMove();
            thisForm.enablePlayer(true);
         },thisForm.firstMoveDelay);
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

      var thisForm = this;
      window.setTimeout(function() {
         var nextMove = thisForm.game.optimalMove(COMPUTER);
         thisForm.markAndUpdate(nextMove.row,nextMove.col,COMPUTER);
         if (thisForm.game.isGameComplete()) {
            thisForm.showResult();
            return;
         }
         thisForm.enablePlayer(true);
      }, thisForm.computerMoveDelay);
   },

   // Creates a click handler for specified row/col button (knows coordinates)
   createHandler: function(row,col) {
      var gameForm = this;
      return function() { gameForm.makeMove(row,col); return false; }
   },

   // Builds and attaches HTML/CSS based UI using DOM
   createUI: function() {

      var newStyle = document.createElement('style');
      document.getElementsByTagName('head')[0].appendChild(newStyle);

      var sheet = document.styleSheets[document.styleSheets.length - 1];

      var rules = {
         ".tictactoe": "{ font-family: 'Rokkitt', serif; font-size: 200%; color: black; }",
         ".tictactoe heading, .tictactoe status": "{ display: block; text-align: center; }",
         ".tictactoe heading": "{ line-height: 96px; }",
         ".tictactoe status": "{ line-height: 84px; font-size: 75%; }",
         ".tictactoe ": "{ display: block; text-align: center; line-height: 96px; }",
         ".tictactoe game": "{ display: block; position: relative; width: 320px; height: 300px; }",
         ".tictactoe game > *": "{ background-color: white; width: 320px; height: 300px; }",
         ".tictactoe form": "{ position: absolute; top: 0px; display: block; text-align: center; }",
         ".tictactoe result ": "{ display: table; position: absolute; top: 0px; z-index: -1; font-size: 150%; opacity: .9; }",
         ".tictactoe result message": "{ display: table-cell; text-align: center; vertical-align: middle; }",
         ".tictactoe button.tttwinner": "{ background-color: #F2F760; transition: background-color .5s; -webkit-transition: background-color .5s; -o-transition: background-color .5s; -moz-transition: background-color .5s;}",
         ".tictactoe button:focus": "{ outline: none; }",
         ".tictactoe button": "{ width: 100px; height: 100px; font-size: 72px; vertical-align: top; color: black; background: none; border: none; }",
         ".tictactoe form > button:nth-of-type(3n+1)": "{ border-right: 5px solid black; }",
         ".tictactoe form > button:nth-of-type(3n+3)": "{ border-left: 5px solid black; }",
         ".tictactoe form > button:nth-of-type(-n+3)": "{ border-bottom: 5px solid black; }",
         ".tictactoe form > button:nth-last-of-type(-n+3)": "{ border-top: 5px solid black; }"
      };


      for (selector in rules) {
         if (sheet.insertRule)
            sheet.insertRule(selector + rules[selector], sheet.cssRules.length);
         else
            sheet.addRule(selector, rules[selector]);
      }

      var headingElem = document.createElement('heading');
      headingElem.appendChild(document.createTextNode(this.heading));
      this.elem.appendChild(headingElem);

      var formElem = this.formElem = document.createElement('form');

      var gameElem = document.createElement('game');
      var size = this.size;
      for (var row=0; row<size; row++) {
         for (var col=0; col<size; col++) {
            var buttonElem = document.createElement('button');
            buttonElem.setAttribute('id', this.buttonId(row,col));
            buttonElem.setAttribute('disabled','true');
            buttonElem.onclick = this.createHandler(row,col);
            formElem.appendChild(buttonElem);
         }
         formElem.appendChild(document.createElement('br'));
      }
      gameElem.appendChild(formElem);

      var resultElem = this.resultElem = document.createElement('result');
      var thisForm = this;
      resultElem.onclick = function() { 
         thisForm.resetGame(); 
         thisForm.playerFirst = !thisForm.playerFirst;
         thisForm.startGame(thisForm.playerFirst); 
      };
      gameElem.appendChild(resultElem);


      this.elem.className += " tictactoe";
      this.elem.appendChild(gameElem);

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
      var size = this.game.size;
      for (var row=0; row<size; row++) {
         for (var col=0; col<size; col++) {
            var gridLabel = this.gridLabel(row,col);
            var button = this.button(row,col);
            button.innerHTML = gridLabel;
            if (gridLabel !== ' ')  {
               button.disabled = true;
            }
         }
      }
   }
};
