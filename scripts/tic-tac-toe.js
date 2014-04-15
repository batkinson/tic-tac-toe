
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


// Player constants
var PLAYER = new Player('X');
var COMPUTER = new Player('O');


/**
 * Represents a cell in the tic-tac-toe grid.
 */
function Cell() {
   this.lines = new Array();
}
Cell.prototype = {

   addLine: function(line) {
      this.lines.push(line);
   },

   isMarked: function() {
      return typeof this.mark !== "undefined";
   },

   getMark: function() {
      return this.mark;
   },

   setMark: function(player) {
      if (this.isMarked()) throw "cell already marked";
      this.mark = player;
      for (var linei=0; linei<this.lines.length; linei++) {
         this.lines[linei].markForPlayer(player);
      }
   },

   cloneForSpeculation: function(newGrid) {
      var specCell = new Cell();
      for (var l=0; l<this.lines.length; l++) {
         var origLine = this.lines[l];
         var specLine = new Line(newGrid,origLine);
         for (var c=0; c<origLine.cells.length; c++) {
            var origCell = origLine.cells[c];
            if (origCell === this) {
               specLine.cells[c] = specCell;
               specCell.addLine(specLine);
            }
         }
      }
      return specCell;
   },

   toString: function() {
      return this.isMarked()? this.mark.toString() : " ";
   }

};


/**
 * Represents a possible winning line in the grid, contains cells.
 */
function Line(grid,line) {
   this.grid = grid;
   if (typeof line !== "undefined") {
      this[PLAYER] = line[PLAYER];
      this[COMPUTER] = line[COMPUTER];
      this.cells = line.cells.slice();
   }
   else {
      this.cells = new Array();
   }
}
Line.prototype = {

   addCell: function(cell) {
      if (this.cells.length >= this.grid.size) throw "line already full";
      this.cells.push(cell);
      cell.addLine(this);
   },

   markForPlayer: function(player) {
      if (typeof this[player] === "undefined") {
         this[player] = 1;
         return;
      }  
      if (this[player] >= this.cells.size) throw "tried to mark too many cells";
      this[player]++;
      if (this[player] == this.grid.size) {
         this.grid.setWinner(player);
      }
   }
};


/**
 * Constructor for a game object. This contains all logic for tic-tac-toe.
 */
function TicTacToe(size, lastState) {
   this.size = size;
   if (typeof lastState !== "undefined") {
      this.lastState = lastState;
      this.grid = lastState.grid;
      this.moves = lastState.moves;
      this.moveMax = lastState.moveMax;
   }
}
TicTacToe.prototype = {

   buildGame: function() {

      this.grid = new Array(this.size);
      this.moves = 0;
      this.moveMax = this.size * this.size;

      // Construct cell grid
      for (var i=0; i<this.size; i++) {
         this.grid[i] = new Array(this.size);
         for (var j=0; j<this.size; j++) {
            this.grid[i][j] = new Cell();
         }
      }

      // Build rows/cols
      for (var i=0; i<this.size; i++) {
         var row = new Line(this);
         var col = new Line(this);
         for (var j=0; j<this.size; j++) {
            row.addCell(this.grid[i][j]);
            col.addCell(this.grid[j][i]);
         }
      }
      
      // Build diagonal lines
      var diag1 = new Line(this);
      var diag2 = new Line(this);
      for (var i=0; i<this.size; i++) {
         diag1.addCell(this.grid[i][i]);
         diag2.addCell(this.grid[this.size-(i+1)][i]);
      }
   },
   
   getCell: function(row,col) {
      if (typeof this.speculatedMove !== "undefined") {
         if (this.speculatedMove.row == row && this.speculatedMove.col == col) {
            return this.speculatedMove.cell;
         }
         else if (typeof this.lastState !== "undefined") {
            return this.lastState.getCell(row,col);
         }
      }
      return this.grid[row][col];
   },

   cellAvailable: function(row,col) {
      return !this.getCell(row,col).isMarked();
   },

   cellMark: function(row,col) {
      return this.getCell(row,col).getMark();
   },

   markCell: function(row,col,player) {
      this.getCell(row,col).setMark(player);
      this.moves++;
   },

   setWinner: function(player) {
      if (typeof this.player !== "undefined") throw "winner already determined";
      this.winner = player;
   },
   
   getWinner: function() {
      return this.winner;
   },

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
   
   scoreGrid: function(depth) {
      var winner = this.getWinner();
      if (typeof winner === "undefined") return 0;
      if (winner === PLAYER) return depth-10; // non-positive 
      if (winner === COMPUTER) return 10-depth; // non-negative
   },

   speculate: function(row,col,player) {
      if (this.getCell(row,col).isMarked()) throw "tried to speculate unavailable move";
      var specState = new TicTacToe(this.size, this);
      var specCell = this.getCell(row,col).cloneForSpeculation(specState);
      specState.speculatedMove = { cell: specCell, row: row, col: col };
      specState.markCell(row,col,player);
      return specState;
   },

   flipCoin: function() {
      return Math.random() < 0.5;
   },

   optimalMove: function(player,depth) {

      if (typeof depth === 'undefined') {
         depth = 0;
      }

      var bestMove = undefined;
      var opponent = (player === PLAYER? COMPUTER : PLAYER);

      if (this.isGameComplete()) {
         return this.scoreGrid(depth);
      }

      // Play all available moves, selecting a highest scoring one
      // Currently O(size^2), only consider available!
      for (var row=0; row<this.size; row++) {
         for (var col=0; col<this.size; col++) {
            if (this.cellAvailable(row,col)) {
               var followingMove = this.speculate(row,col,player).optimalMove(opponent,depth+1);
               if (typeof followingMove === 'number') {
                  followingMove = { score: followingMove, row: row, col: col }; 
               }
               if (typeof bestMove === "undefined" ||
                     (player === COMPUTER && followingMove.score > bestMove.score) ||
                     (player === PLAYER && followingMove.score < bestMove.score) ||
                     (followingMove.score == bestMove.score && this.flipCoin())) {
                  bestMove = { score: followingMove.score, row: row, col: col };
               }
            }
         }
      }

      return bestMove;
   },

   toString: function() {
      var gridStr = "+-----+\n";
      for (var row = 0; row<this.size; row++) {
         for (var col = 0; col<this.size; col++) {
            gridStr += "|" + this.getCell(row,col);
         }
         gridStr += "|\n";
      }
      gridStr += "+-----+";
      return gridStr; 
   }
};


