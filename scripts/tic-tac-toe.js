
function Player(label,description) {
  this.label = label;
}


var PLAYER = new Player('X');
var COMPUTER = new Player('O');


function GameGrid(size, oldgrid) {

   this.initialize = function() {
      this.buildGrid();
      this.buildIndexes();
   };

   this.buildGrid = function () {
      this.grid = new Array();
      for (var row=0; row<this.size; row++) {
         this.grid[row] = [];
         for (var col=0; col<this.size; col++) {
            this.grid[row][col] = undefined; 
         }
      }
   };

   this.buildIndexes = function() {
      var allLines = this.allLines = new Array();
      // Build row/col lines
      for (var i=0; i<this.size; i++) {
         var rowLine = new Array();
         var colLine = new Array();
         for (var j=0; j<this.size; j++) {
            rowLine.push([i,j]);
            colLine.push([j,i]);
         }
         allLines.push(rowLine);
         allLines.push(colLine);
      }
      // Build diag lines
      var diagLine1 = new Array();
      var diagLine2 = new Array();
      for (var i=0; i<this.size; i++) {
         diagLine1.push([i,i]);
         diagLine2.push([this.size-(i+1),i]);
      }
      allLines.push(diagLine1);
      allLines.push(diagLine2);
   };

   this.copyGrid = function(other) {
      // Need a deep copy for side-effect free modification
      this.grid = other.grid.slice();
      for (var row=0; row<this.size; row++) {
        this.grid[row] = other.grid[row].slice();
      }
   };

   this.cellMark = function(row, col) {
      return this.grid[row][col];
   };
   
   this.cellAvailable = function(row, col) {
      return typeof this.grid[row][col] === "undefined";
   };

   this.markCell = function(row, col, player) {
      var playerDefined = typeof player !== "undefined";
      var alreadyMarked = !this.cellAvailable(row,col);
      if (alreadyMarked && playerDefined) {
         throw "cell already marked";
      }
      this.grid[row][col] = player;
      if (playerDefined) {
         this.moves++;
      }
      else if (alreadyMarked) {
         this.moves--;
      }
   };

   this.scoreGrid = function(depth) {
      var winner = this.getWinner();
      if (typeof winner === 'undefined') return 0;
      if (winner === PLAYER) return depth-10; // non-positive 
      if (winner === COMPUTER) return 10-depth; // non-negative
   };

   this.nextGrid = function(row,col,player) {
      var next = new GameGrid(this.size,this);
      next.markCell(row,col,player);
      return next;
   };

   this.optimalMove = function(player,depth) {

      if (typeof depth === 'undefined') {
         depth = 0;
      }

      var bestMove = undefined;
      var opponent = (player === PLAYER? COMPUTER : PLAYER);

      if (this.isGameComplete()) {
         return this.scoreGrid(depth);
      }

      for (var row=0; row<this.size; row++) {
         for (var col=0; col<this.size; col++) {
            if (this.cellAvailable(row,col)) {
               var nextGrid = this.nextGrid(row,col,player);
               var followingMove = nextGrid.optimalMove(opponent,depth+1);
               if (typeof followingMove === 'number') {
                  followingMove = { score: followingMove, row: row, col: col }; 
               }
               if (typeof bestMove === "undefined" ||
                     (player === COMPUTER && followingMove.score > bestMove.score) ||
                     (player === PLAYER && followingMove.score < bestMove.score)) {
                  bestMove = { score: followingMove.score, row: row, col: col };
               }
            }
         }
      }

      return bestMove;
   };

   this.toString = function() {
      var gridStr = "+-----+\n";
      for (var row = 0; row<this.size; row++) {
         var cols = this.grid[row];
         for (var col = 0; col<this.size; col++) {
            var colStr = typeof cols[col] === "undefined"? " " : cols[col].label;
            gridStr += "|" + colStr;
         }
         gridStr += "|\n";
      }
      gridStr += "+-----+";
      return gridStr; 
   };

   this.getWinner = function() {
      linescan:
      for (var i=0; i<this.allLines.length; i++) {
         var line = this.allLines[i];
         var winner = this.cellMark(line[0][0],line[0][1]);
         if (typeof winner === "undefined") {
            continue linescan;
         }
         for (var j=1; j<this.size; j++) {
            var next = this.cellMark(line[j][0],line[j][1]);
            if (typeof next === "undefined" || next !== winner) {
               continue linescan;
            }
         }
         return winner;
      }
      return;
   };

   this.isGameComplete = function() {
      if (this.moves >= this.moveMax) {
         return true;
      }
      var winner = this.getWinner();
      if (typeof winner !== "undefined") {
         return true;
      }
      return false;
   };
   
   if (typeof oldgrid === "undefined") {
      this.size = size;
      this.moveMax = size * size;
      this.moves = 0;
      this.initialize();
   } else {
      this.size = oldgrid.size;
      this.moveMax = oldgrid.moveMax;
      this.moves = oldgrid.moves;
      this.copyGrid(oldgrid);
      this.allLines = oldgrid.allLines;
   }
}


function TicTacToeForm(formName, gridSize) {

   this.game = new GameGrid(gridSize);

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

   this.makeMove = function(row,col) {
      if (this.game.isGameComplete()) {
         alert('Game is already over, refresh to play again.')
      }
      this.markAndUpdate(row,col,PLAYER);
      if (this.game.isGameComplete()) {
         this.alertWinner();
      }
      var nextMove = this.game.optimalMove(COMPUTER);
      this.markAndUpdate(nextMove.row,nextMove.col,COMPUTER);
      if (this.game.isGameComplete()) {
         this.alertWinner();
      }
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

   this.initialize = function() {
      this.createButtons();
      this.updateButtons();
   };
}
