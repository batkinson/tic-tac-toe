
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
            this.rowIndexes[i].push([ i, j ]);
            this.colIndexes[i].push([ j, i ]);
         }
      }

      // Build diag indexes, always only two of grid size
      this.diagIndexes[0] = new Array();
      this.diagIndexes[1] = new Array();
      for (var i=0; i<this.size; i++) {
         this.diagIndexes[0].push([ i, i ]);
         this.diagIndexes[1].push([ this.size - i, i ]);
      }

      // Construct master of all indexes
      for (var row in this.rowIndexes)
         this.allIndexes.push(row);
      for (var col in this.colIndexes)
         this.allIndexes.push(col);
      for (var diag in this.diagIndexes)
         this.allIndexes.push(diag);
   };

   this.getMark = function(row, col) {
      return this.grid[row][col];
   };

   this.setMark = function(row, col, player) {
     if (typeof this.getMark(row,col) !== "undefined" && typeof player !== "undefined") {
       throw "already marked";
     }
     this.grid[row][col] = player;
   };

   
   if (typeof oldgrid === "undefined") {
      this.size = size;
      this.move_max = size * size;
      this.moves = 0;
      this.initGrid();
   } else {
      this.size = oldgrid.size;
      this.move_max = oldgrid.move_max;
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
            this.button(row,col).innerHTML = this.gridLabel(row,col);
         }
      }
   };

   this.initialize = function() {
      this.createButtons();
      this.grid.setMark(0,0,PLAYER);
      this.updateButtons();
   };
}
