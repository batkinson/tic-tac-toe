
function Player(label) {
  this.label = label;
}

var PLAYER = new Player('X');
var COMPUTER = new Player('O');

function GameGrid(size, oldgrid) {

   this.initGrid = function() {
      this.buildGrid();
      this.buildIndexes();
   };

   this.copyGrid = function(other) {
      // To allow side-effect free modifications, need a deep copy
      this.grid = other.grid.slice();
      for (var row=0; row<this.size; row++) {
        this.grid[row] = other.grid[row].slice();
      }
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

      this.rowIndexes = new Array();
      this.colIndexes = new Array();
      this.diagIndexes = new Array();
      this.allIndexes = new Array();

      // Build row/col indexes
      for (var i=0; i<this.size; i++) {
         this.rowIndexes[i] = new Array();
         this.colIndexes[i] = new Array();
         for (var j=0; j<this.size; j++) {
            this.rowIndexes[i].push([i,j]);
            this.colIndexes[i].push([j,i]);
         }
      }

      // Build diag indexes, always only two of grid size
      this.diagIndexes.push(new Array());
      this.diagIndexes.push(new Array());
      for (var i=0; i<this.size; i++) {
         this.diagIndexes[0].push([i,i]);
         this.diagIndexes[1].push([this.size-(i+1),i]);
      }

      // Construct master of all indexes
      for (var row in this.rowIndexes)
         this.allIndexes.push(this.rowIndexes[row]);
      for (var col in this.colIndexes)
         this.allIndexes.push(this.colIndexes[col]);
      for (var diag in this.diagIndexes)
         this.allIndexes.push(this.diagIndexes[diag]);
   };

   this.getMark = function(row, col) {
      return this.grid[row][col];
   };

   this.setMark = function(row, col, player) {
      var playerDefined = typeof player !== "undefined";
      var alreadyMarked = typeof this.getMark(row,col) !== "undefined";
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

   this.getWinner = function() {
      var playerWins = function (cell) { return this.getMark(cell[0],cell[1]) === PLAYER; };
      var computerWins = function (cell) { return this.getMark(cell[0],cell[1]) === COMPUTER; };
      for (lineIdx in this.allIndexes) {
         var line = this.allIndexes[lineIdx];
         if (line.every(playerWins,this)) {
            return PLAYER;
         }
         if (line.every(computerWins,this)) {
            return COMPUTER;
         }
      }
      return undefined;
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
      this.initGrid();
   } else {
      this.size = oldgrid.size;
      this.moveMax = oldgrid.moveMax;
      this.moves = oldgrid.moves;
      this.grid = this.copyGrid(oldgrid.grid);
   }
}

// Constructs the id of the input element for the specified row and column
// Dynamically creates the game for input elements
function TicTacToe(formName, gridSize) {

   this.grid = new GameGrid(gridSize);

   this.formElem = document.getElementById(formName);

   this.buttonId = function buttonId(row,col) {
      return row + 'x' + col;
   };

   this.button = function(row,col) {
      return document.getElementById(this.buttonId(row,col));
   };

   this.createButtons = function() {
      for (var row=0; row<this.grid.size; row++) {
         for (var col=0; col<this.grid.size; col++) {
            var gridElem = document.createElement('button');
            gridElem.setAttribute('id', this.buttonId(row,col));
            gridElem.onclick = function () { return false; }
            this.formElem.appendChild(gridElem);
         }
         this.formElem.appendChild(document.createElement('br'));
      }
   };

   this.gridLabel = function(row,col) {
      var player = this.grid.getMark(row,col);
      if (typeof player === "object")
         return player.label;
      return ' ';
   };

   this.updateButtons = function() {
      for (var row=0; row<this.grid.size; row++) {
         for (var col=0; col<this.grid.size; col++) {
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
      this.grid.setMark(0,0,PLAYER);
      this.grid.setMark(0,1,PLAYER);
      this.grid.setMark(0,2,PLAYER);
      this.updateButtons();
      var gameover = this.grid.isGameComplete();
      var winner = this.grid.getWinner();
      alert('game over? ' + gameover + ' ' + (typeof winner !== 'undefined'? winner.label + ' wins!' : ''));
   };
}
