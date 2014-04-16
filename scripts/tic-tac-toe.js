
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
 * Constructor for a game object. This contains all logic for tic-tac-toe.
 */
function TicTacToe(size,lastState) {
   this.size = size;
   if (typeof lastState !== "undefined") {
      this.moveMax = lastState.moveMax;
      this.grid = lastState.grid.slice(0);
      this.lines = lastState.lines;
      this.moves = lastState.moves;
   } else {
      this.moveMax = this.size * this.size;
      this.grid = new Array(this.moveMax);
      this.lines = new Array();
      this.moves = 0;
   }
}

TicTacToe.prototype = {

   buildGame: function() {

      // Build rows/cols
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

      // Build diagonal lines
      var diag1 = new Array(this.size);
      var diag2 = new Array(this.size);
      for (var i=0; i<this.size; i++) {
         diag1[i] = [i,i];
         diag2[i] = [this.size-(i+1),i];
      }
      this.lines.push(diag1);
      this.lines.push(diag2);
   },

   setCell: function(row,col,player) {
      this.grid[row * this.size + col] = player;
      this.moves++;
   },

   getCell: function(row,col) {
      return this.grid[row * this.size + col];
   },

   cellAvailable: function(row,col) {
      return typeof this.getCell(row,col) === "undefined";
   },

   getWinner: function() {

      if (typeof this.winner !== "undefined")
         return this.winner;

      linescan:
      for (var l=0; l<this.lines.length; l++) {
         var line = this.lines[l];
         var winner = undefined;
         for (var c=0; c<this.size; c++) {
            var cell = line[c];
            var cellVal = this.getCell(cell[0],cell[1]);
            if (typeof cellVal === "undefined")
               continue linescan;
            else if (typeof winner === "undefined")
               winner = cellVal;
            else if (cellVal !== winner)
               continue linescan;
         }
         return winner;
      }
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
      var specState = new TicTacToe(this.size, this);
      specState.setCell(row,col,player);
      return specState;
   },

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

   toString: function() {
      for (var row = 0; row<this.size; row++) {
         for (var col = 0; col<this.size; col++) {
            gridStr += (this.cellAvailable(row,col)? " " : this.getCell(row,col));
         }
         gridStr += "\n";
      }
      return gridStr;
   }
};


/**
 * Constructor for form object. Turns the form into a tic-tac-toe UI.
 */
function TicTacToeForm(elemId, gridSize) {

   if (typeof gridSize === "undefined") {
      gridSize = 3;
   }

   this.game = new TicTacToe(gridSize);
   this.elemId = elemId;
   this.elem = document.getElementById(elemId);
   this.formElem;
   this.resultElem;
   this.heading = "Tic Tac Toe";
   this.size = gridSize;

   this.game.buildGame();
   this.createUI();
}

TicTacToeForm.prototype = {

   buttonId: function buttonId(row,col) {
      return row + 'x' + col;
   },

   button: function(row,col) {
      return document.getElementById(this.buttonId(row,col));
   },

   markAndUpdate: function(row,col,player) {
      this.game.setCell(row,col,player);
      this.updateUI();
   },

   showResult: function() {

      thisForm = this;
      var show = function(text) {
         window.setTimeout(function() {
            thisForm.resultElem.innerText = text;
            thisForm.formElem.style.display = "none";
            thisForm.resultElem.style.display = "table-cell";
         },500);
      };

      if (this.game.getWinner() === PLAYER)
         show('You Win!');
      else if (this.game.getWinner() === COMPUTER)
         show('You Lose.');
      else
         show("A Draw.");
   },

   disableButtons: function (disabled) {
      for (var row=0; row<this.game.size; row++) {
         for (var col=0; col<this.game.size; col++) {
            var button = this.button(row,col);
            button.disabled = disabled || !this.game.cellAvailable(row,col);
         }
      }
   },

   makeMove: function(row,col) {

      if (this.game.isGameComplete()) {
         alert('Game is already over, refresh to play again.')
      }
      this.markAndUpdate(row,col,PLAYER);
      if (this.game.isGameComplete()) {
         this.showResult();
         return;
      }

      this.disableButtons(true);

      var thisForm = this;
      window.setTimeout(function() {
         var nextMove = thisForm.game.optimalMove(COMPUTER);
         thisForm.markAndUpdate(nextMove.row,nextMove.col,COMPUTER);
         if (thisForm.game.isGameComplete()) {
            thisForm.showResult();
            return;
        }
        thisForm.disableButtons(false);
      }, 10);
   },

   createHandler: function(row,col) {
      var gameForm = this;
      return function() { gameForm.makeMove(row,col); return false; }
   },

   createUI: function() {

      var newStyle = document.createElement('style');
      document.getElementsByTagName('head')[0].appendChild(newStyle);

      var sheet = document.styleSheets[document.styleSheets.length - 1];

      var gameElem = this.elem;
      var size = this.size;

      var rules = {
         ".tictactoe": "{ font-family: 'Rokkitt', serif; font-size: 200%; color: black; }",
         ".tictactoe > *": "{ text-align: center; vertical-align: middle; }",
         ".tictactoe ": "{ display: table; width: 100%; }",
         ".tictactoe heading": "{ display: table-row; line-height: 300%; }",
         ".tictactoe form": "{ display: table-cell; }",
         ".tictactoe button:focus": "{ outline: none; }",
         ".tictactoe button": "{ width: 100px; height: 100px; font-size: 72px; vertical-align: top; color: black; }",
         ".tictactoe result": "{ display: none; width: " + size * 100 + "px; height: " + size * 100 + "px; font-size: 150%; }",
      };

      if (size == 3) {
         rules[".tictactoe button"] = "{ width: 100px; height: 100px; font-size: 72px; vertical-align: top; color: black; background: none; border: none; }";
         rules[".tictactoe form > button:nth-of-type(3n+1)"] = "{ border-right: 5px solid black; }";
         rules[".tictactoe form > button:nth-of-type(3n+3)"] = "{ border-left: 5px solid black; }";
         rules[".tictactoe form > button:nth-of-type(-n+3)"] = "{ border-bottom: 5px solid black; }";
         rules[".tictactoe form > button:nth-last-of-type(-n+3)"] = "{ border-top: 5px solid black; }";
      }

      for (selector in rules) {
         if (sheet.insertRule)
            sheet.insertRule(selector + rules[selector], sheet.cssRules.length);
         else
            sheet.addRule(selector, rules[selector]);
      }


      var headingElem = document.createElement('heading');
      headingElem.appendChild(document.createTextNode(this.heading));
      gameElem.appendChild(headingElem);

      var formElem = this.formElem = document.createElement('form');
      for (var row=0; row<size; row++) {
         for (var col=0; col<size; col++) {
            var buttonElem = document.createElement('button');
            buttonElem.setAttribute('id', this.buttonId(row,col));
            buttonElem.onclick = this.createHandler(row,col);
            formElem.appendChild(buttonElem);
         }
         formElem.appendChild(document.createElement('br'));
      }

      gameElem.appendChild(formElem);

      var resultElem = this.resultElem = document.createElement('result');
      gameElem.appendChild(resultElem);

      gameElem.className += " tictactoe";
   },

   gridLabel: function(row,col) {
      var player = this.game.getCell(row,col);
      if (typeof player === "object")
         return player.label;
      return ' ';
   },

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