/**
 * Constructor for form object. Turns the form into a tic-tac-toe UI.
 */
function TicTacToeForm(formName, gridSize) {

   this.game = new TicTacToe(gridSize);

   this.formElem = document.getElementById(formName);

   this.buttonId = function buttonId(row,col) {
      return row + 'x' + col;
   };

   this.button = function(row,col) {
      return document.getElementById(this.buttonId(row,col));
   };

   this.markAndUpdate = function(row,col,player) {
      this.game.markCell(row,col,player);
      this.updateButtons();
   };

   this.alertWinner = function() {
      if (this.game.getWinner() === PLAYER) {
         alert('You win!');
      }
      if (this.game.getWinner() === COMPUTER) {
         alert('Computer wins!');
      }
      else {
         alert("It's a Draw!");
      }
   };

   this.disableButtons = function (disabled) {
      for (var row=0; row<this.game.size; row++) {
         for (var col=0; col<this.game.size; col++) {
            var button = this.button(row,col);
            button.disabled = disabled || !this.game.cellAvailable(row,col);
         }
      }
   };

   this.makeMove = function(row,col) {
      if (this.game.isGameComplete()) {
         alert('Game is already over, refresh to play again.')
      }
      this.markAndUpdate(row,col,PLAYER);
      if (this.game.isGameComplete()) {
         this.alertWinner();
         return;
      }

      this.disableButtons(true);

      var thisForm = this;
      window.setTimeout(function() {
         var nextMove = thisForm.game.optimalMove(COMPUTER);
         thisForm.markAndUpdate(nextMove.row,nextMove.col,COMPUTER);
         if (thisForm.game.isGameComplete()) {
            thisForm.alertWinner();
            return;
        }
        thisForm.disableButtons(false);
      }, 100);
   };

   this.createHandler = function(row,col) {
      var gameForm = this;
      return function() { gameForm.makeMove(row,col); return false; }
   };

   this.createButtons = function() {
      var size = this.game.size;
      for (var row=0; row<size; row++) {
         for (var col=0; col<size; col++) {
            var gridElem = document.createElement('button');
            gridElem.setAttribute('id', this.buttonId(row,col));
            gridElem.onclick = this.createHandler(row,col);
            this.formElem.appendChild(gridElem);
         }
         this.formElem.appendChild(document.createElement('br'));
      }
   };

   this.gridLabel = function(row,col) {
      var player = this.game.cellMark(row,col);
      if (typeof player === "object")
         return player.label;
      return ' ';
   };

   this.updateButtons = function() {
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
   };

   this.game.buildGame();
   this.createButtons();
}
