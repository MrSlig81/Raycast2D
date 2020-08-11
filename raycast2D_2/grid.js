class Cell{
	constructor(x, y, size){
		this.x = x;
		this.y = y;
		this.size = size;
		this.mouseOver = false;
		this.selected = false;
		this.used = false;
		this.padding = this.size * 0.1;

		this.neighbours = {top : null, bottom : null, left : null, right : null, topleft : null, topright : null, bottomleft : null, bottomright : null};
	}
}

class Edge{
	constructor(p1, p2){
		this.p1 = p1;
		this.p2 = p2;
	}
}

class Grid{
	constructor(x, y, cellSize, canvas, renderMan){
		this.canvas = canvas;
		this.x = x;
		this.y = y;
		this.width = canvas.width;
		this.height = canvas.height;
		this.cellSize = cellSize;
		this.renderMan = renderMan;
		this.edges = [];
		this.gridCells = [];
		this.mouseDown = false;
		this.rectSelection = {x : 0, y : 0, width : 0, height : 0};

		let cellPerRow = 0;
		for(let i = 0; i < this.height; i += cellSize){
			cellPerRow = 0;
			for(let j = 0; j < this.width; j += cellSize){
				cellPerRow++;

				let cell = new Cell(this.x + j, this.y - i, cellSize);
				this.gridCells.push(cell);
			}
		}

		for(let i = 0; i < 20; i++){
			let randCell = Math.floor(Math.random() * (this.gridCells.length));
			this.gridCells[randCell].used = true;
		}	

		// Set neighbours
		let topBound = 0;
		let bottomBound = this.gridCells.length;
		let leftBound = 0;
		let rightBound = cellPerRow-1;

		for(let i = 0; i < this.gridCells.length; i++){
			if(i % cellPerRow == 0){
				leftBound = i - 1;
				rightBound = i + cellPerRow;
			}

			let topIdx = i - cellPerRow;
			let bottomIdx = i + cellPerRow;
			let leftIdx = i - 1;
			let rightIdx = i + 1;

			if(topIdx >= topBound){
				this.gridCells[i].neighbours.top = this.gridCells[topIdx];
			}

			if(bottomIdx < bottomBound){
				this.gridCells[i].neighbours.bottom = this.gridCells[bottomIdx];
			}

			if(leftIdx > leftBound){
				this.gridCells[i].neighbours.left = this.gridCells[leftIdx];
			}

			if(rightIdx < rightBound){
				this.gridCells[i].neighbours.right = this.gridCells[rightIdx];
			}

			if(topIdx > topBound && leftIdx > leftBound){
				this.gridCells[i].neighbours.topleft = this.gridCells[topIdx-1];
			}

			if(topIdx > topBound && rightIdx < rightBound){
				this.gridCells[i].neighbours.topright = this.gridCells[topIdx + 1];
			}

			if(bottomIdx < bottomBound && leftIdx > leftBound){
				this.gridCells[i].neighbours.bottomleft = this.gridCells[bottomIdx - 1];
			}

			if(bottomIdx < bottomBound && rightIdx < rightBound){
				this.gridCells[i].neighbours.bottomright = this.gridCells[bottomIdx + 1];
			}
		}
	}


	createEdges(){

		this.edges = [];

		let mapX = new Map();
		let mapY = new Map();

		for(let i = 0; i < this.gridCells.length; i++){

			let cell = this.gridCells[i];

			if(cell.used == false)
				continue;

			let ptTopLeft = {x : cell.x, y : cell.y};
			let ptTopRight = {x : cell.x + cell.size, y : cell.y};
			let ptBottomRight = {x : cell.x + cell.size, y : cell.y - cell.size};
			let ptBottomLeft = {x : cell.x, y : cell.y - cell.size};

			let top = cell.neighbours.top != null && cell.neighbours.top.used;
			let left = cell.neighbours.left != null && cell.neighbours.left.used;
			let bottom = cell.neighbours.bottom != null && cell.neighbours.bottom.used;
			let right = cell.neighbours.right != null && cell.neighbours.right.used;

			let topleft = cell.neighbours.topleft != null && cell.neighbours.topleft.used;
			let topright = cell.neighbours.topright != null && cell.neighbours.topright.used;
			let bottomleft = cell.neighbours.bottomleft != null && cell.neighbours.bottomleft.used;
			let bottomright = cell.neighbours.bottomright != null && cell.neighbours.bottomright.used;

			if((top && left && !topleft) || (!top && !left)){

				if(!mapX.get(ptTopLeft.x))
					mapX.set(ptTopLeft.x, []);
				if(!mapY.get(ptTopLeft.y))
					mapY.set(ptTopLeft.y, []);

				mapX.get(ptTopLeft.x).push(ptTopLeft);
				mapY.get(ptTopLeft.y).push(ptTopLeft);
			}

			if((top && right && !topright) || (!top && !right)){

				if(!mapX.get(ptTopRight.x))
					mapX.set(ptTopRight.x, []);
				if(!mapY.get(ptTopRight.y))
					mapY.set(ptTopRight.y, []);

				mapX.get(ptTopRight.x).push(ptTopRight);
				mapY.get(ptTopRight.y).push(ptTopRight);
			}				

			if((bottom && right && !bottomright) || (!bottom && !right)){

				if(!mapX.get(ptBottomRight.x))
					mapX.set(ptBottomRight.x, []);
				if(!mapY.get(ptBottomRight.y))
					mapY.set(ptBottomRight.y, []);

				mapX.get(ptBottomRight.x).push(ptBottomRight);
				mapY.get(ptBottomRight.y).push(ptBottomRight);
			}

			if((bottom && left && !bottomleft) || (!bottom && !left)){

				if(!mapX.get(ptBottomLeft.x))
					mapX.set(ptBottomLeft.x, []);
				if(!mapY.get(ptBottomLeft.y))
					mapY.set(ptBottomLeft.y, []);

				mapX.get(ptBottomLeft.x).push(ptBottomLeft);
				mapY.get(ptBottomLeft.y).push(ptBottomLeft);
			}
		}

		for (let ptList of mapX.values()){

			ptList.sort(function(a,b){return (a.y > b.y ? -1 : 1)});

			for(let i = 0; i < ptList.length-1; i += 2){
  				this.edges.push(new Edge(ptList[i], ptList[i+1]));
			}
  		}

  		for(let ptList of mapY.values()){

  			ptList.sort(function(a,b){return (a.x < b.x ? -1 : 1);});

			for(let i = 0; i < ptList.length-1; i += 2){
  				this.edges.push(new Edge(ptList[i], ptList[i+1]));
			}
  		}

  		// Always add canvas boreder edges

  		this.edges.push(new Edge({x : this.x, y : this.y}, {x : this.x + this.width, y : this.y}));
  		this.edges.push(new Edge({x : this.x + this.width, y : this.y}, {x : this.x + this.width, y : this.y - this.height}));
  		this.edges.push(new Edge({x : this.x, y : this.y - this.height}, {x : this.x + this.width, y : this.y - this.height}));
  		this.edges.push(new Edge({x : this.x, y : this.y}, {x : this.x , y : this.y - this.height}));

  		return this.edges;
	}


	drawGrid(){

		for(let i = 0; i < this.width; i += this.cellSize){
			this.renderMan.DrawLine(this.x + i, this.y + 0, this.x + i, this.y - this.height, 1, 1.0, 0.0, 0.0, 1.0);
		}

		for(let i = 0; i < this.height; i += this.cellSize){
			this.renderMan.DrawLine(this.x + 0, this.y - i, this.x + this.width, this.y - i, 1, 1.0, 0.0, 0.0, 1.0);
		}
			
		for(let i = 0; i < this.gridCells.length; i++){
			if(this.gridCells[i].selected == true && this.gridCells[i].used == true){
				this.renderMan.DrawRect(this.gridCells[i].x + this.gridCells[i].padding, this.gridCells[i].y - this.gridCells[i].padding, this.gridCells[i].size - this.gridCells[i].padding*2, this.gridCells[i].size - this.gridCells[i].padding*2, 0,0,0,1);
				continue;
			}

			if(this.gridCells[i].mouseOver == true && this.mouseDown == false){
				this.renderMan.DrawRect(this.gridCells[i].x, this.gridCells[i].y, this.gridCells[i].size, this.gridCells[i].size, 1,0,0,0.5);

			}
			else if(this.gridCells[i].selected == true || this.gridCells[i].used == true){
				this.renderMan.DrawRect(this.gridCells[i].x + this.gridCells[i].padding, this.gridCells[i].y - this.gridCells[i].padding, this.gridCells[i].size - this.gridCells[i].padding*2, this.gridCells[i].size - this.gridCells[i].padding*2, 1,0,0,1);
			}	
		}		

	}

	drawTiles(){
		for(let i = 0; i < this.gridCells.length; i++){
			if(this.gridCells[i].used == true){
				this.renderMan.DrawRect(this.gridCells[i].x, this.gridCells[i].y, this.gridCells[i].size, this.gridCells[i].size, 1,0,0,1);
			}
		}
	}

	drawEdges(){
		for(let i = 0; i < this.edges.length; i++){
			let edge = this.edges[i];
			this.renderMan.DrawLine(edge.p1.x, edge.p1.y, edge.p2.x, edge.p2.y, this.gridCells[i].padding, 1.0, 0.0, 0.0, 1.0);
		}
	}
}























